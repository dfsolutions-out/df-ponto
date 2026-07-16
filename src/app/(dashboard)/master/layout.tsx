import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { MasterHeader } from "@/components/master/MasterHeader";
import { MasterSidebar } from "@/components/master/MasterSidebar";
import { createClient } from "@/lib/supabase/server";

type MasterLayoutProps = {
  children: ReactNode;
};

export default async function MasterLayout({
  children,
}: MasterLayoutProps) {
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
    .select("full_name, email, is_master, is_active")
    .eq("id", userId)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_master ||
    !profile.is_active
  ) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const fullName =
    profile.full_name?.trim() || "Administrador Master";

  const email =
    profile.email?.trim() || "E-mail não informado";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <MasterSidebar />

        <div className="min-w-0 flex-1">
          <MasterHeader
            fullName={fullName}
            email={email}
          />

          {children}
        </div>
      </div>
    </div>
  );
}