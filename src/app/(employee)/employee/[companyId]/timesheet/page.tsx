import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileClock,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import { getEmployeeTimesheetMonth } from "@/services/employee-portal";
import type {
  TimeEntryPunchType,
} from "@/types/time-entry";

type EmployeeTimesheetPageProps = {
  params: Promise<{
    companyId: string;
  }>;

  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
};

function formatMinutes(
  minutes: number,
): string {
  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(
    remainingMinutes,
  ).padStart(2, "0")}`;
}

function formatTime(
  timestamp: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(timestamp));
}

function formatDate(
  date: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    },
  ).format(
    new Date(`${date}T12:00:00Z`),
  );
}

function getMonthLabel(
  year: number,
  month: number,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12,
      ),
    ),
  );
}

function getPunchLabel(
  type: TimeEntryPunchType,
): string {
  const labels: Record<
    TimeEntryPunchType,
    string
  > = {
    entry: "Entrada",
    break_start:
      "Saída intervalo",
    break_end:
      "Retorno intervalo",
    exit: "Saída",
    custom: "Adicional",
  };

  return labels[type];
}

function shiftMonth(params: {
  year: number;
  month: number;
  shift: number;
}): {
  year: number;
  month: number;
} {
  const date =
    new Date(
      Date.UTC(
        params.year,
        params.month - 1 +
          params.shift,
        1,
        12,
      ),
    );

  return {
    year:
      date.getUTCFullYear(),

    month:
      date.getUTCMonth() + 1,
  };
}

export default async function EmployeeTimesheetPage({
  params,
  searchParams,
}: EmployeeTimesheetPageProps) {
  const { companyId } =
    await params;

  const query =
    await searchParams;

  const requestedYear =
    query.year
      ? Number(query.year)
      : undefined;

  const requestedMonth =
    query.month
      ? Number(query.month)
      : undefined;

  let timesheet;

  try {
    timesheet =
      await getEmployeeTimesheetMonth(
        {
          companyId,
          year:
            requestedYear,
          month:
            requestedMonth,
        },
      );
  } catch {
    notFound();
  }

  const previous =
    shiftMonth({
      year: timesheet.year,
      month: timesheet.month,
      shift: -1,
    });

  const next =
    shiftMonth({
      year: timesheet.year,
      month: timesheet.month,
      shift: 1,
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <FileClock className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              Espelho de ponto
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Minhas marcações
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {timesheet.companyName}
            </p>
          </div>
        </div>

        <Link
          href={`/employee/${companyId}/time-clock`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-500"
        >
          <Clock3 className="size-4" />
          Registrar ponto
        </Link>
      </div>

      <section className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <Link
          href={`/employee/${companyId}/timesheet?year=${previous.year}&month=${previous.month}`}
          className="flex size-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Período
          </p>

          <p className="mt-1 capitalize font-bold text-white">
            {getMonthLabel(
              timesheet.year,
              timesheet.month,
            )}
          </p>
        </div>

        <Link
          href={`/employee/${companyId}/timesheet?year=${next.year}&month=${next.month}`}
          className="flex size-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </Link>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Total trabalhado
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {formatMinutes(
              timesheet.totalWorkedMinutes,
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Marcações
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {
              timesheet.totalEntries
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pendentes
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {
              timesheet.totalPendingReview
            }
          </p>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-blue-400" />

            <h2 className="font-bold text-white">
              Dias com marcação
            </h2>
          </div>
        </div>

        {timesheet.days.length ===
        0 ? (
          <div className="px-5 py-14 text-center">
            <FileClock className="mx-auto size-8 text-slate-700" />

            <p className="mt-4 font-semibold text-slate-300">
              Nenhuma marcação neste mês
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Selecione outro período ou
              registre seu primeiro ponto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {timesheet.days.map(
              (day) => (
                <article
                  key={day.date}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-bold capitalize text-white">
                          {formatDate(
                            day.date,
                          )}
                        </p>

                        {day.requiresReview ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                            <AlertTriangle className="size-3" />
                            Em análise
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300">
                            <CheckCircle2 className="size-3" />
                            Regular
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Total calculado:{" "}
                        {formatMinutes(
                          day.workedMinutes,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {day.entries.map(
                        (entry) => (
                          <div
                            key={
                              entry.id
                            }
                            className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              {getPunchLabel(
                                entry.punchType,
                              )}
                            </p>

                            <p className="mt-1 text-sm font-bold text-white">
                              {formatTime(
                                entry.recordedAt,
                              )}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}