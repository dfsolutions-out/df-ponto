export type JobPosition = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobPositionActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    name?: string[];
    description?: string[];
  };
};

export type JobPositionStatusActionState = {
  success: boolean;
  message: string | null;
  fieldErrors: {
    reason?: string[];
  };
};