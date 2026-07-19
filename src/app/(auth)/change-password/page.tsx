import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ChangePasswordPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "full_name, email, is_active, must_change_password",
      )
      .eq("id", userId)
      .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (!profile.must_change_password) {
    redirect("/access");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <KeyRound className="size-6" />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Primeiro acesso
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Crie uma nova senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Olá,{" "}
            {profile.full_name?.trim() ||
              "usuário"}. Por segurança, substitua a senha
            provisória antes de acessar o sistema.
          </p>

          <ChangePasswordForm />

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="size-4" />
            Acesso protegido pela DF Solutions
          </div>
        </div>
      </div>
    </main>
  );
}