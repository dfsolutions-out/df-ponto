import {
  Activity,
  Ban,
  Building2,
  CircleCheckBig,
  CircleX,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { getMasterDashboardStats } from "@/services/master-dashboard";

type StatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof Building2;
};

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
          <Icon
            aria-hidden="true"
            className="size-5"
          />
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

export default async function MasterPage() {
  const stats = await getMasterDashboardStats();

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <Activity
                aria-hidden="true"
                className="size-4"
              />

              <p className="text-xs font-bold uppercase tracking-[0.22em]">
                Administração DF Solutions
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Visão geral
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Acompanhe as empresas cadastradas e administre a
              operação geral da plataforma.
            </p>
          </div>

          <Link
            href="/master/companies/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
          >
            <Plus
              aria-hidden="true"
              className="size-4"
            />

            Nova empresa
          </Link>
        </section>

        {stats.hasError ? (
          <div
            role="alert"
            className="mt-7 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
          >
            Não foi possível atualizar todos os indicadores. O
            painel continua disponível, mas alguns valores podem
            aparecer como zero.
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total de empresas"
            value={stats.totalCompanies}
            description="Todas as empresas preservadas na plataforma."
            icon={Building2}
          />

          <StatCard
            label="Empresas ativas"
            value={stats.activeCompanies}
            description="Empresas liberadas para utilização do sistema."
            icon={CircleCheckBig}
          />

          <StatCard
            label="Empresas suspensas"
            value={stats.suspendedCompanies}
            description="Empresas temporariamente impedidas de operar."
            icon={Ban}
          />

          <StatCard
            label="Empresas canceladas"
            value={stats.cancelledCompanies}
            description="Contratos cancelados com histórico preservado."
            icon={CircleX}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7">
            <div>
              <p className="text-sm font-semibold text-white">
                Empresas recentes
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Os últimos cadastros aparecerão aqui.
              </p>
            </div>

            <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 px-6 text-center">
              <Building2
                aria-hidden="true"
                className="size-9 text-slate-700"
              />

              <p className="mt-4 text-sm font-semibold text-slate-300">
                Nenhuma empresa cadastrada
              </p>

              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Cadastre a primeira empresa cliente para iniciar
                a operação do DF Ponto.
              </p>

              <Link
                href="/master/companies/new"
                className="mt-5 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Cadastrar primeira empresa
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7">
            <p className="text-sm font-semibold text-white">
              Status da plataforma
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Componentes principais da fundação.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Conexão com Supabase",
                "Autenticação Master",
                "Proteção por RLS",
                "Auditoria inicial",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">
                    {item}
                  </span>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}