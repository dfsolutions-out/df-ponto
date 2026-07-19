import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  GeofenceResult,
  TimeClockContext,
  TimeClockExpectedPunch,
  TimeClockLocation,
  TimeEntry,
  TimeEntryPunchType,
  TimeEntrySource,
} from "@/types/time-entry";
import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

type EmployeeDatabaseRow = {
  id: string;
  full_name: string;
  status:
    | "active"
    | "on_leave"
    | "terminated"
    | "blocked";
  admission_date: string;
};

type ScheduleAssignmentRow = {
  work_schedule_id: string;
  starts_on: string;
};

type ScheduleRow = {
  id: string;
  name: string;
  schedule_type:
    | "fixed_weekly"
    | "rotating"
    | "flexible"
    | "on_call";
  cycle_length_days: number;
};

type ScheduleDayRow = {
  id: string;
  day_index: number;
  weekday: number | null;
  label: string | null;
  is_workday: boolean;
};

type ExpectedPunchRow = {
  id: string;
  sequence: number;
  punch_type: TimeEntryPunchType;
  label: string | null;
  expected_time: string;
  day_offset: number;
};

type LocationAssignmentRow = {
  id: string;
  work_location_id: string;
  custom_radius_meters: number | null;
  outside_radius_action_override:
    | OutsideRadiusAction
    | null;
  is_primary: boolean;
};

type LocationRow = {
  id: string;
  name: string;
  location_type: WorkLocationType;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  radius_meters: number;
  minimum_accuracy_meters: number;
  outside_radius_action:
    OutsideRadiusAction;
};

type TimeEntryDatabaseRow = {
  id: string;
  employee_id: string;
  punch_type: TimeEntryPunchType;
  recorded_at: string;
  client_recorded_at: string | null;
  source: TimeEntrySource;
  work_location_id: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  accuracy_meters: number | string | null;
  distance_meters: number | string | null;
  allowed_radius_meters: number | null;
  geofence_result: GeofenceResult;
  justification: string | null;
  requires_review: boolean;
};

function getTodayInBrazil(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}

function parseDateOnly(
  value: string,
): Date {
  return new Date(
    `${value}T12:00:00`,
  );
}

function differenceInDays(
  first: string,
  second: string,
): number {
  const firstDate =
    parseDateOnly(first);

  const secondDate =
    parseDateOnly(second);

  return Math.floor(
    (
      firstDate.getTime() -
      secondDate.getTime()
    ) /
      86400000,
  );
}

function getFixedWeeklyDayIndex(
  date: Date,
): number {
  const weekday = date.getDay();

  return weekday === 0
    ? 7
    : weekday;
}

function mapNullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getDefaultPunch(
  entriesCount: number,
): TimeClockExpectedPunch {
  const defaults: Array<{
    type: TimeEntryPunchType;
    label: string;
  }> = [
    {
      type: "entry",
      label: "Entrada",
    },
    {
      type: "break_start",
      label: "Saída para intervalo",
    },
    {
      type: "break_end",
      label: "Retorno do intervalo",
    },
    {
      type: "exit",
      label: "Saída",
    },
  ];

  const item =
    defaults[entriesCount];

  return {
    id: null,
    sequence:
      entriesCount + 1,
    punchType:
      item?.type ?? "custom",
    label:
      item?.label ??
      "Marcação adicional",
    expectedTime: null,
    dayOffset: 0,
    requiresJustification: true,
  };
}

function mapTimeEntry(
  row: TimeEntryDatabaseRow,
  locationsById: Map<
    string,
    LocationRow
  >,
): TimeEntry {
  const location =
    row.work_location_id
      ? locationsById.get(
          row.work_location_id,
        )
      : null;

  return {
    id: row.id,
    employeeId: row.employee_id,

    punchType: row.punch_type,

    recordedAt: row.recorded_at,
    clientRecordedAt:
      row.client_recorded_at,

    source: row.source,

    locationName:
      location?.name ?? null,

    latitude:
      mapNullableNumber(row.latitude),

    longitude:
      mapNullableNumber(row.longitude),

    accuracyMeters:
      mapNullableNumber(
        row.accuracy_meters,
      ),

    distanceMeters:
      mapNullableNumber(
        row.distance_meters,
      ),

    allowedRadiusMeters:
      row.allowed_radius_meters,

    geofenceResult:
      row.geofence_result,

    justification:
      row.justification,

    requiresReview:
      row.requires_review,
  };
}

