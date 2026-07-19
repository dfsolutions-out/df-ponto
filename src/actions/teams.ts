"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/services/company-access";
import type {
  TeamActionState,
  TeamStatusActionState,
} from "@/types/team";
import {
  teamSchema,
  teamStatusSchema,
} from "@/validators/team";

function getTeamValues(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    departmentId: formData.get("departmentId"),
    managerMembershipId: formData.get(
      "managerMembershipId",
    ),
    supervisorMembershipId: formData.get(
      "supervisorMembershipId",
    ),
  };
}

function getTeamErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "23505") {
    return "Já existe uma equipe com este nome nesta empresa.";
  }

  if (error.code === "23503") {
    return "Um dos vínculos selecionados não está mais disponível.";
  }

  if (error.code === "23514") {
    return "Os dados da equipe não atendem às regras obrigatórias.";
  }

  if (error.code === "42501") {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (error.code === "P0002") {
    return "A equipe informada não foi encontrada.";
  }

  if (error.message?.includes("setor")) {
    return "O setor selecionado não pertence a esta empresa ou está indisponível.";
  }

  if (error.message?.includes("gestor")) {
    return "O gestor selecionado não possui um vínculo válido nesta empresa.";
  }

  if (error.message?.includes("supervisor")) {
    return "O supervisor selecionado não possui um vínculo válido nesta empresa.";
  }

  return (
    error.message ||
    "Não foi possível concluir a operação."
  );
}

export async function createTeamAction(
  companyId: string,
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const validation = teamSchema.safeParse(
    getTeamValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const access =
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para cadastrar equipes.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "create_team_with_audit",
    {
      p_company_id: companyId,
      p_name: validation.data.name,
      p_description:
        validation.data.description,
      p_department_id:
        validation.data.departmentId,
      p_manager_membership_id:
        validation.data.managerMembershipId,
      p_supervisor_membership_id:
        validation.data
          .supervisorMembershipId,
    },
  );

  if (error) {
    console.error(
      "Erro ao cadastrar equipe:",
      error,
    );

    return {
      success: false,
      message: getTeamErrorMessage(error),
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
    `/company/${companyId}/teams`,
  );

  redirect(
    `/company/${companyId}/teams?created=1`,
  );
}

export async function updateTeamAction(
  companyId: string,
  teamId: string,
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const validation = teamSchema.safeParse(
    getTeamValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const access =
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para editar equipes.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "update_team_with_audit",
    {
      p_team_id: teamId,
      p_name: validation.data.name,
      p_description:
        validation.data.description,
      p_department_id:
        validation.data.departmentId,
      p_manager_membership_id:
        validation.data.managerMembershipId,
      p_supervisor_membership_id:
        validation.data
          .supervisorMembershipId,
    },
  );

  if (error) {
    console.error(
      "Erro ao atualizar equipe:",
      error,
    );

    return {
      success: false,
      message: getTeamErrorMessage(error),
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
    `/company/${companyId}/teams`,
  );

  revalidatePath(
    `/company/${companyId}/teams/${teamId}/edit`,
  );

  redirect(
    `/company/${companyId}/teams?updated=1`,
  );
}

export async function changeTeamStatusAction(
  _previousState: TeamStatusActionState,
  formData: FormData,
): Promise<TeamStatusActionState> {
  const validation = teamStatusSchema.safeParse({
    teamId: formData.get("teamId"),
    companyId: formData.get("companyId"),
    isActive: formData.get("isActive"),
    reason: formData.get("reason"),
  });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise a justificativa informada.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const access = await requireCompanyAccess(
    validation.data.companyId,
  );

  if (!access.canManageOrganization) {
    return {
      success: false,
      message:
        "Você não possui permissão para alterar equipes.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "change_team_status_with_audit",
    {
      p_team_id: validation.data.teamId,
      p_is_active:
        validation.data.isActive,
      p_reason: validation.data.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao alterar status da equipe:",
      error,
    );

    return {
      success: false,
      message: getTeamErrorMessage(error),
      fieldErrors: {},
    };
  }

  revalidatePath(
    `/company/${validation.data.companyId}`,
  );

  revalidatePath(
    `/company/${validation.data.companyId}/teams`,
  );

  return {
    success: true,
    message: validation.data.isActive
      ? "Equipe reativada com sucesso."
      : "Equipe inativada com sucesso.",
    fieldErrors: {},
  };
}