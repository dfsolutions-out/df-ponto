"use client";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import { registerTimeEntryAction } from "@/actions/time-clock";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  RegisterTimeEntryActionState,
  TimeClockContext,
  TimeEntryPunchType,
} from "@/types/time-entry";

const TimeClockMap = dynamic(
  () =>
    import(
      "@/components/time-clock/TimeClockMap"
    ).then(
      (module) => module.TimeClockMap,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50">
        <Loader2 className="size-6 animate-spin text-blue-400" />
      </div>
    ),
  },
);

const initialState: RegisterTimeEntryActionState = {
  success: false,
  message: null,
  timeEntryId: null,
  fieldErrors: {},
};

type TimeClockPanelProps = {
  context: TimeClockContext;
};

type CurrentPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;

  clientIdempotencyKey: string;
  deviceIdentifier: string;
  userAgent: string;
};

function getPunchLabel(
  type: TimeEntryPunchType,
): string {
  const labels: Record<
    TimeEntryPunchType,
    string
  > = {
    entry: "Entrada",
    break_start: "Saída para intervalo",
    break_end: "Retorno do intervalo",
    exit: "Saída",
    custom: "Marcação adicional",
  };

  return labels[type];
}

function formatTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
    },
  ).format(new Date(value));
}

function calculateDistanceMeters(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const earthRadius = 6371000;

  const toRadians = (
    value: number,
  ): number => (value * Math.PI) / 180;

  const latitudeDelta = toRadians(
    secondLatitude - firstLatitude,
  );

  const longitudeDelta = toRadians(
    secondLongitude - firstLongitude,
  );

  const firstLatitudeRadians =
    toRadians(firstLatitude);

  const secondLatitudeRadians =
    toRadians(secondLatitude);

  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(calculation),
      Math.sqrt(1 - calculation),
    )
  );
}

function getOrCreateDeviceIdentifier(): string {
  const storageKey =
    "df-ponto-device-id";

  const storedIdentifier =
    window.localStorage.getItem(
      storageKey,
    );

  if (storedIdentifier) {
    return storedIdentifier;
  }

  const newIdentifier =
    window.crypto.randomUUID();

  window.localStorage.setItem(
    storageKey,
    newIdentifier,
  );

  return newIdentifier;
}

