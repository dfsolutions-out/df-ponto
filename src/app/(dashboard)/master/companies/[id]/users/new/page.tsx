import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyAdministratorForm } from "@/components/master/CompanyAdministratorForm";
import { getCompanyById } from "@/services/companies";

type NewCompanyAdministratorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewCompanyAdministratorPage({
  params,
}: NewCompanyAdministratorPageProps) {
  const { id } = await params;

  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/master/companies/${company.id}/users`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para usuários
        </Link>

        <header className="mt-6">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <UserPlus className="size-7" />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            {company.tradeName}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Novo administrador
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Crie o acesso do primeiro administrador responsável
            pela gestão da empresa.
          </p>
        </header>

        <div className="mt-8">
          <CompanyAdministratorForm
            companyId={company.id}
          />
        </div>
      </div>
    </main>
  );
}