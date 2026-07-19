import {
  ArrowLeft,
  CalendarClock,
  MapPinned,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { updateEmployeeAction } from "@/actions/employees";
import { EmployeeForm } from "@/components/company/employees/EmployeeForm";
import { EmployeeLocationsManager } from "@/components/company/employees/EmployeeLocationsManager";
import { EmployeeScheduleAssignmentForm } from "@/components/company/employees/EmployeeScheduleAssignmentForm";
import { requireCompanyAccess } from "@/services/company-access";
import { getEmployeeLocationData } from "@/services/employee-locations";
import { getEmployeeScheduleData } from "@/services/employee-schedules";
import {
  getEmployeeById,
  getEmployeeFormOptions,
} from "@/services/employees";

type EditEmployeePageProps = {
  params: Promise<{
    companyId: string;
    employeeId: string;
  }>;
};

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const {
    companyId,
    employeeId,
  } = await params;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    redirect(
      `/company/${companyId}/employees`,
    );
  }

  const employee =
    await getEmployeeById({
      companyId,
      employeeId,
    });

  if (!employee) {
    notFound();
  }

  const [
    options,
    scheduleData,
    locationData,
  ] = await Promise.all([
    getEmployeeFormOptions(
      companyId,
    ),

    getEmployeeScheduleData({
      companyId,
      employeeId,
    }),

    getEmployeeLocationData({
      companyId,
      employeeId,
    }),
  ]);

  const action =
    updateEmployeeAction.bind(
      null,
      companyId,
      employeeId,
    );

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/employees`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para funcionários
      </Link>

      <section className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <UserRoundCog className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Dados cadastrais
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {employee.fullName}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Atualize os dados sem excluir
              ou substituir o histórico do
              vínculo.
            </p>
          </div>
        </div>

        <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-200">
            Editar dados do funcionário
          </summary>

          <div className="border-t border-slate-800 p-5 sm:p-6">
            <EmployeeForm
              action={action}
              employee={employee}
              options={options}
              cancelHref={`/company/${companyId}/employees`}
            />
          </div>
        </details>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <CalendarClock className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              Jornada do funcionário
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Atribuição e histórico
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Defina a jornada vigente e
              preserve todas as alterações
              anteriores.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <EmployeeScheduleAssignmentForm
            companyId={companyId}
            employeeId={employeeId}
            admissionDate={
              employee.admissionDate
            }
            scheduleData={scheduleData}
          />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
            <MapPinned className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              Geolocalização
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Locais autorizados
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Defina os locais, períodos,
              raios e exceções individuais
              para o registro de ponto.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <EmployeeLocationsManager
            companyId={companyId}
            employeeId={employeeId}
            admissionDate={
              employee.admissionDate
            }
            employeeStatus={
              employee.status
            }
            locationData={locationData}
          />
        </div>
      </section>
    </main>
  );
}