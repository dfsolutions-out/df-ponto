import { z } from "zod";

const booleanFormSchema = z
  .union([
    z.literal("true"),
    z.literal("false"),
    z.literal("on"),
    z.literal(""),
    z.null(),
  ])
  .transform(
    (value) => value === "true" || value === "on",
  );

export const workScheduleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Informe um nome com pelo menos 2 caracteres.",
    )
    .max(
      120,
      "O nome deve ter no máximo 120 caracteres.",
    ),

  description: z
    .string()
    .trim()
    .max(
      1000,
      "A descrição deve ter no máximo 1.000 caracteres.",
    )
    .optional()
    .transform((value) => value || null),

  scheduleType: z.enum([
    "fixed_weekly",
    "rotating",
    "flexible",
    "on_call",
  ]),

  cycleLengthDays: z.coerce
    .number()
    .int("Informe um número inteiro.")
    .min(1, "O ciclo deve possuir pelo menos 1 dia.")
    .max(31, "O ciclo deve possuir no máximo 31 dias."),

  expectedWeeklyHours: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) => {
        if (value === null) {
          return true;
        }

        const number = Number(
          value.replace(",", "."),
        );

        return (
          Number.isFinite(number) &&
          number >= 0 &&
          number <= 168
        );
      },
      "Informe uma carga semanal entre 0 e 168 horas.",
    ),

  isNightShift: booleanFormSchema,
});

export const workScheduleStatusSchema = z.object({
  companyId: z.string().uuid("Empresa inválida."),

  scheduleId: z.string().uuid("Jornada inválida."),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),

  reason: z
    .string()
    .trim()
    .min(
      3,
      "Informe uma justificativa com pelo menos 3 caracteres.",
    )
    .max(
      300,
      "A justificativa deve ter no máximo 300 caracteres.",
    ),
});