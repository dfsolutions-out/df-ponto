"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import { changeEmployeeStatusAction } from "@/actions/employees";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  EmployeeStatus,
  EmployeeStatusActionState,
} from "@/types/employee";

const initialState: EmployeeStatusActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type EmployeeStatusFormProps = {
  companyId: string;
  employeeId: string;
  employeeName: string;
  currentStatus: EmployeeStatus;
};

const statusOptions: Array<{
  value: EmployeeStatus;
  label: string;
  description: string;
}> = [
  {
    value: "active",
    label: "Ativo",
    description:
      "Funcionário trabalhando normalmente e contabilizado na cobrança.",
  },
  {
    value: "on_leave",
    label: "Afastado",
    description:
      "Funcionário temporariamente afastado, com histórico preservado.",
  },
  {
    value: "blocked",
    label: "Bloqueado",
    description:
      "Funcionário preservado, mas impedido de acessar e operar.",
  },
  {
    value: "terminated",
    label: "Desligado",
    description:
      "Funcionário desligado, sem acesso e fora da cobrança.",
  },
];

export function EmployeeStatusForm({
  companyId,
  employeeId,
  employeeName,
  currentStatus,
}: EmployeeStatusFormProps) {
  const [open, setOpen] = useState(false);

  const [targetStatus, setTargetStatus] =
    useState<EmployeeStatus>(currentStatus);

  const [state, action] = useActionState(
    changeEmployeeStatusAction,
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
        onClick={() => {
          setTargetStatus(currentStatus);
          setOpen(true);
        }}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
      >
        Alterar status
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold">
          Alterar status do funcionário
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Atualize a situação trabalhista de{" "}
          <strong className="text-slate-200">
            {employeeName}
          </strong>
          . Nenhum registro será apagado.
        </p>

        <form action={action} className="mt-6 space-y-5">
          <input
            type="hidden"
            name="companyId"
            value={companyId}
          />

          <input
            type="hidden"
            name="employeeId"
            value={employeeId}
          />

          <div>
            <label
              htmlFor={`employee-status-${employeeId}`}
              className="text-sm font-semibold"
            >
              Novo status
            </label>

            <select
              id={`employee-status-${employeeId}`}
              name="status"
              value={targetStatus}
              onChange={(event) =>
                setTargetStatus(
                  event.target
                    .value as EmployeeStatus,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              {statusOptions.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {
                statusOptions.find(
                  (status) =>
                    status.value === targetStatus,
                )?.description
              }
            </p>
          </div>

          {targetStatus === "terminated" ? (
            <div>
              <label
                htmlFor={`termination-date-${employeeId}`}
                className="text-sm font-semibold"
              >
                Data de desligamento
              </label>

              <input
                id={`termination-date-${employeeId}`}
                name="terminationDate"
                type="date"
                required
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              {state.fieldErrors
                .terminationDate?.[0] ? (
                <p className="mt-2 text-sm text-red-400">
                  {
                    state.fieldErrors
                      .terminationDate[0]
                  }
                </p>
              ) : null}
            </div>
          ) : (
            <input
              type="hidden"
              name="terminationDate"
              value=""
            />
          )}

          <div>
            <label
              htmlFor={`employee-reason-${employeeId}`}
              className="text-sm font-semibold"
            >
              Justificativa
            </label>

            <textarea
              id={`employee-reason-${employeeId}`}
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>

            <SubmitButton
              idleText="Confirmar alteração"
              pendingText="Processando..."
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            />
          </div>
        </form>
      </div>
    </div>
  );
}