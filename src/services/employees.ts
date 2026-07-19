import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Employee,
  EmployeeFormOptions,
  EmployeeStatus,
} from "@/types/employee";

type EmployeeDatabaseRow = {
  id: string;
  company_id: string;
  user_id: string | null;

  full_name: string;
  cpf: string;
  registration_number: string;
  email: string;
  phone: string;

  admission_date: string;
  termination_date: string | null;

  status: EmployeeStatus;
  notes: string | null;

  department_id: string | null;
  job_position_id: string | null;
  team_id: string | null;

  created_at: string;
  updated_at: string;
};

type NamedRow = {
  id: string;
  name: string;
};

type TeamRow = {
  id: string;
  name: string;
  department_id: string | null;
};

type MembershipRow = {
  user_id: string;
  role: string;
  status: string;
};

function sanitizeSearch(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[,%()]/g, "") ?? ""
  );
}

function formatEmployee(
  row: EmployeeDatabaseRow,
  departmentsById: Map<string, string>,
  positionsById: Map<string, string>,
  teamsById: Map<string, string>,
  membershipsByUserId: Map<
    string,
    MembershipRow
  >,
): Employee {
  const membership = row.user_id
    ? membershipsByUserId.get(row.user_id)
    : undefined;

  return {
    id: row.id,
    companyId: row.company_id,

    userId: row.user_id,

    fullName: row.full_name,
    cpf: row.cpf,
    registrationNumber:
      row.registration_number,
    email: row.email,
    phone: row.phone,

    admissionDate: row.admission_date,
    terminationDate: row.termination_date,

    status: row.status,
    notes: row.notes,

    departmentId: row.department_id,
    departmentName: row.department_id
      ? departmentsById.get(row.department_id) ??
        null
      : null,

    jobPositionId: row.job_position_id,
    jobPositionName: row.job_position_id
      ? positionsById.get(
          row.job_position_id,
        ) ?? null
      : null,

    teamId: row.team_id,
    teamName: row.team_id
      ? teamsById.get(row.team_id) ?? null
      : null,

    accessRole: membership?.role ?? null,
    accessStatus:
      membership?.status ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function enrichEmployees(
  companyId: string,
  rows: EmployeeDatabaseRow[],
): Promise<Employee[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const departmentIds = Array.from(
    new Set(
      rows
        .map((row) => row.department_id)
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  );

  const positionIds = Array.from(
    new Set(
      rows
        .map((row) => row.job_position_id)
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  );

  const teamIds = Array.from(
    new Set(
      rows
        .map((row) => row.team_id)
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  );

  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  );

  const departmentsById = new Map<
    string,
    string
  >();

  const positionsById = new Map<
    string,
    string
  >();

  const teamsById = new Map<
    string,
    string
  >();

  const membershipsByUserId = new Map<
    string,
    MembershipRow
  >();

  if (departmentIds.length > 0) {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .eq("company_id", companyId)
      .in("id", departmentIds);

    for (const item of
      (data as NamedRow[] | null) ?? []) {
      departmentsById.set(
        item.id,
        item.name,
      );
    }
  }

  if (positionIds.length > 0) {
    const { data } = await supabase
      .from("job_positions")
      .select("id, name")
      .eq("company_id", companyId)
      .in("id", positionIds);

    for (const item of
      (data as NamedRow[] | null) ?? []) {
      positionsById.set(
        item.id,
        item.name,
      );
    }
  }

  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("teams")
      .select("id, name")
      .eq("company_id", companyId)
      .in("id", teamIds);

    for (const item of
      (data as NamedRow[] | null) ?? []) {
      teamsById.set(item.id, item.name);
    }
  }

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("company_memberships")
      .select("user_id, role, status")
      .eq("company_id", companyId)
      .in("user_id", userIds);

    for (const membership of
      (data as MembershipRow[] | null) ??
      []) {
      membershipsByUserId.set(
        membership.user_id,
        membership,
      );
    }
  }

  return rows.map((row) =>
    formatEmployee(
      row,
      departmentsById,
      positionsById,
      teamsById,
      membershipsByUserId,
    ),
  );
}

export async function getEmployees(params: {
  companyId: string;
  search?: string;
  status?:
    | "all"
    | EmployeeStatus;
}): Promise<Employee[]> {
  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select(
      `
        id,
        company_id,
        user_id,
        full_name,
        cpf,
        registration_number,
        email,
        phone,
        admission_date,
        termination_date,
        status,
        notes,
        department_id,
        job_position_id,
        team_id,
        created_at,
        updated_at
      `,
    )
    .eq("company_id", params.companyId)
    .order("status", {
      ascending: true,
    })
    .order("full_name", {
      ascending: true,
    });

  const search = sanitizeSearch(
    params.search,
  );

  if (search) {
    query = query.or(
      [
        `full_name.ilike.%${search}%`,
        `cpf.ilike.%${search}%`,
        `registration_number.ilike.%${search}%`,
        `email.ilike.%${search}%`,
      ].join(","),
    );
  }

  if (
    params.status &&
    params.status !== "all"
  ) {
    query = query.eq(
      "status",
      params.status,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Erro ao listar funcionários:",
      error,
    );

    throw new Error(
      "Não foi possível carregar os funcionários.",
    );
  }

  return enrichEmployees(
    params.companyId,
    (data as EmployeeDatabaseRow[] | null) ??
      [],
  );
}

export async function getEmployeeById(params: {
  companyId: string;
  employeeId: string;
}): Promise<Employee | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
        id,
        company_id,
        user_id,
        full_name,
        cpf,
        registration_number,
        email,
        phone,
        admission_date,
        termination_date,
        status,
        notes,
        department_id,
        job_position_id,
        team_id,
        created_at,
        updated_at
      `,
    )
    .eq("company_id", params.companyId)
    .eq("id", params.employeeId)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar funcionário:",
      error,
    );

    throw new Error(
      "Não foi possível carregar o funcionário.",
    );
  }

  if (!data) {
    return null;
  }

  const employees = await enrichEmployees(
    params.companyId,
    [data as EmployeeDatabaseRow],
  );

  return employees[0] ?? null;
}

export async function getEmployeeCounts(
  companyId: string,
): Promise<{
  total: number;
  active: number;
  onLeave: number;
  terminated: number;
  blocked: number;
}> {
  const supabase = await createClient();

  const [
    total,
    active,
    onLeave,
    terminated,
    blocked,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId),

    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("status", "active"),

    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("status", "on_leave"),

    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("status", "terminated"),

    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("status", "blocked"),
  ]);

  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    onLeave: onLeave.count ?? 0,
    terminated: terminated.count ?? 0,
    blocked: blocked.count ?? 0,
  };
}

export async function getEmployeeFormOptions(
  companyId: string,
): Promise<EmployeeFormOptions> {
  const supabase = await createClient();

  const [
    departmentsResult,
    positionsResult,
    teamsResult,
  ] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("job_positions")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("teams")
      .select(
        "id, name, department_id",
      )
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (departmentsResult.error) {
    throw new Error(
      "Não foi possível carregar os setores.",
    );
  }

  if (positionsResult.error) {
    throw new Error(
      "Não foi possível carregar os cargos.",
    );
  }

  if (teamsResult.error) {
    throw new Error(
      "Não foi possível carregar as equipes.",
    );
  }

  return {
    departments: (
      (departmentsResult.data as
        | NamedRow[]
        | null) ?? []
    ).map((item) => ({
      id: item.id,
      name: item.name,
    })),

    jobPositions: (
      (positionsResult.data as
        | NamedRow[]
        | null) ?? []
    ).map((item) => ({
      id: item.id,
      name: item.name,
    })),

    teams: (
      (teamsResult.data as
        | TeamRow[]
        | null) ?? []
    ).map((item) => ({
      id: item.id,
      name: item.name,
      departmentId:
        item.department_id,
    })),
  };
}