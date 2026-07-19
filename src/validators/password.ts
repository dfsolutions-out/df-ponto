import { z } from "zod";

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        8,
        "A nova senha deve possuir pelo menos 8 caracteres.",
      )
      .max(
        128,
        "A senha ultrapassou o limite permitido.",
      )
      .regex(
        /[A-Z]/,
        "A senha deve possuir ao menos uma letra maiúscula.",
      )
      .regex(
        /[a-z]/,
        "A senha deve possuir ao menos uma letra minúscula.",
      )
      .regex(
        /\d/,
        "A senha deve possuir ao menos um número.",
      )
      .regex(
        /[^A-Za-z0-9]/,
        "A senha deve possuir ao menos um caractere especial.",
      ),

    confirmPassword: z.string(),
  })
  .superRefine((data, context) => {
    if (
      data.password !== data.confirmPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message:
          "As senhas informadas não coincidem.",
      });
    }
  });