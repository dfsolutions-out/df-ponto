import { Building2, LogOut, ShieldCheck } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CompanyHeader(props: {
  companyName: string;
  roleLabel: string;
  fullName: string;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{props.companyName}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
              <ShieldCheck className="size-3.5" />
              {props.roleLabel}
            </p>
          </div>
        </div>

        <div className="hidden lg:block">
          <p className="text-sm font-semibold">{props.companyName}</p>
          <p className="text-xs text-slate-500">{props.roleLabel}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{props.fullName}</p>
            <p className="text-xs text-slate-500">{props.email}</p>
          </div>
          <form action={logoutAction}>
            <SubmitButton
              idleText="Sair"
              pendingText="Saindo..."
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </form>
          <LogOut className="hidden size-4" />
        </div>
      </div>
    </header>
  );
}
