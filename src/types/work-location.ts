export type WorkLocationType =
  | "fixed"
  | "temporary"
  | "external"
  | "route"
  | "free";

export type OutsideRadiusAction =
  | "block"
  | "allow_with_alert"
  | "require_justification";

export type WorkLocation = {
  id: string;
  companyId: string;

  name: string;
  description: string | null;

  locationType: WorkLocationType;

  address: string | null;

  latitude: number | null;
  longitude: number | null;

  radiusMeters: number;
  minimumAccuracyMeters: number;

  outsideRadiusAction: OutsideRadiusAction;

  startsOn: string | null;
  endsOn: string | null;

  isActive: boolean;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type WorkLocationActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    name?: string[];
    description?: string[];
    locationType?: string[];
    address?: string[];
    latitude?: string[];
    longitude?: string[];
    radiusMeters?: string[];
    minimumAccuracyMeters?: string[];
    outsideRadiusAction?: string[];
    startsOn?: string[];
    endsOn?: string[];
    notes?: string[];
  };
};

export type WorkLocationStatusActionState = {
  success: boolean;
  message: string | null;

  fieldErrors: {
    reason?: string[];
  };
};