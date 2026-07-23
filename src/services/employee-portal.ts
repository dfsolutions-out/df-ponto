import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getTimeClockContext } from "@/services/time-clock";
import type {
  EmployeePortalCompany,
  EmployeePortalContext,
  EmployeePortalDashboard,
  EmployeeTimesheetDay,
  EmployeeTimesheetMonth,
} from "@/types/employee-portal";
import type {
  TimeEntry,
  TimeEntryPunchType,
  TimeEntrySource,
  GeofenceResult,
} from "@/types/time-entry";

type EmployeeStatus =
  | "active"
  | "on_leave"
  | "terminated"
  | "blocked";

type EmployeeDatabaseRow = {
  id: string;
  company_id: string;
  user_id: string | null;

  full_name: string;
  status: EmployeeStatus;

  admission_date: string;
  termination_date: string | null;

  department_id: string | null;
  job_position_id: string | null;
  team_id: string | null;
};

type CompanyDatabaseRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean;
};

type DepartmentDatabaseRow = {
  id: string;
  name: string;
};

type PositionDatabaseRow = {
  id: string;
  name: string;
};

type TeamDatabaseRow = {
  id: string;
  name: string;
};

type MembershipDatabaseRow = {
  company_id: string;
  user_id: string;
  is_active: boolean;
};

type TimesheetEntryDatabaseRow = {
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

function getBrazilDateParts(
  date: Date = new Date(),
): {
  year: number;
  month: number;
  day: number;
} {
  const parts =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getBrazilDateString(
  date: Date = new Date(),
): string {
  const parts = getBrazilDateParts(date);

  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function getMonthRange(params: {
  year: number;
  month: number;
}): {
  firstDay: string;
  lastDay: string;
  startTimestamp: string;
  endTimestamp: string;
} {
  const firstDay = `${params.year}-${String(
    params.month,
  ).padStart(2, "0")}-01`;

  const lastDayDate = new Date(
    Date.UTC(
      params.year,
      params.month,
      0,
      12,
    ),
  );

  const lastDay = [
    String(
      lastDayDate.getUTCFullYear(),
    ),
    String(
      lastDayDate.getUTCMonth() + 1,
    ).padStart(2, "0"),
    String(
      lastDayDate.getUTCDate(),
    ).padStart(2, "0"),
  ].join("-");

  return {
    firstDay,
    lastDay,
    startTimestamp:
      `${firstDay}T00:00:00-03:00`,
    endTimestamp:
      `${lastDay}T23:59:59.999-03:00`,
  };
}

function getDateKeyFromTimestamp(
  timestamp: string,
): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date(timestamp));
}

function mapNullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function calculateWorkedMinutes(
  entries: TimeEntry[],
): number {
  if (entries.length < 2) {
    return 0;
  }

  const sortedEntries = [...entries].sort(
    (first, second) =>
      new Date(first.recordedAt).getTime() -
      new Date(second.recordedAt).getTime(),
  );

  let workedMilliseconds = 0;

  for (
    let index = 0;
    index + 1 < sortedEntries.length;
    index += 2
  ) {
    const start = new Date(
      sortedEntries[index].recordedAt,
    ).getTime();

    const end = new Date(
      sortedEntries[index + 1].recordedAt,
    ).getTime();

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end > start
    ) {
      workedMilliseconds += end - start;
    }
  }

  return Math.floor(
    workedMilliseconds / 60000,
  );
}

function mapTimesheetEntry(
  entry: TimesheetEntryDatabaseRow,
): TimeEntry {
  return {
    id: entry.id,

    employeeId:
      entry.employee_id,

    punchType:
      entry.punch_type,

    recordedAt:
      entry.recorded_at,

    clientRecordedAt:
      entry.client_recorded_at,

    source:
      entry.source,

    /*
     * Nesta consulta mensal ainda não carregamos
     * a tabela dos locais. O nome poderá ser
     * acrescentado depois por relacionamento.
     */
    locationName: null,

    latitude:
      mapNullableNumber(
        entry.latitude,
      ),

    longitude:
      mapNullableNumber(
        entry.longitude,
      ),

    accuracyMeters:
      mapNullableNumber(
        entry.accuracy_meters,
      ),

    distanceMeters:
      mapNullableNumber(
        entry.distance_meters,
      ),

    allowedRadiusMeters:
      entry.allowed_radius_meters,

    geofenceResult:
      entry.geofence_result,

    justification:
      entry.justification,

    requiresReview:
      entry.requires_review,
  };
}

