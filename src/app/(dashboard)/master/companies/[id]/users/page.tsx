import {
  ArrowLeft,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompanyById } from "@/services/companies";
import { getCompanyMembers } from "@/services/company-users";
import { formatPhone } from "@/utils/company";

type CompanyUsersPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    created?: string;
    newUser?: string;
  }>;
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    company_admin: "Administrador",
    hr: "RH",
    manager: "Gestor",
    supervisor: "Supervisor",
    employee: "Funcionário",
  };

  return labels[role] ?? role;
}

export default async function CompanyUsersPage({
  params,
  searchParams,
}: CompanyUsersPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const [company, members] = await Promise.all([
    getCompanyById(id),
    getCompanyMembers(id),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/master/companies/${company.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para a empresa
        </Link>

        <section className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              {company.tradeName}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Usuários da empresa
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Gerencie administradores e demais perfis vinculados.
            </p>
          </div>

          <Link
            href={`/master/companies/${company.id}/users/new`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Novo administrador
          </Link>
        </section>

        {query.created === "1" ? (
          <div className="mt-7 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {query.newUser === "1"
              ? "Administrador criado com sucesso. A senha provisória deverá ser alterada no primeiro acesso."
              : "Usuário existente vinculado à empresa com sucesso."}
          </div>
        ) : null}

        {members.length === 0 ? (
          <section className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 text-center">
            <UserRound className="size-12 text-slate-700" />

            <h2 className="mt-5 text-lg font-semibold">
              Nenhum usuário vinculado
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Crie o primeiro administrador responsável pela empresa.
            </p>

            <Link
              href={`/master/companies/${company.id}/users/new`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Criar administrador
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {members.map((member) => (
              <article
                key={member.membershipId}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <UserRound className="size-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-white">
                          {member.fullName}
                        </h2>

                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {getRoleLabel(member.role)}
                        </span>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {member.status === "active"
                            ? "Ativo"
                            : member.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="size-4 text-slate-600" />
                          {member.email}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <Phone className="size-4 text-slate-600" />
                          {member.phone
                            ? formatPhone(member.phone)
                            : "Telefone não informado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="size-4 text-blue-400" />
                    Acesso vinculado
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}