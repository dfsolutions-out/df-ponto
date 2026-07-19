"use client";

import dynamic from "next/dynamic";
import {
  Crown,
  History,
  MapPin,
  Navigation,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignEmployeeLocationAction,
  endEmployeeLocationAction,
  setEmployeePrimaryLocationAction,
} from "@/actions/employee-locations";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  EmployeeLocationAssignment,
  EmployeeLocationAssignmentActionState,
  EmployeeLocationData,
  EmployeeLocationSimpleActionState,
} from "@/types/employee-location";
import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

const EmployeeLocationMap = dynamic(
  () =>
    import(
      "@/components/company/employees/EmployeeLocationMap"
    ).then(
      (module) => module.EmployeeLocationMap,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-500">
        Carregando mapa...
      </div>
    ),
  },
);

const initialAssignmentState: EmployeeLocationAssignmentActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

const initialSimpleState: EmployeeLocationSimpleActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type EmployeeLocationsManagerProps = {
  companyId: string;
  employeeId: string;
  admissionDate: string;
  employeeStatus: string;
  locationData: EmployeeLocationData;
};

type LocationCardProps = {
  assignment: EmployeeLocationAssignment;
  companyId: string;
  employeeId: string;
};

function getTodayInBrazil(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${value}T12:00:00`));
}

function getLocationTypeLabel(
  type: WorkLocationType,
): string {
  const labels: Record<WorkLocationType, string> = {
    fixed: "Local fixo",
    temporary: "Temporário",
    external: "Trabalho externo",
    route: "Em rota",
    free: "Registro livre",
  };

  return labels[type];
}

function getOutsideRadiusLabel(
  action: OutsideRadiusAction,
): string {
  const labels: Record<OutsideRadiusAction, string> = {
    block: "Bloquear fora do raio",
    allow_with_alert: "Permitir com alerta",
    require_justification: "Exigir justificativa",
  };

  return labels[action];
}

function LocationCard({
  assignment,
  companyId,
  employeeId,
}: LocationCardProps) {
  const router = useRouter();

  const [showPrimaryForm, setShowPrimaryForm] =
    useState(false);

  const [showEndForm, setShowEndForm] =
    useState(false);

  const [primaryState, primaryAction] =
    useActionState(
      setEmployeePrimaryLocationAction,
      initialSimpleState,
    );

  const [endState, endAction] =
    useActionState(
      endEmployeeLocationAction,
      initialSimpleState,
    );

  useEffect(() => {
    if (
      primaryState.success ||
      endState.success
    ) {
      router.refresh();
    }
  }, [
    endState.success,
    primaryState.success,
    router,
  ]);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/45">
      <div className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold text-white">
                {assignment.locationName}
              </h3>

              {assignment.isPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                  <Crown className="size-3" />
                  Principal
                </span>
              ) : null}

              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                {getLocationTypeLabel(
                  assignment.locationType,
                )}
              </span>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase",
                  assignment.isActive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                {assignment.isActive
                  ? "Ativo"
                  : "Encerrado"}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {assignment.address ||
                "Sem endereço fixo cadastrado."}
            </p>

            <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-semibold text-slate-300">
                  Vigência
                </p>

                <p className="mt-1">
                  {formatDate(
                    assignment.startsOn,
                  )}{" "}
                  até{" "}
                  {assignment.endsOn
                    ? formatDate(
                        assignment.endsOn,
                      )
                    : "atualmente"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-300">
                  Raio efetivo
                </p>

                <p className="mt-1">
                  {
                    assignment.effectiveRadiusMeters
                  }{" "}
                  metros
                </p>

                {assignment.customRadiusMeters ? (
                  <p className="mt-1 text-blue-400">
                    Exceção individual
                  </p>
                ) : null}
              </div>

              <div>
                <p className="font-semibold text-slate-300">
                  Fora do raio
                </p>

                <p className="mt-1">
                  {getOutsideRadiusLabel(
                    assignment.effectiveOutsideRadiusAction,
                  )}
                </p>

                {assignment.outsideRadiusActionOverride ? (
                  <p className="mt-1 text-blue-400">
                    Regra individual
                  </p>
                ) : null}
              </div>

              <div>
                <p className="font-semibold text-slate-300">
                  Precisão aceita
                </p>

                <p className="mt-1">
                  Até{" "}
                  {
                    assignment.minimumAccuracyMeters
                  }{" "}
                  metros
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-600">
              Motivo: {assignment.reason}
            </p>
          </div>

          {assignment.isActive ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {!assignment.isPrimary ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowPrimaryForm(true);
                    setShowEndForm(false);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-500/30 px-3 text-xs font-bold text-amber-300 transition hover:bg-amber-500/10"
                >
                  <Crown className="size-3.5" />
                  Definir principal
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setShowEndForm(true);
                  setShowPrimaryForm(false);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
              >
                <X className="size-3.5" />
                Encerrar
              </button>
            </div>
          ) : null}
        </div>

        {showPrimaryForm ? (
          <form
            action={primaryAction}
            className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <input
              type="hidden"
              name="companyId"
              value={companyId}
            />

            <input
              type="hidden"
              name="employeeId"
              value={employeeId}
            />

            <input
              type="hidden"
              name="assignmentId"
              value={assignment.id}
            />

            <label
              htmlFor={`primary-reason-${assignment.id}`}
              className="text-sm font-semibold text-slate-200"
            >
              Justificativa
            </label>

            <textarea
              id={`primary-reason-${assignment.id}`}
              name="reason"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              placeholder="Ex.: Local principal da operação do funcionário."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500"
            />

            {primaryState.fieldErrors
              .reason?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  primaryState.fieldErrors
                    .reason[0]
                }
              </p>
            ) : null}

            {primaryState.message &&
            !primaryState.success ? (
              <p className="mt-3 text-sm text-red-400">
                {primaryState.message}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowPrimaryForm(false)
                }
                className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>

              <SubmitButton
                idleText="Confirmar principal"
                pendingText="Salvando..."
                className="h-10 rounded-xl bg-amber-500 px-4 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </form>
        ) : null}

        {showEndForm ? (
          <form
            action={endAction}
            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
          >
            <input
              type="hidden"
              name="companyId"
              value={companyId}
            />

            <input
              type="hidden"
              name="employeeId"
              value={employeeId}
            />

            <input
              type="hidden"
              name="assignmentId"
              value={assignment.id}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor={`end-date-${assignment.id}`}
                  className="text-sm font-semibold text-slate-200"
                >
                  Data de encerramento
                </label>

                <input
                  id={`end-date-${assignment.id}`}
                  type="date"
                  name="endsOn"
                  min={assignment.startsOn}
                  defaultValue={getTodayInBrazil()}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-red-500"
                />

                {endState.fieldErrors
                  .endsOn?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      endState.fieldErrors
                        .endsOn[0]
                    }
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor={`end-reason-${assignment.id}`}
                  className="text-sm font-semibold text-slate-200"
                >
                  Justificativa
                </label>

                <input
                  id={`end-reason-${assignment.id}`}
                  name="reason"
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Ex.: Mudança de posto."
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500"
                />

                {endState.fieldErrors
                  .reason?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      endState.fieldErrors
                        .reason[0]
                    }
                  </p>
                ) : null}
              </div>
            </div>

            {endState.message &&
            !endState.success ? (
              <p className="mt-3 text-sm text-red-400">
                {endState.message}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowEndForm(false)
                }
                className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>

              <SubmitButton
                idleText="Confirmar encerramento"
                pendingText="Encerrando..."
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </form>
        ) : null}
      </div>

      {assignment.latitude !== null &&
      assignment.longitude !== null ? (
        <div className="border-t border-slate-800 p-4">
          <EmployeeLocationMap
            latitude={assignment.latitude}
            longitude={assignment.longitude}
            radiusMeters={
              assignment.effectiveRadiusMeters
            }
          />
        </div>
      ) : null}
    </article>
  );
}

export function EmployeeLocationsManager({
  companyId,
  employeeId,
  admissionDate,
  employeeStatus,
  locationData,
}: EmployeeLocationsManagerProps) {
  const router = useRouter();

  const [showForm, setShowForm] =
    useState(
      locationData.active.length === 0,
    );

  const [
    selectedLocationId,
    setSelectedLocationId,
  ] = useState("");

  const [
    assignmentState,
    assignmentAction,
  ] = useActionState(
    assignEmployeeLocationAction,
    initialAssignmentState,
  );

  useEffect(() => {
    if (assignmentState.success) {
      router.refresh();
    }
  }, [
    assignmentState.success,
    router,
  ]);

  const selectedLocation = useMemo(
    () =>
      locationData.availableLocations.find(
        (location) =>
          location.id ===
          selectedLocationId,
      ) ?? null,
    [
      locationData.availableLocations,
      selectedLocationId,
    ],
  );

  const employeeTerminated =
    employeeStatus === "terminated";

  const today = getTodayInBrazil();

  const defaultStartDate =
    today < admissionDate
      ? admissionDate
      : today;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-blue-400" />

              <h3 className="font-bold text-white">
                Locais autorizados
              </h3>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              O funcionário poderá registrar
              ponto nos locais ativos dentro
              do período de vigência.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                {locationData.active.length}{" "}
                ativo(s)
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-400">
                {locationData.history.length}{" "}
                histórico(s)
              </span>
            </div>
          </div>

          {!employeeTerminated ? (
            <button
              type="button"
              onClick={() =>
                setShowForm(
                  (current) => !current,
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              <Plus className="size-4" />
              Atribuir local
            </button>
          ) : null}
        </div>
      </section>

      {employeeTerminated ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Funcionário desligado. Novos locais
          não podem ser atribuídos.
        </div>
      ) : null}

      {showForm &&
      !employeeTerminated ? (
        <form
          action={assignmentAction}
          className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5"
        >
          <input
            type="hidden"
            name="companyId"
            value={companyId}
          />

          <input
            type="hidden"
            name="employeeId"
            value={employeeId}
          />

          <h3 className="font-bold text-white">
            Nova atribuição
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            A exceção individual de raio ou
            regra prevalece sobre a
            configuração padrão do local.
          </p>

          {assignmentState.message ? (
            <div
              className={[
                "mt-5 rounded-xl border px-4 py-3 text-sm",
                assignmentState.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200",
              ].join(" ")}
            >
              {
                assignmentState.message
              }
            </div>
          ) : null}

          {locationData.availableLocations
            .length === 0 ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Nenhum local ativo está
              disponível. Cadastre ou reative
              um local primeiro.
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="employee-work-location"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Local
                  </label>

                  <select
                    id="employee-work-location"
                    name="workLocationId"
                    required
                    value={selectedLocationId}
                    onChange={(event) =>
                      setSelectedLocationId(
                        event.target.value,
                      )
                    }
                    aria-invalid={Boolean(
                      assignmentState
                        .fieldErrors
                        .workLocationId?.[0],
                    )}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Selecione um local
                    </option>

                    {locationData.availableLocations.map(
                      (location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.name} —{" "}
                          {getLocationTypeLabel(
                            location.locationType,
                          )}{" "}
                          — raio{" "}
                          {
                            location.radiusMeters
                          }
                         m
                        </option>
                      ),
                    )}
                  </select>

                  {assignmentState
                    .fieldErrors
                    .workLocationId?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .workLocationId[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="employee-location-start"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Início da vigência
                  </label>

                  <input
                    id="employee-location-start"
                    name="startsOn"
                    type="date"
                    required
                    min={admissionDate}
                    defaultValue={defaultStartDate}
                    aria-invalid={Boolean(
                      assignmentState
                        .fieldErrors
                        .startsOn?.[0],
                    )}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {assignmentState
                    .fieldErrors
                    .startsOn?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .startsOn[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="employee-location-end"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Data final{" "}
                    <span className="font-normal text-slate-500">
                      (opcional)
                    </span>
                  </label>

                  <input
                    id="employee-location-end"
                    name="endsOn"
                    type="date"
                    min={admissionDate}
                    aria-invalid={Boolean(
                      assignmentState
                        .fieldErrors
                        .endsOn?.[0],
                    )}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {assignmentState
                    .fieldErrors
                    .endsOn?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .endsOn[0]
                      }
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs text-slate-500">
                    Use para postos temporários
                    ou autorizações com prazo.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="customRadiusMeters"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Raio individual{" "}
                    <span className="font-normal text-slate-500">
                      (opcional)
                    </span>
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="customRadiusMeters"
                      name="customRadiusMeters"
                      type="number"
                      min={30}
                      max={50000}
                      placeholder={
                        selectedLocation
                          ? String(
                              selectedLocation.radiusMeters,
                            )
                          : "Padrão do local"
                      }
                      aria-invalid={Boolean(
                        assignmentState
                          .fieldErrors
                          .customRadiusMeters?.[0],
                      )}
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      metros
                    </span>
                  </div>

                  {assignmentState
                    .fieldErrors
                    .customRadiusMeters?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .customRadiusMeters[0]
                      }
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs text-slate-500">
                    Vazio utiliza o raio padrão
                    do local.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="outsideRadiusActionOverride"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Regra individual fora do raio
                  </label>

                  <select
                    id="outsideRadiusActionOverride"
                    name="outsideRadiusActionOverride"
                    defaultValue=""
                    aria-invalid={Boolean(
                      assignmentState
                        .fieldErrors
                        .outsideRadiusActionOverride?.[0],
                    )}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Usar regra padrão do local
                    </option>

                    <option value="block">
                      Bloquear marcação
                    </option>

                    <option value="allow_with_alert">
                      Permitir com alerta
                    </option>

                    <option value="require_justification">
                      Exigir justificativa
                    </option>
                  </select>

                  {assignmentState
                    .fieldErrors
                    .outsideRadiusActionOverride?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .outsideRadiusActionOverride[0]
                      }
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
                    <input
                      type="checkbox"
                      name="isPrimary"
                      value="true"
                      defaultChecked={
                        locationData.active
                          .length === 0
                      }
                      className="mt-1 size-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-200">
                        Definir como local principal
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        O local principal será
                        priorizado nas telas e
                        validações do funcionário.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="employee-location-reason"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Justificativa
                  </label>

                  <textarea
                    id="employee-location-reason"
                    name="reason"
                    required
                    minLength={3}
                    maxLength={500}
                    rows={4}
                    placeholder="Ex.: Local principal definido para a operação do funcionário."
                    aria-invalid={Boolean(
                      assignmentState
                        .fieldErrors
                        .reason?.[0],
                    )}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  {assignmentState
                    .fieldErrors
                    .reason?.[0] ? (
                    <p className="mt-2 text-sm text-red-400">
                      {
                        assignmentState
                          .fieldErrors
                          .reason[0]
                      }
                    </p>
                  ) : null}
                </div>
              </div>

              {selectedLocation !== null &&
              selectedLocation.latitude !== null &&
              selectedLocation.longitude !== null ? (
                <div className="mt-5">
                  <EmployeeLocationMap
                    latitude={
                      selectedLocation.latitude
                    }
                    longitude={
                      selectedLocation.longitude
                    }
                    radiusMeters={
                      selectedLocation.radiusMeters
                    }
                  />
                </div>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <SubmitButton
                  idleText="Atribuir local"
                  pendingText="Atribuindo..."
                  className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </>
          )}
        </form>
      ) : null}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <Navigation className="size-5 text-emerald-400" />

          <h3 className="font-bold text-white">
            Vínculos ativos
          </h3>
        </div>

        {locationData.active.length === 0 ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-5">
            <p className="font-semibold text-amber-200">
              Funcionário sem local autorizado
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-200/70">
              Atribua pelo menos um local
              antes de liberar o registro de
              ponto com geolocalização.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {locationData.active.map(
              (assignment) => (
                <LocationCard
                  key={assignment.id}
                  assignment={assignment}
                  companyId={companyId}
                  employeeId={employeeId}
                />
              ),
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <History className="size-5 text-slate-500" />

          <h3 className="font-bold text-white">
            Histórico de locais
          </h3>
        </div>

        {locationData.history.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-950/40 px-5 py-6 text-sm text-slate-600">
            Nenhum vínculo com local foi
            encerrado.
          </p>
        ) : (
          <div className="space-y-4">
            {locationData.history.map(
              (assignment) => (
                <LocationCard
                  key={assignment.id}
                  assignment={assignment}
                  companyId={companyId}
                  employeeId={employeeId}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}