async function requireAuthenticatedUserId(): Promise<string> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !data.user
  ) {
    throw new Error(
      "Sessão inválida.",
    );
  }

  return data.user.id;
}

export const getEmployeePortalCompanies =
  cache(
    async (): Promise<EmployeePortalCompany[]> => {
      const supabase =
        await createClient();

      const userId =
        await requireAuthenticatedUserId();

      const {
        data: employeeData,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select(
          `
            id,
            company_id,
            user_id,
            full_name,
            status,
            admission_date,
            termination_date,
            department_id,
            job_position_id,
            team_id
          `,
        )
        .eq("user_id", userId)
        .order("full_name");

      if (employeeError) {
        console.error(
          "Erro ao carregar vínculos do funcionário:",
          employeeError,
        );

        throw new Error(
          "Não foi possível carregar seus vínculos.",
        );
      }

      const employees =
        (employeeData as
          | EmployeeDatabaseRow[]
          | null) ?? [];

      if (employees.length === 0) {
        return [];
      }

      const companyIds = Array.from(
        new Set(
          employees.map(
            (employee) =>
              employee.company_id,
          ),
        ),
      );

      const departmentIds =
        employees
          .map(
            (employee) =>
              employee.department_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              value !== null,
          );

      const positionIds =
        employees
          .map(
            (employee) =>
              employee.job_position_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              value !== null,
          );

      const teamIds =
        employees
          .map(
            (employee) =>
              employee.team_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              value !== null,
          );

      const companiesPromise =
        supabase
          .from("companies")
          .select(
            `
              id,
              legal_name,
              trade_name,
              is_active
            `,
          )
          .in("id", companyIds);

      const membershipsPromise =
        supabase
          .from("company_memberships")
          .select(
            `
              company_id,
              user_id,
              is_active
            `,
          )
          .eq("user_id", userId)
          .in(
            "company_id",
            companyIds,
          );

      const departmentsPromise =
        departmentIds.length > 0
          ? supabase
              .from("departments")
              .select("id, name")
              .in("id", departmentIds)
          : null;

      const positionsPromise =
        positionIds.length > 0
          ? supabase
              .from("job_positions")
              .select("id, name")
              .in("id", positionIds)
          : null;

      const teamsPromise =
        teamIds.length > 0
          ? supabase
              .from("teams")
              .select("id, name")
              .in("id", teamIds)
          : null;

      const [
        companiesResult,
        membershipsResult,
        departmentsResult,
        positionsResult,
        teamsResult,
      ] = await Promise.all([
        companiesPromise,
        membershipsPromise,

        departmentsPromise ??
          Promise.resolve({
            data: [] as DepartmentDatabaseRow[],
            error: null,
          }),

        positionsPromise ??
          Promise.resolve({
            data: [] as PositionDatabaseRow[],
            error: null,
          }),

        teamsPromise ??
          Promise.resolve({
            data: [] as TeamDatabaseRow[],
            error: null,
          }),
      ]);

      if (companiesResult.error) {
        console.error(
          "Erro ao carregar empresas do portal:",
          companiesResult.error,
        );

        throw new Error(
          "Não foi possível carregar as empresas dos vínculos.",
        );
      }

      if (membershipsResult.error) {
        console.error(
          "Erro ao carregar acessos do funcionário:",
          membershipsResult.error,
        );

        throw new Error(
          "Não foi possível validar o acesso aos vínculos.",
        );
      }

      if (departmentsResult.error) {
        console.error(
          "Erro ao carregar setores do funcionário:",
          departmentsResult.error,
        );
      }

      if (positionsResult.error) {
        console.error(
          "Erro ao carregar cargos do funcionário:",
          positionsResult.error,
        );
      }

      if (teamsResult.error) {
        console.error(
          "Erro ao carregar equipes do funcionário:",
          teamsResult.error,
        );
      }

      const companies =
        (companiesResult.data as
          | CompanyDatabaseRow[]
          | null) ?? [];

      const memberships =
        (membershipsResult.data as
          | MembershipDatabaseRow[]
          | null) ?? [];

      const departments =
        (departmentsResult.data as
          | DepartmentDatabaseRow[]
          | null) ?? [];

      const positions =
        (positionsResult.data as
          | PositionDatabaseRow[]
          | null) ?? [];

      const teams =
        (teamsResult.data as
          | TeamDatabaseRow[]
          | null) ?? [];

      const companiesById =
        new Map(
          companies.map(
            (company) => [
              company.id,
              company,
            ],
          ),
        );

      const membershipsByCompanyId =
        new Map(
          memberships.map(
            (membership) => [
              membership.company_id,
              membership,
            ],
          ),
        );

      const departmentsById =
        new Map(
          departments.map(
            (department) => [
              department.id,
              department.name,
            ],
          ),
        );

      const positionsById =
        new Map(
          positions.map(
            (position) => [
              position.id,
              position.name,
            ],
          ),
        );

      const teamsById =
        new Map(
          teams.map(
            (team) => [
              team.id,
              team.name,
            ],
          ),
        );

      return employees
        .map((employee) => {
          const company =
            companiesById.get(
              employee.company_id,
            );

          if (!company) {
            return null;
          }

          const membership =
            membershipsByCompanyId.get(
              employee.company_id,
            );

          const item: EmployeePortalCompany = {
            companyId:
              company.id,

            companyName:
              company.legal_name,

            companyTradeName:
              company.trade_name,

            employeeId:
              employee.id,

            employeeName:
              employee.full_name,

            employeeStatus:
              employee.status,

            departmentName:
              employee.department_id
                ? departmentsById.get(
                    employee.department_id,
                  ) ?? null
                : null,

            jobPositionName:
              employee.job_position_id
                ? positionsById.get(
                    employee.job_position_id,
                  ) ?? null
                : null,

            teamName:
              employee.team_id
                ? teamsById.get(
                    employee.team_id,
                  ) ?? null
                : null,

            admissionDate:
              employee.admission_date,

            terminationDate:
              employee.termination_date,

            isMembershipActive:
              company.is_active &&
              Boolean(
                membership?.is_active,
              ),
          };

          return item;
        })
        .filter(
          (
            item,
          ): item is EmployeePortalCompany =>
            item !== null,
        )
        .sort((first, second) => {
          const firstName =
            first.companyTradeName ??
            first.companyName;

          const secondName =
            second.companyTradeName ??
            second.companyName;

          return firstName.localeCompare(
            secondName,
            "pt-BR",
          );
        });
    },
  );

export const requireEmployeePortalContext =
  cache(
    async (
      companyId: string,
    ): Promise<EmployeePortalContext> => {
      const companies =
        await getEmployeePortalCompanies();

      const current =
        companies.find(
          (company) =>
            company.companyId ===
            companyId,
        );

      if (!current) {
        throw new Error(
          "Você não possui vínculo com esta empresa.",
        );
      }

      return {
        current,
        companies,
      };
    },
  );

export async function getEmployeePortalDashboard(
  companyId: string,
): Promise<EmployeePortalDashboard> {
  const [
    portalContext,
    timeClockContext,
  ] = await Promise.all([
    requireEmployeePortalContext(
      companyId,
    ),

    getTimeClockContext(
      companyId,
    ),
  ]);

  const workedMinutesToday =
    calculateWorkedMinutes(
      timeClockContext.entriesToday,
    );

  const pendingReviewCount =
    timeClockContext.entriesToday.filter(
      (entry) =>
        entry.requiresReview,
    ).length;

  return {
    context: portalContext,

    scheduleName:
      timeClockContext.scheduleName,

    dayLabel:
      timeClockContext.dayLabel,

    expectedPunch:
      timeClockContext.expectedPunch
        ? {
            punchType:
              timeClockContext
                .expectedPunch
                .punchType,

            label:
              timeClockContext
                .expectedPunch.label,

            expectedTime:
              timeClockContext
                .expectedPunch
                .expectedTime,
          }
        : null,

    primaryLocation:
      timeClockContext.currentLocation
        ? {
            name:
              timeClockContext
                .currentLocation.name,

            address:
              timeClockContext
                .currentLocation.address,

            radiusMeters:
              timeClockContext
                .currentLocation
                .radiusMeters,
          }
        : null,

    entriesToday:
      timeClockContext.entriesToday,

    workedMinutesToday,
    pendingReviewCount,

    canRegister:
      timeClockContext.canRegister,

    blockReason:
      timeClockContext.blockReason,
  };
}

export async function getEmployeeTimesheetMonth(
  params: {
    companyId: string;
    year?: number;
    month?: number;
  },
): Promise<EmployeeTimesheetMonth> {
  const portalContext =
    await requireEmployeePortalContext(
      params.companyId,
    );

  const currentDate =
    getBrazilDateParts();

  const year =
    params.year ??
    currentDate.year;

  const month =
    params.month ??
    currentDate.month;

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    throw new Error(
      "Ano inválido.",
    );
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Mês inválido.",
    );
  }

  const range =
    getMonthRange({
      year,
      month,
    });

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
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
      params.companyId,
    )
    .eq(
      "employee_id",
      portalContext.current.employeeId,
    )
    .gte(
      "recorded_at",
      range.startTimestamp,
    )
    .lte(
      "recorded_at",
      range.endTimestamp,
    )
    .order("recorded_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao carregar espelho de ponto:",
      error,
    );

    throw new Error(
      "Não foi possível carregar o espelho do mês.",
    );
  }

  /*
   * O Supabase retorna o banco em snake_case.
   * Primeiro tratamos como o formato real da consulta
   * e depois convertemos para TimeEntry.
   */
  const databaseEntries =
    (data as unknown as
      | TimesheetEntryDatabaseRow[]
      | null) ?? [];

  const normalizedEntries =
    databaseEntries.map(
      mapTimesheetEntry,
    );

  const entriesByDay =
    new Map<string, TimeEntry[]>();

  for (
    const entry of normalizedEntries
  ) {
    const dateKey =
      getDateKeyFromTimestamp(
        entry.recordedAt,
      );

    const currentEntries =
      entriesByDay.get(dateKey) ?? [];

    currentEntries.push(entry);

    entriesByDay.set(
      dateKey,
      currentEntries,
    );
  }

  const days: EmployeeTimesheetDay[] =
    Array.from(
      entriesByDay.entries(),
    )
      .map(
        ([date, dayEntries]) => {
          const sortedEntries =
            [...dayEntries].sort(
              (first, second) =>
                new Date(
                  first.recordedAt,
                ).getTime() -
                new Date(
                  second.recordedAt,
                ).getTime(),
            );

          return {
            date,

            entries:
              sortedEntries,

            firstEntryAt:
              sortedEntries[0]
                ?.recordedAt ?? null,

            lastExitAt:
              sortedEntries.length > 1
                ? sortedEntries[
                    sortedEntries.length - 1
                  ].recordedAt
                : null,

            workedMinutes:
              calculateWorkedMinutes(
                sortedEntries,
              ),

            requiresReview:
              sortedEntries.some(
                (entry) =>
                  entry.requiresReview,
              ),
          };
        },
      )
      .sort(
        (first, second) =>
          second.date.localeCompare(
            first.date,
          ),
      );

  return {
    year,
    month,

    employeeName:
      portalContext.current
        .employeeName,

    companyName:
      portalContext.current
        .companyTradeName ??
      portalContext.current
        .companyName,

    days,

    totalWorkedMinutes:
      days.reduce(
        (total, day) =>
          total +
          day.workedMinutes,
        0,
      ),

    totalEntries:
      normalizedEntries.length,

    totalPendingReview:
      normalizedEntries.filter(
        (entry) =>
          entry.requiresReview,
      ).length,
  };
}

export function getCurrentBrazilDate(): string {
  return getBrazilDateString()
}