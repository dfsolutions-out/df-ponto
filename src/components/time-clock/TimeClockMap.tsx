"use client";

import type {
  LatLngBoundsExpression,
  PathOptions,
} from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
} from "react-leaflet";

type TimeClockMapProps = {
  currentLatitude: number;
  currentLongitude: number;

  locationLatitude: number | null;
  locationLongitude: number | null;

  radiusMeters: number | null;
};

const currentPointOptions: PathOptions = {
  color: "#ffffff",
  fillColor: "#22c55e",
  fillOpacity: 1,
  weight: 3,
};

const locationPointOptions: PathOptions = {
  color: "#ffffff",
  fillColor: "#2563eb",
  fillOpacity: 1,
  weight: 3,
};

const radiusOptions: PathOptions = {
  color: "#2563eb",
  fillColor: "#3b82f6",
  fillOpacity: 0.18,
  weight: 3,
};

const connectionOptions: PathOptions = {
  color: "#f59e0b",
  dashArray: "8 8",
  weight: 3,
};

export function TimeClockMap({
  currentLatitude,
  currentLongitude,
  locationLatitude,
  locationLongitude,
  radiusMeters,
}: TimeClockMapProps) {
  const hasLocation =
    locationLatitude !== null &&
    locationLongitude !== null;

  const bounds:
    LatLngBoundsExpression =
      hasLocation
        ? [
            [
              currentLatitude,
              currentLongitude,
            ],
            [
              locationLatitude,
              locationLongitude,
            ],
          ]
        : [
            [
              currentLatitude -
                0.003,
              currentLongitude -
                0.003,
            ],
            [
              currentLatitude +
                0.003,
              currentLongitude +
                0.003,
            ],
          ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <MapContainer
        bounds={bounds}
        boundsOptions={{
          padding: [45, 45],
        }}
        scrollWheelZoom
        zoomControl
        attributionControl
        className="z-0 h-[380px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker
          center={[
            currentLatitude,
            currentLongitude,
          ]}
          radius={9}
          pathOptions={
            currentPointOptions
          }
        />

        {hasLocation ? (
          <>
            {radiusMeters !== null ? (
              <Circle
                center={[
                  locationLatitude,
                  locationLongitude,
                ]}
                radius={radiusMeters}
                pathOptions={
                  radiusOptions
                }
              />
            ) : null}

            <CircleMarker
              center={[
                locationLatitude,
                locationLongitude,
              ]}
              radius={9}
              pathOptions={
                locationPointOptions
              }
            />

            <Polyline
              positions={[
                [
                  currentLatitude,
                  currentLongitude,
                ],
                [
                  locationLatitude,
                  locationLongitude,
                ],
              ]}
              pathOptions={
                connectionOptions
              }
            />
          </>
        ) : null}
      </MapContainer>

      <div className="grid gap-3 border-t border-slate-800 bg-slate-950/70 px-4 py-4 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-500" />

          <span className="text-slate-400">
            Sua localização atual
          </span>
        </div>

        {hasLocation ? (
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-blue-600" />

            <span className="text-slate-400">
              Centro do local autorizado
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}