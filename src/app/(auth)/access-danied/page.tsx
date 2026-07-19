import {
  Ban,
  LogOut,
} from "lucide-react";

import { logoutAction } from "@/actions/auth";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
          <Ban className="size-8" />
        </div>

        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-red-400">
          Acesso indisponível
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Não foi possível acessar uma empresa
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          Seu usuário não possui vínculo ativo com uma empresa
          liberada para operação. Entre em contato com o
          administrador ou com o suporte da DF Solutions.
        </p>

        <form
          action={logoutAction}
          className="mt-8"
        >
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 px-6 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <LogOut className="size-4" />
            Sair do sistema
          </button>
        </form>
      </section>
    </main>
  );
}