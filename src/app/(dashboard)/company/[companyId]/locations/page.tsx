import {
  Briefcase,
  MapPin,
  Navigation,
  Plus,
  Search,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { WorkLocationStatusForm } from "@/components/company/locations/WorkLocationStatusForm";
import { requireCompanyAccess } from "@/services/company-access";
import {
  getWorkLocationCounts,
  getWorkLocations,
} from "@/services/work-locations";
import type {
  OutsideRadiusAction,
  WorkLocationType,
} from "@/types/work-location";

type LocationsPageProps = {
  params: Promise<{
    companyId: string;
  }>;

  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    created?: string;
    updated?: string;
  }>;
};

function getTypeLabel(
  type: WorkLocationType,
): string {
  const labels: Record<
    WorkLocationType,
    string
  > = {
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
  const labels: Record<
    OutsideRadiusAction,
    string
  > = {
    block: "Bloquear fora do raio",
    allow_with_alert:
      "Permitir com alerta",
    require_justification:
      "Exigir justificativa",
  };

  return labels[action];
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

export default async function LocationsPage({
  params,
  searchParams,
}: LocationsPageProps) {
  const { companyId } = await params;
  const query = await searchParams;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  const status =
    query.status === "active" ||
    query.status === "inactive"
      ? query.status
      : "all";

  const validTypes: WorkLocationType[] = [
    "fixed",
    "temporary",
    "external",
    "route",
    "free",
  ];

  const locationType =
    validTypes.includes(
      query.type as WorkLocationType,
    )
      ? (
          query.type as WorkLocationType
        )
      : "all";

  const [locations, counts] =
    await Promise.all([
      getWorkLocations({
        companyId,
        search: query.q,
        status,
        locationType,
      }),

      getWorkLocationCounts(
        companyId,
      ),
    ]);

  const successMessage =
    query.created
      ? "Local cadastrado com sucesso."
      : query.updated
        ? "Local atualizado com sucesso."
        : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Geolocalização
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Locais autorizados
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Configure endereços, coordenadas, raios e regras para registro de ponto.
          </p>
        </div>

        {access.canManageOrganization ? (
          <Link
            href={`/company/${companyId}/locations/new`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Novo local
          </Link>
        ) : null}
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: MapPin,
          },
          {
            label: "Ativos",
            value: counts.active,
            icon: Navigation,
          },
          {
            label: "Inativos",
            value: counts.inactive,
            icon: MapPin,
          },
          {
            label: "Temporários",
            value: counts.temporary,
            icon: Timer,
          },
          {
            label: "Externos e rotas",
            value: counts.external,
            icon: Briefcase,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {item.value}
                  </p>
                </div>

                <Icon className="size-5 text-slate-600" />
              </div>
            </article>
          );
        })}
      </section>

      <form className="mt-7 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:grid-cols-[1fr_190px_210px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />

          <input
            name="q"
            defaultValue={query.q}
            placeholder="Buscar por nome, endereço ou descrição"
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none"
        >
          <option value="all">
            Todos os status
          </option>

          <option value="active">
            Somente ativos
          </option>

          <option value="inactive">
            Somente inativos
          </option>
        </select>

        <select
          name="type"
          defaultValue={locationType}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none"
        >
          <option value="all">
            Todos os tipos
          </option>

          <option value="fixed">
            Local fixo
          </option>

          <option value="temporary">
            Temporário
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

        <button className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <MapPin className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Nenhum local encontrado
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {query.q ||
              status !== "all" ||
              locationType !== "all"
                ? "Altere os filtros para localizar outros locais."
                : "Cadastre o primeiro local autorizado para preparar a geolocalização do ponto."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {locations.map(
              (location) => (
                <article
                  key={location.id}
                  className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold text-white">
                        {location.name}
                      </h2>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase",
                          location.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-800 text-slate-400",
                        ].join(" ")}
                      >
                        {location.isActive
                          ? "Ativo"
                          : "Inativo"}
                      </span>

                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                        {getTypeLabel(
                          location.locationType,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {location.address ||
                        location.description ||
                        "Sem endereço ou descrição cadastrada."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span>
                        Raio:{" "}
                        {location.radiusMeters} m
                      </span>

                      <span>
                        Precisão: até{" "}
                        {
                          location.minimumAccuracyMeters
                        }{" "}
                        m
                      </span>

                      <span>
                        {getOutsideRadiusLabel(
                          location.outsideRadiusAction,
                        )}
                      </span>

                      {location.latitude !== null &&
                      location.longitude !== null ? (
                        <span>
                          {location.latitude.toFixed(6)},{" "}
                          {location.longitude.toFixed(6)}
                        </span>
                      ) : null}

                      {location.startsOn &&
                      location.endsOn ? (
                        <span>
                          {formatDate(
                            location.startsOn,
                          )}{" "}
                          até{" "}
                          {formatDate(
                            location.endsOn,
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {access.canManageOrganization ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/company/${companyId}/locations/${location.id}/edit`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
                      >
                        Editar
                      </Link>

                      <WorkLocationStatusForm
                        companyId={companyId}
                        locationId={location.id}
                        locationName={location.name}
                        isActive={location.isActive}
                      />
                    </div>
                  ) : null}
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}