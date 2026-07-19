import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/types/department";

type DepartmentRow = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDepartments(params: {
  companyId: string;
  search?: string;
  status?: "all" | "active" | "inactive";
}): Promise<Department[]> {
  const supabase = await createClient();

  let query = supabase
    .from("departments")
    .select(
      "id, company_id, name, description, is_active, created_at, updated_at",
    )
    .eq("company_id", params.companyId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  const search = params.search
    ?.trim()
    .replace(/[,%()]/g, "");

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
    console.error("Erro ao listar setores:", error);
    throw new Error("Não foi possível carregar os setores.");
  }

  return (data as DepartmentRow[]).map(mapDepartment);
}

export async function getDepartmentById(params: {
  companyId: string;
  departmentId: string;
}): Promise<Department | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select(
      "id, company_id, name, description, is_active, created_at, updated_at",
    )
    .eq("company_id", params.companyId)
    .eq("id", params.departmentId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar setor:", error);
    throw new Error("Não foi possível carregar o setor.");
  }

  return data
    ? mapDepartment(data as DepartmentRow)
    : null;
}

export async function getDepartmentCounts(
  companyId: string,
): Promise<{ total: number; active: number; inactive: number }> {
  const supabase = await createClient();

  const [{ count: total }, { count: active }, { count: inactive }] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase
        .from("departments")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("departments")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", false),
    ]);

  return {
    total: total ?? 0,
    active: active ?? 0,
    inactive: inactive ?? 0,
  };
}
