"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  EmployeeActionState,
  EmployeeStatusActionState,
} from "@/types/employee";
import {
  employeeSchema,
  employeeStatusSchema,
  employeeUpdateSchema,
} from "@/validators/employee";

function getEmployeeFormValues(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    registrationNumber: formData.get("registrationNumber"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    admissionDate: formData.get("admissionDate"),
    departmentId: formData.get("departmentId"),
    jobPositionId: formData.get("jobPositionId"),
    teamId: formData.get("teamId"),
    notes: formData.get("notes"),

    grantAccess: formData.get("grantAccess") ?? "false",

    temporaryPassword: formData.get("temporaryPassword"),

    confirmTemporaryPassword: formData.get("confirmTemporaryPassword"),
  };
}

function getEmployeeErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "23505") {
    if (message.includes("cpf")) {
      return "Já existe um funcionário com este CPF nesta empresa.";
    }

    if (message.includes("registration")) {
      return "Já existe um funcionário com esta matrícula nesta empresa.";
    }

    if (message.includes("email")) {
      return "Já existe um funcionário com este e-mail nesta empresa.";
    }

    if (message.includes("user")) {
      return "Esta conta já está vinculada a outro funcionário nesta empresa.";
    }

    return "Já existe um registro com estes dados nesta empresa.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "O funcionário informado não foi encontrado.";
  }

  if (message.includes("cpf") && message.includes("check")) {
    return "Informe um CPF válido.";
  }

  if (message.includes("setor")) {
    return "O setor selecionado está indisponível ou não pertence à empresa.";
  }

  if (message.includes("cargo")) {
    return "O cargo selecionado está indisponível ou não pertence à empresa.";
  }

  if (message.includes("equipe")) {
    return "A equipe selecionada está indisponível ou não pertence à empresa.";
  }

  return error.message || "Não foi possível concluir a operação.";
}

async function findProfileByEmail(email: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, is_active")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível verificar a conta de acesso.");
  }

  return data;
}

async function ensureEmployeeAccess(params: {
  companyId: string;
  fullName: string;
  email: string;
  phone: string;
  temporaryPassword: string;
}): Promise<{
  userId: string;
  createdUser: boolean;
  createdMembership: boolean;
}> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const existingProfile = await findProfileByEmail(params.email);

  let userId: string;
  let createdUser = false;
  let createdMembership = false;

  if (existingProfile) {
    if (!existingProfile.is_active) {
      throw new Error("O e-mail pertence a um usuário globalmente inativo.");
    }

    userId = existingProfile.id;
  } else {
    const { data: createdUserResult, error: createUserError } =
      await admin.auth.admin.createUser({
        email: params.email,
        password: params.temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: params.fullName,
        },
      });

    if (createUserError || !createdUserResult.user) {
      console.error("Erro ao criar usuário do funcionário:", createUserError);

      throw new Error(
        createUserError?.message || "Não foi possível criar a conta de acesso.",
      );
    }

    userId = createdUserResult.user.id;
    createdUser = true;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: params.fullName,
        email: params.email,
        phone: params.phone,
        is_active: true,
        must_change_password: true,
      })
      .eq("id", userId);

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);

      throw new Error(
        "A conta foi criada, mas não foi possível concluir o perfil.",
      );
    }
  }

  const { data: existingMembership, error: membershipSearchError } = await admin
    .from("company_memberships")
    .select("id, status, role")
    .eq("company_id", params.companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipSearchError) {
    if (createdUser) {
      await admin.auth.admin.deleteUser(userId);
    }

    throw new Error("Não foi possível verificar o vínculo de acesso.");
  }

  if (!existingMembership) {
    const { error: membershipError } = await supabase.rpc(
      "create_employee_membership_with_audit",
      {
        p_company_id: params.companyId,
        p_user_id: userId,
      },
    );

    if (membershipError) {
      if (createdUser) {
        await admin.auth.admin.deleteUser(userId);
      }

      throw new Error(getEmployeeErrorMessage(membershipError));
    }

    createdMembership = true;
  } else if (existingMembership.status !== "active") {
    const { error: activateError } = await admin
      .from("company_memberships")
      .update({
        status: "active",
      })
      .eq("id", existingMembership.id);

    if (activateError) {
      throw new Error(
        "O usuário já existe, mas seu vínculo com a empresa não pôde ser reativado.",
      );
    }
  }

  return {
    userId,
    createdUser,
    createdMembership,
  };
}

