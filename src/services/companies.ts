import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CompanyDetails,
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

type CompanyDetailsDatabaseRow = {
  id: string;
  legal_name: string;
  trade_name: string;
  cnpj: string;
  email: string;
  phone: string;
  responsible_name: string;
  responsible_email: string | null;
  responsible_phone: string | null;
  postal_code: string | null;
  street: string;
  street_number: string;
  address_complement: string | null;
  district: string;
  city: string;
  state: string;
  status: CompanyStatus;
  price_per_active_employee: number | string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
  cancelled_at: string | null;
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
    query = query.or(
      [
        `trade_name.ilike.%${normalizedSearch}%`,
        `legal_name.ilike.%${normalizedSearch}%`,
        `cnpj.ilike.%${normalizedSearch.replace(/\D/g, "")}%`,
      ].join(","),
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

export async function getCompanyById(
  companyId: string,
): Promise<CompanyDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
        id,
        legal_name,
        trade_name,
        cnpj,
        email,
        phone,
        responsible_name,
        responsible_email,
        responsible_phone,
        postal_code,
        street,
        street_number,
        address_complement,
        district,
        city,
        state,
        status,
        price_per_active_employee,
        internal_notes,
        created_at,
        updated_at,
        suspended_at,
        cancelled_at
      `,
    )
    .eq("id", companyId)
    .single();

  if (error || !data) {
    console.error("Erro ao carregar empresa:", {
      companyId,
      message: error?.message,
      code: error?.code,
    });

    return null;
  }

  const company =
    data as CompanyDetailsDatabaseRow;

  return {
    id: company.id,
    legalName: company.legal_name,
    tradeName: company.trade_name,
    cnpj: company.cnpj,
    email: company.email,
    phone: company.phone,
    responsibleName: company.responsible_name,
    responsibleEmail: company.responsible_email,
    responsiblePhone: company.responsible_phone,
    postalCode: company.postal_code,
    street: company.street,
    streetNumber: company.street_number,
    addressComplement:
      company.address_complement,
    district: company.district,
    city: company.city,
    state: company.state,
    status: company.status,
    pricePerActiveEmployee: Number(
      company.price_per_active_employee,
    ),
    internalNotes: company.internal_notes,
    createdAt: company.created_at,
    updatedAt: company.updated_at,
    suspendedAt: company.suspended_at,
    cancelledAt: company.cancelled_at,
  };
}