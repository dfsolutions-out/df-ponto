import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (userId) {
    redirect("/access");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
              DF
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                DF Ponto
              </p>

              <p className="text-xs text-slate-400">
                Controle digital de jornada
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
              Acesso seguro
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Entrar no sistema
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Utilize suas credenciais para acessar o DF Ponto.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 DF Solutions. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}