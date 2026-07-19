"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  EmployeeScheduleActionState,
} from "@/types/employee-schedule";
import {
  employeeScheduleAssignmentSchema,
} from "@/validators/employee-schedule";

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "42501") {
    return "Você não possui permissão para atribuir jornadas.";
  }

  if (error.code === "P0002") {
    return (
      error.message ||
      "Funcionário ou jornada não encontrado."
    );
  }

  if (error.code === "22023") {
    return (
      error.message ||
      "Os dados da atribuição são inválidos."
    );
  }

  if (error.code === "23505") {
    return "O funcionário já possui uma jornada vigente neste período.";
  }

  return (
    error.message ||
    "Não foi possível atribuir a jornada."
  );
}

export async function assignEmployeeScheduleAction(
  _previousState: EmployeeScheduleActionState,
  formData: FormData,
): Promise<EmployeeScheduleActionState> {
  const validation =
    employeeScheduleAssignmentSchema.safeParse(
      {
        companyId:
          formData.get("companyId"),

        employeeId:
          formData.get("employeeId"),

        workScheduleId:
          formData.get("workScheduleId"),

        startsOn:
          formData.get("startsOn"),

        reason:
          formData.get("reason"),
      },
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

  const {
    companyId,
    employeeId,
    workScheduleId,
    startsOn,
    reason,
  } = validation.data;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para atribuir jornadas.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const {
    data: employee,
    error: employeeError,
  } = await supabase
    .from("employees")
    .select(
      `
        id,
        admission_date,
        termination_date,
        status
      `,
    )
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee) {
    return {
      success: false,
      message:
        "Funcionário não encontrado.",
      fieldErrors: {},
    };
  }

  if (
    startsOn <
    employee.admission_date
  ) {
    return {
      success: false,
      message:
        "A jornada não pode começar antes da data de admissão do funcionário.",
      fieldErrors: {
        startsOn: [
          "Informe uma data igual ou posterior à admissão.",
        ],
      },
    };
  }

  if (
    employee.termination_date &&
    startsOn >
      employee.termination_date
  ) {
    return {
      success: false,
      message:
        "A jornada não pode começar depois da data de desligamento.",
      fieldErrors: {
        startsOn: [
          "Informe uma data anterior ou igual ao desligamento.",
        ],
      },
    };
  }

  if (
    employee.status ===
    "terminated"
  ) {
    return {
      success: false,
      message:
        "Não é possível atribuir uma nova jornada a um funcionário desligado.",
      fieldErrors: {},
    };
  }

  const { error } = await supabase.rpc(
    "assign_employee_schedule_with_audit",
    {
      p_employee_id: employeeId,
      p_work_schedule_id:
        workScheduleId,
      p_starts_on: startsOn,
      p_reason: reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao atribuir jornada:",
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
    `/company/${companyId}`,
  );

  revalidatePath(
    `/company/${companyId}/employees`,
  );

  revalidatePath(
    `/company/${companyId}/employees/${employeeId}/edit`,
  );

  return {
    success: true,
    message:
      "Jornada atribuída com sucesso.",
    fieldErrors: {},
  };
}