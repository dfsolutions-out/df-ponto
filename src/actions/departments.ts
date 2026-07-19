"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  DepartmentActionState,
  DepartmentStatusActionState,
} from "@/types/department";
import {
  departmentSchema,
  departmentStatusSchema,
} from "@/validators/department";

function getDepartmentValues(formData: FormData) {
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
    return "Já existe um setor com este nome nesta empresa.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "O setor informado não foi encontrado.";
  }

  return "Não foi possível concluir a operação.";
}

export async function createDepartmentAction(
  companyId: string,
  _previousState: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  const validation = departmentSchema.safeParse(
    getDepartmentValues(formData),
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
      message: "Você não possui permissão para cadastrar setores.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "create_department_with_audit",
    {
      p_company_id: companyId,
      p_name: validation.data.name,
      p_description: validation.data.description,
    },
  );

  if (error) {
    console.error("Erro ao cadastrar setor:", error);

    return {
      success: false,
      message: getErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? { name: ["Este nome já está sendo utilizado."] }
          : {},
    };
  }

  revalidatePath(`/company/${companyId}`);
  revalidatePath(`/company/${companyId}/departments`);
  redirect(`/company/${companyId}/departments?created=1`);
}

export async function updateDepartmentAction(
  companyId: string,
  departmentId: string,
  _previousState: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  const validation = departmentSchema.safeParse(
    getDepartmentValues(formData),
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
      message: "Você não possui permissão para editar setores.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "update_department_with_audit",
    {
      p_department_id: departmentId,
      p_name: validation.data.name,
      p_description: validation.data.description,
    },
  );

  if (error) {
    console.error("Erro ao atualizar setor:", error);

    return {
      success: false,
      message: getErrorMessage(error),
      fieldErrors:
        error.code === "23505"
          ? { name: ["Este nome já está sendo utilizado."] }
          : {},
    };
  }

  revalidatePath(`/company/${companyId}`);
  revalidatePath(`/company/${companyId}/departments`);
  revalidatePath(
    `/company/${companyId}/departments/${departmentId}/edit`,
  );
  redirect(`/company/${companyId}/departments?updated=1`);
}

export async function changeDepartmentStatusAction(
  _previousState: DepartmentStatusActionState,
  formData: FormData,
): Promise<DepartmentStatusActionState> {
  const validation = departmentStatusSchema.safeParse({
    departmentId: formData.get("departmentId"),
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
      message: "Você não possui permissão para alterar setores.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "change_department_status_with_audit",
    {
      p_department_id: validation.data.departmentId,
      p_is_active: validation.data.isActive,
      p_reason: validation.data.reason,
    },
  );

  if (error) {
    console.error("Erro ao alterar status do setor:", error);

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
    `/company/${validation.data.companyId}/departments`,
  );

  return {
    success: true,
    message: validation.data.isActive
      ? "Setor reativado com sucesso."
      : "Setor inativado com sucesso.",
    fieldErrors: {},
  };
}
