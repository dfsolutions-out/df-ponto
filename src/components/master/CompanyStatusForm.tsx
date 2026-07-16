"use client";

import { useActionState } from "react";

import { changeCompanyStatusAction } from "@/actions/companies";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  CompanyStatus,
  CompanyStatusActionState,
} from "@/types/company";

const initialState: CompanyStatusActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type CompanyStatusFormProps = {
  companyId: string;
  targetStatus: CompanyStatus;
  title: string;
  description: string;
  buttonText: string;
  pendingText: string;
  buttonClassName: string;
};

export function CompanyStatusForm({
  companyId,
  targetStatus,
  title,
  description,
  buttonText,
  pendingText,
  buttonClassName,
}: CompanyStatusFormProps) {
  const [state, formAction] = useActionState(
    changeCompanyStatusAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
    >
      <input
        type="hidden"
        name="companyId"
        value={companyId}
      />

      <input
        type="hidden"
        name="status"
        value={targetStatus}
      />

      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {state.message ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.message}
        </div>
      ) : null}

      <div className="mt-4">
        <label
          htmlFor={`reason-${targetStatus}`}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Justificativa
        </label>

        <textarea
          id={`reason-${targetStatus}`}
          name="reason"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          placeholder="Informe o motivo desta alteração..."
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
        />

        {state.fieldErrors.reason?.[0] ? (
          <p className="mt-2 text-sm text-red-400">
            {state.fieldErrors.reason[0]}
          </p>
        ) : null}
      </div>

      <SubmitButton
        idleText={buttonText}
        pendingText={pendingText}
        className={buttonClassName}
      />
    </form>
  );
}