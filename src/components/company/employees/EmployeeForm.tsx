"use client";

import { useActionState, useMemo, useState } from "react";

import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  Employee,
  EmployeeActionState,
  EmployeeFormOptions,
} from "@/types/employee";

const initialState: EmployeeActionState = {
  success: false,
  message: null,
  employeeId: null,
  fieldErrors: {},
};

type EmployeeFormProps = {
  action: (
    previousState: EmployeeActionState,
    formData: FormData,
  ) => Promise<EmployeeActionState>;

  options: EmployeeFormOptions;

  employee?: Employee;

  cancelHref: string;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCpfInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3",
    )
    .replace(
      /^(\d{3})\.(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3-$4",
    );
}

function formatPhoneInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCpfInitial(value?: string): string {
  return value ? formatCpfInput(value) : "";
}

function formatPhoneInitial(value?: string): string {
  return value ? formatPhoneInput(value) : "";
}

export function EmployeeForm({
  action,
  options,
  employee,
  cancelHref,
}: EmployeeFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialState,
  );

  const [cpf, setCpf] = useState(
    formatCpfInitial(employee?.cpf),
  );

  const [phone, setPhone] = useState(
    formatPhoneInitial(employee?.phone),
  );

  const [grantAccess, setGrantAccess] =
    useState(false);

  const [departmentId, setDepartmentId] =
    useState(employee?.departmentId ?? "");

  const [teamId, setTeamId] = useState(
    employee?.teamId ?? "",
  );

  const availableTeams = useMemo(() => {
    if (!departmentId) {
      return options.teams;
    }

    return options.teams.filter(
      (team) =>
        !team.departmentId ||
        team.departmentId === departmentId,
    );
  }, [departmentId, options.teams]);

  const isEditing = Boolean(employee);

  function handleDepartmentChange(
    value: string,
  ): void {
    setDepartmentId(value);

    const currentTeam = options.teams.find(
      (team) => team.id === teamId,
    );

    if (
      currentTeam?.departmentId &&
      value &&
      currentTeam.departmentId !== value
    ) {
      setTeamId("");
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-7"
    >
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <section>
        <div className="mb-5">
          <h2 className="font-bold text-white">
            Dados pessoais
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informações de identificação e contato do
            funcionário.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="fullName"
              className="text-sm font-semibold text-slate-200"
            >
              Nome completo
            </label>

            <input
              id="fullName"
              name="fullName"
              defaultValue={employee?.fullName}
              required
              minLength={2}
              maxLength={160}
              autoFocus
              placeholder="Ex.: João da Silva"
              aria-invalid={Boolean(
                state.fieldErrors.fullName?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.fullName?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.fullName[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="cpf"
              className="text-sm font-semibold text-slate-200"
            >
              CPF
            </label>

            <input
              id="cpf"
              name="cpf"
              value={cpf}
              onChange={(event) =>
                setCpf(
                  formatCpfInput(
                    event.target.value,
                  ),
                )
              }
              required
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              placeholder="000.000.000-00"
              aria-invalid={Boolean(
                state.fieldErrors.cpf?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.cpf?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.cpf[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="registrationNumber"
              className="text-sm font-semibold text-slate-200"
            >
              Matrícula
            </label>

            <input
              id="registrationNumber"
              name="registrationNumber"
              defaultValue={
                employee?.registrationNumber
              }
              required
              maxLength={50}
              placeholder="Ex.: 000123"
              aria-invalid={Boolean(
                state.fieldErrors
                  .registrationNumber?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors
              .registrationNumber?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .registrationNumber[0]
                }
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-200"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              defaultValue={employee?.email}
              required
              maxLength={255}
              autoComplete="email"
              placeholder="funcionario@empresa.com.br"
              aria-invalid={Boolean(
                state.fieldErrors.email?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.email?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="text-sm font-semibold text-slate-200"
            >
              Telefone
            </label>

            <input
              id="phone"
              name="phone"
              value={phone}
              onChange={(event) =>
                setPhone(
                  formatPhoneInput(
                    event.target.value,
                  ),
                )
              }
              required
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              placeholder="(21) 99999-9999"
              aria-invalid={Boolean(
                state.fieldErrors.phone?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.phone?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.phone[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 pt-7">
        <div className="mb-5">
          <h2 className="font-bold text-white">
            Vínculo trabalhista
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Defina admissão e estrutura organizacional.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="admissionDate"
              className="text-sm font-semibold text-slate-200"
            >
              Data de admissão
            </label>

            <input
              id="admissionDate"
              name="admissionDate"
              type="date"
              defaultValue={
                employee?.admissionDate
              }
              required
              aria-invalid={Boolean(
                state.fieldErrors
                  .admissionDate?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors
              .admissionDate?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .admissionDate[0]
                }
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
              value={departmentId}
              onChange={(event) =>
                handleDepartmentChange(
                  event.target.value,
                )
              }
              aria-invalid={Boolean(
                state.fieldErrors
                  .departmentId?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">
                Nenhum setor selecionado
              </option>

              {options.departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ),
              )}
            </select>

            {state.fieldErrors
              .departmentId?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .departmentId[0]
                }
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="jobPositionId"
              className="text-sm font-semibold text-slate-200"
            >
              Cargo{" "}
              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <select
              id="jobPositionId"
              name="jobPositionId"
              defaultValue={
                employee?.jobPositionId ?? ""
              }
              aria-invalid={Boolean(
                state.fieldErrors
                  .jobPositionId?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">
                Nenhum cargo selecionado
              </option>

              {options.jobPositions.map(
                (position) => (
                  <option
                    key={position.id}
                    value={position.id}
                  >
                    {position.name}
                  </option>
                ),
              )}
            </select>

            {state.fieldErrors
              .jobPositionId?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {
                  state.fieldErrors
                    .jobPositionId[0]
                }
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="teamId"
              className="text-sm font-semibold text-slate-200"
            >
              Equipe{" "}
              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <select
              id="teamId"
              name="teamId"
              value={teamId}
              onChange={(event) =>
                setTeamId(event.target.value)
              }
              aria-invalid={Boolean(
                state.fieldErrors.teamId?.[0],
              )}
              className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">
                Nenhuma equipe selecionada
              </option>

              {availableTeams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>

            {state.fieldErrors.teamId?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.teamId[0]}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="notes"
              className="text-sm font-semibold text-slate-200"
            >
              Observações{" "}
              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <textarea
              id="notes"
              name="notes"
              defaultValue={employee?.notes ?? ""}
              maxLength={2000}
              rows={5}
              placeholder="Informações internas relevantes sobre o vínculo."
              aria-invalid={Boolean(
                state.fieldErrors.notes?.[0],
              )}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {state.fieldErrors.notes?.[0] ? (
              <p className="mt-2 text-sm text-red-400">
                {state.fieldErrors.notes[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {!isEditing ? (
        <section className="border-t border-slate-800 pt-7">
          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
            <input
              type="checkbox"
              name="grantAccess"
              value="true"
              checked={grantAccess}
              onChange={(event) =>
                setGrantAccess(
                  event.target.checked,
                )
              }
              className="mt-1 size-4 rounded border-slate-600 bg-slate-900 text-blue-600"
            />

            <span>
              <span className="block font-bold text-white">
                Criar acesso ao sistema
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                O funcionário receberá uma conta com
                papel de funcionário e deverá trocar a
                senha no primeiro acesso.
              </span>
            </span>
          </label>

          {grantAccess ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="temporaryPassword"
                  className="text-sm font-semibold text-slate-200"
                >
                  Senha provisória
                </label>

                <div className="mt-2">
                  <PasswordInput
                    id="temporaryPassword"
                    name="temporaryPassword"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    error={Boolean(
                      state.fieldErrors
                        .temporaryPassword?.[0],
                    )}
                    placeholder="Mínimo de 8 caracteres"
                  />
                </div>

                {state.fieldErrors
                  .temporaryPassword?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      state.fieldErrors
                        .temporaryPassword[0]
                    }
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="confirmTemporaryPassword"
                  className="text-sm font-semibold text-slate-200"
                >
                  Confirmar senha provisória
                </label>

                <div className="mt-2">
                  <PasswordInput
                    id="confirmTemporaryPassword"
                    name="confirmTemporaryPassword"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    error={Boolean(
                      state.fieldErrors
                        .confirmTemporaryPassword?.[0],
                    )}
                    placeholder="Repita a senha provisória"
                  />
                </div>

                {state.fieldErrors
                  .confirmTemporaryPassword?.[0] ? (
                  <p className="mt-2 text-sm text-red-400">
                    {
                      state.fieldErrors
                        .confirmTemporaryPassword[0]
                    }
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <input
                type="hidden"
                name="temporaryPassword"
                value=""
              />

              <input
                type="hidden"
                name="confirmTemporaryPassword"
                value=""
              />
            </>
          )}
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-7 sm:flex-row sm:justify-end">
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>

        <SubmitButton
          idleText={
            isEditing
              ? "Salvar alterações"
              : "Cadastrar funcionário"
          }
          pendingText={
            isEditing
              ? "Salvando..."
              : "Cadastrando..."
          }
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  );
}