"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/validators/auth";

export type LoginActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validation = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    const errors =
      validation.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Revise os campos destacados.",
      fieldErrors: {
        email: errors.email,
        password: errors.password,
      },
    };
  }

  const supabase = await createClient();

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

  if (loginError) {
    return {
      success: false,
      message: "E-mail ou senha inválidos.",
      fieldErrors: {},
    };
  }

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    await supabase.auth.signOut();

    return {
      success: false,
      message:
        "Não foi possível validar sua sessão. Tente novamente.",
      fieldErrors: {},
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "is_active, must_change_password",
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return {
      success: false,
      message:
        "Seu perfil não foi encontrado. Entre em contato com o suporte.",
      fieldErrors: {},
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();

    return {
      success: false,
      message:
        "Seu acesso está inativo. Entre em contato com o suporte.",
      fieldErrors: {},
    };
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect("/access");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}