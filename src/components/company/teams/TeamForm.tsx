"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  Team,
  TeamActionState,
  TeamDepartmentOption,
  TeamResponsibleOption,
} from "@/types/team";

const initialState: TeamActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

type TeamFormProps = {
  action: (
    previousState: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;

  team?: Team;

  departments: TeamDepartmentOption[];

  managers: TeamResponsibleOption[];

  supervisors: TeamResponsibleOption[];

  cancelHref: string;
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    company_admin: "Administrador",
    hr: "RH",
    manager: "Gestor",
    supervisor: "Supervisor",
  };

  return labels[role] ?? role;
}

export function TeamForm({
  action,
  team,
  departments,
  managers,
  supervisors,
  cancelHref,
}: TeamFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialState,
  );

  const nameError =
    state.fieldErrors.name?.[0];

  const descriptionError =
    state.fieldErrors.description?.[0];

  const departmentError =
    state.fieldErrors.departmentId?.[0];

  const managerError =
    state.fieldErrors.managerMembershipId?.[0];

  const supervisorError =
    state.fieldErrors
      .supervisorMembershipId?.[0];

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="name"
          className="text-sm font-semibold text-slate-200"
        >
          Nome da equipe
        </label>

        <input
          id="name"
          name="name"
          defaultValue={team?.name}
          required
          minLength={2}
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(nameError)}
          aria-describedby={
            nameError
              ? "team-name-error"
              : undefined
          }
          placeholder="Ex.: Equipe Operacional A"
          className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {nameError ? (
          <p
            id="team-name-error"
            className="mt-2 text-sm text-red-400"
          >
            {nameError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="departmentId"
          className="text-sm font-semibold text-slate-200"
        >
          Setor{" "}
          <span className="font-normal text-slate-500">
            (opcional)
          </span>
        </label>

        <select
          id="departmentId"
          name="departmentId"
          defaultValue={
            team?.departmentId ?? ""
          }
          aria-invalid={Boolean(
            departmentError,
          )}
          className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="">
            Nenhum setor vinculado
          </option>

          {departments.map((department) => (
            <option
              key={department.id}
              value={department.id}
            >
              {department.name}
            </option>
          ))}
        </select>

        {departments.length === 0 ? (
          <p className="mt-2 text-xs text-amber-300">
            Nenhum setor ativo cadastrado. A
            equipe poderá ser criada sem setor.
          </p>
        ) : null}

        {departmentError ? (
          <p className="mt-2 text-sm text-red-400">
            {departmentError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="managerMembershipId"
            className="text-sm font-semibold text-slate-200"
          >
            Gestor responsável{" "}
            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <select
            id="managerMembershipId"
            name="managerMembershipId"
            defaultValue={
              team?.managerMembershipId ?? ""
            }
            aria-invalid={Boolean(
              managerError,
            )}
            className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">
              Nenhum gestor definido
            </option>

            {managers.map((manager) => (
              <option
                key={manager.membershipId}
                value={manager.membershipId}
              >
                {manager.fullName} —{" "}
                {getRoleLabel(manager.role)}
              </option>
            ))}
          </select>

          {managerError ? (
            <p className="mt-2 text-sm text-red-400">
              {managerError}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="supervisorMembershipId"
            className="text-sm font-semibold text-slate-200"
          >
            Supervisor responsável{" "}
            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <select
            id="supervisorMembershipId"
            name="supervisorMembershipId"
            defaultValue={
              team?.supervisorMembershipId ??
              ""
            }
            aria-invalid={Boolean(
              supervisorError,
            )}
            className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">
              Nenhum supervisor definido
            </option>

            {supervisors.map(
              (supervisor) => (
                <option
                  key={
                    supervisor.membershipId
                  }
                  value={
                    supervisor.membershipId
                  }
                >
                  {supervisor.fullName} —{" "}
                  {getRoleLabel(
                    supervisor.role,
                  )}
                </option>
              ),
            )}
          </select>

          {supervisorError ? (
            <p className="mt-2 text-sm text-red-400">
              {supervisorError}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-semibold text-slate-200"
        >
          Descrição{" "}
          <span className="font-normal text-slate-500">
            (opcional)
          </span>
        </label>

        <textarea
          id="description"
          name="description"
          defaultValue={
            team?.description ?? ""
          }
          maxLength={1000}
          rows={5}
          aria-invalid={Boolean(
            descriptionError,
          )}
          placeholder="Descreva a finalidade, área de atuação ou observações da equipe."
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {descriptionError ? (
          <p className="mt-2 text-sm text-red-400">
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
          idleText={
            team
              ? "Salvar alterações"
              : "Cadastrar equipe"
          }
          pendingText={
            team
              ? "Salvando..."
              : "Cadastrando..."
          }
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}