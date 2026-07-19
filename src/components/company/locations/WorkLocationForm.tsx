"use client";

import dynamic from "next/dynamic";
import {
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  WorkLocation,
  WorkLocationActionState,
  WorkLocationType,
} from "@/types/work-location";

const WorkLocationMapSelector = dynamic(
  () =>
    import(
      "@/components/company/locations/WorkLocationMapSelector"
    ).then(
      (module) =>
        module.WorkLocationMapSelector,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-5 py-16 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-blue-400" />

        <p className="mt-3 text-sm text-slate-500">
          Carregando mapa...
        </p>
      </div>
    ),
  },
);

const initialState: WorkLocationActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type WorkLocationFormProps = {
  action: (
    previousState: WorkLocationActionState,
    formData: FormData,
  ) => Promise<WorkLocationActionState>;

  location?: WorkLocation;

  cancelHref: string;
};

type CepFeedback = {
  type: "success" | "warning" | "error";
  message: string;
} | null;

type GeocodeApiResponse = {
  success: boolean;
  message: string;

  address?: {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    number: string;
    complement: string;
    formattedAddress: string;
  };

  location?: {
    latitude: number | null;
    longitude: number | null;

    precision:
      | "exact"
      | "street"
      | "cep"
      | "city"
      | "none";

    displayName: string | null;
  };
};

function requiresCoordinates(
  type: WorkLocationType,
): boolean {
  return (
    type === "fixed" ||
    type === "temporary"
  );
}

function getTypeDescription(
  type: WorkLocationType,
): string {
  if (type === "fixed") {
    return "Local com endereço e raio definidos, como escritório, loja ou base operacional.";
  }

  if (type === "temporary") {
    return "Local válido somente durante um período específico.";
  }

  if (type === "external") {
    return "Funcionário pode trabalhar externamente, sem endereço fixo.";
  }

  if (type === "route") {
    return "Usado para motoristas, técnicos e equipes que trabalham em deslocamento.";
  }

  return "Permite registro em qualquer localização, seguindo a regra configurada.";
}

