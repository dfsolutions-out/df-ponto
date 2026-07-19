"use client";

import type {
  LatLngExpression,
  PathOptions,
} from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
} from "react-leaflet";

type EmployeeLocationMapProps = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

const radiusPathOptions: PathOptions = {
  color: "#2563eb",
  fillColor: "#3b82f6",
  fillOpacity: 0.2,
  opacity: 1,
  weight: 3,
};

const pointPathOptions: PathOptions = {
  color: "#ffffff",
  fillColor: "#2563eb",
  fillOpacity: 1,
  opacity: 1,
  weight: 3,
};

function getZoom(
  radiusMeters: number,
): number {
  if (radiusMeters <= 50) {
    return 18;
  }

  if (radiusMeters <= 100) {
    return 17;
  }

  if (radiusMeters <= 250) {
    return 16;
  }

  if (radiusMeters <= 500) {
    return 15;
  }

  if (radiusMeters <= 1000) {
    return 14;
  }

  return 13;
}

export function EmployeeLocationMap({
  latitude,
  longitude,
  radiusMeters,
}: EmployeeLocationMapProps) {
  const center: LatLngExpression = [
    latitude,
    longitude,
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <MapContainer
        center={center}
        zoom={getZoom(radiusMeters)}
        scrollWheelZoom={false}
        zoomControl
        attributionControl
        className="z-0 h-[260px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={
            radiusPathOptions
          }
        />

        <CircleMarker
          center={center}
          radius={8}
          pathOptions={
            pointPathOptions
          }
        />
      </MapContainer>
    </div>
  );
}