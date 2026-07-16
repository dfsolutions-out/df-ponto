"use client";

import type { FormEvent } from "react";
import { useActionState } from "react";

import {
  createCompanyAction,
  updateCompanyAction,
} from "@/actions/companies";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  CompanyActionState,
  CompanyDetails,
} from "@/types/company";
import {
  formatCnpj,
  formatCurrencyFromInput,
  formatPhone,
  formatPostalCode,
} from "@/utils/company";

const initialState: CompanyActionState = {
  success: false,
  message: null,
  fieldErrors: {},
};

const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  defaultValue?: string;
  error?: string;
  onInput?: (event: FormEvent<HTMLInputElement>) => void;
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
  maxLength,
  defaultValue,
  error,
  onInput,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        {label}

        {required ? (
          <span className="ml-1 text-blue-400">*</span>
        ) : null}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        onInput={onInput}
        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />

      {error ? (
        <p
          id={`${name}-error`}
          className="mt-2 text-sm text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CompanyFormProps = {
  company?: CompanyDetails;
};

export function CompanyForm({
  company,
}: CompanyFormProps) {
  const action = company
    ? updateCompanyAction.bind(null, company.id)
    : createCompanyAction;

  const [state, formAction] = useActionState(
    action,
    initialState,
  );

  const error = (field: string) =>
    state.fieldErrors[field]?.[0];

  const cancelHref = company
    ? `/master/companies/${company.id}`
    : "/master/companies";

  return (
    <form action={formAction} className="space-y-8">
      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Identificação
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Dados da empresa
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Informações jurídicas e comerciais da empresa cliente.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Field
            label="Razão social"
            name="legalName"
            defaultValue={company?.legalName}
            placeholder="Empresa Exemplo Serviços Ltda."
            required
            maxLength={200}
            autoComplete="organization"
            error={error("legalName")}
          />

          <Field
            label="Nome fantasia"
            name="tradeName"
            defaultValue={company?.tradeName}
            placeholder="Empresa Exemplo"
            required
            maxLength={200}
            error={error("tradeName")}
          />

          <Field
            label="CNPJ"
            name="cnpj"
            defaultValue={
              company ? formatCnpj(company.cnpj) : undefined
            }
            placeholder="00.000.000/0000-00"
            required
            maxLength={18}
            error={error("cnpj")}
            onInput={(event) => {
              event.currentTarget.value = formatCnpj(
                event.currentTarget.value,
              );
            }}
          />

          <Field
            label="E-mail da empresa"
            name="email"
            type="email"
            defaultValue={company?.email}
            placeholder="contato@empresa.com.br"
            required
            maxLength={320}
            autoComplete="email"
            error={error("email")}
          />

          <Field
            label="Telefone da empresa"
            name="phone"
            type="tel"
            defaultValue={
              company
                ? formatPhone(company.phone)
                : undefined
            }
            placeholder="(21) 99999-9999"
            required
            maxLength={15}
            autoComplete="tel"
            error={error("phone")}
            onInput={(event) => {
              event.currentTarget.value = formatPhone(
                event.currentTarget.value,
              );
            }}
          />

          <Field
            label="Valor mensal por funcionário ativo"
            name="pricePerActiveEmployee"
            defaultValue={
              company
                ? company.pricePerActiveEmployee.toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )
                : undefined
            }
            placeholder="0,00"
            required
            maxLength={16}
            error={error("pricePerActiveEmployee")}
            onInput={(event) => {
              event.currentTarget.value =
                formatCurrencyFromInput(
                  event.currentTarget.value,
                );
            }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Contato
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Responsável pela empresa
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Field
            label="Nome do responsável"
            name="responsibleName"
            defaultValue={company?.responsibleName}
            placeholder="Nome completo"
            required
            maxLength={150}
            autoComplete="name"
            error={error("responsibleName")}
          />

          <Field
            label="E-mail do responsável"
            name="responsibleEmail"
            type="email"
            defaultValue={
              company?.responsibleEmail ?? undefined
            }
            placeholder="responsavel@empresa.com.br"
            maxLength={320}
            error={error("responsibleEmail")}
          />

          <Field
            label="Telefone do responsável"
            name="responsiblePhone"
            type="tel"
            defaultValue={
              company?.responsiblePhone
                ? formatPhone(
                    company.responsiblePhone,
                  )
                : undefined
            }
            placeholder="(21) 99999-9999"
            maxLength={15}
            error={error("responsiblePhone")}
            onInput={(event) => {
              event.currentTarget.value = formatPhone(
                event.currentTarget.value,
              );
            }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Localização
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Endereço da empresa
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <Field
            label="CEP"
            name="postalCode"
            defaultValue={
              company?.postalCode
                ? formatPostalCode(company.postalCode)
                : undefined
            }
            placeholder="00000-000"
            required
            maxLength={9}
            autoComplete="postal-code"
            error={error("postalCode")}
            onInput={(event) => {
              event.currentTarget.value =
                formatPostalCode(
                  event.currentTarget.value,
                );
            }}
          />

          <Field
            label="Logradouro"
            name="street"
            defaultValue={company?.street}
            placeholder="Rua, avenida ou estrada"
            required
            maxLength={200}
            autoComplete="street-address"
            error={error("street")}
          />

          <Field
            label="Número"
            name="streetNumber"
            defaultValue={company?.streetNumber}
            placeholder="123 ou S/N"
            required
            maxLength={30}
            error={error("streetNumber")}
          />

          <Field
            label="Complemento"
            name="addressComplement"
            defaultValue={
              company?.addressComplement ?? undefined
            }
            placeholder="Sala, bloco, andar..."
            maxLength={150}
            error={error("addressComplement")}
          />

          <Field
            label="Bairro"
            name="district"
            defaultValue={company?.district}
            placeholder="Nome do bairro"
            required
            maxLength={200}
            error={error("district")}
          />

          <Field
            label="Cidade"
            name="city"
            defaultValue={company?.city}
            placeholder="Nome da cidade"
            required
            maxLength={200}
            autoComplete="address-level2"
            error={error("city")}
          />

          <div>
            <label
              htmlFor="state"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Estado
              <span className="ml-1 text-blue-400">*</span>
            </label>

            <select
              id="state"
              name="state"
              required
              defaultValue={company?.state ?? ""}
              aria-invalid={Boolean(error("state"))}
              aria-describedby={
                error("state")
                  ? "state-error"
                  : undefined
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="" disabled>
                Selecione
              </option>

              {brazilianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            {error("state") ? (
              <p
                id="state-error"
                className="mt-2 text-sm text-red-400"
              >
                {error("state")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <label
          htmlFor="internalNotes"
          className="block text-sm font-medium text-slate-200"
        >
          Observações internas
        </label>

        <p className="mt-1 text-xs text-slate-500">
          Este conteúdo será visível apenas para a administração
          Master.
        </p>

        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={5}
          maxLength={5000}
          defaultValue={company?.internalNotes ?? ""}
          placeholder="Informações comerciais, implantação, negociação ou observações internas..."
          aria-invalid={Boolean(
            error("internalNotes"),
          )}
          aria-describedby={
            error("internalNotes")
              ? "internalNotes-error"
              : undefined
          }
          className="mt-4 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        {error("internalNotes") ? (
          <p
            id="internalNotes-error"
            className="mt-2 text-sm text-red-400"
          >
            {error("internalNotes")}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 px-6 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </a>

        <SubmitButton
          idleText={
            company
              ? "Salvar alterações"
              : "Cadastrar empresa"
          }
          pendingText={
            company
              ? "Salvando..."
              : "Cadastrando..."
          }
          className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </form>
  );
}