"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  WorkLocationActionState,
  WorkLocationStatusActionState,
} from "@/types/work-location";
import {
  workLocationSchema,
  workLocationStatusSchema,
} from "@/validators/work-location";

function getFormValues(
  formData: FormData,
) {
  return {
    name: formData.get("name"),

    description:
      formData.get("description"),

    locationType:
      formData.get("locationType"),

    address:
      formData.get("address"),

    latitude:
      formData.get("latitude"),

    longitude:
      formData.get("longitude"),

    radiusMeters:
      formData.get("radiusMeters"),

    minimumAccuracyMeters:
      formData.get(
        "minimumAccuracyMeters",
      ),

    outsideRadiusAction:
      formData.get(
        "outsideRadiusAction",
      ),

    startsOn:
      formData.get("startsOn"),

    endsOn:
      formData.get("endsOn"),

    notes:
      formData.get("notes"),
  };
}

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  const message =
    error.message?.toLowerCase() ?? "";

  if (error.code === "23505") {
    return "Já existe um local com este nome nesta empresa.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "O local informado não foi encontrado.";
  }

  if (
    message.includes("latitude") ||
    message.includes("longitude") ||
    message.includes("coorden")
  ) {
    return "Informe coordenadas válidas para este local.";
  }

  if (
    message.includes("temporary") ||
    message.includes("temporário") ||
    message.includes("period")
  ) {
    return "Informe corretamente o período do local temporário.";
  }

  if (message.includes("radius")) {
    return "Informe um raio permitido válido.";
  }

  return (
    error.message ||
    "Não foi possível concluir a operação."
  );
}

export async function createWorkLocationAction(
  companyId: string,
  _previousState: WorkLocationActionState,
  formData: FormData,
): Promise<WorkLocationActionState> {
  const validation =
    workLocationSchema.safeParse(
      getFormValues(formData),
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados.",
      fieldErrors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para cadastrar locais.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  const {
    data: locationId,
    error,
  } = await supabase.rpc(
    "create_work_location_with_audit",
    {
      p_company_id: companyId,
      p_name: input.name,
      p_description:
        input.description,
      p_location_type:
        input.locationType,
      p_address: input.address,
      p_latitude: input.latitude,
      p_longitude:
        input.longitude,
      p_radius_meters:
        input.radiusMeters,
      p_minimum_accuracy_meters:
        input.minimumAccuracyMeters,
      p_outside_radius_action:
        input.outsideRadiusAction,
      p_starts_on:
        input.startsOn,
      p_ends_on:
        input.endsOn,
      p_notes: input.notes,
    },
  );

  if (error || !locationId) {
    console.error(
      "Erro ao cadastrar local:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(
          error ?? {
            message:
              "O local não foi criado.",
          },
        ),
      fieldErrors:
        error?.code === "23505"
          ? {
              name: [
                "Este nome já está sendo utilizado.",
              ],
            }
          : {},
    };
  }

  revalidatePath(
    `/company/${companyId}`,
  );

  revalidatePath(
    `/company/${companyId}/locations`,
  );

  redirect(
    `/company/${companyId}/locations?created=1`,
  );
}

export async function updateWorkLocationAction(
  companyId: string,
  locationId: string,
  _previousState: WorkLocationActionState,
  formData: FormData,
): Promise<WorkLocationActionState> {
  const validation =
    workLocationSchema.safeParse(
      getFormValues(formData),
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados.",
      fieldErrors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para editar locais.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "update_work_location_with_audit",
    {
      p_work_location_id:
        locationId,
      p_name: input.name,
      p_description:
        input.description,
      p_location_type:
        input.locationType,
      p_address: input.address,
      p_latitude: input.latitude,
      p_longitude:
        input.longitude,
      p_radius_meters:
        input.radiusMeters,
      p_minimum_accuracy_meters:
        input.minimumAccuracyMeters,
      p_outside_radius_action:
        input.outsideRadiusAction,
      p_starts_on:
        input.startsOn,
      p_ends_on:
        input.endsOn,
      p_notes: input.notes,
    },
  );

  if (error) {
    console.error(
      "Erro ao atualizar local:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? {
              name: [
                "Este nome já está sendo utilizado.",
              ],
            }
          : {},
    };
  }

  revalidatePath(
    `/company/${companyId}`,
  );

  revalidatePath(
    `/company/${companyId}/locations`,
  );

  revalidatePath(
    `/company/${companyId}/locations/${locationId}/edit`,
  );

  redirect(
    `/company/${companyId}/locations?updated=1`,
  );
}

export async function changeWorkLocationStatusAction(
  _previousState:
    WorkLocationStatusActionState,
  formData: FormData,
): Promise<WorkLocationStatusActionState> {
  const validation =
    workLocationStatusSchema.safeParse({
      companyId:
        formData.get("companyId"),

      locationId:
        formData.get("locationId"),

      isActive:
        formData.get("isActive"),

      reason:
        formData.get("reason"),
    });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise a justificativa informada.",
      fieldErrors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  const access =
    await requireCompanyAccess(
      validation.data.companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para alterar locais.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "change_work_location_status_with_audit",
    {
      p_work_location_id:
        validation.data.locationId,
      p_is_active:
        validation.data.isActive,
      p_reason:
        validation.data.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao alterar status do local:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidatePath(
    `/company/${validation.data.companyId}`,
  );

  revalidatePath(
    `/company/${validation.data.companyId}/locations`,
  );

  return {
    success: true,
    message:
      validation.data.isActive
        ? "Local reativado com sucesso."
        : "Local inativado com sucesso.",
    fieldErrors: {},
  };
}