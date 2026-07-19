import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";

import { EmployeeStatusForm } from "@/components/company/employees/EmployeeStatusForm";
import { requireCompanyAccess } from "@/services/company-access";
import {
  getEmployeeCounts,
  getEmployees,
} from "@/services/employees";
import type { EmployeeStatus } from "@/types/employee";

type EmployeesPageProps = {
  params: Promise<{
    companyId: string;
  }>;

  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
    updated?: string;
    accessWarning?: string;
  }>;
};

function formatCpf(value: string): string {
  return value.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4",
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${value}T12:00:00`));
}

function getStatusDetails(
  status: EmployeeStatus,
): {
  label: string;
  className: string;
} {
  const statusMap: Record<
    EmployeeStatus,
    {
      label: string;
      className: string;
    }
  > = {
    active: {
      label: "Ativo",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },
    on_leave: {
      label: "Afastado",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    terminated: {
      label: "Desligado",
      className:
        "border-slate-700 bg-slate-800 text-slate-400",
    },
    blocked: {
      label: "Bloqueado",
      className:
        "border-red-500/30 bg-red-500/10 text-red-300",
    },
  };

  return statusMap[status];
}

export default async function EmployeesPage({
  params,
  searchParams,
}: EmployeesPageProps) {
  const { companyId } = await params;
  const query = await searchParams;

  const access =
    await requireCompanyAccess(companyId);

  const validStatuses = [
    "active",
    "on_leave",
    "terminated",
    "blocked",
  ] as const;

  const status = validStatuses.includes(
    query.status as
      | "active"
      | "on_leave"
      | "terminated"
      | "blocked",
  )
    ? (query.status as EmployeeStatus)
    : "all";

  const [employees, counts] =
    await Promise.all([
      getEmployees({
        companyId,
        search: query.q,
        status,
      }),

      getEmployeeCounts(companyId),
    ]);

  const successMessage = query.created
    ? "Funcionário cadastrado com sucesso."
    : query.updated
      ? "Funcionário atualizado com sucesso."
      : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Gestão de pessoas
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Funcionários
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Gerencie vínculos trabalhistas, estrutura
            organizacional e acesso dos funcionários.
          </p>
        </div>

        {access.canManageOrganization ? (
          <Link
            href={`/company/${companyId}/employees/new`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Novo funcionário
          </Link>
        ) : null}
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {query.accessWarning ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-200">
          O funcionário foi cadastrado, mas a conta de
          acesso não pôde ser vinculada. O vínculo
          trabalhista foi preservado e o acesso poderá
          ser configurado posteriormente.
        </div>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: Users,
          },
          {
            label: "Ativos",
            value: counts.active,
            icon: BadgeCheck,
          },
          {
            label: "Afastados",
            value: counts.onLeave,
            icon: UserRound,
          },
          {
            label: "Desligados",
            value: counts.terminated,
            icon: BriefcaseBusiness,
          },
          {
            label: "Bloqueados",
            value: counts.blocked,
            icon: ShieldAlert,
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

      <form className="mt-7 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-[1fr_210px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />

          <input
            name="q"
            defaultValue={query.q}
            placeholder="Buscar por nome, CPF, matrícula ou e-mail"
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">
            Todos os status
          </option>

          <option value="active">
            Somente ativos
          </option>

          <option value="on_leave">
            Somente afastados
          </option>

          <option value="terminated">
            Somente desligados
          </option>

          <option value="blocked">
            Somente bloqueados
          </option>
        </select>

        <button className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold transition hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <Users className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Nenhum funcionário encontrado
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {query.q || status !== "all"
                ? "Altere os filtros para tentar localizar outros funcionários."
                : "Cadastre o primeiro funcionário para iniciar a operação da empresa."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {employees.map((employee) => {
              const statusDetails =
                getStatusDetails(employee.status);

              return (
                <article
                  key={employee.id}
                  className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold text-white">
                        {employee.fullName}
                      </h2>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                          statusDetails.className,
                        ].join(" ")}
                      >
                        {statusDetails.label}
                      </span>

                      {employee.userId ? (
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                          Acesso vinculado
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                          Sem acesso
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span>
                        Matrícula:{" "}
                        {employee.registrationNumber}
                      </span>

                      <span>
                        CPF: {formatCpf(employee.cpf)}
                      </span>

                      <span>
                        Admissão:{" "}
                        {formatDate(
                          employee.admissionDate,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="size-4 text-slate-600" />
                        {employee.departmentName ??
                          "Sem setor"}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness className="size-4 text-slate-600" />
                        {employee.jobPositionName ??
                          "Sem cargo"}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Users className="size-4 text-slate-600" />
                        {employee.teamName ??
                          "Sem equipe"}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Mail className="size-4 text-slate-600" />
                        {employee.email}
                      </span>
                    </div>
                  </div>

                  {access.canManageOrganization ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/company/${companyId}/employees/${employee.id}/edit`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                      >
                        Editar
                      </Link>

                      <EmployeeStatusForm
                        companyId={companyId}
                        employeeId={employee.id}
                        employeeName={
                          employee.fullName
                        }
                        currentStatus={
                          employee.status
                        }
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}