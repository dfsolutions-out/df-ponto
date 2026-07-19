"use client";

import type {
  LatLngExpression,
  PathOptions,
} from "leaflet";
import {
  Crosshair,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type MapCoordinates = {
  latitude: number;
  longitude: number;
};

type WorkLocationMapSelectorProps = {
  name: string;

  latitude: number | null;
  longitude: number | null;

  searchLatitude: number | null;
  searchLongitude: number | null;

  radiusMeters: number;

  onLocationSelect: (
    coordinates: MapCoordinates,
  ) => void;
};

type MapEventsProps = {
  onLocationSelect: (
    coordinates: MapCoordinates,
  ) => void;
};

type MapControllerProps = {
  selectedLatitude: number | null;
  selectedLongitude: number | null;

  searchLatitude: number | null;
  searchLongitude: number | null;

  radiusMeters: number;
};

const brazilCenter: LatLngExpression = [
  -14.235,
  -51.9253,
];

const radiusPathOptions: PathOptions = {
  color: "#2563eb",
  fillColor: "#3b82f6",
  fillOpacity: 0.2,
  opacity: 1,
  weight: 3,
};

const approximatePathOptions: PathOptions = {
  color: "#f59e0b",
  fillColor: "#f59e0b",
  fillOpacity: 0.9,
  opacity: 1,
  weight: 3,
};

const selectedPointPathOptions: PathOptions = {
  color: "#ffffff",
  fillColor: "#2563eb",
  fillOpacity: 1,
  opacity: 1,
  weight: 3,
};

function getZoomByRadius(
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

  if (radiusMeters <= 2500) {
    return 13;
  }

  if (radiusMeters <= 5000) {
    return 12;
  }

  if (radiusMeters <= 10000) {
    return 11;
  }

  return 10;
}

function MapEvents({
  onLocationSelect,
}: MapEventsProps) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        latitude: Number(
          event.latlng.lat.toFixed(7),
        ),

        longitude: Number(
          event.latlng.lng.toFixed(7),
        ),
      });
    },
  });

  return null;
}

