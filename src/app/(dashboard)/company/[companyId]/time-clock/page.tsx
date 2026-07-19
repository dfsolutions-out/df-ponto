import {
  Clock3,
} from "lucide-react";

import { TimeClockPanel } from "@/components/time-clock/TimeClockPanel";
import { getTimeClockContext } from "@/services/time-clock";

type TimeClockPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function TimeClockPage({
  params,
}: TimeClockPageProps) {
  const { companyId } =
    await params;

  const context =
    await getTimeClockContext(
      companyId,
    );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <Clock3 className="size-5" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
            Registro digital
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Registrar ponto
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Capture sua localização,
            confirme o local autorizado e
            registre a próxima marcação da
            jornada.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <TimeClockPanel
          context={context}
        />
      </div>
    </main>
  );
}