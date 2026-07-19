import {
  ArrowLeft,
  CalendarCog,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { updateWorkScheduleAction } from "@/actions/work-schedules";
import { WorkScheduleDaysEditor } from "@/components/company/schedules/WorkScheduleDaysEditor";
import { WorkScheduleForm } from "@/components/company/schedules/WorkScheduleForm";
import { requireCompanyAccess } from "@/services/company-access";
import { getWorkScheduleConfiguration } from "@/services/work-schedule-days";
import { getWorkScheduleById } from "@/services/work-schedules";

type EditWorkSchedulePageProps = {
  params: Promise<{
    companyId: string;
    scheduleId: string;
  }>;

  searchParams: Promise<{
    created?: string;
  }>;
};

export default async function EditWorkSchedulePage({
  params,
  searchParams,
}: EditWorkSchedulePageProps) {
  const { companyId, scheduleId } =
    await params;

  const query = await searchParams;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    redirect(
      `/company/${companyId}/schedules`,
    );
  }

  const schedule =
    await getWorkScheduleById({
      companyId,
      scheduleId,
    });

  if (!schedule) {
    notFound();
  }

  const configuration =
    await getWorkScheduleConfiguration(
      schedule,
    );

  const updateAction =
    updateWorkScheduleAction.bind(
      null,
      companyId,
      scheduleId,
    );

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/schedules`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para jornadas
      </Link>

      {query.created ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Jornada criada com sucesso.
          Configure agora os dias e
          horários esperados.
        </div>
      ) : null}

      <section className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <CalendarCog className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Configuração geral
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {schedule.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Atualize o modelo da jornada
              sem excluir seu histórico.
            </p>
          </div>
        </div>

        <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-200">
            Editar informações gerais
          </summary>

          <div className="border-t border-slate-800 p-5 sm:p-6">
            <WorkScheduleForm
              action={updateAction}
              schedule={schedule}
              cancelHref={`/company/${companyId}/schedules`}
            />
          </div>
        </details>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <Clock3 className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              Ciclo da jornada
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Dias e horários
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Defina dias trabalhados,
              folgas, intervalos, múltiplos
              períodos e virada de dia.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <WorkScheduleDaysEditor
            configuration={
              configuration
            }
          />
        </div>
      </section>
    </main>
  );
}