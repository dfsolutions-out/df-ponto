export type EmployeeStatus =
  | "active"
  | "on_leave"
  | "terminated"
  | "blocked";

export type Employee = {
  id: string;
  companyId: string;

  userId: string | null;

  fullName: string;
  cpf: string;
  registrationNumber: string;
  email: string;
  phone: string;

  admissionDate: string;
  terminationDate: string | null;

  status: EmployeeStatus;
  notes: string | null;

  departmentId: string | null;
  departmentName: string | null;

  jobPositionId: string | null;
  jobPositionName: string | null;

  teamId: string | null;
  teamName: string | null;

  accessRole: string | null;
  accessStatus: string | null;

  createdAt: string;
  updatedAt: string;
};

export type EmployeeOption = {
  id: string;
  name: string;
};

export type EmployeeFormOptions = {
  departments: EmployeeOption[];
  jobPositions: EmployeeOption[];
  teams: Array<
    EmployeeOption & {
      departmentId: string | null;
    }
  >;
};

export type EmployeeActionState = {
  success: boolean;
  message: string | null;
  employeeId?: string | null;

  fieldErrors: {
    fullName?: string[];
    cpf?: string[];
    registrationNumber?: string[];
    email?: string[];
    phone?: string[];
    admissionDate?: string[];
    departmentId?: string[];
    jobPositionId?: string[];
    teamId?: string[];
    notes?: string[];
    grantAccess?: string[];
    temporaryPassword?: string[];
    confirmTemporaryPassword?: string[];
  };
};

export type EmployeeStatusActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    status?: string[];
    reason?: string[];
    terminationDate?: string[];
  };
};