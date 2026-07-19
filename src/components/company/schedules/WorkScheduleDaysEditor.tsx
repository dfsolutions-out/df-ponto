"use client";

import {
  Clock3,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import { saveWorkScheduleConfigurationAction } from "@/actions/work-schedule-days";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  SchedulePunchType,
  WorkScheduleConfiguration,
  WorkScheduleConfigurationActionState,
  WorkScheduleDay,
  WorkSchedulePunch,
} from "@/types/work-schedule-day";

const initialState: WorkScheduleConfigurationActionState =
  {
    success: false,
    message: null,
    fieldErrors: {},
  };

type WorkScheduleDaysEditorProps = {
  configuration: WorkScheduleConfiguration;
};

const punchTypeOptions: Array<{
  value: SchedulePunchType;
  label: string;
}> = [
  {
    value: "entry",
    label: "Entrada",
  },
  {
    value: "break_start",
    label: "Saída para intervalo",
  },
  {
    value: "break_end",
    label: "Retorno do intervalo",
  },
  {
    value: "exit",
    label: "Saída",
  },
  {
    value: "custom",
    label: "Personalizada",
  },
];

function getDefaultLabel(
  punchType: SchedulePunchType,
): string {
  return (
    punchTypeOptions.find(
      (option) =>
        option.value === punchType,
    )?.label ?? "Marcação"
  );
}

function calculateExpectedMinutes(
  punches: WorkSchedulePunch[],
): number {
  const sortedPunches = [
    ...punches,
  ].sort(
    (first, second) =>
      first.sequence - second.sequence,
  );

  let total = 0;

  for (
    let index = 0;
    index < sortedPunches.length;
    index += 2
  ) {
    const start =
      sortedPunches[index];

    const end =
      sortedPunches[index + 1];

    if (!start || !end) {
      continue;
    }

    const [
      startHour,
      startMinute,
    ] = start.expectedTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] =
      end.expectedTime
        .split(":")
        .map(Number);

    const startMinutes =
      startHour * 60 +
      startMinute +
      start.dayOffset * 1440;

    const endMinutes =
      endHour * 60 +
      endMinute +
      end.dayOffset * 1440;

    if (endMinutes >= startMinutes) {
      total +=
        endMinutes - startMinutes;
    }
  }

  return total;
}

function formatMinutes(
  minutes: number,
): string {
  const hours =
    Math.floor(minutes / 60);

  const remainder =
    minutes % 60;

  return `${hours}h ${String(
    remainder,
  ).padStart(2, "0")}min`;
}

function normalizeSequences(
  punches: WorkSchedulePunch[],
): WorkSchedulePunch[] {
  return punches.map(
    (punch, index) => ({
      ...punch,
      sequence: index + 1,
    }),
  );
}

function createAdditionalPunches(
  currentLength: number,
): WorkSchedulePunch[] {
  const firstSequence =
    currentLength + 1;

  return [
    {
      id: null,
      sequence: firstSequence,
      punchType: "entry",
      label: "Início do período",
      expectedTime: "18:00",
      dayOffset: 0,
      isRequired: true,
    },
    {
      id: null,
      sequence:
        firstSequence + 1,
      punchType: "exit",
      label: "Fim do período",
      expectedTime: "19:00",
      dayOffset: 0,
      isRequired: true,
    },
  ];
}

