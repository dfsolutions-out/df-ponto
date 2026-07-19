"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  WorkScheduleActionState,
  WorkScheduleStatusActionState,
} from "@/types/work-schedule";
import {
  workScheduleSchema,
  workScheduleStatusSchema,
} from "@/validators/work-schedule";

function getWorkScheduleFormValues(
  formData: FormData,
) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    scheduleType:
      formData.get("scheduleType"),
    cycleLengthDays:
      formData.get("cycleLengthDays"),
    expectedWeeklyHours:
      formData.get("expectedWeeklyHours"),
    isNightShift:
      formData.get("isNightShift") ??
      "false",
  };
}

function hoursToMinutes(
  value: string | null,
): number | null {
  if (!value) {
    return null;
  }

  const hours = Number(
    value.replace(",", "."),
  );

  if (!Number.isFinite(hours)) {
    return null;
  }

  return Math.round(hours * 60);
}

function getWorkScheduleErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  const message =
    error.message?.toLowerCase() ?? "";

  if (error.code === "23505") {
    return "Já existe uma jornada com este nome nesta empresa.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "A jornada informada não foi encontrada.";
  }

  if (
    message.includes("cycle_length") ||
    message.includes("ciclo")
  ) {
    return "Informe uma duração de ciclo válida.";
  }

  if (
    message.includes(
      "expected_weekly_minutes",
    )
  ) {
    return "Informe uma carga semanal válida.";
  }

  return (
    error.message ||
    "Não foi possível concluir a operação."
  );
}

export async function createWorkScheduleAction(
  companyId: string,
  _previousState: WorkScheduleActionState,
  formData: FormData,
): Promise<WorkScheduleActionState> {
  const validation =
    workScheduleSchema.safeParse(
      getWorkScheduleFormValues(formData),
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
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para cadastrar jornadas.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  const {
    data: scheduleId,
    error,
  } = await supabase.rpc(
    "create_work_schedule_with_audit",
    {
      p_company_id: companyId,
      p_name: input.name,
      p_description: input.description,
      p_schedule_type:
        input.scheduleType,
      p_cycle_length_days:
        input.cycleLengthDays,
      p_expected_weekly_minutes:
        hoursToMinutes(
          input.expectedWeeklyHours,
        ),
      p_is_night_shift:
        input.isNightShift,
    },
  );

  if (error || !scheduleId) {
    console.error(
      "Erro ao cadastrar jornada:",
      error,
    );

    return {
      success: false,
      message:
        getWorkScheduleErrorMessage(
          error ?? {
            message:
              "A jornada não foi criada.",
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

  revalidatePath(`/company/${companyId}`);

  revalidatePath(
    `/company/${companyId}/schedules`,
  );

  redirect(
    `/company/${companyId}/schedules/${scheduleId}/edit?created=1`,
  );
}

export async function updateWorkScheduleAction(
  companyId: string,
  scheduleId: string,
  _previousState: WorkScheduleActionState,
  formData: FormData,
): Promise<WorkScheduleActionState> {
  const validation =
    workScheduleSchema.safeParse(
      getWorkScheduleFormValues(formData),
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
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para editar jornadas.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "update_work_schedule_with_audit",
    {
      p_work_schedule_id: scheduleId,
      p_name: input.name,
      p_description: input.description,
      p_schedule_type:
        input.scheduleType,
      p_cycle_length_days:
        input.cycleLengthDays,
      p_expected_weekly_minutes:
        hoursToMinutes(
          input.expectedWeeklyHours,
        ),
      p_is_night_shift:
        input.isNightShift,
    },
  );

  if (error) {
    console.error(
      "Erro ao atualizar jornada:",
      error,
    );

    return {
      success: false,
      message:
        getWorkScheduleErrorMessage(error),
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

  revalidatePath(`/company/${companyId}`);

  revalidatePath(
    `/company/${companyId}/schedules`,
  );

  revalidatePath(
    `/company/${companyId}/schedules/${scheduleId}/edit`,
  );

  redirect(
    `/company/${companyId}/schedules?updated=1`,
  );
}

export async function changeWorkScheduleStatusAction(
  _previousState: WorkScheduleStatusActionState,
  formData: FormData,
): Promise<WorkScheduleStatusActionState> {
  const validation =
    workScheduleStatusSchema.safeParse({
      companyId:
        formData.get("companyId"),
      scheduleId:
        formData.get("scheduleId"),
      isActive:
        formData.get("isActive"),
      reason: formData.get("reason"),
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
        "Você não possui permissão para alterar jornadas.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "change_work_schedule_status_with_audit",
    {
      p_work_schedule_id:
        validation.data.scheduleId,
      p_is_active:
        validation.data.isActive,
      p_reason: validation.data.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao alterar status da jornada:",
      error,
    );

    return {
      success: false,
      message:
        getWorkScheduleErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidatePath(
    `/company/${validation.data.companyId}`,
  );

  revalidatePath(
    `/company/${validation.data.companyId}/schedules`,
  );

  return {
    success: true,
    message: validation.data.isActive
      ? "Jornada reativada com sucesso."
      : "Jornada inativada com sucesso.",
    fieldErrors: {},
  };
}