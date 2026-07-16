import { z } from "zod";

import {
  isValidCnpj,
  onlyDigits,
} from "@/utils/company";

const requiredText = (
  fieldName: string,
  minimumLength = 2,
  maximumLength = 200,
) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${fieldName}.`)
    .min(
      minimumLength,
      `${fieldName} deve possuir pelo menos ${minimumLength} caracteres.`,
    )
    .max(
      maximumLength,
      `${fieldName} ultrapassou o limite permitido.`,
    );

const optionalText = (maximumLength: number) =>
  z
    .string()
    .trim()
    .max(
      maximumLength,
      "O conteúdo ultrapassou o limite permitido.",
    )
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(320, "O e-mail informado é muito longo.")
  .refine(
    (value) =>
      value.length === 0 ||
      z.string().email().safeParse(value).success,
    "Informe um e-mail válido.",
  )
  .transform((value) => value.toLowerCase() || null);

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

export const companySchema = z.object({
  legalName: requiredText("a razão social"),

  tradeName: requiredText("o nome fantasia"),

  cnpj: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) => value.length === 14,
      "O CNPJ deve possuir 14 números.",
    )
    .refine(isValidCnpj, "Informe um CNPJ válido."),

  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail da empresa.")
    .max(320, "O e-mail informado é muito longo.")
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),

  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) =>
        value.length === 10 || value.length === 11,
      "Informe um telefone com DDD.",
    ),

  responsibleName: requiredText(
    "o nome do responsável",
    2,
    150,
  ),

  responsibleEmail: optionalEmail,

  responsiblePhone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) =>
        value.length === 0 ||
        value.length === 10 ||
        value.length === 11,
      "Informe um telefone válido com DDD.",
    )
    .transform((value) => value || null),

  postalCode: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) => value.length === 8,
      "Informe um CEP com 8 números.",
    ),

  street: requiredText("o endereço"),

  streetNumber: requiredText(
    "o número do endereço",
    1,
    30,
  ),

  addressComplement: optionalText(150),

  district: requiredText("o bairro"),

  city: requiredText("a cidade"),

  state: z.enum(brazilianStates, {
    message: "Selecione o estado.",
  }),

  pricePerActiveEmployee: z
    .string()
    .trim()
    .min(1, "Informe o valor por funcionário.")
    .transform((value) => {
      const normalized = value
        .replace(/\./g, "")
        .replace(",", ".");

      return Number(normalized);
    })
    .refine(
      (value) => Number.isFinite(value),
      "Informe um valor válido.",
    )
    .refine(
      (value) => value >= 0,
      "O valor não pode ser negativo.",
    )
    .refine(
      (value) => value <= 9999999999.99,
      "O valor informado ultrapassou o limite permitido.",
    ),

  internalNotes: optionalText(5000),
});

export type CompanyInput = z.infer<
  typeof companySchema
>;
export const companyStatusSchema = z.object({
  companyId: z
    .string()
    .uuid("Identificador da empresa inválido."),

  status: z.enum([
    "active",
    "suspended",
    "cancelled",
  ]),

  reason: z
    .string()
    .trim()
    .min(
      5,
      "Informe uma justificativa com pelo menos 5 caracteres.",
    )
    .max(
      1000,
      "A justificativa ultrapassou o limite permitido.",
    ),
});