import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireEmployeePortalContext } from "@/services/employee-portal";

type EmployeeProfilePageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
      timeZone: "UTC",
    },
  ).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function getStatusLabel(
  status:
    | "active"
    | "on_leave"
    | "terminated"
    | "blocked",
): string {
  const labels = {
    active: "Ativo",
    on_leave: "Afastado",
    terminated: "Desligado",
    blocked: "Bloqueado",
  };

  return labels[status];
}

export default async function EmployeeProfilePage({
  params,
}: EmployeeProfilePageProps) {
  const { companyId } =
    await params;

  let context;

  try {
    context =
      await requireEmployeePortalContext(
        companyId,
      );
  } catch {
    notFound();
  }

  const supabase =
    await createClient();

  const {
    data,
  } = await supabase.auth.getUser();

  const current =
    context.current;

  const companyName =
    current.companyTradeName ??
    current.companyName;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <UserRound className="size-5" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Meu perfil
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {current.employeeName}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Dados do vínculo e acesso.
          </p>
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <Building2 className="size-5 text-blue-400" />

            <h2 className="font-bold text-white">
              Empresa
            </h2>
          </div>

          <p className="mt-5 text-lg font-bold text-white">
            {companyName}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {current.companyName}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-blue-400" />

            <h2 className="font-bold text-white">
              Acesso
            </h2>
          </div>

          <p className="mt-5 break-all text-sm font-semibold text-white">
            {data.user?.email ??
              "E-mail não disponível"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Conta vinculada ao funcionário.
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-emerald-400" />

          <h2 className="font-bold text-white">
            Dados do vínculo
          </h2>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Situação
            </p>

            <p className="mt-2 font-semibold text-white">
              {getStatusLabel(
                current.employeeStatus,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Admissão
            </p>

            <p className="mt-2 font-semibold text-white">
              {formatDate(
                current.admissionDate,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Cargo
            </p>

            <p className="mt-2 font-semibold text-white">
              {current.jobPositionName ??
                "Não informado"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Setor
            </p>

            <p className="mt-2 font-semibold text-white">
              {current.departmentName ??
                "Não informado"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Equipe
            </p>

            <p className="mt-2 font-semibold text-white">
              {current.teamName ??
                "Não informada"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <BriefcaseBusiness className="size-5 text-violet-400" />

          <p className="mt-4 font-bold text-white">
            Meu espelho de ponto
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulte seus horários,
            totais e pendências.
          </p>

          <Link
            href={`/employee/${companyId}/timesheet`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-violet-500/30 px-4 text-xs font-bold text-violet-300 transition hover:bg-violet-500/10"
          >
            Abrir espelho
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <KeyRound className="size-5 text-amber-400" />

          <p className="mt-4 font-bold text-white">
            Alterar minha senha
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Atualize sua senha de acesso
            sempre que necessário.
          </p>

          <Link
            href="/change-password"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-amber-500/30 px-4 text-xs font-bold text-amber-300 transition hover:bg-amber-500/10"
          >
            Alterar senha
          </Link>
        </div>
      </section>

      <div className="mt-6 hidden">
        <CalendarDays />
        <UsersRound />
      </div>
    </div>
  );
}