export async function createEmployeeAction(
  companyId: string,
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const validation = employeeSchema.safeParse(getEmployeeFormValues(formData));

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados antes de continuar.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para cadastrar funcionários.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  /*
   * Primeiro cadastramos o vínculo trabalhista sem acesso.
   * Assim, se a criação da conta falhar, o funcionário
   * continua cadastrado e o acesso pode ser concedido depois.
   */
  const { data: employeeId, error: employeeError } = await supabase.rpc(
    "create_employee_with_audit",
    {
      p_company_id: companyId,
      p_user_id: null,
      p_full_name: input.fullName,
      p_cpf: input.cpf,
      p_registration_number: input.registrationNumber,
      p_email: input.email,
      p_phone: input.phone,
      p_admission_date: input.admissionDate,
      p_department_id: input.departmentId,
      p_job_position_id: input.jobPositionId,
      p_team_id: input.teamId,
      p_notes: input.notes,
    },
  );

  if (employeeError || !employeeId) {
    console.error("Erro ao cadastrar funcionário:", employeeError);

    return {
      success: false,
      message: getEmployeeErrorMessage(
        employeeError ?? {
          message: "O funcionário não foi criado.",
        },
      ),
      fieldErrors:
        employeeError?.code === "23505"
          ? {
              cpf: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
              registrationNumber: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
              email: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
            }
          : {},
    };
  }

  if (input.grantAccess) {
    try {
      const accessResult = await ensureEmployeeAccess({
        companyId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        temporaryPassword: input.temporaryPassword,
      });

      const { error: linkError } = await supabase.rpc(
        "set_employee_access_user_with_audit",
        {
          p_employee_id: employeeId,
          p_user_id: accessResult.userId,
          p_reason:
            "Conta de acesso vinculada durante o cadastro do funcionário.",
        },
      );

      if (linkError) {
        console.error("Erro ao vincular acesso ao funcionário:", linkError);

        revalidatePath(`/company/${companyId}`);

        revalidatePath(`/company/${companyId}/employees`);

        redirect(`/company/${companyId}/employees?created=1&accessWarning=1`);
      }
    } catch (error) {
      console.error(
        "Funcionário criado, mas houve erro ao criar o acesso:",
        error,
      );

      revalidatePath(`/company/${companyId}`);

      revalidatePath(`/company/${companyId}/employees`);

      redirect(`/company/${companyId}/employees?created=1&accessWarning=1`);
    }
  }

  revalidatePath(`/company/${companyId}`);

  revalidatePath(`/company/${companyId}/employees`);

  redirect(`/company/${companyId}/employees?created=1`);
}

export async function updateEmployeeAction(
  companyId: string,
  employeeId: string,
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const validation = employeeUpdateSchema.safeParse(
    getEmployeeFormValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados antes de continuar.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para editar funcionários.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_employee_with_audit", {
    p_employee_id: employeeId,
    p_full_name: input.fullName,
    p_cpf: input.cpf,
    p_registration_number: input.registrationNumber,
    p_email: input.email,
    p_phone: input.phone,
    p_admission_date: input.admissionDate,
    p_department_id: input.departmentId,
    p_job_position_id: input.jobPositionId,
    p_team_id: input.teamId,
    p_notes: input.notes,
  });

  if (error) {
    console.error("Erro ao atualizar funcionário:", error);

    return {
      success: false,
      message: getEmployeeErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? {
              cpf: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
              registrationNumber: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
              email: [
                "Confira se CPF, matrícula ou e-mail já estão cadastrados.",
              ],
            }
          : {},
    };
  }

  revalidatePath(`/company/${companyId}`);

  revalidatePath(`/company/${companyId}/employees`);

  revalidatePath(`/company/${companyId}/employees/${employeeId}/edit`);

  redirect(`/company/${companyId}/employees?updated=1`);
}

export async function changeEmployeeStatusAction(
  _previousState: EmployeeStatusActionState,
  formData: FormData,
): Promise<EmployeeStatusActionState> {
  const validation = employeeStatusSchema.safeParse({
    employeeId: formData.get("employeeId"),
    companyId: formData.get("companyId"),
    status: formData.get("status"),
    reason: formData.get("reason"),
    terminationDate: formData.get("terminationDate"),
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(validation.data.companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message: "Você não possui permissão para alterar funcionários.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { data: employee, error: employeeSearchError } = await supabase
    .from("employees")
    .select("id, user_id")
    .eq("company_id", validation.data.companyId)
    .eq("id", validation.data.employeeId)
    .single();

  if (employeeSearchError || !employee) {
    return {
      success: false,
      message: "Funcionário não encontrado.",
      fieldErrors: {},
    };
  }

  const { error } = await supabase.rpc("change_employee_status_with_audit", {
    p_employee_id: validation.data.employeeId,
    p_status: validation.data.status,
    p_reason: validation.data.reason,
    p_termination_date: validation.data.terminationDate,
  });

  if (error) {
    console.error("Erro ao alterar status do funcionário:", error);

    return {
      success: false,
      message: getEmployeeErrorMessage(error),
      fieldErrors: {},
    };
  }

  /*
   * Mantém o acesso coerente com o status trabalhista.
   *
   * active      → vínculo ativo
   * blocked     → vínculo bloqueado
   * terminated  → vínculo inativo
   * on_leave    → acesso permanece como está
   */
  if (employee.user_id && validation.data.status !== "on_leave") {
    const membershipStatus =
      validation.data.status === "active"
        ? "active"
        : validation.data.status === "blocked"
          ? "blocked"
          : "inactive";

    const { error: membershipError } = await supabase.rpc(
      "change_employee_membership_status_with_audit",
      {
        p_employee_id: validation.data.employeeId,
        p_membership_status: membershipStatus,
        p_reason: validation.data.reason,
      },
    );

    if (membershipError) {
      console.error(
        "Status trabalhista alterado, mas o acesso não foi sincronizado:",
        membershipError,
      );

      revalidatePath(`/company/${validation.data.companyId}`);

      revalidatePath(`/company/${validation.data.companyId}/employees`);

      return {
        success: true,
        message:
          "O status do funcionário foi alterado, mas o acesso precisa ser revisado.",
        fieldErrors: {},
      };
    }
  }

  revalidatePath(`/company/${validation.data.companyId}`);

  revalidatePath(`/company/${validation.data.companyId}/employees`);

  return {
    success: true,
    message: "Status do funcionário atualizado com sucesso.",
    fieldErrors: {},
  };
}
