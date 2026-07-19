"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/validators/password";

export type ChangePasswordActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const validation = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Revise os campos destacados.",
      fieldErrors: {
        password: errors.password,
        confirmPassword: errors.confirmPassword,
      },
    };
  }

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente.",
      fieldErrors: {},
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (passwordError) {
    console.error("Erro ao atualizar senha:", passwordError);

    return {
      success: false,
      message: "Não foi possível atualizar sua senha.",
      fieldErrors: {},
    };
  }

  const { error: profileError } = await supabase.rpc("complete_first_access");

  if (profileError) {
    console.error("Erro ao finalizar primeiro acesso:", profileError);

    return {
      success: false,
      message:
        "A senha foi alterada, mas não foi possível finalizar o primeiro acesso. Entre em contato com o suporte.",
      fieldErrors: {},
    };
  }

  revalidatePath("/", "layout");

  redirect("/access");
}
