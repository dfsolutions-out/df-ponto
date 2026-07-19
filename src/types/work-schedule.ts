export type WorkScheduleType =
  | "fixed_weekly"
  | "rotating"
  | "flexible"
  | "on_call";

export type WorkSchedule = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  scheduleType: WorkScheduleType;
  cycleLengthDays: number;
  expectedWeeklyMinutes: number | null;
  isNightShift: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkScheduleActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    name?: string[];
    description?: string[];
    scheduleType?: string[];
    cycleLengthDays?: string[];
    expectedWeeklyHours?: string[];
    isNightShift?: string[];
  };
};

export type WorkScheduleStatusActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    reason?: string[];
  };
};