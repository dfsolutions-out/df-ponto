"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import { changeTeamStatusAction } from "@/actions/teams";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { TeamStatusActionState } from "@/types/team";

const initialState: TeamStatusActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type TeamStatusFormProps = {
  companyId: string;
  teamId: string;
  teamName: string;
  isActive: boolean;
};

export function TeamStatusForm({
  companyId,
  teamId,
  teamName,
  isActive,
}: TeamStatusFormProps) {
  const [open, setOpen] = useState(false);

  const [state, action] = useActionState(
    changeTeamStatusAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      window.location.reload();
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-bold transition",
          isActive
            ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
        ].join(" ")}
      >
        {isActive ? "Inativar" : "Reativar"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActive
            ? "Inativar equipe"
            : "Reativar equipe"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isActive
            ? `A equipe “${teamName}” deixará de aparecer nas seleções operacionais, mas seu histórico será preservado.`
            : `A equipe “${teamName}” voltará a ficar disponível para uso.`}
        </p>

        <form
          action={action}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="companyId"
            value={companyId}
          />

          <input
            type="hidden"
            name="teamId"
            value={teamId}
          />

          <input
            type="hidden"
            name="isActive"
            value={String(!isActive)}
          />

          <div>
            <label
              htmlFor={`team-reason-${teamId}`}
              className="text-sm font-semibold"
            >
              Justificativa
            </label>

            <textarea
              id={`team-reason-${teamId}`}
              name="reason"
              required
              minLength={3}
              maxLength={300}
              rows={4}
              placeholder="Informe o motivo desta alteração."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.reason?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.reason[0]}
              </p>
            ) : null}
          </div>

          {state.message && !state.success ? (
            <p
              role="alert"
              className="text-sm text-red-400"
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>

            <SubmitButton
              idleText={
                isActive
                  ? "Confirmar inativação"
                  : "Confirmar reativação"
              }
              pendingText="Processando..."
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            />
          </div>
        </form>
      </div>
    </div>
  );
}