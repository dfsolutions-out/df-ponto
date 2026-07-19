import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  WorkScheduleConfiguration,
  WorkScheduleDay,
  WorkSchedulePunch,
} from "@/types/work-schedule-day";
import type {
  WorkSchedule,
} from "@/types/work-schedule";

type DayDatabaseRow = {
  id: string;
  day_index: number;
  weekday: number | null;
  label: string | null;
  is_workday: boolean;
  expected_work_minutes: number;
};

type PunchDatabaseRow = {
  id: string;
  work_schedule_day_id: string;
  sequence: number;
  punch_type:
    | "entry"
    | "break_start"
    | "break_end"
    | "exit"
    | "custom";
  label: string | null;
  expected_time: string;
  day_offset: number;
  is_required: boolean;
};

const weekdayLabels = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function getDefaultPunches(): WorkSchedulePunch[] {
  return [
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
      punchType: "break_start",
      label: "Saída para intervalo",
      expectedTime: "12:00",
      dayOffset: 0,
      isRequired: true,
    },
    {
      id: null,
      sequence: 3,
      punchType: "break_end",
      label: "Retorno do intervalo",
      expectedTime: "13:00",
      dayOffset: 0,
      isRequired: true,
    },
    {
      id: null,
      sequence: 4,
      punchType: "exit",
      label: "Saída",
      expectedTime: "17:00",
      dayOffset: 0,
      isRequired: true,
    },
  ];
}

function createEmptyDays(
  schedule: WorkSchedule,
): WorkScheduleDay[] {
  return Array.from(
    {
      length:
        schedule.cycleLengthDays,
    },
    (_, index) => {
      const dayIndex = index + 1;

      const weekday =
        schedule.scheduleType ===
        "fixed_weekly"
          ? dayIndex % 7
          : null;

      const isWeekend =
        weekday === 0 ||
        weekday === 6;

      return {
        id: null,
        dayIndex,
        weekday,
        label:
          weekday !== null
            ? weekdayLabels[weekday]
            : `Dia ${dayIndex}`,
        isWorkday:
          schedule.scheduleType ===
          "fixed_weekly"
            ? !isWeekend
            : dayIndex === 1,
        expectedWorkMinutes:
          schedule.scheduleType ===
            "fixed_weekly" &&
          !isWeekend
            ? 480
            : schedule.scheduleType ===
                "rotating" &&
              dayIndex === 1
              ? 720
              : 0,
        punches:
          schedule.scheduleType ===
            "fixed_weekly" &&
          !isWeekend
            ? getDefaultPunches()
            : schedule.scheduleType ===
                  "rotating" &&
                dayIndex === 1
              ? [
                  {
                    id: null,
                    sequence: 1,
                    punchType:
                      "entry",
                    label: "Entrada",
                    expectedTime:
                      "07:00",
                    dayOffset: 0,
                    isRequired: true,
                  },
                  {
                    id: null,
                    sequence: 2,
                    punchType:
                      "exit",
                    label: "Saída",
                    expectedTime:
                      "19:00",
                    dayOffset: 0,
                    isRequired: true,
                  },
                ]
              : [],
      };
    },
  );
}

export async function getWorkScheduleConfiguration(
  schedule: WorkSchedule,
): Promise<WorkScheduleConfiguration> {
  const supabase = await createClient();

  const { data: dayData, error: dayError } =
    await supabase
      .from("work_schedule_days")
      .select(
        `
          id,
          day_index,
          weekday,
          label,
          is_workday,
          expected_work_minutes
        `,
      )
      .eq(
        "company_id",
        schedule.companyId,
      )
      .eq(
        "work_schedule_id",
        schedule.id,
      )
      .eq("is_active", true)
      .order("day_index");

  if (dayError) {
    console.error(
      "Erro ao carregar dias da jornada:",
      dayError,
    );

    throw new Error(
      "Não foi possível carregar os dias da jornada.",
    );
  }

  const days =
    (dayData as DayDatabaseRow[] | null) ??
    [];

  if (days.length === 0) {
    return {
      scheduleId: schedule.id,
      companyId: schedule.companyId,
      scheduleName: schedule.name,
      scheduleType:
        schedule.scheduleType,
      cycleLengthDays:
        schedule.cycleLengthDays,
      isNightShift:
        schedule.isNightShift,
      days: createEmptyDays(schedule),
    };
  }

  const dayIds = days.map(
    (day) => day.id,
  );

  const {
    data: punchData,
    error: punchError,
  } = await supabase
    .from("work_schedule_punches")
    .select(
      `
        id,
        work_schedule_day_id,
        sequence,
        punch_type,
        label,
        expected_time,
        day_offset,
        is_required
      `,
    )
    .eq(
      "company_id",
      schedule.companyId,
    )
    .in(
      "work_schedule_day_id",
      dayIds,
    )
    .eq("is_active", true)
    .order("sequence");

  if (punchError) {
    console.error(
      "Erro ao carregar marcações da jornada:",
      punchError,
    );

    throw new Error(
      "Não foi possível carregar os horários da jornada.",
    );
  }

  const punches =
    (punchData as
      | PunchDatabaseRow[]
      | null) ?? [];

  const punchesByDayId = new Map<
    string,
    WorkSchedulePunch[]
  >();

  for (const punch of punches) {
    const current =
      punchesByDayId.get(
        punch.work_schedule_day_id,
      ) ?? [];

    current.push({
      id: punch.id,
      sequence: punch.sequence,
      punchType: punch.punch_type,
      label: punch.label ?? "",
      expectedTime:
        punch.expected_time.slice(0, 5),
      dayOffset:
        punch.day_offset === 1
          ? 1
          : 0,
      isRequired: punch.is_required,
    });

    punchesByDayId.set(
      punch.work_schedule_day_id,
      current,
    );
  }

  const emptyDays =
    createEmptyDays(schedule);

  const storedDaysByIndex = new Map(
    days.map((day) => [
      day.day_index,
      day,
    ]),
  );

  return {
    scheduleId: schedule.id,
    companyId: schedule.companyId,
    scheduleName: schedule.name,
    scheduleType:
      schedule.scheduleType,
    cycleLengthDays:
      schedule.cycleLengthDays,
    isNightShift:
      schedule.isNightShift,

    days: emptyDays.map(
      (emptyDay) => {
        const stored =
          storedDaysByIndex.get(
            emptyDay.dayIndex,
          );

        if (!stored) {
          return emptyDay;
        }

        return {
          id: stored.id,
          dayIndex:
            stored.day_index,
          weekday:
            stored.weekday,
          label:
            stored.label ||
            emptyDay.label,
          isWorkday:
            stored.is_workday,
          expectedWorkMinutes:
            stored.expected_work_minutes,
          punches:
            punchesByDayId.get(
              stored.id,
            ) ?? [],
        };
      },
    ),
  };
}