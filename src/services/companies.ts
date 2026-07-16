import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CompanyListItem,
  CompanyStatus,
} from "@/types/company";

type GetCompaniesParams = {
  search?: string;
  status?: CompanyStatus | "all";
};

type CompanyDatabaseRow = {
  id: string;
  legal_name: string;
  trade_name: string;
  cnpj: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: CompanyStatus;
  price_per_active_employee: number | string;
  created_at: string;
};

export async function getCompanies({
  search = "",
  status = "all",
}: GetCompaniesParams): Promise<CompanyListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select(
      `
        id,
        legal_name,
        trade_name,
        cnpj,
        email,
        phone,
        city,
        state,
        status,
        price_per_active_employee,
        created_at
      `,
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(100);

  const normalizedSearch = search
    .trim()
    .replace(/[,%()]/g, "");

  if (normalizedSearch) {
    query = query.ilike(
      "trade_name",
      `%${normalizedSearch}%`,
    );
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar empresas:", {
      message: error.message,
      code: error.code,
    });

    return [];
  }

  const rows =
    (data as CompanyDatabaseRow[] | null) ?? [];

  return rows.map((company) => ({
    id: company.id,
    legalName: company.legal_name,
    tradeName: company.trade_name,
    cnpj: company.cnpj,
    email: company.email,
    phone: company.phone,
    city: company.city,
    state: company.state,
    status: company.status,
    pricePerActiveEmployee: Number(
      company.price_per_active_employee,
    ),
    createdAt: company.created_at,
  }));
}