export type EmployeeScheduleOption = {
  id: string;
  name: string;
  scheduleType:
    | "fixed_weekly"
    | "rotating"
    | "flexible"
    | "on_call";
  cycleLengthDays: number;
  expectedWeeklyMinutes: number | null;
  isNightShift: boolean;
};

export type EmployeeScheduleAssignment = {
  id: string;
  employeeId: string;
  workScheduleId: string;

  scheduleName: string;
  scheduleType:
    | "fixed_weekly"
    | "rotating"
    | "flexible"
    | "on_call";

  startsOn: string;
  endsOn: string | null;
  isActive: boolean;
  reason: string | null;

  createdAt: string;
};

export type EmployeeScheduleData = {
  current: EmployeeScheduleAssignment | null;
  history: EmployeeScheduleAssignment[];
  availableSchedules: EmployeeScheduleOption[];
};

export type EmployeeScheduleActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    workScheduleId?: string[];
    startsOn?: string[];
    reason?: string[];
  };
};