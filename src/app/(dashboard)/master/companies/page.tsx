import {
  Building2,
  Mail,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";

import { getCompanies } from "@/services/companies";
import type { CompanyStatus } from "@/types/company";
import {
  formatCnpj,
  formatCompanyStatus,
  formatCurrency,
  formatPhone,
} from "@/utils/company";

type MasterCompaniesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    created?: string;
  }>;
};

const validStatuses = [
  "active",
  "suspended",
  "cancelled",
] as const;

function getStatusClass(
  status: CompanyStatus,
): string {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "suspended") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-red-500/20 bg-red-500/10 text-red-400";
}

export default async function MasterCompaniesPage({
  searchParams,
}: MasterCompaniesPageProps) {
  const params = await searchParams;

  const search = params.search?.trim() ?? "";

  const status = validStatuses.includes(
    params.status as CompanyStatus,
  )
    ? (params.status as CompanyStatus)
    : "all";

  const companies = await getCompanies({
    search,
    status,
  });

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              Clientes
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Empresas
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Gerencie as empresas clientes da plataforma.
            </p>
          </div>

          <Link
            href="/master/companies/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus
              aria-hidden="true"
              className="size-4"
            />

            Nova empresa
          </Link>
        </section>

        {params.created === "1" ? (
          <div
            role="status"
            className="mt-7 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300"
          >
            Empresa cadastrada com sucesso.
          </div>
        ) : null}

        <form
          method="get"
          className="mt-8 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-600"
            />

            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Buscar pelo nome fantasia..."
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none transition focus:border-blue-500"
          >
            <option value="all">
              Todos os status
            </option>
            <option value="active">
              Ativas
            </option>
            <option value="suspended">
              Suspensas
            </option>
            <option value="cancelled">
              Canceladas
            </option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl border border-slate-700 px-6 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Filtrar
          </button>
        </form>

        {companies.length === 0 ? (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 text-center">
            <Building2
              aria-hidden="true"
              className="size-12 text-slate-700"
            />

            <h2 className="mt-5 text-lg font-semibold">
              Nenhuma empresa encontrada
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Cadastre uma empresa ou altere os filtros utilizados.
            </p>

            <Link
              href="/master/companies/new"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Cadastrar empresa
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-4">
            {companies.map((company) => (
              <article
                key={company.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">
                        {company.tradeName}
                      </h2>

                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                          getStatusClass(
                            company.status,
                          ),
                        ].join(" ")}
                      >
                        {formatCompanyStatus(
                          company.status,
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {company.legalName}
                    </p>

                    <p className="mt-2 text-xs font-medium text-slate-600">
                      CNPJ {formatCnpj(company.cnpj)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Mail
                          aria-hidden="true"
                          className="size-4 text-slate-600"
                        />
                        {company.email}
                      </span>

                      <span>
                        {formatPhone(company.phone)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <MapPin
                          aria-hidden="true"
                          className="size-4 text-slate-600"
                        />
                        {company.city}/{company.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 border-t border-slate-800 pt-5 xl:min-w-64 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                    <div>
                      <p className="text-xs text-slate-600">
                        Valor por funcionário
                      </p>

                      <p className="mt-1 font-semibold text-slate-200">
                        {formatCurrency(
                          company.pricePerActiveEmployee,
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/master/companies/${company.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      Ver empresa
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}