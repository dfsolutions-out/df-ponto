import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MasterDashboardStats = {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  cancelledCompanies: number;
  hasError: boolean;
};

type CountResult = {
  count: number | null;
  error: {
    message: string;
  } | null;
};

async function getCompanyCount(
  status?: "active" | "suspended" | "cancelled",
): Promise<CountResult> {
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  return {
    count,
    error,
  };
}

export async function getMasterDashboardStats(): Promise<MasterDashboardStats> {
  const [
    totalResult,
    activeResult,
    suspendedResult,
    cancelledResult,
  ] = await Promise.all([
    getCompanyCount(),
    getCompanyCount("active"),
    getCompanyCount("suspended"),
    getCompanyCount("cancelled"),
  ]);

  const hasError = Boolean(
    totalResult.error ||
      activeResult.error ||
      suspendedResult.error ||
      cancelledResult.error,
  );

  if (hasError) {
    console.error("Erro ao carregar indicadores do painel Master:", {
      total: totalResult.error?.message,
      active: activeResult.error?.message,
      suspended: suspendedResult.error?.message,
      cancelled: cancelledResult.error?.message,
    });
  }

  return {
    totalCompanies: totalResult.count ?? 0,
    activeCompanies: activeResult.count ?? 0,
    suspendedCompanies: suspendedResult.count ?? 0,
    cancelledCompanies: cancelledResult.count ?? 0,
    hasError,
  };
}