function MapController({
  selectedLatitude,
  selectedLongitude,
  searchLatitude,
  searchLongitude,
  radiusMeters,
}: MapControllerProps) {
  const map = useMap();

  const hasSelectedLocation =
    selectedLatitude !== null &&
    selectedLongitude !== null;

  const hasSearchedLocation =
    searchLatitude !== null &&
    searchLongitude !== null;

  function centerOnSelection(): void {
    if (!hasSelectedLocation) {
      return;
    }

    map.flyTo(
      [
        selectedLatitude,
        selectedLongitude,
      ],
      getZoomByRadius(radiusMeters),
      {
        animate: true,
        duration: 0.8,
      },
    );
  }

  function centerOnSearch(): void {
    if (!hasSearchedLocation) {
      return;
    }

    map.flyTo(
      [
        searchLatitude,
        searchLongitude,
      ],
      16,
      {
        animate: true,
        duration: 0.8,
      },
    );
  }

  return (
    <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
      {hasSelectedLocation ? (
        <button
          type="button"
          onClick={centerOnSelection}
          className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/95 text-blue-300 shadow-xl backdrop-blur transition hover:bg-slate-800"
          aria-label="Centralizar no local selecionado"
          title="Centralizar no local selecionado"
        >
          <Crosshair className="size-4" />
        </button>
      ) : null}

      {hasSearchedLocation ? (
        <button
          type="button"
          onClick={centerOnSearch}
          className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/95 text-amber-300 shadow-xl backdrop-blur transition hover:bg-slate-800"
          aria-label="Voltar para a região pesquisada"
          title="Voltar para a região pesquisada"
        >
          <Navigation className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function WorkLocationMapSelector({
  name,
  latitude,
  longitude,
  searchLatitude,
  searchLongitude,
  radiusMeters,
  onLocationSelect,
}: WorkLocationMapSelectorProps) {
  const [
    locatingUser,
    setLocatingUser,
  ] = useState(false);

  const [
    locationError,
    setLocationError,
  ] = useState<string | null>(null);

  const safeRadius = Math.max(
    1,
    radiusMeters,
  );

  const hasSelectedLocation =
    latitude !== null &&
    longitude !== null;

  const hasSearchedLocation =
    searchLatitude !== null &&
    searchLongitude !== null;

  const initialCenter =
    useMemo<LatLngExpression>(() => {
      if (hasSelectedLocation) {
        return [
          latitude,
          longitude,
        ];
      }

      if (hasSearchedLocation) {
        return [
          searchLatitude,
          searchLongitude,
        ];
      }

      return brazilCenter;
    }, [
      hasSelectedLocation,
      hasSearchedLocation,
      latitude,
      longitude,
      searchLatitude,
      searchLongitude,
    ]);

  const initialZoom =
    hasSelectedLocation
      ? getZoomByRadius(safeRadius)
      : hasSearchedLocation
        ? 16
        : 4;

  function useCurrentLocation(): void {
    setLocationError(null);

    if (
      typeof navigator ===
        "undefined" ||
      !navigator.geolocation
    ) {
      setLocationError(
        "Este navegador não oferece suporte à localização.",
      );

      return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect({
          latitude: Number(
            position.coords.latitude.toFixed(
              7,
            ),
          ),

          longitude: Number(
            position.coords.longitude.toFixed(
              7,
            ),
          ),
        });

        setLocatingUser(false);
      },

      (error) => {
        console.error(
          "Erro ao obter localização:",
          error,
        );

        setLocationError(
          "Não foi possível obter sua localização. Verifique a permissão de GPS do navegador.",
        );

        setLocatingUser(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-blue-400" />

            <h3 className="text-sm font-bold text-white">
              Selecione o ponto exato
            </h3>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Navegue pelo mapa e clique no imóvel ou na área onde o registro será autorizado.
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locatingUser}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LocateFixed className="size-4" />

          {locatingUser
            ? "Localizando..."
            : "Usar minha localização"}
        </button>
      </div>

      {locationError ? (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {locationError}
        </div>
      ) : null}

      <div className="relative">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          scrollWheelZoom
          zoomControl
          attributionControl
          className="z-0 h-[460px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEvents
            onLocationSelect={
              onLocationSelect
            }
          />

          {hasSearchedLocation &&
          !hasSelectedLocation ? (
            <CircleMarker
              center={[
                searchLatitude,
                searchLongitude,
              ]}
              radius={9}
              pathOptions={
                approximatePathOptions
              }
            />
          ) : null}

          {hasSelectedLocation ? (
            <>
              <Circle
                center={[
                  latitude,
                  longitude,
                ]}
                radius={safeRadius}
                pathOptions={
                  radiusPathOptions
                }
              />

              <CircleMarker
                center={[
                  latitude,
                  longitude,
                ]}
                radius={9}
                pathOptions={
                  selectedPointPathOptions
                }
              />
            </>
          ) : null}

          <MapController
            selectedLatitude={latitude}
            selectedLongitude={longitude}
            searchLatitude={
              searchLatitude
            }
            searchLongitude={
              searchLongitude
            }
            radiusMeters={safeRadius}
          />
        </MapContainer>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[400] rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 shadow-xl backdrop-blur sm:left-1/2 sm:right-auto sm:w-[520px] sm:-translate-x-1/2">
          {hasSelectedLocation ? (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                <Crosshair className="size-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Local selecionado
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {name || "Novo local"} —{" "}
                  {latitude.toFixed(7)},{" "}
                  {longitude.toFixed(7)}
                </p>

                <p className="mt-1 text-[11px] text-blue-300">
                  Raio autorizado:{" "}
                  {safeRadius} metros
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <MapPin className="size-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Clique no mapa
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  O mapa pode ser movido e ampliado livremente. Clique no ponto exato para definir latitude, longitude e o centro do raio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-800 px-4 py-4 text-xs sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-300">
            Ponto escolhido
          </p>

          <p className="mt-1 text-slate-500">
            {hasSelectedLocation
              ? "Confirmado no mapa"
              : "Aguardando seleção"}
          </p>
        </div>

        <div>
          <p className="font-semibold text-slate-300">
            Coordenadas
          </p>

          <p className="mt-1 text-slate-500">
            {hasSelectedLocation
              ? `${latitude.toFixed(
                  7,
                )}, ${longitude.toFixed(
                  7,
                )}`
              : "Não definidas"}
          </p>
        </div>

        <div>
          <p className="font-semibold text-slate-300">
            Área autorizada
          </p>

          <p className="mt-1 text-slate-500">
            Raio de {safeRadius} metros
          </p>
        </div>
      </div>
    </div>
  );
}