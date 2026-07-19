"use client";

import {
  useActionState,
  useState,
} from "react";

import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  WorkSchedule,
  WorkScheduleActionState,
  WorkScheduleType,
} from "@/types/work-schedule";

const initialState: WorkScheduleActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type WorkScheduleFormProps = {
  action: (
    previousState: WorkScheduleActionState,
    formData: FormData,
  ) => Promise<WorkScheduleActionState>;

  schedule?: WorkSchedule;

  cancelHref: string;
};

function minutesToHours(
  minutes: number | null | undefined,
): string {
  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "";
  }

  const hours = minutes / 60;

  return Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(2).replace(".", ",");
}

function getDefaultCycleLength(
  scheduleType: WorkScheduleType,
): number {
  if (scheduleType === "fixed_weekly") {
    return 7;
  }

  if (scheduleType === "rotating") {
    return 2;
  }

  if (scheduleType === "flexible") {
    return 7;
  }

  return 1;
}

function getScheduleTypeDescription(
  scheduleType: WorkScheduleType,
): string {
  if (scheduleType === "fixed_weekly") {
    return "Usada em jornadas com dias da semana definidos, como segunda a sexta.";
  }

  if (scheduleType === "rotating") {
    return "Usada em ciclos como 12x36, 24x48 ou outras escalas.";
  }

  if (scheduleType === "flexible") {
    return "Usada quando existe carga prevista, mas os horários podem variar.";
  }

  return "Usada para plantões, chamados ou períodos operacionais especiais.";
}

