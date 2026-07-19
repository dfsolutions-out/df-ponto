import {
  ArrowLeft,
  CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createWorkScheduleAction } from "@/actions/work-schedules";
import { WorkScheduleForm } from "@/components/company/schedules/WorkScheduleForm";
import { requireCompanyAccess } from "@/services/company-access";

type NewWorkSchedulePageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function NewWorkSchedulePage({
  params,
}: NewWorkSchedulePageProps) {
  const { companyId } = await params;

  const access =
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    redirect(
      `/company/${companyId}/schedules`,
    );
  }

  const action =
    createWorkScheduleAction.bind(
      null,
      companyId,
    );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/schedules`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para jornadas
      </Link>

      <div className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <CalendarPlus className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Novo modelo
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Cadastrar jornada
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Defina primeiro as informações gerais do
              modelo. Depois configuraremos os dias e
              horários.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <WorkScheduleForm
            action={action}
            cancelHref={`/company/${companyId}/schedules`}
          />
        </div>
      </div>
    </main>
  );
}