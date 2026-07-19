import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  EmployeeLocationAssignment,
  EmployeeLocationData,
  EmployeeLocationOption,
} from "@/types/employee-location";
import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

type AssignmentDatabaseRow = {
  id: string;

  company_id: string;
  employee_id: string;
  work_location_id: string;

  is_primary: boolean;

  custom_radius_meters: number | null;

  outside_radius_action_override:
    | OutsideRadiusAction
    | null;

  starts_on: string;
  ends_on: string | null;

  is_active: boolean;

  reason: string;

  created_at: string;
};

type LocationDatabaseRow = {
  id: string;

  name: string;

  location_type: WorkLocationType;

  address: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  radius_meters: number;
  minimum_accuracy_meters: number;

  outside_radius_action:
    OutsideRadiusAction;

  starts_on: string | null;
  ends_on: string | null;

  is_active: boolean;
};

function mapNullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function mapLocationOption(
  row: LocationDatabaseRow,
): EmployeeLocationOption {
  return {
    id: row.id,
    name: row.name,

    locationType:
      row.location_type,

    address: row.address,

    latitude:
      mapNullableNumber(row.latitude),

    longitude:
      mapNullableNumber(row.longitude),

    radiusMeters:
      row.radius_meters,

    minimumAccuracyMeters:
      row.minimum_accuracy_meters,

    outsideRadiusAction:
      row.outside_radius_action,

    startsOn: row.starts_on,
    endsOn: row.ends_on,
  };
}

function mapAssignment(
  row: AssignmentDatabaseRow,
  locationsById: Map<
    string,
    LocationDatabaseRow
  >,
): EmployeeLocationAssignment {
  const location =
    locationsById.get(
      row.work_location_id,
    );

  const defaultRadius =
    location?.radius_meters ?? 50;

  const defaultOutsideRadiusAction =
    location?.outside_radius_action ??
    "block";

  return {
    id: row.id,

    companyId: row.company_id,
    employeeId: row.employee_id,
    workLocationId:
      row.work_location_id,

    locationName:
      location?.name ??
      "Local não encontrado",

    locationType:
      location?.location_type ??
      "fixed",

    address:
      location?.address ?? null,

    latitude:
      mapNullableNumber(
        location?.latitude ?? null,
      ),

    longitude:
      mapNullableNumber(
        location?.longitude ?? null,
      ),

    defaultRadiusMeters:
      defaultRadius,

    customRadiusMeters:
      row.custom_radius_meters,

    effectiveRadiusMeters:
      row.custom_radius_meters ??
      defaultRadius,

    defaultOutsideRadiusAction,

    outsideRadiusActionOverride:
      row.outside_radius_action_override,

    effectiveOutsideRadiusAction:
      row.outside_radius_action_override ??
      defaultOutsideRadiusAction,

    minimumAccuracyMeters:
      location?.minimum_accuracy_meters ??
      100,

    isPrimary: row.is_primary,

    startsOn: row.starts_on,
    endsOn: row.ends_on,

    isActive: row.is_active,

    reason: row.reason,

    createdAt: row.created_at,
  };
}

export async function getEmployeeLocationData(
  params: {
    companyId: string;
    employeeId: string;
  },
): Promise<EmployeeLocationData> {
  const supabase = await createClient();

  const [
    locationsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from("work_locations")
      .select(
        `
          id,
          name,
          location_type,
          address,
          latitude,
          longitude,
          radius_meters,
          minimum_accuracy_meters,
          outside_radius_action,
          starts_on,
          ends_on,
          is_active
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .eq("is_active", true)
      .order("name"),

    supabase
      .from(
        "employee_work_location_assignments",
      )
      .select(
        `
          id,
          company_id,
          employee_id,
          work_location_id,
          is_primary,
          custom_radius_meters,
          outside_radius_action_override,
          starts_on,
          ends_on,
          is_active,
          reason,
          created_at
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .eq(
        "employee_id",
        params.employeeId,
      )
      .order("is_active", {
        ascending: false,
      })
      .order("is_primary", {
        ascending: false,
      })
      .order("starts_on", {
        ascending: false,
      }),
  ]);

  if (locationsResult.error) {
    console.error(
      "Erro ao carregar locais disponíveis:",
      locationsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os locais disponíveis.",
    );
  }

  if (assignmentsResult.error) {
    console.error(
      "Erro ao carregar locais do funcionário:",
      assignmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os locais do funcionário.",
    );
  }

  const activeLocationRows =
    (locationsResult.data as
      | LocationDatabaseRow[]
      | null) ?? [];

  const assignmentRows =
    (assignmentsResult.data as
      | AssignmentDatabaseRow[]
      | null) ?? [];

  const locationsById = new Map<
    string,
    LocationDatabaseRow
  >(
    activeLocationRows.map(
      (location) => [
        location.id,
        location,
      ],
    ),
  );

  const historicalLocationIds =
    Array.from(
      new Set(
        assignmentRows
          .map(
            (assignment) =>
              assignment.work_location_id,
          )
          .filter(
            (locationId) =>
              !locationsById.has(
                locationId,
              ),
          ),
      ),
    );

  if (
    historicalLocationIds.length > 0
  ) {
    const {
      data: historicalLocations,
      error: historicalError,
    } = await supabase
      .from("work_locations")
      .select(
        `
          id,
          name,
          location_type,
          address,
          latitude,
          longitude,
          radius_meters,
          minimum_accuracy_meters,
          outside_radius_action,
          starts_on,
          ends_on,
          is_active
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .in(
        "id",
        historicalLocationIds,
      );

    if (historicalError) {
      console.error(
        "Erro ao carregar locais históricos:",
        historicalError,
      );
    } else {
      for (const location of
        (historicalLocations as
          | LocationDatabaseRow[]
          | null) ?? []) {
        locationsById.set(
          location.id,
          location,
        );
      }
    }
  }

  const assignments =
    assignmentRows.map(
      (assignment) =>
        mapAssignment(
          assignment,
          locationsById,
        ),
    );

  return {
    active: assignments.filter(
      (assignment) =>
        assignment.isActive,
    ),

    history: assignments.filter(
      (assignment) =>
        !assignment.isActive,
    ),

    availableLocations:
      activeLocationRows.map(
        mapLocationOption,
      ),
  };
}