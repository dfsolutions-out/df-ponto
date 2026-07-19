import {
  CalendarClock,
  Clock3,
  Moon,
  Plus,
  Repeat2,
  Search,
} from "lucide-react";
import Link from "next/link";

import { WorkScheduleStatusForm } from "@/components/company/schedules/WorkScheduleStatusForm";
import { requireCompanyAccess } from "@/services/company-access";
import {
  getWorkScheduleCounts,
  getWorkSchedules,
} from "@/services/work-schedules";
import type {
  WorkScheduleType,
} from "@/types/work-schedule";

type WorkSchedulesPageProps = {
  params: Promise<{
    companyId: string;
  }>;

  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    updated?: string;
  }>;
};

function getTypeLabel(
  type: WorkScheduleType,
): string {
  const labels: Record<
    WorkScheduleType,
    string
  > = {
    fixed_weekly: "Semanal fixa",
    rotating: "Escala rotativa",
    flexible: "Flexível",
    on_call: "Plantão",
  };

  return labels[type];
}

function formatWeeklyHours(
  minutes: number | null,
): string {
  if (minutes === null) {
    return "Não informada";
  }

  const hours = minutes / 60;

  return `${hours
    .toFixed(
      Number.isInteger(hours) ? 0 : 2,
    )
    .replace(".", ",")}h`;
}

export default async function WorkSchedulesPage({
  params,
  searchParams,
}: WorkSchedulesPageProps) {
  const { companyId } = await params;
  const query = await searchParams;

  const access =
    await requireCompanyAccess(companyId);

  const status =
    query.status === "active" ||
    query.status === "inactive"
      ? query.status
      : "all";

  const validTypes: WorkScheduleType[] = [
    "fixed_weekly",
    "rotating",
    "flexible",
    "on_call",
  ];

  const scheduleType =
    validTypes.includes(
      query.type as WorkScheduleType,
    )
      ? (query.type as WorkScheduleType)
      : "all";

  const [schedules, counts] =
    await Promise.all([
      getWorkSchedules({
        companyId,
        search: query.q,
        status,
        scheduleType,
      }),

      getWorkScheduleCounts(companyId),
    ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Gestão de jornada
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Jornadas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Crie modelos de horário para funcionários,
            equipes e setores.
          </p>
        </div>

        {access.canManageOrganization ? (
          <Link
            href={`/company/${companyId}/schedules/new`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Nova jornada
          </Link>
        ) : null}
      </div>

      {query.updated ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Jornada atualizada com sucesso.
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: CalendarClock,
          },
          {
            label: "Ativas",
            value: counts.active,
            icon: Clock3,
          },
          {
            label: "Inativas",
            value: counts.inactive,
            icon: Repeat2,
          },
          {
            label: "Noturnas",
            value: counts.night,
            icon: Moon,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {item.value}
                  </p>
                </div>

                <Icon className="size-5 text-slate-600" />
              </div>
            </article>
          );
        })}
      </section>

      <form className="mt-7 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:grid-cols-[1fr_190px_190px_auto]">
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
          <option value="all">
            Todos os status
          </option>

          <option value="active">
            Somente ativas
          </option>

          <option value="inactive">
            Somente inativas
          </option>
        </select>

        <select
          name="type"
          defaultValue={scheduleType}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">
            Todos os tipos
          </option>

          <option value="fixed_weekly">
            Semanal fixa
          </option>

          <option value="rotating">
            Escala rotativa
          </option>

          <option value="flexible">
            Flexível
          </option>

          <option value="on_call">
            Plantão
          </option>
        </select>

        <button className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold transition hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <CalendarClock className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Nenhuma jornada encontrada
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {query.q ||
              status !== "all" ||
              scheduleType !== "all"
                ? "Altere os filtros para tentar localizar outras jornadas."
                : "Cadastre a primeira jornada para começar a configurar os horários da empresa."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {schedules.map((schedule) => (
              <article
                key={schedule.id}
                className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-bold text-white">
                      {schedule.name}
                    </h2>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                        schedule.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-700 bg-slate-800 text-slate-400",
                      ].join(" ")}
                    >
                      {schedule.isActive
                        ? "Ativa"
                        : "Inativa"}
                    </span>

                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                      {getTypeLabel(
                        schedule.scheduleType,
                      )}
                    </span>

                    {schedule.isNightShift ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
                        <Moon className="size-3" />
                        Noturna
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {schedule.description ||
                      "Sem descrição cadastrada."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                    <span>
                      Ciclo:{" "}
                      {schedule.cycleLengthDays}{" "}
                      {schedule.cycleLengthDays === 1
                        ? "dia"
                        : "dias"}
                    </span>

                    <span>
                      Carga semanal:{" "}
                      {formatWeeklyHours(
                        schedule.expectedWeeklyMinutes,
                      )}
                    </span>
                  </div>
                </div>

                {access.canManageOrganization ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/company/${companyId}/schedules/${schedule.id}/edit`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
                    >
                      Configurar
                    </Link>

                    <WorkScheduleStatusForm
                      companyId={companyId}
                      scheduleId={schedule.id}
                      scheduleName={schedule.name}
                      isActive={schedule.isActive}
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