export function WorkScheduleForm({
  action,
  schedule,
  cancelHref,
}: WorkScheduleFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialState,
  );

  const [scheduleType, setScheduleType] =
    useState<WorkScheduleType>(
      schedule?.scheduleType ??
        "fixed_weekly",
    );

  const [
    cycleLengthDays,
    setCycleLengthDays,
  ] = useState(
    schedule?.cycleLengthDays ??
      getDefaultCycleLength(
        schedule?.scheduleType ??
          "fixed_weekly",
      ),
  );

  const isEditing = Boolean(schedule);

  function handleScheduleTypeChange(
    value: WorkScheduleType,
  ): void {
    setScheduleType(value);

    /*
     * No cadastro, sugerimos automaticamente um ciclo
     * padrão conforme o tipo escolhido.
     *
     * Na edição, preservamos o ciclo já configurado para
     * evitar sobrescrever uma configuração existente.
     */
    if (!isEditing) {
      setCycleLengthDays(
        getDefaultCycleLength(value),
      );
    }
  }

  function handleCycleLengthChange(
    value: string,
  ): void {
    if (value === "") {
      setCycleLengthDays(0);
      return;
    }

    const parsedValue = Number(value);

    if (!Number.isNaN(parsedValue)) {
      setCycleLengthDays(parsedValue);
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-7"
    >
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="name"
          className="text-sm font-semibold text-slate-200"
        >
          Nome da jornada
        </label>

        <input
          id="name"
          name="name"
          defaultValue={schedule?.name}
          required
          minLength={2}
          maxLength={120}
          autoFocus
          placeholder="Ex.: Jornada Administrativa"
          aria-invalid={Boolean(
            state.fieldErrors.name?.[0],
          )}
          className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {state.fieldErrors.name?.[0] ? (
          <p className="mt-2 text-sm text-red-400">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-semibold text-slate-200"
        >
          Descrição{" "}
          <span className="font-normal text-slate-500">
            (opcional)
          </span>
        </label>

        <textarea
          id="description"
          name="description"
          defaultValue={
            schedule?.description ?? ""
          }
          maxLength={1000}
          rows={4}
          placeholder="Descreva onde esta jornada será aplicada."
          aria-invalid={Boolean(
            state.fieldErrors.description?.[0],
          )}
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {state.fieldErrors
          .description?.[0] ? (
          <p className="mt-2 text-sm text-red-400">
            {
              state.fieldErrors
                .description[0]
            }
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="scheduleType"
            className="text-sm font-semibold text-slate-200"
          >
            Tipo de jornada
          </label>

          <select
            id="scheduleType"
            name="scheduleType"
            value={scheduleType}
            onChange={(event) =>
              handleScheduleTypeChange(
                event.target
                  .value as WorkScheduleType,
              )
            }
            aria-invalid={Boolean(
              state.fieldErrors
                .scheduleType?.[0],
            )}
            className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="fixed_weekly">
              Semanal fixa
            </option>

            <option value="rotating">
              Escala rotativa
            </option>

            <option value="flexible">
              Jornada flexível
            </option>

            <option value="on_call">
              Plantão ou sobreaviso
            </option>
          </select>

          {state.fieldErrors
            .scheduleType?.[0] ? (
            <p className="mt-2 text-sm text-red-400">
              {
                state.fieldErrors
                  .scheduleType[0]
              }
            </p>
          ) : null}

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {getScheduleTypeDescription(
              scheduleType,
            )}
          </p>
        </div>

        <div>
          <label
            htmlFor="cycleLengthDays"
            className="text-sm font-semibold text-slate-200"
          >
            Duração do ciclo
          </label>

          <div className="relative mt-2">
            <input
              id="cycleLengthDays"
              name="cycleLengthDays"
              type="number"
              min={1}
              max={31}
              value={
                cycleLengthDays === 0
                  ? ""
                  : cycleLengthDays
              }
              onChange={(event) =>
                handleCycleLengthChange(
                  event.target.value,
                )
              }
              required
              aria-invalid={Boolean(
                state.fieldErrors
                  .cycleLengthDays?.[0],
              )}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-16 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              dias
            </span>
          </div>

          {state.fieldErrors
            .cycleLengthDays?.[0] ? (
            <p className="mt-2 text-sm text-red-400">
              {
                state.fieldErrors
                  .cycleLengthDays[0]
              }
            </p>
          ) : null}

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Para jornada semanal, use 7 dias.
            Para 12x36, use um ciclo de 2 dias.
          </p>
        </div>

        <div>
          <label
            htmlFor="expectedWeeklyHours"
            className="text-sm font-semibold text-slate-200"
          >
            Carga semanal prevista{" "}
            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <div className="relative mt-2">
            <input
              id="expectedWeeklyHours"
              name="expectedWeeklyHours"
              type="text"
              inputMode="decimal"
              defaultValue={minutesToHours(
                schedule?.expectedWeeklyMinutes,
              )}
              placeholder="Ex.: 44"
              aria-invalid={Boolean(
                state.fieldErrors
                  .expectedWeeklyHours?.[0],
              )}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              horas
            </span>
          </div>

          {state.fieldErrors
            .expectedWeeklyHours?.[0] ? (
            <p className="mt-2 text-sm text-red-400">
              {
                state.fieldErrors
                  .expectedWeeklyHours[0]
              }
            </p>
          ) : null}
        </div>

        <div className="flex items-end">
          <label className="flex min-h-12 w-full cursor-pointer items-start gap-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
            <input
              type="checkbox"
              name="isNightShift"
              value="true"
              defaultChecked={
                schedule?.isNightShift ??
                false
              }
              className="mt-0.5 size-4 rounded border-slate-600 bg-slate-900 text-blue-600"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-200">
                Jornada noturna
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Marque quando a jornada envolver
                trabalho noturno ou virada de dia.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">
        <p className="text-sm font-semibold text-blue-200">
          Próxima configuração
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-200/70">
          Depois de criar o modelo,
          configuraremos os dias trabalhados,
          folgas e horários esperados de entrada,
          intervalo e saída.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-7 sm:flex-row sm:justify-end">
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>

        <SubmitButton
          idleText={
            isEditing
              ? "Salvar alterações"
              : "Criar e configurar"
          }
          pendingText={
            isEditing
              ? "Salvando..."
              : "Criando..."
          }
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}