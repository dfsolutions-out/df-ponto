"use client";

import { useActionState } from "react";

import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/actions/password";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: ChangePasswordActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialState,
  );

  const passwordError =
    state.fieldErrors.password?.[0];

  const confirmPasswordError =
    state.fieldErrors.confirmPassword?.[0];

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
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Nova senha
        </label>

        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="Digite sua nova senha"
          error={Boolean(passwordError)}
          aria-describedby={
            passwordError
              ? "password-error"
              : undefined
          }
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

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Confirmar nova senha
        </label>

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="Repita sua nova senha"
          error={Boolean(
            confirmPasswordError,
          )}
          aria-describedby={
            confirmPasswordError
              ? "confirmPassword-error"
              : undefined
          }
        />

        {confirmPasswordError ? (
          <p
            id="confirmPassword-error"
            className="mt-2 text-sm text-red-400"
          >
            {confirmPasswordError}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <p className="text-xs leading-5 text-slate-500">
          Use pelo menos 8 caracteres, incluindo uma letra
          maiúscula, uma minúscula, um número e um caractere
          especial.
        </p>
      </div>

      <SubmitButton
        idleText="Salvar nova senha"
        pendingText="Atualizando senha..."
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}