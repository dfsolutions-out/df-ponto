export type CompanyStatus =
  | "active"
  | "suspended"
  | "cancelled";

export type CompanyActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: Record<string, string[] | undefined>;
};

export type CompanyStatusActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    reason?: string[];
  };
};

export type CompanyListItem = {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: CompanyStatus;
  pricePerActiveEmployee: number;
  createdAt: string;
};

export type CompanyDetails = {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  responsibleName: string;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  postalCode: string | null;
  street: string;
  streetNumber: string;
  addressComplement: string | null;
  district: string;
  city: string;
  state: string;
  status: CompanyStatus;
  pricePerActiveEmployee: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  cancelledAt: string | null;
};