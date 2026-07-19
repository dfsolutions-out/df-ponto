import type {
  WorkScheduleType,
} from "@/types/work-schedule";

export type SchedulePunchType =
  | "entry"
  | "break_start"
  | "break_end"
  | "exit"
  | "custom";

export type WorkSchedulePunch = {
  id: string | null;
  sequence: number;
  punchType: SchedulePunchType;
  label: string;
  expectedTime: string;
  dayOffset: 0 | 1;
  isRequired: boolean;
};

export type WorkScheduleDay = {
  id: string | null;
  dayIndex: number;
  weekday: number | null;
  label: string;
  isWorkday: boolean;
  expectedWorkMinutes: number;
  punches: WorkSchedulePunch[];
};

export type WorkScheduleConfiguration = {
  scheduleId: string;
  companyId: string;
  scheduleName: string;
  scheduleType: WorkScheduleType;
  cycleLengthDays: number;
  isNightShift: boolean;
  days: WorkScheduleDay[];
};

export type WorkScheduleConfigurationActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    configuration?: string[];
  };
};