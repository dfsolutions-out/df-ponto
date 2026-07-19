import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Clock3,
  MapPin,
  Network,
  Users,
} from "lucide-react";
import Link from "next/link";

import { getDepartmentCounts } from "@/services/departments";
import { getEmployeeCounts } from "@/services/employees";
import { getJobPositionCounts } from "@/services/job-positions";
import { getTeamCounts } from "@/services/teams";
import { getWorkScheduleCounts } from "@/services/work-schedules";

type CompanyDashboardPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function CompanyDashboardPage({
  params,
}: CompanyDashboardPageProps) {
  const { companyId } = await params;

  const [
    employeeCounts,
    departmentCounts,
    positionCounts,
    teamCounts,
    workScheduleCounts,
  ] = await Promise.all([
    getEmployeeCounts(companyId),
    getDepartmentCounts(companyId),
    getJobPositionCounts(companyId),
    getTeamCounts(companyId),
    getWorkScheduleCounts(companyId),
  ]);

  const indicators = [
    {
      label: "Funcionários ativos",
      value: employeeCounts.active,
      icon: Users,
      href: `/company/${companyId}/employees?status=active`,
    },
    {
      label: "Setores ativos",
      value: departmentCounts.active,
      icon: Building2,
      href: `/company/${companyId}/departments?status=active`,
    },
    {
      label: "Cargos ativos",
      value: positionCounts.active,
      icon: BriefcaseBusiness,
      href: `/company/${companyId}/positions?status=active`,
    },
    {
      label: "Equipes ativas",
      value: teamCounts.active,
      icon: Network,
      href: `/company/${companyId}/teams?status=active`,
    },
    {
      label: "Jornadas ativas",
      value: workScheduleCounts.active,
      icon: CalendarClock,
      href: `/company/${companyId}/schedules?status=active`,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
        Painel da empresa
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Visão geral
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        Acompanhe os funcionários, a estrutura organizacional e os
        principais módulos operacionais da empresa.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {indicators.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-blue-500/30 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">
                    {item.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {item.value}
                  </p>
                </div>

                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
                  <Icon className="size-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-blue-400" />

            <h2 className="font-semibold">
              Situação dos funcionários
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulte rapidamente os vínculos que exigem atenção.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link
              href={`/company/${companyId}/employees?status=on_leave`}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-amber-500/30 hover:bg-slate-950"
            >
              <p className="text-xs text-slate-500">
                Afastados
              </p>

              <p className="mt-2 text-2xl font-bold">
                {employeeCounts.onLeave}
              </p>
            </Link>

            <Link
              href={`/company/${companyId}/employees?status=blocked`}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-red-500/30 hover:bg-slate-950"
            >
              <p className="text-xs text-slate-500">
                Bloqueados
              </p>

              <p className="mt-2 text-2xl font-bold">
                {employeeCounts.blocked}
              </p>
            </Link>

            <Link
              href={`/company/${companyId}/employees?status=terminated`}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-600 hover:bg-slate-950"
            >
              <p className="text-xs text-slate-500">
                Desligados
              </p>

              <p className="mt-2 text-2xl font-bold">
                {employeeCounts.terminated}
              </p>
            </Link>

            <Link
              href={`/company/${companyId}/employees`}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 transition hover:bg-blue-500/15"
            >
              <p className="text-xs text-blue-300">
                Total preservado
              </p>

              <p className="mt-2 text-2xl font-bold">
                {employeeCounts.total}
              </p>
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <Clock3 className="size-5 text-blue-400" />

            <h2 className="font-semibold">
              Operação de jornadas
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Acompanhe os modelos de jornada já cadastrados na empresa.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href={`/company/${companyId}/schedules?status=active`}
              className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-4 transition hover:bg-blue-500/15"
            >
              <span className="flex items-center gap-3 text-sm text-blue-200">
                <CalendarClock className="size-4 text-blue-400" />
                Jornadas ativas
              </span>

              <span className="text-lg font-bold text-white">
                {workScheduleCounts.active}
              </span>
            </Link>

            <Link
              href={`/company/${companyId}/schedules?status=inactive`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition hover:bg-slate-950"
            >
              <span className="flex items-center gap-3 text-sm text-slate-300">
                <CalendarClock className="size-4 text-slate-600" />
                Jornadas inativas
              </span>

              <span className="text-lg font-bold text-white">
                {workScheduleCounts.inactive}
              </span>
            </Link>

            <Link
              href={`/company/${companyId}/schedules`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition hover:bg-slate-950"
            >
              <span className="flex items-center gap-3 text-sm text-slate-300">
                <Clock3 className="size-4 text-slate-600" />
                Total de modelos
              </span>

              <span className="text-lg font-bold text-white">
                {workScheduleCounts.total}
              </span>
            </Link>

            <Link
              href={`/company/${companyId}/schedules`}
              className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-4 transition hover:bg-violet-500/15"
            >
              <span className="flex items-center gap-3 text-sm text-violet-200">
                <Clock3 className="size-4 text-violet-400" />
                Jornadas noturnas
              </span>

              <span className="text-lg font-bold text-white">
                {workScheduleCounts.night}
              </span>
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-6">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-slate-500" />

                <h2 className="font-semibold">
                  Locais autorizados
                </h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                O próximo módulo permitirá cadastrar locais, raios de
                geolocalização e regras de marcação por funcionário.
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Em breve
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}