export async function getTimeClockContext(
  companyId: string,
): Promise<TimeClockContext> {
  const supabase =
    await createClient();

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !userData.user
  ) {
    return {
      companyId,
      employee: null,
      expectedPunch: null,
      currentLocation: null,
      availableLocations: [],
      entriesToday: [],
      scheduleName: null,
      dayLabel: null,
      isWorkday: false,
      canRegister: false,
      blockReason:
        "Sessão inválida.",
    };
  }

  const {
    data: employeeData,
    error: employeeError,
  } = await supabase
    .from("employees")
    .select(
      `
        id,
        full_name,
        status,
        admission_date
      `,
    )
    .eq(
      "company_id",
      companyId,
    )
    .eq(
      "user_id",
      userData.user.id,
    )
    .maybeSingle();

  if (
    employeeError ||
    !employeeData
  ) {
    return {
      companyId,
      employee: null,
      expectedPunch: null,
      currentLocation: null,
      availableLocations: [],
      entriesToday: [],
      scheduleName: null,
      dayLabel: null,
      isWorkday: false,
      canRegister: false,
      blockReason:
        "Seu usuário não está vinculado a um funcionário desta empresa.",
    };
  }

  const employee =
    employeeData as EmployeeDatabaseRow;

  const today =
    getTodayInBrazil();

  const startOfDay =
    `${today}T00:00:00-03:00`;

  const endOfDay =
    `${today}T23:59:59.999-03:00`;

  const [
    entriesResult,
    scheduleAssignmentResult,
    locationAssignmentsResult,
  ] = await Promise.all([
    supabase
      .from("time_entries")
      .select(
        `
          id,
          employee_id,
          punch_type,
          recorded_at,
          client_recorded_at,
          source,
          work_location_id,
          latitude,
          longitude,
          accuracy_meters,
          distance_meters,
          allowed_radius_meters,
          geofence_result,
          justification,
          requires_review
        `,
      )
      .eq(
        "company_id",
        companyId,
      )
      .eq(
        "employee_id",
        employee.id,
      )
      .gte(
        "recorded_at",
        startOfDay,
      )
      .lte(
        "recorded_at",
        endOfDay,
      )
      .order("recorded_at"),

    supabase
      .from(
        "employee_schedule_assignments",
      )
      .select(
        `
          work_schedule_id,
          starts_on
        `,
      )
      .eq(
        "company_id",
        companyId,
      )
      .eq(
        "employee_id",
        employee.id,
      )
      .eq("is_active", true)
      .lte("starts_on", today)
      .or(
        `ends_on.is.null,ends_on.gte.${today}`,
      )
      .order("starts_on", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from(
        "employee_work_location_assignments",
      )
      .select(
        `
          id,
          work_location_id,
          custom_radius_meters,
          outside_radius_action_override,
          is_primary
        `,
      )
      .eq(
        "company_id",
        companyId,
      )
      .eq(
        "employee_id",
        employee.id,
      )
      .eq("is_active", true)
      .lte("starts_on", today)
      .or(
        `ends_on.is.null,ends_on.gte.${today}`,
      )
      .order("is_primary", {
        ascending: false,
      }),
  ]);

  if (entriesResult.error) {
    throw new Error(
      "Não foi possível carregar as marcações de hoje.",
    );
  }

  if (
    locationAssignmentsResult.error
  ) {
    throw new Error(
      "Não foi possível carregar os locais autorizados.",
    );
  }

  const locationAssignments =
    (locationAssignmentsResult.data as
      | LocationAssignmentRow[]
      | null) ?? [];

  const locationIds =
    locationAssignments.map(
      (assignment) =>
        assignment.work_location_id,
    );

  let locationRows:
    LocationRow[] = [];

  if (locationIds.length > 0) {
    const {
      data: locationsData,
      error: locationsError,
    } = await supabase
      .from("work_locations")
      .select(
        `
          id,
          name,
          location_type,
          address,
          latitude,
          longitude,
          radius_meters,
          minimum_accuracy_meters,
          outside_radius_action
        `,
      )
      .eq(
        "company_id",
        companyId,
      )
      .eq("is_active", true)
      .in("id", locationIds);

    if (locationsError) {
      throw new Error(
        "Não foi possível carregar os dados dos locais.",
      );
    }

    locationRows =
      (locationsData as
        | LocationRow[]
        | null) ?? [];
  }

  const locationsById =
    new Map(
      locationRows.map(
        (location) => [
          location.id,
          location,
        ],
      ),
    );

  const availableLocations:
    TimeClockLocation[] =
      locationAssignments
        .map((assignment) => {
          const location =
            locationsById.get(
              assignment.work_location_id,
            );

          if (!location) {
            return null;
          }

          return {
            assignmentId:
              assignment.id,

            locationId:
              location.id,

            name: location.name,

            locationType:
              location.location_type,

            address:
              location.address,

            latitude:
              mapNullableNumber(
                location.latitude,
              ),

            longitude:
              mapNullableNumber(
                location.longitude,
              ),

            radiusMeters:
              assignment.custom_radius_meters ??
              location.radius_meters,

            minimumAccuracyMeters:
              location.minimum_accuracy_meters,

            outsideRadiusAction:
              assignment.outside_radius_action_override ??
              location.outside_radius_action,

            isPrimary:
              assignment.is_primary,
          };
        })
        .filter(
          (
            location,
          ): location is TimeClockLocation =>
            location !== null,
        );

  const entriesRows =
    (entriesResult.data as
      | TimeEntryDatabaseRow[]
      | null) ?? [];

  const entriesToday =
    entriesRows.map((entry) =>
      mapTimeEntry(
        entry,
        locationsById,
      ),
    );

  let scheduleName:
    string | null = null;

  let dayLabel:
    string | null = null;

  let isWorkday = false;

  let expectedPunch:
    TimeClockExpectedPunch | null =
      null;

  const scheduleAssignment =
    scheduleAssignmentResult.data as
      | ScheduleAssignmentRow
      | null;

  if (scheduleAssignment) {
    const {
      data: scheduleData,
    } = await supabase
      .from("work_schedules")
      .select(
        `
          id,
          name,
          schedule_type,
          cycle_length_days
        `,
      )
      .eq(
        "company_id",
        companyId,
      )
      .eq(
        "id",
        scheduleAssignment.work_schedule_id,
      )
      .maybeSingle();

    if (scheduleData) {
      const schedule =
        scheduleData as ScheduleRow;

      scheduleName =
        schedule.name;

      let dayIndex: number;

      if (
        schedule.schedule_type ===
        "fixed_weekly"
      ) {
        dayIndex =
          getFixedWeeklyDayIndex(
            parseDateOnly(today),
          );
      } else {
        const elapsedDays =
          differenceInDays(
            today,
            scheduleAssignment.starts_on,
          );

        dayIndex =
          (
            (
              elapsedDays %
              Math.max(
                schedule.cycle_length_days,
                1,
              )
            ) +
            Math.max(
              schedule.cycle_length_days,
              1,
            )
          ) %
            Math.max(
              schedule.cycle_length_days,
              1,
            ) +
          1;
      }

      const {
        data: dayData,
      } = await supabase
        .from("work_schedule_days")
        .select(
          `
            id,
            day_index,
            weekday,
            label,
            is_workday
          `,
        )
        .eq(
          "company_id",
          companyId,
        )
        .eq(
          "work_schedule_id",
          schedule.id,
        )
        .eq(
          "day_index",
          dayIndex,
        )
        .eq("is_active", true)
        .maybeSingle();

      if (dayData) {
        const day =
          dayData as ScheduleDayRow;

        dayLabel =
          day.label ??
          `Dia ${day.day_index}`;

        isWorkday =
          day.is_workday;

        if (day.is_workday) {
          const {
            data: punchesData,
          } = await supabase
            .from(
              "work_schedule_punches",
            )
            .select(
              `
                id,
                sequence,
                punch_type,
                label,
                expected_time,
                day_offset
              `,
            )
            .eq(
              "company_id",
              companyId,
            )
            .eq(
              "work_schedule_day_id",
              day.id,
            )
            .eq("is_active", true)
            .order("sequence");

          const punches =
            (punchesData as
              | ExpectedPunchRow[]
              | null) ?? [];

          const nextPunch =
            punches[
              entriesToday.length
            ];

          if (nextPunch) {
            expectedPunch = {
              id: nextPunch.id,
              sequence:
                nextPunch.sequence,

              punchType:
                nextPunch.punch_type,

              label:
                nextPunch.label ||
                "Marcação",

              expectedTime:
                nextPunch.expected_time.slice(
                  0,
                  5,
                ),

              dayOffset:
                nextPunch.day_offset ===
                1
                  ? 1
                  : 0,

              requiresJustification:
                false,
            };
          }
        }
      }
    }
  }

  if (!expectedPunch) {
    expectedPunch =
      getDefaultPunch(
        entriesToday.length,
      );
  }

  let blockReason:
    string | null = null;

  if (
    employee.status !== "active"
  ) {
    blockReason =
      "Seu vínculo não está ativo para registro de ponto.";
  } else if (
    availableLocations.length === 0
  ) {
    blockReason =
      "Nenhum local autorizado está vigente para você.";
  }

  return {
    companyId,

    employee: {
      id: employee.id,
      fullName:
        employee.full_name,
      status: employee.status,
      admissionDate:
        employee.admission_date,
    },

    expectedPunch,

    currentLocation:
      availableLocations.find(
        (location) =>
          location.isPrimary,
      ) ??
      availableLocations[0] ??
      null,

    availableLocations,

    entriesToday,

    scheduleName,
    dayLabel,
    isWorkday,

    canRegister:
      blockReason === null,

    blockReason,
  };
}