import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  EmployeeScheduleAssignment,
  EmployeeScheduleData,
  EmployeeScheduleOption,
} from "@/types/employee-schedule";

type AssignmentDatabaseRow = {
  id: string;
  employee_id: string;
  work_schedule_id: string;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  reason: string | null;
  created_at: string;
};

type ScheduleDatabaseRow = {
  id: string;
  name: string;
  schedule_type:
    | "fixed_weekly"
    | "rotating"
    | "flexible"
    | "on_call";
  cycle_length_days: number;
  expected_weekly_minutes: number | null;
  is_night_shift: boolean;
};

function mapScheduleOption(
  row: ScheduleDatabaseRow,
): EmployeeScheduleOption {
  return {
    id: row.id,
    name: row.name,
    scheduleType: row.schedule_type,
    cycleLengthDays:
      row.cycle_length_days,
    expectedWeeklyMinutes:
      row.expected_weekly_minutes,
    isNightShift:
      row.is_night_shift,
  };
}

function mapAssignment(
  row: AssignmentDatabaseRow,
  schedulesById: Map<
    string,
    ScheduleDatabaseRow
  >,
): EmployeeScheduleAssignment {
  const schedule =
    schedulesById.get(
      row.work_schedule_id,
    );

  return {
    id: row.id,
    employeeId: row.employee_id,
    workScheduleId:
      row.work_schedule_id,

    scheduleName:
      schedule?.name ??
      "Jornada não encontrada",

    scheduleType:
      schedule?.schedule_type ??
      "fixed_weekly",

    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export async function getEmployeeScheduleData(
  params: {
    companyId: string;
    employeeId: string;
  },
): Promise<EmployeeScheduleData> {
  const supabase = await createClient();

  const [
    schedulesResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from("work_schedules")
      .select(
        `
          id,
          name,
          schedule_type,
          cycle_length_days,
          expected_weekly_minutes,
          is_night_shift
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .eq("is_active", true)
      .order("name"),

    supabase
      .from(
        "employee_schedule_assignments",
      )
      .select(
        `
          id,
          employee_id,
          work_schedule_id,
          starts_on,
          ends_on,
          is_active,
          reason,
          created_at
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .eq(
        "employee_id",
        params.employeeId,
      )
      .order("starts_on", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (schedulesResult.error) {
    console.error(
      "Erro ao carregar jornadas disponíveis:",
      schedulesResult.error,
    );

    throw new Error(
      "Não foi possível carregar as jornadas disponíveis.",
    );
  }

  if (assignmentsResult.error) {
    console.error(
      "Erro ao carregar histórico de jornadas:",
      assignmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar o histórico de jornadas do funcionário.",
    );
  }

  const schedules =
    (schedulesResult.data as
      | ScheduleDatabaseRow[]
      | null) ?? [];

  const assignments =
    (assignmentsResult.data as
      | AssignmentDatabaseRow[]
      | null) ?? [];

  const schedulesById = new Map<
    string,
    ScheduleDatabaseRow
  >(
    schedules.map((schedule) => [
      schedule.id,
      schedule,
    ]),
  );

  /*
   * Uma jornada antiga pode ter sido inativada.
   * Precisamos carregá-la para preservar o histórico.
   */
  const missingScheduleIds = Array.from(
    new Set(
      assignments
        .map(
          (assignment) =>
            assignment.work_schedule_id,
        )
        .filter(
          (scheduleId) =>
            !schedulesById.has(scheduleId),
        ),
    ),
  );

  if (missingScheduleIds.length > 0) {
    const {
      data: missingSchedules,
      error: missingSchedulesError,
    } = await supabase
      .from("work_schedules")
      .select(
        `
          id,
          name,
          schedule_type,
          cycle_length_days,
          expected_weekly_minutes,
          is_night_shift
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .in("id", missingScheduleIds);

    if (missingSchedulesError) {
      console.error(
        "Erro ao carregar jornadas históricas:",
        missingSchedulesError,
      );
    } else {
      for (const schedule of
        (missingSchedules as
          | ScheduleDatabaseRow[]
          | null) ?? []) {
        schedulesById.set(
          schedule.id,
          schedule,
        );
      }
    }
  }

  const history = assignments.map(
    (assignment) =>
      mapAssignment(
        assignment,
        schedulesById,
      ),
  );

  return {
    current:
      history.find(
        (assignment) =>
          assignment.isActive &&
          assignment.endsOn === null,
      ) ?? null,

    history,

    availableSchedules:
      schedules.map(mapScheduleOption),
  };
}