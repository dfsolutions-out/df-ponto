import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

export type TimeEntryPunchType =
  | "entry"
  | "break_start"
  | "break_end"
  | "exit"
  | "custom";

export type TimeEntrySource =
  | "web"
  | "pwa"
  | "offline_sync"
  | "manual_adjustment";

export type GeofenceResult =
  | "inside"
  | "outside"
  | "accuracy_low"
  | "not_applicable";

export type TimeClockEmployee = {
  id: string;
  fullName: string;
  status:
    | "active"
    | "on_leave"
    | "terminated"
    | "blocked";
  admissionDate: string;
};

export type TimeClockExpectedPunch = {
  id: string | null;
  sequence: number;
  punchType: TimeEntryPunchType;
  label: string;
  expectedTime: string | null;
  dayOffset: 0 | 1;
  requiresJustification: boolean;
};

export type TimeClockLocation = {
  assignmentId: string;
  locationId: string;

  name: string;
  locationType: WorkLocationType;

  address: string | null;

  latitude: number | null;
  longitude: number | null;

  radiusMeters: number;
  minimumAccuracyMeters: number;

  outsideRadiusAction:
    OutsideRadiusAction;

  isPrimary: boolean;
};

export type TimeEntry = {
  id: string;

  employeeId: string;

  punchType: TimeEntryPunchType;

  recordedAt: string;
  clientRecordedAt: string | null;

  source: TimeEntrySource;

  locationName: string | null;

  latitude: number | null;
  longitude: number | null;

  accuracyMeters: number | null;
  distanceMeters: number | null;
  allowedRadiusMeters: number | null;

  geofenceResult: GeofenceResult;

  justification: string | null;

  requiresReview: boolean;
};

export type TimeClockContext = {
  companyId: string;

  employee: TimeClockEmployee | null;

  expectedPunch:
    | TimeClockExpectedPunch
    | null;

  currentLocation:
    | TimeClockLocation
    | null;

  availableLocations:
    TimeClockLocation[];

  entriesToday: TimeEntry[];

  scheduleName: string | null;
  dayLabel: string | null;
  isWorkday: boolean;

  canRegister: boolean;
  blockReason: string | null;
};

export type RegisterTimeEntryActionState = {
  success: boolean;
  message: string | null;

  timeEntryId: string | null;

  fieldErrors: {
    latitude?: string[];
    longitude?: string[];
    accuracyMeters?: string[];
    justification?: string[];
    clientIdempotencyKey?: string[];
  };
};