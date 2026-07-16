import { z } from "zod";

import { onlyDigits } from "@/utils/company";

export const companyAdministratorSchema = z
  .object({
    companyId: z
      .string()
      .uuid("Identificador da empresa inválido."),

    fullName: z
      .string()
      .trim()
      .min(2, "Informe o nome completo.")
      .max(150, "O nome informado é muito longo."),

    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail.")
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
        "Informe um telefone válido com DDD.",
      ),

    temporaryPassword: z
      .string()
      .min(
        8,
        "A senha provisória deve possuir pelo menos 8 caracteres.",
      )
      .max(
        128,
        "A senha provisória ultrapassou o limite permitido.",
      )
      .regex(
        /[A-Z]/,
        "A senha precisa possuir ao menos uma letra maiúscula.",
      )
      .regex(
        /[a-z]/,
        "A senha precisa possuir ao menos uma letra minúscula.",
      )
      .regex(
        /\d/,
        "A senha precisa possuir ao menos um número.",
      ),

    confirmTemporaryPassword: z.string(),
  })
  .superRefine((data, context) => {
    if (
      data.temporaryPassword !==
      data.confirmTemporaryPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmTemporaryPassword"],
        message: "As senhas informadas não coincidem.",
      });
    }
  });