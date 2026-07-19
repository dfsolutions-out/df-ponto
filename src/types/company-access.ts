export type CompanyRole =
  | "company_admin"
  | "hr"
  | "manager"
  | "supervisor"
  | "employee";

export type CompanyAccessContext = {
  userId: string;
  companyId: string;
  companyName: string;
  companyLegalName: string;
  role: CompanyRole;
  roleLabel: string;
  fullName: string;
  email: string;
  canManageOrganization: boolean;
};
