import type { CompanyMemberRole } from "@/types/company-user";

export type Team = {
  id: string;
  companyId: string;
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  description: string | null;
  managerMembershipId: string | null;
  managerName: string | null;
  supervisorMembershipId: string | null;
  supervisorName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamResponsibleOption = {
  membershipId: string;
  fullName: string;
  email: string;
  role: CompanyMemberRole;
};

export type TeamDepartmentOption = {
  id: string;
  name: string;
};

export type TeamActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    name?: string[];
    description?: string[];
    departmentId?: string[];
    managerMembershipId?: string[];
    supervisorMembershipId?: string[];
  };
};

export type TeamStatusActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    reason?: string[];
  };
};