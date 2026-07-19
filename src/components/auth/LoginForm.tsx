"use client";

import { useActionState } from "react";

import {
  loginAction,
  type LoginActionState,
} from "@/actions/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialLoginState: LoginActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

export function LoginForm() {
  const [state, formAction] = useActionState(
    loginAction,
    initialLoginState,
  );

  const emailError =
    state.fieldErrors.email?.[0];

  const passwordError =
    state.fieldErrors.password?.[0];

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5"
    >
      {state.message ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          E-mail
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={320}
          aria-invalid={Boolean(emailError)}
          aria-describedby={
            emailError
              ? "email-error"
              : undefined
          }
          placeholder="seuemail@empresa.com.br"
          className={[
            "h-12 w-full rounded-xl border bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600",
            emailError
              ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
          ].join(" ")}
        />

        {emailError ? (
          <p
            id="email-error"
            className="mt-2 text-sm text-red-400"
          >
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Senha
        </label>

        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
          error={Boolean(passwordError)}
          aria-describedby={
            passwordError
              ? "password-error"
              : undefined
          }
          placeholder="Digite sua senha"
        />

        {passwordError ? (
          <p
            id="password-error"
            className="mt-2 text-sm text-red-400"
          >
            {passwordError}
          </p>
        ) : null}
      </div>

      <SubmitButton
        idleText="Entrar no painel"
        pendingText="Validando acesso..."
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}