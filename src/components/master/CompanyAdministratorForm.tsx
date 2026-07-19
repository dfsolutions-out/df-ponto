"use client";

import { useActionState } from "react";

import { createCompanyAdministratorAction } from "@/actions/company-users";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { CompanyUserActionState } from "@/types/company-user";
import { formatPhone } from "@/utils/company";

const initialState: CompanyUserActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type CompanyAdministratorFormProps = {
  companyId: string;
};

export function CompanyAdministratorForm({
  companyId,
}: CompanyAdministratorFormProps) {
  const [state, formAction] = useActionState(
    createCompanyAdministratorAction,
    initialState,
  );

  const error = (
    field: keyof CompanyUserActionState["fieldErrors"],
  ) => state.fieldErrors[field]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
          Identificação
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Dados do administrador
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Caso o e-mail já exista na plataforma, o mesmo login será
          vinculado a esta empresa.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nome completo
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              minLength={2}
              maxLength={150}
              autoComplete="name"
              placeholder="Nome completo"
              aria-invalid={Boolean(error("fullName"))}
              aria-describedby={
                error("fullName")
                  ? "fullName-error"
                  : undefined
              }
              className={[
                "h-12 w-full rounded-xl border bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600",
                error("fullName")
                  ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
              ].join(" ")}
            />

            {error("fullName") ? (
              <p
                id="fullName-error"
                className="mt-2 text-sm text-red-400"
              >
                {error("fullName")}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              E-mail de acesso
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="administrador@empresa.com.br"
              aria-invalid={Boolean(error("email"))}
              aria-describedby={
                error("email")
                  ? "email-error"
                  : undefined
              }
              className={[
                "h-12 w-full rounded-xl border bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600",
                error("email")
                  ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
              ].join(" ")}
            />

            {error("email") ? (
              <p
                id="email-error"
                className="mt-2 text-sm text-red-400"
              >
                {error("email")}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Telefone
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={15}
              autoComplete="tel"
              placeholder="(21) 99999-9999"
              aria-invalid={Boolean(error("phone"))}
              aria-describedby={
                error("phone")
                  ? "phone-error"
                  : undefined
              }
              onInput={(event) => {
                event.currentTarget.value = formatPhone(
                  event.currentTarget.value,
                );
              }}
              className={[
                "h-12 w-full rounded-xl border bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600",
                error("phone")
                  ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
              ].join(" ")}
            />

            {error("phone") ? (
              <p
                id="phone-error"
                className="mt-2 text-sm text-red-400"
              >
                {error("phone")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
          Primeiro acesso
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Senha provisória
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          A senha será usada apenas quando o e-mail ainda não possuir
          uma conta. O usuário deverá alterá-la no primeiro acesso.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="temporaryPassword"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Senha provisória
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <PasswordInput
              id="temporaryPassword"
              name="temporaryPassword"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              error={Boolean(
                error("temporaryPassword"),
              )}
              aria-describedby={
                error("temporaryPassword")
                  ? "temporaryPassword-error"
                  : undefined
              }
            />

            {error("temporaryPassword") ? (
              <p
                id="temporaryPassword-error"
                className="mt-2 text-sm text-red-400"
              >
                {error("temporaryPassword")}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirmTemporaryPassword"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Confirmar senha
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <PasswordInput
              id="confirmTemporaryPassword"
              name="confirmTemporaryPassword"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Repita a senha provisória"
              error={Boolean(
                error("confirmTemporaryPassword"),
              )}
              aria-describedby={
                error("confirmTemporaryPassword")
                  ? "confirmTemporaryPassword-error"
                  : undefined
              }
            />

            {error("confirmTemporaryPassword") ? (
              <p
                id="confirmTemporaryPassword-error"
                className="mt-2 text-sm text-red-400"
              >
                {error(
                  "confirmTemporaryPassword",
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
          <p className="text-xs leading-5 text-slate-500">
            A senha deve possuir pelo menos 8 caracteres, incluindo
            uma letra maiúscula, uma letra minúscula e um número.
          </p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
        <a
          href={`/master/companies/${companyId}/users`}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-6 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>

        <SubmitButton
          idleText="Criar administrador"
          pendingText="Criando acesso..."
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </form>
  );
}