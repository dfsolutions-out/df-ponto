"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  JobPositionActionState,
  JobPositionStatusActionState,
} from "@/types/job-position";
import {
  jobPositionSchema,
  jobPositionStatusSchema,
} from "@/validators/job-position";

function getJobPositionValues(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
  };
}

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "23505") {
    return "Já existe um cargo com este nome nesta empresa.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "O cargo informado não foi encontrado.";
  }

  return "Não foi possível concluir a operação.";
}

export async function createJobPositionAction(
  companyId: string,
  _previousState: JobPositionActionState,
  formData: FormData,
): Promise<JobPositionActionState> {
  const validation = jobPositionSchema.safeParse(
    getJobPositionValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para cadastrar cargos.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "create_job_position_with_audit",
    {
      p_company_id: companyId,
      p_name: validation.data.name,
      p_description: validation.data.description,
    },
  );

  if (error) {
    console.error("Erro ao cadastrar cargo:", error);

    return {
      success: false,
      message: getErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? {
              name: ["Este nome já está sendo utilizado."],
            }
          : {},
    };
  }

  revalidatePath(`/company/${companyId}`);
  revalidatePath(`/company/${companyId}/positions`);

  redirect(`/company/${companyId}/positions?created=1`);
}

export async function updateJobPositionAction(
  companyId: string,
  positionId: string,
  _previousState: JobPositionActionState,
  formData: FormData,
): Promise<JobPositionActionState> {
  const validation = jobPositionSchema.safeParse(
    getJobPositionValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para editar cargos.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "update_job_position_with_audit",
    {
      p_job_position_id: positionId,
      p_name: validation.data.name,
      p_description: validation.data.description,
    },
  );

  if (error) {
    console.error("Erro ao atualizar cargo:", error);

    return {
      success: false,
      message: getErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? {
              name: ["Este nome já está sendo utilizado."],
            }
          : {},
    };
  }

  revalidatePath(`/company/${companyId}`);
  revalidatePath(`/company/${companyId}/positions`);
  revalidatePath(
    `/company/${companyId}/positions/${positionId}/edit`,
  );

  redirect(`/company/${companyId}/positions?updated=1`);
}

export async function changeJobPositionStatusAction(
  _previousState: JobPositionStatusActionState,
  formData: FormData,
): Promise<JobPositionStatusActionState> {
  const validation = jobPositionStatusSchema.safeParse({
    positionId: formData.get("positionId"),
    companyId: formData.get("companyId"),
    isActive: formData.get("isActive"),
    reason: formData.get("reason"),
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Revise a justificativa informada.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(
    validation.data.companyId,
  );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para alterar cargos.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "change_job_position_status_with_audit",
    {
      p_job_position_id: validation.data.positionId,
      p_is_active: validation.data.isActive,
      p_reason: validation.data.reason,
    },
  );

  if (error) {
    console.error("Erro ao alterar status do cargo:", error);

    return {
      success: false,
      message: getErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidatePath(
    `/company/${validation.data.companyId}`,
  );

  revalidatePath(
    `/company/${validation.data.companyId}/positions`,
  );

  return {
    success: true,
    message: validation.data.isActive
      ? "Cargo reativado com sucesso."
      : "Cargo inativado com sucesso.",
    fieldErrors: {},
  };
}