import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type {
  CompanyAccessContext,
  CompanyRole,
} from "@/types/company-access";

function getRoleLabel(role: CompanyRole): string {
  const labels: Record<CompanyRole, string> = {
    company_admin: "Administrador da empresa",
    hr: "Recursos Humanos",
    manager: "Gestor",
    supervisor: "Supervisor",
    employee: "Funcionário",
  };

  return labels[role];
}

export async function requireCompanyAccess(
  companyId: string,
): Promise<CompanyAccessContext> {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "full_name, email, is_active, must_change_password",
    )
    .eq("id", userId)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("company_memberships")
    .select(
      `
        role,
        status,
        companies (
          id,
          trade_name,
          legal_name,
          status
        )
      `,
    )
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (membershipError || !membership) {
    redirect("/access-denied");
  }

  const company = Array.isArray(
    membership.companies,
  )
    ? membership.companies[0]
    : membership.companies;

  if (!company || company.status !== "active") {
    redirect("/access-denied");
  }

  const role = membership.role as CompanyRole;

  return {
    userId,
    companyId,
    companyName: company.trade_name,
    companyLegalName: company.legal_name,
    role,
    roleLabel: getRoleLabel(role),
    fullName:
      profile.full_name?.trim() || "Usuário",
    email:
      profile.email?.trim() || "E-mail não informado",
    canManageOrganization:
      role === "company_admin" || role === "hr",
  };
}
