import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido.")
    .max(320, "O e-mail informado é muito longo.")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(128, "A senha informada é muito longa."),
});

export type LoginInput = z.infer<typeof loginSchema>;