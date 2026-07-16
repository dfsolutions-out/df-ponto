import {
  ScrollText,
  ShieldCheck,
} from "lucide-react";

export default function MasterAuditPage() {
  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
          Segurança
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Auditoria
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Consulte as ações administrativas e sensíveis registradas.
        </p>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <ScrollText
                aria-hidden="true"
                className="size-6"
              />
            </div>

            <div>
              <h2 className="font-semibold">
                Módulo de auditoria preparado
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                A tabela e as políticas de segurança já existem.
                A listagem completa será ligada após o cadastro de
                empresas.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4"
                />

                Registros protegidos contra alteração e exclusão
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}