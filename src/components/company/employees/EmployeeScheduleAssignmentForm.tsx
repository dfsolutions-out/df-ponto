"use client";

import {
  CalendarClock,
  History,
  Moon,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
} from "react";

import { assignEmployeeScheduleAction } from "@/actions/employee-schedules";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  EmployeeScheduleActionState,
  EmployeeScheduleData,
} from "@/types/employee-schedule";

const initialState: EmployeeScheduleActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type EmployeeScheduleAssignmentFormProps = {
  companyId: string;
  employeeId: string;
  admissionDate: string;
  scheduleData: EmployeeScheduleData;
};

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function formatWeeklyHours(
  minutes: number | null,
): string {
  if (minutes === null) {
    return "Carga não informada";
  }

  const hours = minutes / 60;

  return `${hours
    .toFixed(
      Number.isInteger(hours) ? 0 : 2,
    )
    .replace(".", ",")}h semanais`;
}

function getTypeLabel(
  type:
    | "fixed_weekly"
    | "rotating"
    | "flexible"
    | "on_call",
): string {
  const labels = {
    fixed_weekly: "Semanal fixa",
    rotating: "Escala rotativa",
    flexible: "Flexível",
    on_call: "Plantão",
  };

  return labels[type];
}

export function EmployeeScheduleAssignmentForm({
  companyId,
  employeeId,
  admissionDate,
  scheduleData,
}: EmployeeScheduleAssignmentFormProps) {
  const [state, action] =
    useActionState(
      assignEmployeeScheduleAction,
      initialState,
    );

  const [open, setOpen] = useState(
    scheduleData.current === null,
  );

  useEffect(() => {
    if (state.success) {
      window.location.reload();
    }
  }, [state.success]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CalendarClock className="size-5 text-blue-400" />

              <h2 className="font-bold text-white">
                Jornada atual
              </h2>
            </div>

            {scheduleData.current ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-bold text-white">
                    {
                      scheduleData.current
                        .scheduleName
                    }
                  </p>

                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300">
                    Vigente
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>
                    Início:{" "}
                    {formatDate(
                      scheduleData.current
                        .startsOn,
                    )}
                  </span>

                  <span>
                    {getTypeLabel(
                      scheduleData.current
                        .scheduleType,
                    )}
                  </span>
                </div>

                {scheduleData.current.reason ? (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Motivo:{" "}
                    {
                      scheduleData.current
                        .reason
                    }
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-amber-200">
                  Funcionário sem jornada
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-200/70">
                  Atribua uma jornada antes de
                  iniciar a operação de ponto.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setOpen((current) => !current)
            }
            className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
          >
            {scheduleData.current
              ? "Alterar jornada"
              : "Atribuir jornada"}
          </button>
        </div>
      </section>

      {open ? (
        <form
          action={action}
          className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5"
        >
          <input
            type="hidden"
            name="companyId"
            value={companyId}
          />

          <input
            type="hidden"
            name="employeeId"
            value={employeeId}
          />

          <h3 className="font-bold text-white">
            {scheduleData.current
              ? "Substituir jornada"
              : "Atribuir jornada"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            A jornada anterior será encerrada
            automaticamente no dia anterior à nova
            vigência. O histórico será preservado.
          </p>

          {state.message ? (
            <div
              role="alert"
              className={[
                "mt-5 rounded-xl border px-4 py-3 text-sm",
                state.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              ].join(" ")}
            >
              {state.message}
            </div>
          ) : null}

          {scheduleData.availableSchedules
            .length === 0 ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-200">
                Nenhuma jornada ativa está disponível.
                Cadastre ou reative uma jornada antes
                de continuar.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="workScheduleId"
                  className="text-sm font-semibold text-slate-200"
                >
                  Jornada
                </label>

                <select
                  id="workScheduleId"
                  name="workScheduleId"
                  required
                  defaultValue={
                    scheduleData.current
                      ?.workScheduleId ?? ""
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="" disabled>
                    Selecione uma jornada
                  </option>

                  {scheduleData.availableSchedules.map(
                    (schedule) => (
                      <option
                        key={schedule.id}
                        value={schedule.id}
                      >
                        {schedule.name} —{" "}
                        {getTypeLabel(
                          schedule.scheduleType,
                        )}{" "}
                        —{" "}
                        {formatWeeklyHours(
                          schedule.expectedWeeklyMinutes,
                        )}
                        {schedule.isNightShift
                          ? " — Noturna"
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                {state.fieldErrors
                  .workScheduleId?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      state.fieldErrors
                        .workScheduleId[0]
                    }
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="startsOn"
                  className="text-sm font-semibold text-slate-200"
                >
                  Início da vigência
                </label>

                <input
                  id="startsOn"
                  name="startsOn"
                  type="date"
                  required
                  min={admissionDate}
                  defaultValue={
                    scheduleData.current
                      ? new Date()
                          .toISOString()
                          .slice(0, 10)
                      : admissionDate
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                {state.fieldErrors
                  .startsOn?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      state.fieldErrors
                        .startsOn[0]
                    }
                  </p>
                ) : null}
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Moon className="size-4 text-slate-600" />

                    <p className="text-xs leading-5 text-slate-500">
                      Jornadas noturnas e com virada
                      de dia são configuradas no
                      próprio modelo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="scheduleReason"
                  className="text-sm font-semibold text-slate-200"
                >
                  Justificativa
                </label>

                <textarea
                  id="scheduleReason"
                  name="reason"
                  required
                  minLength={3}
                  maxLength={500}
                  rows={4}
                  placeholder={
                    scheduleData.current
                      ? "Ex.: Alteração de setor e horário a partir desta data."
                      : "Ex.: Jornada inicial definida na admissão."
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                {state.fieldErrors.reason?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {state.fieldErrors.reason[0]}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {scheduleData.availableSchedules
            .length > 0 ? (
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>

              <SubmitButton
                idleText={
                  scheduleData.current
                    ? "Confirmar alteração"
                    : "Atribuir jornada"
                }
                pendingText="Salvando jornada..."
                className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              />
            </div>
          ) : null}
        </form>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
        <div className="flex items-center gap-3">
          <History className="size-5 text-slate-500" />

          <h2 className="font-bold text-white">
            Histórico de jornadas
          </h2>
        </div>

        {scheduleData.history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nenhuma jornada foi atribuída a este
            funcionário.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {scheduleData.history.map(
              (assignment) => (
                <article
                  key={assignment.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">
                        {
                          assignment.scheduleName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {getTypeLabel(
                          assignment.scheduleType,
                        )}
                      </p>
                    </div>

                    <span
                      className={[
                        "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase",
                        assignment.isActive &&
                        !assignment.endsOn
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-700 bg-slate-800 text-slate-400",
                      ].join(" ")}
                    >
                      {assignment.isActive &&
                      !assignment.endsOn
                        ? "Vigente"
                        : "Encerrada"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>
                      Início:{" "}
                      {formatDate(
                        assignment.startsOn,
                      )}
                    </span>

                    <span>
                      Término:{" "}
                      {assignment.endsOn
                        ? formatDate(
                            assignment.endsOn,
                          )
                        : "Atual"}
                    </span>
                  </div>

                  {assignment.reason ? (
                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {assignment.reason}
                    </p>
                  ) : null}
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}