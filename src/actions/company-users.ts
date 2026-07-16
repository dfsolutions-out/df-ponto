"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CompanyUserActionState } from "@/types/company-user";
import { companyAdministratorSchema } from "@/validators/company-user";

async function validateMasterAccess() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      supabase,
      allowed: false,
      message:
        "Sua sessão expirou. Atualize a página e entre novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_master, is_active")
    .eq("id", userId)
    .single();

  if (
    !profile ||
    !profile.is_master ||
    !profile.is_active
  ) {
    return {
      supabase,
      allowed: false,
      message:
        "Você não possui permissão para realizar esta operação.",
    };
  }

  return {
    supabase,
    allowed: true,
    message: null,
  };
}

export async function createCompanyAdministratorAction(
  _previousState: CompanyUserActionState,
  formData: FormData,
): Promise<CompanyUserActionState> {
  const validation =
    companyAdministratorSchema.safeParse({
      companyId: formData.get("companyId"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      temporaryPassword: formData.get(
        "temporaryPassword",
      ),
      confirmTemporaryPassword: formData.get(
        "confirmTemporaryPassword",
      ),
    });

  if (!validation.success) {
    const errors =
      validation.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Revise os campos destacados antes de continuar.",
      fieldErrors: {
        fullName: errors.fullName,
        email: errors.email,
        phone: errors.phone,
        temporaryPassword:
          errors.temporaryPassword,
        confirmTemporaryPassword:
          errors.confirmTemporaryPassword,
      },
    };
  }

  const access = await validateMasterAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const admin = createAdminClient();

  const { data: company, error: companyError } =
    await access.supabase
      .from("companies")
      .select("id, status")
      .eq("id", input.companyId)
      .single();

  if (companyError || !company) {
    return {
      success: false,
      message: "Empresa não encontrada.",
      fieldErrors: {},
    };
  }

  if (company.status === "cancelled") {
    return {
      success: false,
      message:
        "Não é possível criar usuários para uma empresa cancelada.",
      fieldErrors: {},
    };
  }

  /*
   * Primeiro verificamos se o e-mail já pertence a algum
   * perfil. Isso permite usar o mesmo login em várias empresas.
   */
  const {
    data: existingProfile,
    error: existingProfileError,
  } = await admin
    .from("profiles")
    .select("id, email, is_active")
    .ilike("email", input.email)
    .maybeSingle();

  if (existingProfileError) {
    console.error(
      "Erro ao procurar perfil existente:",
      existingProfileError,
    );

    return {
      success: false,
      message:
        "Não foi possível verificar o usuário informado.",
      fieldErrors: {},
    };
  }

  let userId: string;
  let createdNewUser = false;

  if (existingProfile) {
    userId = existingProfile.id;

    if (!existingProfile.is_active) {
      return {
        success: false,
        message:
          "O e-mail informado pertence a um usuário globalmente inativo.",
        fieldErrors: {
          email: [
            "Este usuário está inativo na plataforma.",
          ],
        },
      };
    }

    const {
      data: existingMembership,
      error: membershipSearchError,
    } = await admin
      .from("company_memberships")
      .select("id")
      .eq("company_id", input.companyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipSearchError) {
      console.error(
        "Erro ao verificar vínculo existente:",
        membershipSearchError,
      );

      return {
        success: false,
        message:
          "Não foi possível verificar os vínculos do usuário.",
        fieldErrors: {},
      };
    }

    if (existingMembership) {
      return {
        success: false,
        message:
          "Este usuário já possui vínculo com a empresa.",
        fieldErrors: {
          email: [
            "O e-mail já está vinculado a esta empresa.",
          ],
        },
      };
    }
  } else {
    const {
      data: createdUser,
      error: createUserError,
    } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
      },
    });

    if (createUserError || !createdUser.user) {
      console.error(
        "Erro ao criar usuário no Supabase Auth:",
        createUserError,
      );

      const message =
        createUserError?.message.toLowerCase() ?? "";

      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        return {
          success: false,
          message:
            "Já existe um usuário de autenticação com este e-mail.",
          fieldErrors: {
            email: [
              "Este e-mail já está sendo utilizado.",
            ],
          },
        };
      }

      return {
        success: false,
        message:
          "Não foi possível criar o acesso do administrador.",
        fieldErrors: {},
      };
    }

    userId = createdUser.user.id;
    createdNewUser = true;

    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.phone,
        email: input.email,
        is_active: true,
        must_change_password: true,
      })
      .eq("id", userId);

    if (updateProfileError) {
      console.error(
        "Erro ao completar perfil do usuário:",
        updateProfileError,
      );

      await admin.auth.admin.deleteUser(userId);

      return {
        success: false,
        message:
          "O acesso foi iniciado, mas não foi possível concluir o perfil.",
        fieldErrors: {},
      };
    }
  }

  const { error: membershipError } =
    await access.supabase.rpc(
      "create_company_membership_with_audit",
      {
        p_company_id: input.companyId,
        p_user_id: userId,
        p_role: "company_admin",
      },
    );

  if (membershipError) {
    console.error(
      "Erro ao criar vínculo com a empresa:",
      membershipError,
    );

    /*
     * Só removemos o usuário se ele foi criado por esta ação.
     * Usuários antigos podem possuir outros vínculos.
     */
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId);
    }

    if (membershipError.code === "23505") {
      return {
        success: false,
        message:
          "Este usuário já possui vínculo com a empresa.",
        fieldErrors: {
          email: [
            "O e-mail já está vinculado a esta empresa.",
          ],
        },
      };
    }

    return {
      success: false,
      message:
        "Não foi possível vincular o administrador à empresa.",
      fieldErrors: {},
    };
  }

  revalidatePath(
    `/master/companies/${input.companyId}`,
  );

  revalidatePath(
    `/master/companies/${input.companyId}/users`,
  );

  redirect(
    `/master/companies/${input.companyId}/users?created=1&newUser=${
      createdNewUser ? "1" : "0"
    }`,
  );
}