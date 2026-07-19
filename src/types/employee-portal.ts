import type {
  EmployeeStatus,
} from "@/types/employee";
import type {
  TimeEntry,
  TimeEntryPunchType,
} from "@/types/time-entry";

export type EmployeePortalCompany = {
  companyId: string;
  companyName: string;
  companyTradeName: string | null;

  employeeId: string;
  employeeName: string;
  employeeStatus: EmployeeStatus;

  departmentName: string | null;
  jobPositionName: string | null;
  teamName: string | null;

  admissionDate: string;
  terminationDate: string | null;

  isMembershipActive: boolean;
};

export type EmployeePortalContext = {
  current: EmployeePortalCompany;
  companies: EmployeePortalCompany[];
};

export type EmployeePortalDashboard = {
  context: EmployeePortalContext;

  scheduleName: string | null;
  dayLabel: string | null;

  expectedPunch: {
    punchType: TimeEntryPunchType;
    label: string;
    expectedTime: string | null;
  } | null;

  primaryLocation: {
    name: string;
    address: string | null;
    radiusMeters: number;
  } | null;

  entriesToday: TimeEntry[];

  workedMinutesToday: number;
  pendingReviewCount: number;

  canRegister: boolean;
  blockReason: string | null;
};

export type EmployeeTimesheetDay = {
  date: string;
  entries: TimeEntry[];

  firstEntryAt: string | null;
  lastExitAt: string | null;

  workedMinutes: number;
  requiresReview: boolean;
};

export type EmployeeTimesheetMonth = {
  year: number;
  month: number;

  employeeName: string;
  companyName: string;

  days: EmployeeTimesheetDay[];

  totalWorkedMinutes: number;
  totalEntries: number;
  totalPendingReview: number;
};