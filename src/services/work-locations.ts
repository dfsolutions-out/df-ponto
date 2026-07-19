import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  OutsideRadiusAction,
  WorkLocation,
  WorkLocationType,
} from "@/types/work-location";

type WorkLocationDatabaseRow = {
  id: string;
  company_id: string;

  name: string;
  description: string | null;

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

  notes: string | null;

  created_at: string;
  updated_at: string;
};

function mapNullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function mapWorkLocation(
  row: WorkLocationDatabaseRow,
): WorkLocation {
  return {
    id: row.id,
    companyId: row.company_id,

    name: row.name,
    description: row.description,

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

    isActive: row.is_active,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeSearch(
  value?: string,
): string {
  return (
    value
      ?.trim()
      .replace(/[,%()]/g, "") ?? ""
  );
}

export async function getWorkLocations(params: {
  companyId: string;
  search?: string;
  status?:
    | "all"
    | "active"
    | "inactive";
  locationType?:
    | "all"
    | WorkLocationType;
}): Promise<WorkLocation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("work_locations")
    .select(
      `
        id,
        company_id,
        name,
        description,
        location_type,
        address,
        latitude,
        longitude,
        radius_meters,
        minimum_accuracy_meters,
        outside_radius_action,
        starts_on,
        ends_on,
        is_active,
        notes,
        created_at,
        updated_at
      `,
    )
    .eq(
      "company_id",
      params.companyId,
    )
    .order("is_active", {
      ascending: false,
    })
    .order("name");

  const search =
    sanitizeSearch(params.search);

  if (search) {
    query = query.or(
      [
        `name.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `address.ilike.%${search}%`,
      ].join(","),
    );
  }

  if (params.status === "active") {
    query = query.eq(
      "is_active",
      true,
    );
  }

  if (params.status === "inactive") {
    query = query.eq(
      "is_active",
      false,
    );
  }

  if (
    params.locationType &&
    params.locationType !== "all"
  ) {
    query = query.eq(
      "location_type",
      params.locationType,
    );
  }

  const { data, error } =
    await query;

  if (error) {
    console.error(
      "Erro ao listar locais:",
      error,
    );

    throw new Error(
      "Não foi possível carregar os locais.",
    );
  }

  return (
    (data as
      | WorkLocationDatabaseRow[]
      | null) ?? []
  ).map(mapWorkLocation);
}

export async function getWorkLocationById(
  params: {
    companyId: string;
    locationId: string;
  },
): Promise<WorkLocation | null> {
  const supabase = await createClient();

  const { data, error } =
    await supabase
      .from("work_locations")
      .select(
        `
          id,
          company_id,
          name,
          description,
          location_type,
          address,
          latitude,
          longitude,
          radius_meters,
          minimum_accuracy_meters,
          outside_radius_action,
          starts_on,
          ends_on,
          is_active,
          notes,
          created_at,
          updated_at
        `,
      )
      .eq(
        "company_id",
        params.companyId,
      )
      .eq("id", params.locationId)
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar local:",
      error,
    );

    throw new Error(
      "Não foi possível carregar o local.",
    );
  }

  return data
    ? mapWorkLocation(
        data as WorkLocationDatabaseRow,
      )
    : null;
}

export async function getWorkLocationCounts(
  companyId: string,
): Promise<{
  total: number;
  active: number;
  inactive: number;
  temporary: number;
  external: number;
}> {
  const supabase = await createClient();

  const [
    total,
    active,
    inactive,
    temporary,
    external,
  ] = await Promise.all([
    supabase
      .from("work_locations")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId),

    supabase
      .from("work_locations")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", true),

    supabase
      .from("work_locations")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq("is_active", false),

    supabase
      .from("work_locations")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .eq(
        "location_type",
        "temporary",
      )
      .eq("is_active", true),

    supabase
      .from("work_locations")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", companyId)
      .in("location_type", [
        "external",
        "route",
        "free",
      ])
      .eq("is_active", true),
  ]);

  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    inactive: inactive.count ?? 0,
    temporary:
      temporary.count ?? 0,
    external:
      external.count ?? 0,
  };
}