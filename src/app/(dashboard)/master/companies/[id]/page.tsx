import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyStatusForm } from "@/components/master/CompanyStatusForm";
import { getCompanyById } from "@/services/companies";
import {
  formatCnpj,
  formatCompanyStatus,
  formatCurrency,
  formatPhone,
  formatPostalCode,
} from "@/utils/company";

type CompanyDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    updated?: string;
    statusChanged?: string;
  }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function CompanyDetailsPage({
  params,
  searchParams,
}: CompanyDetailsPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/master/companies"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para empresas
        </Link>

        {query.updated === "1" ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Empresa atualizada com sucesso.
          </div>
        ) : null}

        {query.statusChanged === "1" ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Status atualizado com sucesso.
          </div>
        ) : null}

        <section className="mt-6 flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Building2 className="size-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {company.tradeName}
                </h1>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                  {formatCompanyStatus(company.status)}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {company.legalName}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                CNPJ {formatCnpj(company.cnpj)}
              </p>
            </div>
          </div>

          <Link
            href={`/master/companies/${company.id}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <Edit3 className="size-4" />
            Editar empresa
          </Link>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">
                Informações gerais
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600">
                      E-mail
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {company.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600">
                      Telefone
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {formatPhone(company.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <UserRound className="mt-0.5 size-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600">
                      Responsável
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {company.responsibleName}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {company.responsibleEmail ??
                        "E-mail não informado"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {company.responsiblePhone
                        ? formatPhone(
                            company.responsiblePhone,
                          )
                        : "Telefone não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <WalletCards className="mt-0.5 size-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600">
                      Valor por funcionário ativo
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {formatCurrency(
                        company.pricePerActiveEmployee,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 md:col-span-2">
                  <MapPin className="mt-0.5 size-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-600">
                      Endereço
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {company.street},{" "}
                      {company.streetNumber}
                      {company.addressComplement
                        ? ` - ${company.addressComplement}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {company.district} — {company.city}/
                      {company.state}
                      {company.postalCode
                        ? ` — CEP ${formatPostalCode(
                            company.postalCode,
                          )}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">
                Observações internas
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                {company.internalNotes ??
                  "Nenhuma observação interna cadastrada."}
              </p>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-blue-400" />
                <h2 className="font-semibold">
                  Histórico cadastral
                </h2>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-600">
                    Criada em
                  </p>
                  <p className="mt-1 text-slate-300">
                    {formatDate(company.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Última atualização
                  </p>
                  <p className="mt-1 text-slate-300">
                    {formatDate(company.updatedAt)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="font-semibold">
                Controle de status
              </h2>

              <div className="mt-5 space-y-4">
                {company.status !== "active" ? (
                  <CompanyStatusForm
                    companyId={company.id}
                    targetStatus="active"
                    title="Reativar empresa"
                    description="Libera novamente a operação da empresa na plataforma."
                    buttonText="Reativar empresa"
                    pendingText="Reativando..."
                    buttonClassName="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                  />
                ) : null}

                {company.status === "active" ? (
                  <CompanyStatusForm
                    companyId={company.id}
                    targetStatus="suspended"
                    title="Suspender empresa"
                    description="Bloqueia temporariamente a operação, preservando todos os dados."
                    buttonText="Suspender empresa"
                    pendingText="Suspendendo..."
                    buttonClassName="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
                  />
                ) : null}

                {company.status !== "cancelled" ? (
                  <CompanyStatusForm
                    companyId={company.id}
                    targetStatus="cancelled"
                    title="Cancelar empresa"
                    description="Encerra o vínculo comercial sem excluir o histórico."
                    buttonText="Cancelar empresa"
                    pendingText="Cancelando..."
                    buttonClassName="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                  />
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}