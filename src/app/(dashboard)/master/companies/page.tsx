import {
  Building2,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function MasterCompaniesPage() {
  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              Clientes
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Empresas
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Gerencie as empresas clientes da plataforma.
            </p>
          </div>

          <Link
            href="/master/companies/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus
              aria-hidden="true"
              className="size-4"
            />

            Nova empresa
          </Link>
        </section>

        <section className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 text-center">
          <Building2
            aria-hidden="true"
            className="size-12 text-slate-700"
          />

          <h2 className="mt-5 text-lg font-semibold">
            Nenhuma empresa cadastrada
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            A listagem será preenchida assim que cadastrarmos a
            primeira empresa cliente.
          </p>

          <Link
            href="/master/companies/new"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Iniciar cadastro
          </Link>
        </section>
      </div>
    </main>
  );
}