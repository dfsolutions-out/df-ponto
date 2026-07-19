import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileClock,
  MapPin,
  Timer,
} from "lucide-react";
import Link from "next/link";

import type {
  EmployeePortalDashboard,
} from "@/types/employee-portal";
import type {
  TimeEntryPunchType,
} from "@/types/time-entry";

type EmployeeDashboardProps = {
  dashboard: EmployeePortalDashboard;
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
  )}h ${String(
    remainingMinutes,
  ).padStart(2, "0")}min`;
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

function getPunchLabel(
  type: TimeEntryPunchType,
): string {
  const labels: Record<
    TimeEntryPunchType,
    string
  > = {
    entry: "Entrada",
    break_start:
      "Saída para intervalo",
    break_end:
      "Retorno do intervalo",
    exit: "Saída",
    custom:
      "Marcação adicional",
  };

  return labels[type];
}

export function EmployeeDashboard({
  dashboard,
}: EmployeeDashboardProps) {
  const current =
    dashboard.context.current;

  const companyName =
    current.companyTradeName ??
    current.companyName;

  const timeClockHref =
    `/employee/${current.companyId}/time-clock`;

  const timesheetHref =
    `/employee/${current.companyId}/timesheet`;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Portal do funcionário
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Olá,{" "}
              {current.employeeName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Consulte sua jornada,
              registre o ponto e
              acompanhe suas marcações
              em {companyName}.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              {current.jobPositionName ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-slate-300">
                  <BriefcaseBusiness className="size-3.5 text-blue-400" />

                  {
                    current.jobPositionName
                  }
                </span>
              ) : null}

              {current.departmentName ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-slate-300">
                  <Building2 className="size-3.5 text-blue-400" />

                  {
                    current.departmentName
                  }
                </span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href={timeClockHref}
              className={[
                "inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-sm font-bold transition sm:w-auto",
                dashboard.canRegister
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-950/40 hover:bg-blue-500"
                  : "pointer-events-none bg-slate-800 text-slate-600",
              ].join(" ")}
            >
              <Clock3 className="size-5" />

              Registrar ponto

              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {!dashboard.canRegister ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" />

            <div>
              <p className="font-semibold text-amber-100">
                Registro indisponível
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-200/70">
                {
                  dashboard.blockReason
                }
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Próxima marcação
            </p>

            <CalendarClock className="size-4 text-blue-400" />
          </div>

          <p className="mt-4 text-xl font-bold text-white">
            {dashboard.expectedPunch
              ?.label ??
              "Não definida"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {dashboard.expectedPunch
              ?.expectedTime
              ? `Prevista para ${dashboard.expectedPunch.expectedTime}`
              : "Sem horário previsto"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Jornada
            </p>

            <Timer className="size-4 text-violet-400" />
          </div>

          <p className="mt-4 text-xl font-bold text-white">
            {dashboard.scheduleName ??
              "Sem jornada"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {dashboard.dayLabel ??
              "Dia não configurado"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Trabalhado hoje
            </p>

            <Clock3 className="size-4 text-emerald-400" />
          </div>

          <p className="mt-4 text-xl font-bold text-white">
            {formatMinutes(
              dashboard.workedMinutesToday,
            )}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {
              dashboard.entriesToday
                .length
            }{" "}
            marcação(ões)
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pendências
            </p>

            <AlertTriangle className="size-4 text-amber-400" />
          </div>

          <p className="mt-4 text-xl font-bold text-white">
            {
              dashboard.pendingReviewCount
            }
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Marcação(ões) em análise
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Clock3 className="size-5 text-blue-400" />

                <h2 className="font-bold text-white">
                  Marcações de hoje
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Horários registrados no
                dia atual.
              </p>
            </div>

            <Link
              href={timesheetHref}
              className="text-xs font-bold text-blue-400 transition hover:text-blue-300"
            >
              Ver espelho
            </Link>
          </div>

          {dashboard.entriesToday
            .length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center">
              <Clock3 className="mx-auto size-7 text-slate-600" />

              <p className="mt-3 text-sm font-semibold text-slate-300">
                Nenhuma marcação hoje
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                A primeira marcação
                aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {dashboard.entriesToday.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          entry.requiresReview
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-emerald-500/10 text-emerald-300",
                        ].join(" ")}
                      >
                        {entry.requiresReview ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {getPunchLabel(
                            entry.punchType,
                          )}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {entry.locationName ??
                            "Local registrado"}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-white">
                      {formatTime(
                        entry.recordedAt,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-emerald-400" />

              <h2 className="font-bold text-white">
                Local principal
              </h2>
            </div>

            {dashboard.primaryLocation ? (
              <>
                <p className="mt-5 text-lg font-bold text-white">
                  {
                    dashboard
                      .primaryLocation.name
                  }
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {dashboard
                    .primaryLocation
                    .address ??
                    "Sem endereço fixo."}
                </p>

                <p className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300">
                  Raio autorizado:{" "}
                  {
                    dashboard
                      .primaryLocation
                      .radiusMeters
                  }{" "}
                  metros
                </p>
              </>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Nenhum local principal
                está vigente.
              </p>
            )}
          </article>

          <Link
            href={timesheetHref}
            className="group flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/30 hover:bg-slate-900"
          >
            <div>
              <div className="flex items-center gap-3">
                <FileClock className="size-5 text-blue-400" />

                <h2 className="font-bold text-white">
                  Meu espelho
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Consulte todas as
                marcações do mês.
              </p>
            </div>

            <ArrowRight className="size-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}