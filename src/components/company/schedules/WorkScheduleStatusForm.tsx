"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import { changeWorkScheduleStatusAction } from "@/actions/work-schedules";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { WorkScheduleStatusActionState } from "@/types/work-schedule";

const initialState: WorkScheduleStatusActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type WorkScheduleStatusFormProps = {
  companyId: string;
  scheduleId: string;
  scheduleName: string;
  isActive: boolean;
};

export function WorkScheduleStatusForm({
  companyId,
  scheduleId,
  scheduleName,
  isActive,
}: WorkScheduleStatusFormProps) {
  const [open, setOpen] = useState(false);

  const [state, action] = useActionState(
    changeWorkScheduleStatusAction,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActive
            ? "Inativar jornada"
            : "Reativar jornada"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isActive
            ? `A jornada “${scheduleName}” deixará de ficar disponível para novas atribuições. O histórico será preservado.`
            : `A jornada “${scheduleName}” voltará a ficar disponível para configuração e atribuição.`}
        </p>

        <form
          action={action}
          className="mt-6 space-y-5"
        >
          <input
            type="hidden"
            name="companyId"
            value={companyId}
          />

          <input
            type="hidden"
            name="scheduleId"
            value={scheduleId}
          />

          <input
            type="hidden"
            name="isActive"
            value={String(!isActive)}
          />

          <div>
            <label
              htmlFor={`schedule-reason-${scheduleId}`}
              className="text-sm font-semibold"
            >
              Justificativa
            </label>

            <textarea
              id={`schedule-reason-${scheduleId}`}
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
              className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
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
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            />
          </div>
        </form>
      </div>
    </div>
  );
}