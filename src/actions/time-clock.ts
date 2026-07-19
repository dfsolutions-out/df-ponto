"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type {
  RegisterTimeEntryActionState,
} from "@/types/time-entry";
import {
  registerTimeEntrySchema,
} from "@/validators/time-entry";

const initialErrorState: RegisterTimeEntryActionState =
  {
    success: false,
    message: null,
    timeEntryId: null,
    fieldErrors: {},
  };

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "42501") {
    return (
      error.message ||
      "Você não possui permissão para registrar esta marcação."
    );
  }

  if (error.code === "P0002") {
    return (
      error.message ||
      "Funcionário não encontrado."
    );
  }

  if (error.code === "22023") {
    return (
      error.message ||
      "A marcação não pôde ser validada."
    );
  }

  if (error.code === "23505") {
    return (
      error.message ||
      "Aguarde alguns segundos antes de registrar novamente."
    );
  }

  return (
    error.message ||
    "Não foi possível registrar o ponto."
  );
}

export async function registerTimeEntryAction(
  _previousState:
    RegisterTimeEntryActionState,
  formData: FormData,
): Promise<RegisterTimeEntryActionState> {
  const validation =
    registerTimeEntrySchema.safeParse(
      {
        companyId:
          formData.get("companyId"),

        employeeId:
          formData.get("employeeId"),

        latitude:
          formData.get("latitude"),

        longitude:
          formData.get("longitude"),

        accuracyMeters:
          formData.get(
            "accuracyMeters",
          ),

        justification:
          formData.get(
            "justification",
          ),

        clientIdempotencyKey:
          formData.get(
            "clientIdempotencyKey",
          ),

        clientRecordedAt:
          formData.get(
            "clientRecordedAt",
          ),

        source:
          formData.get("source"),

        deviceIdentifier:
          formData.get(
            "deviceIdentifier",
          ),

        userAgent:
          formData.get("userAgent"),
      },
    );

  if (!validation.success) {
    return {
      ...initialErrorState,

      message:
        "Revise a localização e os dados informados.",

      fieldErrors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  const input = validation.data;

  const supabase =
    await createClient();

  const {
    data: timeEntryId,
    error,
  } = await supabase.rpc(
    "register_time_entry_with_audit",
    {
      p_company_id:
        input.companyId,

      p_employee_id:
        input.employeeId,

      p_latitude:
        input.latitude,

      p_longitude:
        input.longitude,

      p_accuracy_meters:
        input.accuracyMeters,

      p_justification:
        input.justification,

      p_client_idempotency_key:
        input.clientIdempotencyKey,

      p_client_recorded_at:
        input.clientRecordedAt,

      p_source:
        input.source,

      p_device_identifier:
        input.deviceIdentifier,

      p_user_agent:
        input.userAgent,
    },
  );

  if (
    error ||
    !timeEntryId
  ) {
    console.error(
      "Erro ao registrar ponto:",
      error,
    );

    return {
      ...initialErrorState,

      message:
        getErrorMessage(
          error ?? {
            message:
              "A marcação não foi criada.",
          },
        ),
    };
  }

  revalidatePath(
    `/company/${input.companyId}`,
  );

  revalidatePath(
    `/company/${input.companyId}/time-clock`,
  );

  return {
    success: true,
    message:
      "Ponto registrado com sucesso.",
    timeEntryId:
      String(timeEntryId),
    fieldErrors: {},
  };
}