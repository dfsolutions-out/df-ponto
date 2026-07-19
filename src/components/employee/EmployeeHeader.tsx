"use client";

import {
  Building2,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import type {
  EmployeePortalContext,
} from "@/types/employee-portal";

type EmployeeHeaderProps = {
  context: EmployeePortalContext;
};

export function EmployeeHeader({
  context,
}: EmployeeHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [
    companyMenuOpen,
    setCompanyMenuOpen,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const currentCompanyName =
    context.current.companyTradeName ??
    context.current.companyName;

  function buildCompanyPath(
    companyId: string,
  ): string {
    const currentBase =
      `/employee/${context.current.companyId}`;

    const newBase =
      `/employee/${companyId}`;

    if (
      pathname.startsWith(
        currentBase,
      )
    ) {
      return pathname.replace(
        currentBase,
        newBase,
      );
    }

    return newBase;
  }

  async function handleSignOut(): Promise<void> {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    const supabase =
      createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={`/employee/${context.current.companyId}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-950/40">
            DF
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              DF Ponto
            </p>

            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Portal do funcionário
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {context.companies.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setCompanyMenuOpen(
                    (current) =>
                      !current,
                  )
                }
                className="flex h-10 max-w-48 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white sm:max-w-72"
              >
                <Building2 className="size-4 shrink-0 text-blue-400" />

                <span className="truncate">
                  {currentCompanyName}
                </span>

                <ChevronDown className="size-4 shrink-0" />
              </button>

              {companyMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Trocar vínculo
                  </p>

                  {context.companies.map(
                    (company) => {
                      const name =
                        company.companyTradeName ??
                        company.companyName;

                      const active =
                        company.companyId ===
                        context.current
                          .companyId;

                      return (
                        <Link
                          key={
                            company.companyId
                          }
                          href={buildCompanyPath(
                            company.companyId,
                          )}
                          onClick={() =>
                            setCompanyMenuOpen(
                              false,
                            )
                          }
                          className={[
                            "block rounded-xl px-3 py-3 transition",
                            active
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-slate-900 hover:text-white",
                          ].join(" ")}
                        >
                          <p className="truncate text-sm font-semibold">
                            {name}
                          </p>

                          <p
                            className={[
                              "mt-1 truncate text-xs",
                              active
                                ? "text-blue-100"
                                : "text-slate-600",
                            ].join(" ")}
                          >
                            {
                              company.employeeName
                            }
                          </p>
                        </Link>
                      );
                    },
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 sm:flex">
              <Building2 className="size-4 shrink-0 text-blue-400" />

              <span className="max-w-52 truncate text-xs font-semibold text-slate-300">
                {currentCompanyName}
              </span>
            </div>
          )}

          <Link
            href={`/employee/${context.current.companyId}/profile`}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-white"
            aria-label="Meu perfil"
            title="Meu perfil"
          >
            <UserRound className="size-4" />
          </Link>

          <button
            type="button"
            onClick={() =>
              void handleSignOut()
            }
            disabled={signingOut}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}