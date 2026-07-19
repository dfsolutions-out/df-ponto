"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Department, DepartmentActionState } from "@/types/department";

const initialState: DepartmentActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type DepartmentFormProps = {
  action: (
    previousState: DepartmentActionState,
    formData: FormData,
  ) => Promise<DepartmentActionState>;
  department?: Department;
  cancelHref: string;
};

export function DepartmentForm({
  action,
  department,
  cancelHref,
}: DepartmentFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  const nameError = state.fieldErrors.name?.[0];
  const descriptionError = state.fieldErrors.description?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="text-sm font-semibold text-slate-200">
          Nome do setor
        </label>
        <input
          id="name"
          name="name"
          defaultValue={department?.name}
          required
          minLength={2}
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "name-error" : undefined}
          placeholder="Ex.: Administrativo"
          className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        {nameError ? (
          <p id="name-error" className="mt-2 text-sm text-red-400">
            {nameError}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-semibold text-slate-200">
          Descrição <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={department?.description ?? ""}
          maxLength={500}
          rows={5}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={descriptionError ? "description-error" : undefined}
          placeholder="Descreva a finalidade ou responsabilidade deste setor."
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        {descriptionError ? (
          <p id="description-error" className="mt-2 text-sm text-red-400">
            {descriptionError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>
        <SubmitButton
          idleText={department ? "Salvar alterações" : "Cadastrar setor"}
          pendingText={department ? "Salvando..." : "Cadastrando..."}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}
