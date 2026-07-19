import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Team,
  TeamDepartmentOption,
  TeamResponsibleOption,
} from "@/types/team";

type TeamDatabaseRow = {
  id: string;
  company_id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  manager_membership_id: string | null;
  supervisor_membership_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DepartmentDatabaseRow = {
  id: string;
  name: string;
};

type MembershipDatabaseRow = {
  id: string;
  user_id: string;
  role:
    | "company_admin"
    | "hr"
    | "manager"
    | "supervisor"
    | "employee";
};

type ProfileDatabaseRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function sanitizeSearch(value?: string): string {
  return value
    ?.trim()
    .replace(/[,%()]/g, "") ?? "";
}

export async function getTeams(params: {
  companyId: string;
  search?: string;
  status?: "all" | "active" | "inactive";
}): Promise<Team[]> {
  const supabase = await createClient();

  let query = supabase
    .from("teams")
    .select(
      `
        id,
        company_id,
        department_id,
        name,
        description,
        manager_membership_id,
        supervisor_membership_id,
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

  const search = sanitizeSearch(params.search);

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

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar equipes:", error);

    throw new Error(
      "Não foi possível carregar as equipes.",
    );
  }

  const teams =
    (data as TeamDatabaseRow[] | null) ?? [];

  if (teams.length === 0) {
    return [];
  }

  const departmentIds = Array.from(
    new Set(
      teams
        .map((team) => team.department_id)
        .filter(
          (value): value is string =>
            typeof value === "string",
        ),
    ),
  );

  const membershipIds = Array.from(
    new Set(
      teams
        .flatMap((team) => [
          team.manager_membership_id,
          team.supervisor_membership_id,
        ])
        .filter(
          (value): value is string =>
            typeof value === "string",
        ),
    ),
  );

  const departmentsById = new Map<
    string,
    DepartmentDatabaseRow
  >();

  if (departmentIds.length > 0) {
    const {
      data: departmentData,
      error: departmentError,
    } = await supabase
      .from("departments")
      .select("id, name")
      .eq("company_id", params.companyId)
      .in("id", departmentIds);

    if (departmentError) {
      console.error(
        "Erro ao carregar setores das equipes:",
        departmentError,
      );
    } else {
      const departments =
        (departmentData as
          | DepartmentDatabaseRow[]
          | null) ?? [];

      for (const department of departments) {
        departmentsById.set(
          department.id,
          department,
        );
      }
    }
  }

  const membershipsById = new Map<
    string,
    MembershipDatabaseRow
  >();

  const profilesById = new Map<
    string,
    ProfileDatabaseRow
  >();

  if (membershipIds.length > 0) {
    const {
      data: membershipData,
      error: membershipError,
    } = await supabase
      .from("company_memberships")
      .select("id, user_id, role")
      .eq("company_id", params.companyId)
      .in("id", membershipIds);

    if (membershipError) {
      console.error(
        "Erro ao carregar responsáveis das equipes:",
        membershipError,
      );
    } else {
      const memberships =
        (membershipData as
          | MembershipDatabaseRow[]
          | null) ?? [];

      for (const membership of memberships) {
        membershipsById.set(
          membership.id,
          membership,
        );
      }

      const userIds = Array.from(
        new Set(
          memberships.map(
            (membership) => membership.user_id,
          ),
        ),
      );

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profileError) {
          console.error(
            "Erro ao carregar perfis dos responsáveis:",
            profileError,
          );
        } else {
          const profiles =
            (profileData as
              | ProfileDatabaseRow[]
              | null) ?? [];

          for (const profile of profiles) {
            profilesById.set(
              profile.id,
              profile,
            );
          }
        }
      }
    }
  }

  function getResponsibleName(
    membershipId: string | null,
  ): string | null {
    if (!membershipId) {
      return null;
    }

    const membership =
      membershipsById.get(membershipId);

    if (!membership) {
      return null;
    }

    const profile = profilesById.get(
      membership.user_id,
    );

    return (
      profile?.full_name?.trim() ||
      profile?.email?.trim() ||
      "Usuário não identificado"
    );
  }

  return teams.map((team) => ({
    id: team.id,
    companyId: team.company_id,
    departmentId: team.department_id,
    departmentName: team.department_id
      ? departmentsById.get(team.department_id)
          ?.name ?? null
      : null,
    name: team.name,
    description: team.description,
    managerMembershipId:
      team.manager_membership_id,
    managerName: getResponsibleName(
      team.manager_membership_id,
    ),
    supervisorMembershipId:
      team.supervisor_membership_id,
    supervisorName: getResponsibleName(
      team.supervisor_membership_id,
    ),
    isActive: team.is_active,
    createdAt: team.created_at,
    updatedAt: team.updated_at,
  }));
}

export async function getTeamById(params: {
  companyId: string;
  teamId: string;
}): Promise<Team | null> {
  const teams = await getTeams({
    companyId: params.companyId,
    status: "all",
  });

  return (
    teams.find(
      (team) => team.id === params.teamId,
    ) ?? null
  );
}

export async function getTeamCounts(
  companyId: string,
): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const supabase = await createClient();

  const [
    totalResult,
    activeResult,
    inactiveResult,
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId),

    supabase
      .from("teams")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", true),

    supabase
      .from("teams")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", false),
  ]);

  return {
    total: totalResult.count ?? 0,
    active: activeResult.count ?? 0,
    inactive: inactiveResult.count ?? 0,
  };
}

export async function getTeamDepartmentOptions(
  companyId: string,
): Promise<TeamDepartmentOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao carregar setores disponíveis:",
      error,
    );

    throw new Error(
      "Não foi possível carregar os setores.",
    );
  }

  return (
    (data as DepartmentDatabaseRow[] | null) ?? []
  ).map((department) => ({
    id: department.id,
    name: department.name,
  }));
}

export async function getTeamResponsibleOptions(
  companyId: string,
): Promise<{
  managers: TeamResponsibleOption[];
  supervisors: TeamResponsibleOption[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_memberships")
    .select("id, user_id, role")
    .eq("company_id", companyId)
    .eq("status", "active")
    .in("role", [
      "company_admin",
      "hr",
      "manager",
      "supervisor",
    ]);

  if (error) {
    console.error(
      "Erro ao carregar responsáveis disponíveis:",
      error,
    );

    throw new Error(
      "Não foi possível carregar os responsáveis.",
    );
  }

  const memberships =
    (data as MembershipDatabaseRow[] | null) ?? [];

  if (memberships.length === 0) {
    return {
      managers: [],
      supervisors: [],
    };
  }

  const userIds = Array.from(
    new Set(
      memberships.map(
        (membership) => membership.user_id,
      ),
    ),
  );

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (profileError) {
    console.error(
      "Erro ao carregar perfis dos responsáveis:",
      profileError,
    );

    throw new Error(
      "Não foi possível carregar os responsáveis.",
    );
  }

  const profiles =
    (profileData as ProfileDatabaseRow[] | null) ??
    [];

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const options = memberships
    .map((membership) => {
      const profile = profilesById.get(
        membership.user_id,
      );

      return {
        membershipId: membership.id,
        fullName:
          profile?.full_name?.trim() ||
          profile?.email?.trim() ||
          "Usuário sem nome",
        email:
          profile?.email?.trim() ||
          "E-mail não informado",
        role: membership.role,
      } satisfies TeamResponsibleOption;
    })
    .sort((first, second) =>
      first.fullName.localeCompare(
        second.fullName,
        "pt-BR",
      ),
    );

  return {
    managers: options.filter((option) =>
      [
        "company_admin",
        "hr",
        "manager",
      ].includes(option.role),
    ),

    supervisors: options.filter((option) =>
      [
        "company_admin",
        "hr",
        "supervisor",
      ].includes(option.role),
    ),
  };
}