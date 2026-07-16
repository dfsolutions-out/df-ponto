"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type {
  CompanyActionState,
  CompanyStatusActionState,
} from "@/types/company";
import {
  companySchema,
  companyStatusSchema,
} from "@/validators/company";

async function validateMasterAccess() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      supabase,
      allowed: false,
      message:
        "Sua sessão expirou. Atualize a página e entre novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_master, is_active")
    .eq("id", userId)
    .single();

  if (
    !profile ||
    !profile.is_master ||
    !profile.is_active
  ) {
    return {
      supabase,
      allowed: false,
      message:
        "Você não possui permissão para realizar esta operação.",
    };
  }

  return {
    supabase,
    allowed: true,
    message: null,
  };
}

function getCompanyFormValues(formData: FormData) {
  return {
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
  };
}

export async function createCompanyAction(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const validation = companySchema.safeParse(
    getCompanyFormValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados antes de continuar.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const access = await validateMasterAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
      fieldErrors: {},
    };
  }

  const input = validation.data;

  const { error } = await access.supabase.rpc(
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

    console.error("Erro ao cadastrar empresa:", error);

    return {
      success: false,
      message:
        "Não foi possível cadastrar a empresa.",
      fieldErrors: {},
    };
  }

  revalidatePath("/master");
  revalidatePath("/master/companies");

  redirect("/master/companies?created=1");
}

export async function updateCompanyAction(
  companyId: string,
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const validation = companySchema.safeParse(
    getCompanyFormValues(formData),
  );

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados antes de continuar.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const access = await validateMasterAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
      fieldErrors: {},
    };
  }

  const input = validation.data;

  const { error } = await access.supabase.rpc(
    "update_company_with_audit",
    {
      p_company_id: companyId,
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
    if (error.code === "23505") {
      return {
        success: false,
        message:
          "Já existe outra empresa com este CNPJ.",
        fieldErrors: {
          cnpj: [
            "Este CNPJ já está sendo utilizado.",
          ],
        },
      };
    }

    console.error("Erro ao atualizar empresa:", error);

    return {
      success: false,
      message:
        "Não foi possível atualizar a empresa.",
      fieldErrors: {},
    };
  }

  revalidatePath("/master");
  revalidatePath("/master/companies");
  revalidatePath(
    `/master/companies/${companyId}`,
  );

  redirect(
    `/master/companies/${companyId}?updated=1`,
  );
}

export async function changeCompanyStatusAction(
  _previousState: CompanyStatusActionState,
  formData: FormData,
): Promise<CompanyStatusActionState> {
  const validation =
    companyStatusSchema.safeParse({
      companyId: formData.get("companyId"),
      status: formData.get("status"),
      reason: formData.get("reason"),
    });

  if (!validation.success) {
    const errors =
      validation.error.flatten().fieldErrors;

    return {
      success: false,
      message:
        "Revise a justificativa informada.",
      fieldErrors: {
        reason: errors.reason,
      },
    };
  }

  const access = await validateMasterAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
      fieldErrors: {},
    };
  }

  const input = validation.data;

  const { error } = await access.supabase.rpc(
    "change_company_status_with_audit",
    {
      p_company_id: input.companyId,
      p_new_status: input.status,
      p_reason: input.reason,
    },
  );

  if (error) {
    console.error(
      "Erro ao alterar status da empresa:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível alterar o status da empresa.",
      fieldErrors: {},
    };
  }

  revalidatePath("/master");
  revalidatePath("/master/companies");
  revalidatePath(
    `/master/companies/${input.companyId}`,
  );

  redirect(
    `/master/companies/${input.companyId}?statusChanged=1`,
  );
}