import {
  ArrowLeft,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import { TimeClockPanel } from "@/components/time-clock/TimeClockPanel";
import { requireEmployeePortalContext } from "@/services/employee-portal";
import { getTimeClockContext } from "@/services/time-clock";

type EmployeeTimeClockPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function EmployeeTimeClockPage({
  params,
}: EmployeeTimeClockPageProps) {
  const { companyId } =
    await params;

  try {
    await requireEmployeePortalContext(
      companyId,
    );
  } catch {
    notFound();
  }

  const context =
    await getTimeClockContext(
      companyId,
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={`/employee/${companyId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar ao início
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <Clock3 className="size-5" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Registro digital
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Registrar ponto
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Capture sua localização e
            confirme a próxima marcação.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <TimeClockPanel
          context={context}
        />
      </div>
    </div>
  );
}