export function WorkScheduleDaysEditor({
  configuration,
}: WorkScheduleDaysEditorProps) {
  const [state, formAction] =
    useActionState(
      saveWorkScheduleConfigurationAction,
      initialState,
    );

  const [days, setDays] =
    useState<WorkScheduleDay[]>(
      configuration.days,
    );

  const serializedConfiguration =
    useMemo(
      () =>
        JSON.stringify({
          companyId:
            configuration.companyId,
          scheduleId:
            configuration.scheduleId,
          days: days.map((day) => ({
            ...day,
            expectedWorkMinutes:
              day.isWorkday
                ? calculateExpectedMinutes(
                    day.punches,
                  )
                : 0,
            punches:
              normalizeSequences(
                day.punches,
              ),
          })),
        }),
      [
        configuration.companyId,
        configuration.scheduleId,
        days,
      ],
    );

  function updateDay(
    dayIndex: number,
    updater: (
      day: WorkScheduleDay,
    ) => WorkScheduleDay,
  ): void {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.dayIndex === dayIndex
          ? updater(day)
          : day,
      ),
    );
  }

  function toggleWorkday(
    dayIndex: number,
    isWorkday: boolean,
  ): void {
    updateDay(
      dayIndex,
      (day) => ({
        ...day,
        isWorkday,
        punches:
          isWorkday &&
          day.punches.length === 0
            ? [
                {
                  id: null,
                  sequence: 1,
                  punchType: "entry",
                  label: "Entrada",
                  expectedTime: "08:00",
                  dayOffset: 0,
                  isRequired: true,
                },
                {
                  id: null,
                  sequence: 2,
                  punchType: "exit",
                  label: "Saída",
                  expectedTime: "17:00",
                  dayOffset: 0,
                  isRequired: true,
                },
              ]
            : day.punches,
      }),
    );
  }

  function updatePunch(
    dayIndex: number,
    punchIndex: number,
    patch: Partial<WorkSchedulePunch>,
  ): void {
    updateDay(dayIndex, (day) => ({
      ...day,
      punches:
        day.punches.map(
          (punch, index) =>
            index === punchIndex
              ? {
                  ...punch,
                  ...patch,
                }
              : punch,
        ),
    }));
  }

  function changePunchType(
    dayIndex: number,
    punchIndex: number,
    punchType: SchedulePunchType,
  ): void {
    updatePunch(
      dayIndex,
      punchIndex,
      {
        punchType,
        label:
          getDefaultLabel(
            punchType,
          ),
      },
    );
  }

  function addPunchPair(
    dayIndex: number,
  ): void {
    updateDay(dayIndex, (day) => ({
      ...day,
      punches:
        normalizeSequences([
          ...day.punches,
          ...createAdditionalPunches(
            day.punches.length,
          ),
        ]),
    }));
  }

  function removePunch(
    dayIndex: number,
    punchIndex: number,
  ): void {
    updateDay(dayIndex, (day) => ({
      ...day,
      punches:
        normalizeSequences(
          day.punches.filter(
            (_, index) =>
              index !== punchIndex,
          ),
        ),
    }));
  }

  function copyDayToOthers(
    sourceDayIndex: number,
  ): void {
    const sourceDay =
      days.find(
        (day) =>
          day.dayIndex ===
          sourceDayIndex,
      );

    if (!sourceDay) {
      return;
    }

    setDays((currentDays) =>
      currentDays.map((day) => {
        if (
          day.dayIndex ===
          sourceDayIndex
        ) {
          return day;
        }

        return {
          ...day,
          isWorkday:
            sourceDay.isWorkday,
          punches:
            sourceDay.punches.map(
              (punch) => ({
                ...punch,
                id: null,
              }),
            ),
          expectedWorkMinutes:
            sourceDay
              .expectedWorkMinutes,
        };
      }),
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="configuration"
        value={
          serializedConfiguration
        }
      />

      {state.message ? (
        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            state.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}

      <div className="space-y-4">
        {days.map((day) => {
          const expectedMinutes =
            day.isWorkday
              ? calculateExpectedMinutes(
                  day.punches,
                )
              : 0;

          return (
            <article
              key={day.dayIndex}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40"
            >
              <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-white">
                      {day.label}
                    </h3>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase",
                        day.isWorkday
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-700 bg-slate-800 text-slate-400",
                      ].join(" ")}
                    >
                      {day.isWorkday
                        ? "Trabalho"
                        : "Folga"}
                    </span>

                    {day.isWorkday ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="size-3.5" />
                        {formatMinutes(
                          expectedMinutes,
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={
                        day.isWorkday
                      }
                      onChange={(event) =>
                        toggleWorkday(
                          day.dayIndex,
                          event.target
                            .checked,
                        )
                      }
                      className="size-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                    />

                    Dia trabalhado
                  </label>

                  {day.isWorkday ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyDayToOthers(
                          day.dayIndex,
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      <Copy className="size-4" />
                      Copiar para todos
                    </button>
                  ) : null}
                </div>
              </div>

              {day.isWorkday ? (
                <div className="p-5">
                  <div className="space-y-3">
                    {day.punches.map(
                      (
                        punch,
                        punchIndex,
                      ) => (
                        <div
                          key={`${day.dayIndex}-${punch.sequence}-${punchIndex}`}
                          className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[70px_170px_1fr_130px_150px_44px]"
                        >
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Ordem
                            </label>

                            <div className="mt-2 flex h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-sm font-bold">
                              {punchIndex +
                                1}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Tipo
                            </label>

                            <select
                              value={
                                punch.punchType
                              }
                              onChange={(
                                event,
                              ) =>
                                changePunchType(
                                  day.dayIndex,
                                  punchIndex,
                                  event
                                    .target
                                    .value as SchedulePunchType,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-500"
                            >
                              {punchTypeOptions.map(
                                (
                                  option,
                                ) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Nome
                            </label>

                            <input
                              value={
                                punch.label
                              }
                              onChange={(
                                event,
                              ) =>
                                updatePunch(
                                  day.dayIndex,
                                  punchIndex,
                                  {
                                    label:
                                      event
                                        .target
                                        .value,
                                  },
                                )
                              }
                              maxLength={
                                80
                              }
                              className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Horário
                            </label>

                            <input
                              type="time"
                              value={
                                punch.expectedTime
                              }
                              onChange={(
                                event,
                              ) =>
                                updatePunch(
                                  day.dayIndex,
                                  punchIndex,
                                  {
                                    expectedTime:
                                      event
                                        .target
                                        .value,
                                  },
                                )
                              }
                              required
                              className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              Dia
                            </label>

                            <select
                              value={
                                punch.dayOffset
                              }
                              onChange={(
                                event,
                              ) =>
                                updatePunch(
                                  day.dayIndex,
                                  punchIndex,
                                  {
                                    dayOffset:
                                      Number(
                                        event
                                          .target
                                          .value,
                                      ) ===
                                      1
                                        ? 1
                                        : 0,
                                  },
                                )
                              }
                              className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-500"
                            >
                              <option value={0}>
                                Mesmo dia
                              </option>

                              <option value={1}>
                                Dia seguinte
                              </option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() =>
                                removePunch(
                                  day.dayIndex,
                                  punchIndex,
                                )
                              }
                              disabled={
                                day
                                  .punches
                                  .length <=
                                2
                              }
                              aria-label="Remover marcação"
                              className="flex size-11 items-center justify-center rounded-lg border border-red-500/20 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addPunchPair(
                        day.dayIndex,
                      )
                    }
                    disabled={
                      day.punches
                        .length >= 20
                    }
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                    Adicionar período
                  </button>

                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Cada período utiliza
                    duas marcações. Exemplo:
                    entrada e saída, ou
                    retorno e saída.
                  </p>
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-slate-600">
                  Este dia está configurado
                  como folga.
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          Salve depois de revisar todos
          os dias e horários.
        </p>

        <SubmitButton
          idleText="Salvar dias e horários"
          pendingText="Salvando configuração..."
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}