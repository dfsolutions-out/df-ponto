import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import { getEmployeePortalCompanies } from "@/services/employee-portal";

export default async function EmployeeAccessPage() {
  const companies =
    await getEmployeePortalCompanies();

  if (companies.length === 1) {
    redirect(
      `/employee/${companies[0].companyId}`,
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-slate-100">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-950/40">
            DF
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            DF Ponto
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Portal do funcionário
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Escolha o vínculo que deseja
            acessar.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-0.5 size-6 shrink-0 text-amber-300" />

              <div>
                <h2 className="font-bold text-amber-100">
                  Nenhum vínculo encontrado
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-200/70">
                  Seu usuário ainda não está
                  vinculado a um funcionário.
                  Solicite a regularização ao
                  administrador ou RH.
                </p>

                <Link
                  href="/access"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-amber-500/30 px-4 text-sm font-bold text-amber-200 transition hover:bg-amber-500/10"
                >
                  Voltar aos acessos
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {companies.map(
              (company) => {
                const name =
                  company.companyTradeName ??
                  company.companyName;

                return (
                  <Link
                    key={
                      company.companyId
                    }
                    href={`/employee/${company.companyId}`}
                    className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                        <Building2 className="size-5" />
                      </div>

                      <ArrowRight className="size-5 text-slate-700 transition group-hover:translate-x-1 group-hover:text-blue-400" />
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-white">
                      {name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        company.employeeName
                      }
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-400">
                      <Clock3 className="size-4" />
                      Acessar meu ponto
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </div>
    </main>
  );
}