export function TimeClockPanel({
  context,
}: TimeClockPanelProps) {
  const [state, formAction] =
    useActionState(
      registerTimeEntryAction,
      initialState,
    );

  const [
    currentPosition,
    setCurrentPosition,
  ] = useState<CurrentPosition | null>(
    null,
  );

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    locationError,
    setLocationError,
  ] = useState<string | null>(
    null,
  );

  /*
   * Depois do sucesso, recarregamos a página
   * para buscar a nova sequência da jornada.
   *
   * Este efeito não chama setState.
   */
  useEffect(() => {
    if (!state.success) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        window.location.reload();
      }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.success]);

  const expectedPunch =
    context.expectedPunch;

  const primaryLocation =
    context.currentLocation;

  const distanceMeters =
    useMemo(() => {
      if (
        currentPosition === null ||
        primaryLocation === null ||
        primaryLocation.latitude === null ||
        primaryLocation.longitude === null
      ) {
        return null;
      }

      return calculateDistanceMeters(
        currentPosition.latitude,
        currentPosition.longitude,
        primaryLocation.latitude,
        primaryLocation.longitude,
      );
    }, [
      currentPosition,
      primaryLocation,
    ]);

  const insideRadius =
    distanceMeters !== null &&
    primaryLocation !== null
      ? distanceMeters <=
        primaryLocation.radiusMeters
      : null;

  const accuracyAccepted =
    currentPosition !== null &&
    primaryLocation !== null
      ? currentPosition.accuracyMeters <=
        primaryLocation.minimumAccuracyMeters
      : null;

  const requiresJustification =
    Boolean(
      expectedPunch?.requiresJustification,
    ) ||
    (
      insideRadius === false &&
      primaryLocation
        ?.outsideRadiusAction ===
        "require_justification"
    );

  const outsideRadiusBlocked =
    insideRadius === false &&
    primaryLocation
      ?.outsideRadiusAction ===
      "block";

  function captureLocation(): void {
    setLocationError(null);

    if (
      typeof navigator ===
        "undefined" ||
      !navigator.geolocation
    ) {
      setLocationError(
        "Este navegador não possui suporte à geolocalização.",
      );

      return;
    }

    setLocating(true);

    /*
     * Os identificadores são criados no clique,
     * antes da captura. Eles ficam congelados
     * junto da localização desta tentativa.
     */
    const clientIdempotencyKey =
      window.crypto.randomUUID();

    const deviceIdentifier =
      getOrCreateDeviceIdentifier();

    const userAgent =
      navigator.userAgent;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
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

          accuracyMeters: Number(
            position.coords.accuracy.toFixed(
              2,
            ),
          ),

          capturedAt:
            new Date().toISOString(),

          clientIdempotencyKey,
          deviceIdentifier,
          userAgent,
        });

        setLocating(false);
      },

      (error) => {
        console.error(
          "Erro ao capturar localização:",
          error,
        );

        const message =
          error.code ===
          error.PERMISSION_DENIED
            ? "A permissão de localização foi negada. Libere o acesso nas configurações do navegador."
            : error.code ===
                error.TIMEOUT
              ? "A localização demorou muito para responder. Tente novamente em uma área aberta."
              : "Não foi possível obter sua localização.";

        setLocationError(message);
        setLocating(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  }

  if (!context.employee) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-1 size-6 shrink-0 text-amber-300" />

          <div>
            <h2 className="font-bold text-amber-100">
              Acesso sem vínculo
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-200/70">
              {context.blockReason}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Funcionário
          </p>

          <p className="mt-3 font-bold text-white">
            {context.employee.fullName}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Jornada
          </p>

          <p className="mt-3 font-bold text-white">
            {context.scheduleName ||
              "Sem jornada vigente"}
          </p>

          {context.dayLabel ? (
            <p className="mt-1 text-xs text-slate-500">
              {context.dayLabel}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Local principal
          </p>

          <p className="mt-3 font-bold text-white">
            {primaryLocation?.name ||
              "Sem local vigente"}
          </p>

          {primaryLocation ? (
            <p className="mt-1 text-xs text-slate-500">
              Raio de{" "}
              {primaryLocation.radiusMeters}{" "}
              metros
            </p>
          ) : null}
        </article>
      </section>

      {!context.canRegister ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-300" />

            <div>
              <p className="font-semibold text-red-200">
                Registro indisponível
              </p>

              <p className="mt-1 text-sm leading-6 text-red-200/70">
                {context.blockReason}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Próxima marcação
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white">
              {expectedPunch?.label ||
                "Registrar ponto"}
            </h2>

            {expectedPunch?.expectedTime ? (
              <p className="mt-2 text-sm text-slate-500">
                Horário esperado:{" "}
                {expectedPunch.expectedTime}
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-300">
                Marcação fora da sequência
                prevista. Será necessária uma
                justificativa.
              </p>
            )}
          </div>

          <div className="flex size-24 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
            <Clock3 className="size-10 text-blue-400" />
          </div>
        </div>

        <div className="mt-7">
          <button
            type="button"
            onClick={captureLocation}
            disabled={
              locating ||
              !context.canRegister ||
              state.success
            }
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {locating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Localizando...
              </>
            ) : (
              <>
                <LocateFixed className="size-4" />
                {currentPosition
                  ? "Atualizar minha localização"
                  : "Capturar minha localização"}
              </>
            )}
          </button>
        </div>

        {locationError ? (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {locationError}
          </div>
        ) : null}

        {currentPosition ? (
          <div className="mt-6 space-y-5">
            <TimeClockMap
              currentLatitude={
                currentPosition.latitude
              }
              currentLongitude={
                currentPosition.longitude
              }
              locationLatitude={
                primaryLocation?.latitude ??
                null
              }
              locationLongitude={
                primaryLocation?.longitude ??
                null
              }
              radiusMeters={
                primaryLocation?.radiusMeters ??
                null
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2">
                  <Crosshair className="size-4 text-blue-400" />

                  <p className="text-xs font-semibold text-slate-300">
                    Precisão do GPS
                  </p>
                </div>

                <p className="mt-3 text-xl font-bold text-white">
                  {Math.round(
                    currentPosition.accuracyMeters,
                  )}{" "}
                  m
                </p>

                <p
                  className={[
                    "mt-1 text-xs",
                    accuracyAccepted === false
                      ? "text-red-400"
                      : "text-emerald-400",
                  ].join(" ")}
                >
                  {accuracyAccepted === false
                    ? "Precisão insuficiente"
                    : "Precisão aceita"}
                </p>
              </article>

              <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-blue-400" />

                  <p className="text-xs font-semibold text-slate-300">
                    Distância
                  </p>
                </div>

                <p className="mt-3 text-xl font-bold text-white">
                  {distanceMeters !== null
                    ? `${Math.round(
                        distanceMeters,
                      )} m`
                    : "Livre"}
                </p>

                <p
                  className={[
                    "mt-1 text-xs",
                    insideRadius === false
                      ? "text-amber-400"
                      : "text-emerald-400",
                  ].join(" ")}
                >
                  {insideRadius === false
                    ? "Fora do raio"
                    : insideRadius === true
                      ? "Dentro do raio"
                      : "Sem limite fixo"}
                </p>
              </article>

              <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-blue-400" />

                  <p className="text-xs font-semibold text-slate-300">
                    Local
                  </p>
                </div>

                <p className="mt-3 font-bold text-white">
                  {primaryLocation?.name ||
                    "Local autorizado"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Capturado às{" "}
                  {formatTime(
                    currentPosition.capturedAt,
                  )}
                </p>
              </article>
            </div>

            {insideRadius === false ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" />

                  <div>
                    <p className="font-semibold text-amber-200">
                      Fora do raio autorizado
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-200/70">
                      A regra configurada para
                      este local será aplicada
                      ao tentar registrar.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {outsideRadiusBlocked ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                A marcação está bloqueada porque
                você está fora do raio autorizado.
              </div>
            ) : null}

            <form
              action={formAction}
              className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5"
            >
              <input
                type="hidden"
                name="companyId"
                value={context.companyId}
              />

              <input
                type="hidden"
                name="employeeId"
                value={context.employee.id}
              />

              <input
                type="hidden"
                name="latitude"
                value={currentPosition.latitude}
              />

              <input
                type="hidden"
                name="longitude"
                value={currentPosition.longitude}
              />

              <input
                type="hidden"
                name="accuracyMeters"
                value={
                  currentPosition.accuracyMeters
                }
              />

              <input
                type="hidden"
                name="clientIdempotencyKey"
                value={
                  currentPosition.clientIdempotencyKey
                }
              />

              <input
                type="hidden"
                name="clientRecordedAt"
                value={
                  currentPosition.capturedAt
                }
              />

              <input
                type="hidden"
                name="source"
                value="web"
              />

              <input
                type="hidden"
                name="deviceIdentifier"
                value={
                  currentPosition.deviceIdentifier
                }
              />

              <input
                type="hidden"
                name="userAgent"
                value={
                  currentPosition.userAgent
                }
              />

              {requiresJustification ||
              insideRadius === false ? (
                <div>
                  <label
                    htmlFor="time-entry-justification"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Justificativa{" "}
                    {requiresJustification
                      ? ""
                      : "(opcional)"}
                  </label>

                  <textarea
                    id="time-entry-justification"
                    name="justification"
                    required={
                      requiresJustification
                    }
                    minLength={
                      requiresJustification
                        ? 5
                        : undefined
                    }
                    maxLength={1000}
                    rows={4}
                    placeholder="Explique o motivo desta marcação."
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {state.fieldErrors
                    .justification?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        state.fieldErrors
                          .justification[0]
                      }
                    </p>
                  ) : null}
                </div>
              ) : (
                <input
                  type="hidden"
                  name="justification"
                  value=""
                />
              )}

              {state.message ? (
                <div
                  role="status"
                  className={[
                    "mt-5 rounded-xl border px-4 py-3 text-sm",
                    state.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-200",
                  ].join(" ")}
                >
                  {state.message}
                </div>
              ) : null}

              <div className="mt-5">
                <SubmitButton
                  idleText={`Registrar ${
                    expectedPunch
                      ? getPunchLabel(
                          expectedPunch.punchType,
                        )
                      : "ponto"
                  }`}
                  pendingText="Registrando ponto..."
                  disabled={
                    accuracyAccepted === false ||
                    outsideRadiusBlocked ||
                    !context.canRegister ||
                    state.success
                  }
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-base font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center">
            <LocateFixed className="mx-auto size-8 text-slate-600" />

            <p className="mt-4 font-semibold text-slate-300">
              Localização ainda não capturada
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Capture sua localização para
              verificar precisão, distância e
              raio antes de registrar.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Clock3 className="size-5 text-blue-400" />

          <h2 className="font-bold text-white">
            Marcações de hoje
          </h2>
        </div>

        {context.entriesToday.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            Nenhuma marcação foi registrada
            hoje.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {context.entriesToday.map(
              (entry) => (
                <article
                  key={entry.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={[
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        entry.requiresReview
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-emerald-500/10 text-emerald-300",
                      ].join(" ")}
                    >
                      {entry.requiresReview ? (
                        <AlertTriangle className="size-5" />
                      ) : (
                        <CheckCircle2 className="size-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {getPunchLabel(
                          entry.punchType,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {entry.locationName ||
                          "Local não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-lg font-bold text-white">
                      {formatTime(
                        entry.recordedAt,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {entry.distanceMeters !== null
                        ? `${Math.round(
                            entry.distanceMeters,
                          )} m do local`
                        : "Localização livre"}
                    </p>

                    {entry.requiresReview ? (
                      <p className="mt-1 text-xs font-semibold text-amber-400">
                        Requer análise
                      </p>
                    ) : null}
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}