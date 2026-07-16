"use server";

import {
  revalidatePath,
} from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { CompanyActionState } from "@/types/company";
import { companySchema } from "@/validators/company";

export async function createCompanyAction(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const validation = companySchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    cnpj: formData.get("cnpj"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    responsibleName: formData.get(
      "responsibleName",
    ),
    responsibleEmail: formData.get(
      "responsibleEmail",
    ),
    responsiblePhone: formData.get(
      "responsiblePhone",
    ),
    postalCode: formData.get("postalCode"),
    street: formData.get("street"),
    streetNumber: formData.get("streetNumber"),
    addressComplement: formData.get(
      "addressComplement",
    ),
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    pricePerActiveEmployee: formData.get(
      "pricePerActiveEmployee",
    ),
    internalNotes: formData.get("internalNotes"),
  });

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados antes de continuar.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      success: false,
      message:
        "Sua sessão expirou. Atualize a página e entre novamente.",
      fieldErrors: {},
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("is_master, is_active")
    .eq("id", userId)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_master ||
    !profile.is_active
  ) {
    return {
      success: false,
      message:
        "Você não possui permissão para cadastrar empresas.",
      fieldErrors: {},
    };
  }

  const input = validation.data;

  const { error } = await supabase.rpc(
    "create_company_with_audit",
    {
      p_legal_name: input.legalName,
      p_trade_name: input.tradeName,
      p_cnpj: input.cnpj,
      p_email: input.email,
      p_phone: input.phone,
      p_responsible_name:
        input.responsibleName,
      p_responsible_email:
        input.responsibleEmail,
      p_responsible_phone:
        input.responsiblePhone,
      p_postal_code: input.postalCode,
      p_street: input.street,
      p_street_number: input.streetNumber,
      p_address_complement:
        input.addressComplement,
      p_district: input.district,
      p_city: input.city,
      p_state: input.state,
      p_price_per_active_employee:
        input.pricePerActiveEmployee,
      p_internal_notes: input.internalNotes,
    },
  );

  if (error) {
    console.error("Erro ao cadastrar empresa:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });

    if (error.code === "23505") {
      return {
        success: false,
        message:
          "Já existe uma empresa cadastrada com este CNPJ.",
        fieldErrors: {
          cnpj: [
            "Este CNPJ já está sendo utilizado.",
          ],
        },
      };
    }

    if (error.code === "42501") {
      return {
        success: false,
        message:
          "Você não possui permissão para realizar esta operação.",
        fieldErrors: {},
      };
    }

    return {
      success: false,
      message:
        "Não foi possível cadastrar a empresa. Tente novamente.",
      fieldErrors: {},
    };
  }

  revalidatePath("/master");
  revalidatePath("/master/companies");

  redirect("/master/companies?created=1");
}