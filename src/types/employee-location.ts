import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

export type EmployeeLocationOption = {
  id: string;
  name: string;
  locationType: WorkLocationType;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  radiusMeters: number;
  minimumAccuracyMeters: number;

  outsideRadiusAction: OutsideRadiusAction;

  startsOn: string | null;
  endsOn: string | null;
};

export type EmployeeLocationAssignment = {
  id: string;

  companyId: string;
  employeeId: string;
  workLocationId: string;

  locationName: string;
  locationType: WorkLocationType;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  defaultRadiusMeters: number;
  customRadiusMeters: number | null;
  effectiveRadiusMeters: number;

  defaultOutsideRadiusAction: OutsideRadiusAction;

  outsideRadiusActionOverride:
    | OutsideRadiusAction
    | null;

  effectiveOutsideRadiusAction:
    OutsideRadiusAction;

  minimumAccuracyMeters: number;

  isPrimary: boolean;

  startsOn: string;
  endsOn: string | null;

  isActive: boolean;

  reason: string;

  createdAt: string;
};

export type EmployeeLocationData = {
  active: EmployeeLocationAssignment[];
  history: EmployeeLocationAssignment[];
  availableLocations: EmployeeLocationOption[];
};

export type EmployeeLocationAssignmentActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    workLocationId?: string[];
    startsOn?: string[];
    endsOn?: string[];
    customRadiusMeters?: string[];
    outsideRadiusActionOverride?: string[];
    reason?: string[];
  };
};

export type EmployeeLocationSimpleActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    endsOn?: string[];
    reason?: string[];
  };
};