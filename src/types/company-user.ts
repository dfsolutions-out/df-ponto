export type CompanyUserActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    fullName?: string[];
    email?: string[];
    phone?: string[];
    temporaryPassword?: string[];
    confirmTemporaryPassword?: string[];
  };
};

export type CompanyMemberRole =
  | "company_admin"
  | "hr"
  | "manager"
  | "supervisor"
  | "employee";

export type CompanyMemberStatus =
  | "active"
  | "inactive"
  | "blocked";

export type CompanyMemberListItem = {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  joinedAt: string | null;
  createdAt: string;
};