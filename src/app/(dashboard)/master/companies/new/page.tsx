import {
  ArrowLeft,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function NewCompanyPage() {
  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/master/companies"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4"
          />

          Voltar para empresas
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-7 sm:p-10">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Building2
              aria-hidden="true"
              className="size-7"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Nova empresa
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            A estrutura do painel está pronta. Na próxima etapa
            criaremos o formulário completo, as validações, a Server
            Action, a auditoria e o cadastro do primeiro administrador
            da empresa.
          </p>
        </section>
      </div>
    </main>
  );
}