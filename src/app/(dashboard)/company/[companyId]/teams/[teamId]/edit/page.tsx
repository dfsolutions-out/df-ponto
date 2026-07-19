import {
  ArrowLeft,
  Network,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { updateTeamAction } from "@/actions/teams";
import { TeamForm } from "@/components/company/teams/TeamForm";
import { requireCompanyAccess } from "@/services/company-access";
import {
  getTeamById,
  getTeamDepartmentOptions,
  getTeamResponsibleOptions,
} from "@/services/teams";

type EditTeamPageProps = {
  params: Promise<{
    companyId: string;
    teamId: string;
  }>;
};

export default async function EditTeamPage({
  params,
}: EditTeamPageProps) {
  const { companyId, teamId } =
    await params;

  const access =
    await requireCompanyAccess(companyId);

  if (!access.canManageOrganization) {
    redirect(`/company/${companyId}/teams`);
  }

  const [
    team,
    departments,
    responsibleOptions,
  ] = await Promise.all([
    getTeamById({
      companyId,
      teamId,
    }),

    getTeamDepartmentOptions(companyId),

    getTeamResponsibleOptions(companyId),
  ]);

  if (!team) {
    notFound();
  }

  const action = updateTeamAction.bind(
    null,
    companyId,
    teamId,
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/teams`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para equipes
      </Link>

      <div className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <Network className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Edição
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Editar equipe
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Atualize a estrutura sem perder o
              histórico do registro.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <TeamForm
            action={action}
            team={team}
            departments={departments}
            managers={
              responsibleOptions.managers
            }
            supervisors={
              responsibleOptions.supervisors
            }
            cancelHref={`/company/${companyId}/teams`}
          />
        </div>
      </div>
    </main>
  );
}