import {
  ArrowLeft,
  MapPinned,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { updateWorkLocationAction } from "@/actions/work-locations";
import { WorkLocationForm } from "@/components/company/locations/WorkLocationForm";
import { requireCompanyAccess } from "@/services/company-access";
import { getWorkLocationById } from "@/services/work-locations";

type EditLocationPageProps = {
  params: Promise<{
    companyId: string;
    locationId: string;
  }>;
};

export default async function EditLocationPage({
  params,
}: EditLocationPageProps) {
  const { companyId, locationId } =
    await params;

  const access =
    await requireCompanyAccess(
      companyId,
    );

  if (!access.canManageOrganization) {
    redirect(
      `/company/${companyId}/locations`,
    );
  }

  const location =
    await getWorkLocationById({
      companyId,
      locationId,
    });

  if (!location) {
    notFound();
  }

  const action =
    updateWorkLocationAction.bind(
      null,
      companyId,
      locationId,
    );

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/company/${companyId}/locations`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para locais
      </Link>

      <div className="mt-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <MapPinned className="size-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Configuração
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {location.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Atualize o local sem apagar seu histórico.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <WorkLocationForm
            action={action}
            location={location}
            cancelHref={`/company/${companyId}/locations`}
          />
        </div>
      </div>
    </main>
  );
}