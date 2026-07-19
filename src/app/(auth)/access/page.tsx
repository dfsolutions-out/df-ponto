import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AccessPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
        is_master,
        is_active,
        must_change_password,
        last_selected_company_id
      `,
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

  if (profile.is_master) {
    redirect("/master");
  }

  const {
    data: memberships,
    error: membershipsError,
  } = await supabase
    .from("company_memberships")
    .select(
      `
        company_id,
        role,
        status,
        companies (
          id,
          status
        )
      `,
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipsError || !memberships) {
    redirect("/access-denied");
  }

  const activeMemberships =
    memberships.filter((membership) => {
      const company = Array.isArray(
        membership.companies,
      )
        ? membership.companies[0]
        : membership.companies;

      return company?.status === "active";
    });

  if (activeMemberships.length === 0) {
    redirect("/access-denied");
  }

  const preferredMembership =
    activeMemberships.find(
      (membership) =>
        membership.company_id ===
        profile.last_selected_company_id,
    ) ?? activeMemberships[0];

  redirect(
    `/company/${preferredMembership.company_id}`,
  );
}