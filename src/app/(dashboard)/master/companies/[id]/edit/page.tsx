import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyForm } from "@/components/master/CompanyForm";
import { getCompanyById } from "@/services/companies";

type EditCompanyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCompanyPage({
  params,
}: EditCompanyPageProps) {
  const { id } = await params;

  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/master/companies/${company.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para a empresa
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Atualização cadastral
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Editar {company.tradeName}
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Atualize os dados da empresa. Toda alteração será registrada na auditoria.
          </p>
        </header>

        <div className="mt-8">
          <CompanyForm company={company} />
        </div>
      </div>
    </main>
  );
}