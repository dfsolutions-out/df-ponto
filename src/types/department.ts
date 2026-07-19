export type Department = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    name?: string[];
    description?: string[];
  };
};

export type DepartmentStatusActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    reason?: string[];
  };
};
