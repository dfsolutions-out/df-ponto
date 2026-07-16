import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CompanyMemberListItem,
  CompanyMemberRole,
  CompanyMemberStatus,
} from "@/types/company-user";

type MembershipDatabaseRow = {
  id: string;
  user_id: string;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  joined_at: string | null;
  created_at: string;
};

type ProfileDatabaseRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export async function getCompanyMembers(
  companyId: string,
): Promise<CompanyMemberListItem[]> {
  const admin = createAdminClient();

  const { data: membershipData, error } =
    await admin
      .from("company_memberships")
      .select(
        `
          id,
          user_id,
          role,
          status,
          joined_at,
          created_at
        `,
      )
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Erro ao carregar membros da empresa:",
      error,
    );

    return [];
  }

  const memberships =
    (membershipData as MembershipDatabaseRow[] | null) ??
    [];

  if (memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map(
    (membership) => membership.user_id,
  );

  const { data: profileData, error: profileError } =
    await admin
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);

  if (profileError) {
    console.error(
      "Erro ao carregar perfis dos membros:",
      profileError,
    );

    return [];
  }

  const profiles =
    (profileData as ProfileDatabaseRow[] | null) ?? [];

  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return memberships.map((membership) => {
    const profile = profilesById.get(
      membership.user_id,
    );

    return {
      membershipId: membership.id,
      userId: membership.user_id,
      fullName:
        profile?.full_name?.trim() ||
        "Nome não informado",
      email:
        profile?.email?.trim() ||
        "E-mail não informado",
      phone: profile?.phone ?? null,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joined_at,
      createdAt: membership.created_at,
    };
  });
}