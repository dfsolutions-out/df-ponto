import {
  ArrowLeft,
  BriefcaseBusiness,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { updateJobPositionAction } from "@/actions/job-positions";
import { JobPositionForm } from "@/components/company/positions/JobPositionForm";
import { requireCompanyAccess } from "@/services/company-access";
import { getJobPositionById } from "@/services/job-positions";

type Props = {
  params: Promise<{
    companyId: string;
    positionId: string;
  }>;
};

export default async function EditJobPositionPage({
  params,
}: Props) {
  const { companyId, positionId } = await params;

  const access = await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    redirect(`/company/${companyId}/positions`);
  }

  const position = await getJobPositionById({
    companyId,
    positionId,
  });

  if (!position) {
    notFound();
  }

  const action = updateJobPositionAction.bind(
    null,
    companyId,
    positionId,
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/positions`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para cargos
      </Link>

      <div className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <BriefcaseBusiness className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Edição
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Editar cargo
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Atualize os dados sem perder o histórico
              do registro.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <JobPositionForm
            action={action}
            position={position}
            cancelHref={`/company/${companyId}/positions`}
          />
        </div>
      </div>
    </main>
  );
}