function formatCep(value: string): string {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(
    0,
    5,
  )}-${digits.slice(5)}`;
}

function parseCoordinate(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(
    value.replace(",", "."),
  );

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function buildCompleteAddress(params: {
  baseAddress: string;
  number: string;
  complement: string;
}): string {
  const parts = [
    params.baseAddress.trim(),

    params.number.trim()
      ? `Número ${params.number.trim()}`
      : "",

    params.complement.trim(),
  ].filter(Boolean);

  return parts.join(" - ");
}

function getFeedbackClasses(
  type: "success" | "warning" | "error",
): string {
  if (type === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (type === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  return "border-red-500/30 bg-red-500/10 text-red-200";
}

export function WorkLocationForm({
  action,
  location,
  cancelHref,
}: WorkLocationFormProps) {
  const [state, formAction] =
    useActionState(
      action,
      initialState,
    );

  const [locationName, setLocationName] =
    useState(location?.name ?? "");

  const [locationType, setLocationType] =
    useState<WorkLocationType>(
      location?.locationType ??
        "fixed",
    );

  const [cep, setCep] = useState("");

  const [number, setNumber] =
    useState("");

  const [complement, setComplement] =
    useState("");

  const [baseAddress, setBaseAddress] =
    useState(
      location?.address ?? "",
    );

  const [
    searchingAddress,
    setSearchingAddress,
  ] = useState(false);

  const [
    cepFeedback,
    setCepFeedback,
  ] = useState<CepFeedback>(null);

  const [latitude, setLatitude] =
    useState(
      location?.latitude !== null &&
        location?.latitude !==
          undefined
        ? String(location.latitude)
        : "",
    );

  const [longitude, setLongitude] =
    useState(
      location?.longitude !== null &&
        location?.longitude !==
          undefined
        ? String(location.longitude)
        : "",
    );

  const [
    searchLatitude,
    setSearchLatitude,
  ] = useState<number | null>(
    location?.latitude ?? null,
  );

  const [
    searchLongitude,
    setSearchLongitude,
  ] = useState<number | null>(
    location?.longitude ?? null,
  );

  const [
    radiusMeters,
    setRadiusMeters,
  ] = useState(
    String(
      location?.radiusMeters ?? 50,
    ),
  );

  const showCoordinates =
    requiresCoordinates(locationType);

  const isTemporary =
    locationType === "temporary";

  const isEditing =
    Boolean(location);

  const latitudeNumber = useMemo(
    () => parseCoordinate(latitude),
    [latitude],
  );

  const longitudeNumber = useMemo(
    () => parseCoordinate(longitude),
    [longitude],
  );

  const radiusNumber = useMemo(() => {
    const parsedValue = Number(
      radiusMeters,
    );

    if (
      !Number.isFinite(parsedValue) ||
      parsedValue <= 0
    ) {
      return 50;
    }

    return parsedValue;
  }, [radiusMeters]);

  const completeAddress = useMemo(
    () =>
      buildCompleteAddress({
        baseAddress,
        number,
        complement,
      }),
    [
      baseAddress,
      complement,
      number,
    ],
  );

  async function handleSearchAddress(): Promise<void> {
    const cleanCep = cep.replace(
      /\D/g,
      "",
    );

    if (cleanCep.length !== 8) {
      setCepFeedback({
        type: "error",
        message:
          "Informe um CEP válido com 8 dígitos.",
      });

      return;
    }

    try {
      setSearchingAddress(true);
      setCepFeedback(null);

      const query = new URLSearchParams({
        cep: cleanCep,
        number: number.trim(),
        complement:
          complement.trim(),
      });

      const response = await fetch(
        `/api/geocode/cep?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as GeocodeApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Não foi possível consultar o endereço.",
        );
      }

      if (data.address) {
        setCep(
          data.address.cep,
        );

        setBaseAddress(
          [
            data.address.street,
            data.address.neighborhood,
            data.address.city,
            data.address.state,
            data.address.cep
              ? `CEP ${data.address.cep}`
              : "",
          ]
            .filter(Boolean)
            .join(" - "),
        );
      }

      const foundLatitude =
        data.location?.latitude ??
        null;

      const foundLongitude =
        data.location?.longitude ??
        null;

      setSearchLatitude(
        foundLatitude,
      );

      setSearchLongitude(
        foundLongitude,
      );

      /*
       * A localização retornada é usada
       * somente para centralizar o mapa.
       *
       * O usuário ainda precisa clicar no
       * ponto exato para confirmar o local.
       */
      if (
        location === undefined ||
        latitudeNumber === null ||
        longitudeNumber === null
      ) {
        setLatitude("");
        setLongitude("");
      }

      setCepFeedback({
        type:
          data.location?.precision ===
          "exact"
            ? "success"
            : "warning",

        message: data.message,
      });
    } catch (error) {
      setCepFeedback({
        type: "error",

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível buscar o endereço.",
      });
    } finally {
      setSearchingAddress(false);
    }
  }

  function handleMapLocationSelect(
    coordinates: {
      latitude: number;
      longitude: number;
    },
  ): void {
    setLatitude(
      coordinates.latitude.toFixed(7),
    );

    setLongitude(
      coordinates.longitude.toFixed(7),
    );

    setCepFeedback({
      type: "success",
      message:
        "Ponto selecionado no mapa. Latitude e longitude foram preenchidas automaticamente.",
    });
  }

  return (
    <form
      action={formAction}
      className="space-y-7"
    >
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <section>
        <div className="mb-5">
          <h2 className="font-bold text-white">
            Identificação
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Defina o nome e a finalidade
            deste local.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-slate-200"
            >
              Nome do local
            </label>

            <input
              id="name"
              name="name"
              value={locationName}
              onChange={(event) =>
                setLocationName(
                  event.target.value,
                )
              }
              required
              minLength={2}
              maxLength={120}
              autoFocus
              placeholder="Ex.: Escritório principal"
              aria-invalid={Boolean(
                state.fieldErrors.name?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors
              .name?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .name[0]
                }
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="locationType"
              className="text-sm font-semibold text-slate-200"
            >
              Tipo de local
            </label>

            <select
              id="locationType"
              name="locationType"
              value={locationType}
              onChange={(event) => {
                const nextType =
                  event.target
                    .value as WorkLocationType;

                setLocationType(
                  nextType,
                );

                setCepFeedback(null);
              }}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="fixed">
                Local fixo
              </option>

              <option value="temporary">
                Local temporário
              </option>

              <option value="external">
                Trabalho externo
              </option>

              <option value="route">
                Trabalho em rota
              </option>

              <option value="free">
                Registro livre
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {getTypeDescription(
                locationType,
              )}
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-slate-200"
            >
              Descrição{" "}
              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <textarea
              id="description"
              name="description"
              defaultValue={
                location?.description ??
                ""
              }
              maxLength={1000}
              rows={3}
              placeholder="Descreva a finalidade ou a operação deste local."
              aria-invalid={Boolean(
                state.fieldErrors
                  .description?.[0],
              )}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors
              .description?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .description[0]
                }
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {showCoordinates ? (
        <section className="border-t border-slate-800 pt-7">
          <div className="mb-5 flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-blue-400" />

            <div>
              <h2 className="font-bold text-white">
                Endereço e localização
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Preencha o CEP, número e
                complemento. Depois confirme
                o ponto exato diretamente no
                mapa.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[190px_130px_1fr_auto] xl:items-end">
              <div>
                <label
                  htmlFor="cep-helper"
                  className="text-sm font-semibold text-blue-100"
                >
                  CEP
                </label>

                <input
                  id="cep-helper"
                  type="text"
                  inputMode="numeric"
                  value={cep}
                  onChange={(event) => {
                    setCep(
                      formatCep(
                        event.target
                          .value,
                      ),
                    );

                    setCepFeedback(
                      null,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      void handleSearchAddress();
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  className="mt-2 h-12 w-full rounded-xl border border-blue-400/20 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="address-number"
                  className="text-sm font-semibold text-blue-100"
                >
                  Número
                </label>

                <input
                  id="address-number"
                  type="text"
                  inputMode="numeric"
                  value={number}
                  onChange={(event) => {
                    setNumber(
                      event.target.value.slice(
                        0,
                        30,
                      ),
                    );

                    setCepFeedback(
                      null,
                    );
                  }}
                  placeholder="Ex.: 123"
                  maxLength={30}
                  className="mt-2 h-12 w-full rounded-xl border border-blue-400/20 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="address-complement"
                  className="text-sm font-semibold text-blue-100"
                >
                  Complemento
                </label>

                <input
                  id="address-complement"
                  type="text"
                  value={complement}
                  onChange={(event) => {
                    setComplement(
                      event.target.value.slice(
                        0,
                        120,
                      ),
                    );

                    setCepFeedback(
                      null,
                    );
                  }}
                  placeholder="Ex.: Sala 201, bloco B"
                  maxLength={120}
                  className="mt-2 h-12 w-full rounded-xl border border-blue-400/20 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSearchAddress()
                }
                disabled={
                  searchingAddress
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchingAddress ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <LocateFixed className="size-4" />
                    Localizar endereço
                  </>
                )}
              </button>
            </div>

            {cepFeedback ? (
              <div
                role="status"
                className={[
                  "mt-4 rounded-xl border px-4 py-3 text-sm",
                  getFeedbackClasses(
                    cepFeedback.type,
                  ),
                ].join(" ")}
              >
                {
                  cepFeedback.message
                }
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-blue-100/75">
                A busca centraliza o mapa
                na melhor região encontrada.
                O ponto definitivo é
                confirmado clicando no mapa.
              </p>
            )}
          </div>

          <div className="mt-5">
            <label
              htmlFor="base-address"
              className="text-sm font-semibold text-slate-200"
            >
              Endereço encontrado
            </label>

            <textarea
              id="base-address"
              value={baseAddress}
              onChange={(event) =>
                setBaseAddress(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={500}
              placeholder="O endereço encontrado será exibido aqui. Você também pode corrigi-lo manualmente."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              O endereço pode ser corrigido
              manualmente antes de salvar.
            </p>
          </div>

          <input
            type="hidden"
            name="address"
            value={completeAddress}
          />

          <div className="mt-5">
            <WorkLocationMapSelector
              name={
                locationName ||
                "Novo local"
              }
              latitude={
                latitudeNumber
              }
              longitude={
                longitudeNumber
              }
              searchLatitude={
                searchLatitude
              }
              searchLongitude={
                searchLongitude
              }
              radiusMeters={
                radiusNumber
              }
              onLocationSelect={
                handleMapLocationSelect
              }
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="latitude"
                className="text-sm font-semibold text-slate-200"
              >
                Latitude selecionada
              </label>

              <input
                id="latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                required
                value={latitude}
                onChange={(event) =>
                  setLatitude(
                    event.target.value,
                  )
                }
                placeholder="Selecione no mapa"
                aria-invalid={Boolean(
                  state.fieldErrors
                    .latitude?.[0],
                )}
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {state.fieldErrors
                .latitude?.[0] ? (
                <p className="mt-2 text-sm text-red-400">
                  {
                    state.fieldErrors
                      .latitude[0]
                  }
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="text-sm font-semibold text-slate-200"
              >
                Longitude selecionada
              </label>

              <input
                id="longitude"
                name="longitude"
                type="text"
                inputMode="decimal"
                required
                value={longitude}
                onChange={(event) =>
                  setLongitude(
                    event.target.value,
                  )
                }
                placeholder="Selecione no mapa"
                aria-invalid={Boolean(
                  state.fieldErrors
                    .longitude?.[0],
                )}
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {state.fieldErrors
                .longitude?.[0] ? (
                <p className="mt-2 text-sm text-red-400">
                  {
                    state.fieldErrors
                      .longitude[0]
                  }
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <>
          <input
            type="hidden"
            name="address"
            value=""
          />

          <input
            type="hidden"
            name="latitude"
            value=""
          />

          <input
            type="hidden"
            name="longitude"
            value=""
          />
        </>
      )}

      <section className="border-t border-slate-800 pt-7">
        <div className="mb-5 flex items-start gap-3">
          <Navigation className="mt-0.5 size-5 shrink-0 text-blue-400" />

          <div>
            <h2 className="font-bold text-white">
              Regras de geolocalização
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure o raio, a
              precisão mínima e o
              comportamento fora da área.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="radiusMeters"
              className="text-sm font-semibold text-slate-200"
            >
              Raio permitido
            </label>

            <div className="relative mt-2">
              <input
                id="radiusMeters"
                name="radiusMeters"
                type="number"
                min={30}
                max={50000}
                value={radiusMeters}
                onChange={(event) =>
                  setRadiusMeters(
                    event.target.value,
                  )
                }
                required
                aria-invalid={Boolean(
                  state.fieldErrors
                    .radiusMeters?.[0],
                )}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-20 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                metros
              </span>
            </div>

            {state.fieldErrors
              .radiusMeters?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .radiusMeters[0]
                }
              </p>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">
              O círculo do mapa muda
              automaticamente conforme o
              valor informado.
            </p>
          </div>

          <div>
            <label
              htmlFor="minimumAccuracyMeters"
              className="text-sm font-semibold text-slate-200"
            >
              Precisão máxima aceita
            </label>

            <div className="relative mt-2">
              <input
                id="minimumAccuracyMeters"
                name="minimumAccuracyMeters"
                type="number"
                min={5}
                max={5000}
                defaultValue={
                  location?.minimumAccuracyMeters ??
                  100
                }
                required
                aria-invalid={Boolean(
                  state.fieldErrors
                    .minimumAccuracyMeters?.[0],
                )}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-20 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                metros
              </span>
            </div>

            {state.fieldErrors
              .minimumAccuracyMeters?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .minimumAccuracyMeters[0]
                }
              </p>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">
              Quanto menor o valor, maior
              será a precisão exigida.
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="outsideRadiusAction"
              className="text-sm font-semibold text-slate-200"
            >
              Quando estiver fora do raio
            </label>

            <select
              id="outsideRadiusAction"
              name="outsideRadiusAction"
              defaultValue={
                location?.outsideRadiusAction ??
                (showCoordinates
                  ? "block"
                  : "allow_with_alert")
              }
              aria-invalid={Boolean(
                state.fieldErrors
                  .outsideRadiusAction?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="block">
                Bloquear a marcação
              </option>

              <option value="allow_with_alert">
                Permitir e gerar alerta
              </option>

              <option value="require_justification">
                Exigir justificativa
              </option>
            </select>

            {state.fieldErrors
              .outsideRadiusAction?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .outsideRadiusAction[0]
                }
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {isTemporary ? (
        <section className="border-t border-slate-800 pt-7">
          <div className="mb-5">
            <h2 className="font-bold text-white">
              Período de validade
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              O local ficará disponível
              somente durante este
              intervalo.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="startsOn"
                className="text-sm font-semibold text-slate-200"
              >
                Data inicial
              </label>

              <input
                id="startsOn"
                name="startsOn"
                type="date"
                required
                defaultValue={
                  location?.startsOn ??
                  ""
                }
                aria-invalid={Boolean(
                  state.fieldErrors
                    .startsOn?.[0],
                )}
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {state.fieldErrors
                .startsOn?.[0] ? (
                <p className="mt-2 text-sm text-red-400">
                  {
                    state.fieldErrors
                      .startsOn[0]
                  }
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="endsOn"
                className="text-sm font-semibold text-slate-200"
              >
                Data final
              </label>

              <input
                id="endsOn"
                name="endsOn"
                type="date"
                required
                defaultValue={
                  location?.endsOn ??
                  ""
                }
                aria-invalid={Boolean(
                  state.fieldErrors
                    .endsOn?.[0],
                )}
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {state.fieldErrors
                .endsOn?.[0] ? (
                <p className="mt-2 text-sm text-red-400">
                  {
                    state.fieldErrors
                      .endsOn[0]
                  }
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <>
          <input
            type="hidden"
            name="startsOn"
            value=""
          />

          <input
            type="hidden"
            name="endsOn"
            value=""
          />
        </>
      )}

      <section className="border-t border-slate-800 pt-7">
        <label
          htmlFor="notes"
          className="text-sm font-semibold text-slate-200"
        >
          Observações internas{" "}
          <span className="font-normal text-slate-500">
            (opcional)
          </span>
        </label>

        <textarea
          id="notes"
          name="notes"
          defaultValue={
            location?.notes ?? ""
          }
          maxLength={2000}
          rows={4}
          placeholder="Informações internas, orientações ou exceções deste local."
          aria-invalid={Boolean(
            state.fieldErrors.notes?.[0],
          )}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {state.fieldErrors
          .notes?.[0] ? (
          <p className="mt-2 text-sm text-red-400">
            {
              state.fieldErrors
                .notes[0]
            }
          </p>
        ) : null}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-7 sm:flex-row sm:justify-end">
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>

        <SubmitButton
          idleText={
            isEditing
              ? "Salvar alterações"
              : "Cadastrar local"
          }
          pendingText={
            isEditing
              ? "Salvando..."
              : "Cadastrando..."
          }
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}