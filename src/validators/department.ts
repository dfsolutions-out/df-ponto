import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(500, "A descrição deve ter no máximo 500 caracteres.")
    .optional()
    .transform((value) => value || null),
});

export const departmentStatusSchema = z.object({
  departmentId: z.string().uuid("Setor inválido."),
  companyId: z.string().uuid("Empresa inválida."),
  isActive: z.enum(["true", "false"]).transform(
    (value) => value === "true",
  ),
  reason: z
    .string()
    .trim()
    .min(3, "Informe uma justificativa com pelo menos 3 caracteres.")
    .max(300, "A justificativa deve ter no máximo 300 caracteres."),
});
