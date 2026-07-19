"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  WorkScheduleConfigurationActionState,
} from "@/types/work-schedule-day";
import {
  workScheduleConfigurationSchema,
} from "@/validators/work-schedule-day";

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "42501") {
    return "Você não possui permissão para configurar esta jornada.";
  }

  if (error.code === "P0002") {
    return "A jornada informada não foi encontrada.";
  }

  if (error.code === "22023") {
    return (
      error.message ||
      "A configuração enviada é inválida."
    );
  }

  if (error.code === "23505") {
    return "Existe uma configuração duplicada nesta jornada.";
  }

  return (
    error.message ||
    "Não foi possível salvar a configuração."
  );
}

export async function saveWorkScheduleConfigurationAction(
  _previousState: WorkScheduleConfigurationActionState,
  formData: FormData,
): Promise<WorkScheduleConfigurationActionState> {
  const rawConfiguration =
    formData.get("configuration");

  if (
    typeof rawConfiguration !==
    "string"
  ) {
    return {
      success: false,
      message:
        "A configuração da jornada não foi enviada.",
      fieldErrors: {
        configuration: [
          "Configuração ausente.",
        ],
      },
    };
  }

  let parsedConfiguration: unknown;

  try {
    parsedConfiguration =
      JSON.parse(rawConfiguration);
  } catch {
    return {
      success: false,
      message:
        "A configuração da jornada está corrompida.",
      fieldErrors: {
        configuration: [
          "Não foi possível interpretar os dados enviados.",
        ],
      },
    };
  }

  const validation =
    workScheduleConfigurationSchema.safeParse(
      parsedConfiguration,
    );

  if (!validation.success) {
    console.error(
      "Configuração de jornada inválida:",
      validation.error.flatten(),
    );

    return {
      success: false,
      message:
        validation.error.issues[0]
          ?.message ||
        "Revise os dias e horários da jornada.",
      fieldErrors: {
        configuration: [
          "Existem dias ou horários inválidos.",
        ],
      },
    };
  }

  const {
    companyId,
    scheduleId,
    days,
  } = validation.data;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para configurar jornadas.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  for (const day of days) {
    const { error } = await supabase.rpc(
      "replace_work_schedule_day_configuration_with_audit",
      {
        p_work_schedule_id:
          scheduleId,
        p_day_index:
          day.dayIndex,
        p_weekday:
          day.weekday,
        p_label:
          day.label,
        p_is_workday:
          day.isWorkday,
        p_punches:
          day.isWorkday
            ? day.punches.map(
                (punch, index) => ({
                  sequence:
                    index + 1,
                  punchType:
                    punch.punchType,
                  label:
                    punch.label,
                  expectedTime:
                    punch.expectedTime,
                  dayOffset:
                    punch.dayOffset,
                  isRequired:
                    punch.isRequired,
                }),
              )
            : [],
      },
    );

    if (error) {
      console.error(
        `Erro ao salvar o dia ${day.dayIndex}:`,
        error,
      );

      return {
        success: false,
        message:
          getErrorMessage(error),
        fieldErrors: {
          configuration: [
            `Não foi possível salvar ${day.label}.`,
          ],
        },
      };
    }
  }

  revalidatePath(
    `/company/${companyId}`,
  );

  revalidatePath(
    `/company/${companyId}/schedules`,
  );

  revalidatePath(
    `/company/${companyId}/schedules/${scheduleId}/edit`,
  );

  return {
    success: true,
    message:
      "Dias e horários salvos com sucesso.",
    fieldErrors: {},
  };
}