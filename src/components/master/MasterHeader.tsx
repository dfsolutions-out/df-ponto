import {
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

type MasterHeaderProps = {
  fullName: string;
  email: string;
};

export function MasterHeader({
  fullName,
  email,
}: MasterHeaderProps) {
  const firstName =
    fullName.trim().split(/\s+/)[0] || "Administrador";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/master"
            aria-label="Voltar para a visão geral"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white lg:hidden"
          >
            DF
          </Link>

          <button
            type="button"
            aria-label="Abrir menu"
            disabled
            title="Menu mobile será ativado em uma próxima melhoria"
            className="flex size-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-800 text-slate-600 lg:hidden"
          >
            <Menu
              aria-hidden="true"
              className="size-5"
            />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="hidden size-4 text-blue-400 sm:block"
              />

              <p className="truncate text-sm font-semibold text-white sm:text-base">
                Painel Master
              </p>
            </div>

            <p className="hidden text-xs text-slate-500 sm:block">
              Gestão geral da plataforma DF Ponto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-white">
              Olá, {firstName}
            </p>

            <p className="max-w-56 truncate text-xs text-slate-500">
              {email}
            </p>
          </div>

          <div className="hidden h-9 w-px bg-slate-800 md:block" />

          <form action={logoutAction}>
            <SubmitButton
              idleText="Sair"
              pendingText="Saindo..."
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </form>

          <LogOut
            aria-hidden="true"
            className="hidden size-4 text-slate-600"
          />
        </div>
      </div>
    </header>
  );
}