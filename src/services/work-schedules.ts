import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  WorkSchedule,
  WorkScheduleType,
} from "@/types/work-schedule";

type WorkScheduleDatabaseRow = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  schedule_type: WorkScheduleType;
  cycle_length_days: number;
  expected_weekly_minutes: number | null;
  is_night_shift: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapWorkSchedule(
  row: WorkScheduleDatabaseRow,
): WorkSchedule {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    scheduleType: row.schedule_type,
    cycleLengthDays: row.cycle_length_days,
    expectedWeeklyMinutes:
      row.expected_weekly_minutes,
    isNightShift: row.is_night_shift,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeSearch(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[,%()]/g, "") ?? ""
  );
}

export async function getWorkSchedules(params: {
  companyId: string;
  search?: string;
  status?: "all" | "active" | "inactive";
  scheduleType?: "all" | WorkScheduleType;
}): Promise<WorkSchedule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("work_schedules")
    .select(
      `
        id,
        company_id,
        name,
        description,
        schedule_type,
        cycle_length_days,
        expected_weekly_minutes,
        is_night_shift,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("company_id", params.companyId)
    .order("is_active", {
      ascending: false,
    })
    .order("name", {
      ascending: true,
    });

  const search = sanitizeSearch(
    params.search,
  );

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  if (params.status === "active") {
    query = query.eq("is_active", true);
  }

  if (params.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (
    params.scheduleType &&
    params.scheduleType !== "all"
  ) {
    query = query.eq(
      "schedule_type",
      params.scheduleType,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Erro ao listar jornadas:",
      error,
    );

    throw new Error(
      "Não foi possível carregar as jornadas.",
    );
  }

  return (
    (data as WorkScheduleDatabaseRow[] | null) ??
    []
  ).map(mapWorkSchedule);
}

export async function getWorkScheduleById(params: {
  companyId: string;
  scheduleId: string;
}): Promise<WorkSchedule | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_schedules")
    .select(
      `
        id,
        company_id,
        name,
        description,
        schedule_type,
        cycle_length_days,
        expected_weekly_minutes,
        is_night_shift,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("company_id", params.companyId)
    .eq("id", params.scheduleId)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar jornada:",
      error,
    );

    throw new Error(
      "Não foi possível carregar a jornada.",
    );
  }

  return data
    ? mapWorkSchedule(
        data as WorkScheduleDatabaseRow,
      )
    : null;
}

export async function getWorkScheduleCounts(
  companyId: string,
): Promise<{
  total: number;
  active: number;
  inactive: number;
  night: number;
}> {
  const supabase = await createClient();

  const [
    totalResult,
    activeResult,
    inactiveResult,
    nightResult,
  ] = await Promise.all([
    supabase
      .from("work_schedules")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId),

    supabase
      .from("work_schedules")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", true),

    supabase
      .from("work_schedules")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", false),

    supabase
      .from("work_schedules")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("is_night_shift", true),
  ]);

  return {
    total: totalResult.count ?? 0,
    active: activeResult.count ?? 0,
    inactive: inactiveResult.count ?? 0,
    night: nightResult.count ?? 0,
  };
}