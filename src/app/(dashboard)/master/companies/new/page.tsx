import {
  ArrowLeft,
  Building2,
} from "lucide-react";
import Link from "next/link";

import { CompanyForm } from "@/components/master/CompanyForm";

export default function NewCompanyPage() {
  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/master/companies"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4"
          />

          Voltar para empresas
        </Link>

        <header className="mt-6">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Building2
              aria-hidden="true"
              className="size-7"
            />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Empresa cliente
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Nova empresa
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Cadastre uma nova empresa cliente. Ela será criada
            inicialmente com status ativo.
          </p>
        </header>

        <div className="mt-8">
          <CompanyForm />
        </div>
      </div>
    </main>
  );
}