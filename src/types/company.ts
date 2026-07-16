export type CompanyStatus =
  | "active"
  | "suspended"
  | "cancelled";

export type CompanyActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: Record<string, string[] | undefined>;
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