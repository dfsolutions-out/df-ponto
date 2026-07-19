import { Building2, Plus, Search } from "lucide-react";
import Link from "next/link";

import { DepartmentStatusForm } from "@/components/company/departments/DepartmentStatusForm";
import { requireCompanyAccess } from "@/services/company-access";
import { getDepartmentCounts, getDepartments } from "@/services/departments";

type Props = {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
    updated?: string;
  }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function DepartmentsPage({ params, searchParams }: Props) {
  const { companyId } = await params;
  const query = await searchParams;
  const access = await requireCompanyAccess(companyId);
  const status = query.status === "active" || query.status === "inactive"
    ? query.status
    : "all";

  const [departments, counts] = await Promise.all([
    getDepartments({ companyId, search: query.q, status }),
    getDepartmentCounts(companyId),
  ]);

  const successMessage = query.created
    ? "Setor cadastrado com sucesso."
    : query.updated
      ? "Setor atualizado com sucesso."
      : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Estrutura organizacional
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Setores</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Organize as áreas da empresa sem apagar o histórico de setores que deixarem de ser utilizados.
          </p>
        </div>

        {access.canManageOrganization ? (
          <Link
            href={`/company/${companyId}/departments/new`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Novo setor
          </Link>
        ) : null}
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Total", counts.total],
          ["Ativos", counts.active],
          ["Inativos", counts.inactive],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <form className="mt-7 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-[1fr_190px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Buscar por nome ou descrição"
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos os status</option>
          <option value="active">Somente ativos</option>
          <option value="inactive">Somente inativos</option>
        </select>
        <button className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <Building2 className="size-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold">Nenhum setor encontrado</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {query.q || status !== "all"
                ? "Altere os filtros para tentar localizar outros setores."
                : "Cadastre o primeiro setor para começar a estruturar a empresa."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {departments.map((department) => (
              <article
                key={department.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-bold">{department.name}</h2>
                    <span className={[
                      "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                      department.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-800 text-slate-400",
                    ].join(" ")}>
                      {department.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {department.description || "Sem descrição cadastrada."}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Criado em {formatDate(department.createdAt)}
                  </p>
                </div>

                {access.canManageOrganization ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/company/${companyId}/departments/${department.id}/edit`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      Editar
                    </Link>
                    <DepartmentStatusForm
                      companyId={companyId}
                      departmentId={department.id}
                      departmentName={department.name}
                      isActive={department.isActive}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
