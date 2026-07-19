"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  EmployeeLocationAssignmentActionState,
  EmployeeLocationSimpleActionState,
} from "@/types/employee-location";
import {
  employeeLocationAssignmentSchema,
  employeeLocationEndSchema,
  employeeLocationPrimarySchema,
} from "@/validators/employee-location";

function getErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "42501") {
    return "Você não possui permissão para gerenciar locais deste funcionário.";
  }

  if (error.code === "P0002") {
    return (
      error.message ||
      "Funcionário, local ou vínculo não encontrado."
    );
  }

  if (error.code === "22023") {
    return (
      error.message ||
      "Os dados informados são inválidos."
    );
  }

  if (error.code === "23505") {
    return (
      error.message ||
      "Este local já está atribuído durante o período informado."
    );
  }

  return (
    error.message ||
    "Não foi possível concluir a operação."
  );
}

function revalidateEmployeeLocationPaths(
  companyId: string,
  employeeId: string,
): void {
  revalidatePath(
    `/company/${companyId}`,
  );

  revalidatePath(
    `/company/${companyId}/employees`,
  );

  revalidatePath(
    `/company/${companyId}/employees/${employeeId}/edit`,
  );
}

export async function assignEmployeeLocationAction(
  _previousState:
    EmployeeLocationAssignmentActionState,
  formData: FormData,
): Promise<EmployeeLocationAssignmentActionState> {
  const validation =
    employeeLocationAssignmentSchema.safeParse(
      {
        companyId:
          formData.get("companyId"),

        employeeId:
          formData.get("employeeId"),

        workLocationId:
          formData.get("workLocationId"),

        isPrimary:
          formData.get("isPrimary") ===
          "true"
            ? "true"
            : "false",

        startsOn:
          formData.get("startsOn"),

        endsOn:
          formData.get("endsOn"),

        customRadiusMeters:
          formData.get(
            "customRadiusMeters",
          ),

        outsideRadiusActionOverride:
          formData.get(
            "outsideRadiusActionOverride",
          ),

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

  const input = validation.data;

  const access =
    await requireCompanyAccess(
      input.companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para atribuir locais.",
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
    .eq(
      "company_id",
      input.companyId,
    )
    .eq("id", input.employeeId)
    .maybeSingle();

  if (
    employeeError ||
    !employee
  ) {
    return {
      success: false,
      message:
        "Funcionário não encontrado.",
      fieldErrors: {},
    };
  }

  if (
    input.startsOn <
    employee.admission_date
  ) {
    return {
      success: false,
      message:
        "O local não pode começar antes da admissão.",
      fieldErrors: {
        startsOn: [
          "Informe uma data igual ou posterior à admissão.",
        ],
      },
    };
  }

  if (
    employee.termination_date &&
    input.startsOn >
      employee.termination_date
  ) {
    return {
      success: false,
      message:
        "O local não pode começar depois do desligamento.",
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
        "Não é possível atribuir local a um funcionário desligado.",
      fieldErrors: {},
    };
  }

  const { error } = await supabase.rpc(
    "assign_employee_work_location_with_audit",
    {
      p_employee_id:
        input.employeeId,

      p_work_location_id:
        input.workLocationId,

      p_is_primary:
        input.isPrimary,

      p_custom_radius_meters:
        input.customRadiusMeters,

      p_outside_radius_action_override:
        input.outsideRadiusActionOverride,

      p_starts_on:
        input.startsOn,

      p_ends_on:
        input.endsOn,

      p_reason:
        input.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao atribuir local:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidateEmployeeLocationPaths(
    input.companyId,
    input.employeeId,
  );

  return {
    success: true,
    message:
      "Local atribuído com sucesso.",
    fieldErrors: {},
  };
}

export async function setEmployeePrimaryLocationAction(
  _previousState:
    EmployeeLocationSimpleActionState,
  formData: FormData,
): Promise<EmployeeLocationSimpleActionState> {
  const validation =
    employeeLocationPrimarySchema.safeParse(
      {
        companyId:
          formData.get("companyId"),

        employeeId:
          formData.get("employeeId"),

        assignmentId:
          formData.get("assignmentId"),

        reason:
          formData.get("reason"),
      },
    );

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

  const input = validation.data;

  const access =
    await requireCompanyAccess(
      input.companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para alterar o local principal.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "set_employee_primary_work_location_with_audit",
    {
      p_assignment_id:
        input.assignmentId,

      p_reason:
        input.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao alterar local principal:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidateEmployeeLocationPaths(
    input.companyId,
    input.employeeId,
  );

  return {
    success: true,
    message:
      "Local principal atualizado.",
    fieldErrors: {},
  };
}

export async function endEmployeeLocationAction(
  _previousState:
    EmployeeLocationSimpleActionState,
  formData: FormData,
): Promise<EmployeeLocationSimpleActionState> {
  const validation =
    employeeLocationEndSchema.safeParse(
      {
        companyId:
          formData.get("companyId"),

        employeeId:
          formData.get("employeeId"),

        assignmentId:
          formData.get("assignmentId"),

        endsOn:
          formData.get("endsOn"),

        reason:
          formData.get("reason"),
      },
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos informados.",
      fieldErrors:
        validation.error.flatten()
          .fieldErrors,
    };
  }

  const input = validation.data;

  const access =
    await requireCompanyAccess(
      input.companyId,
    );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para encerrar este local.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "end_employee_work_location_assignment_with_audit",
    {
      p_assignment_id:
        input.assignmentId,

      p_ends_on:
        input.endsOn,

      p_reason:
        input.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao encerrar local:",
      error,
    );

    return {
      success: false,
      message:
        getErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidateEmployeeLocationPaths(
    input.companyId,
    input.employeeId,
  );

  return {
    success: true,
    message:
      "Vínculo com o local encerrado.",
    fieldErrors: {},
  };
}