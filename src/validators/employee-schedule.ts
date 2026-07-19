import { z } from "zod";

export const employeeScheduleAssignmentSchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    employeeId: z
      .string()
      .uuid("Funcionário inválido."),

    workScheduleId: z
      .string()
      .uuid("Selecione uma jornada válida."),

    startsOn: z
      .string()
      .trim()
      .min(
        1,
        "Informe a data de início da jornada.",
      )
      .refine((value) => {
        const date = new Date(
          `${value}T12:00:00`,
        );

        return !Number.isNaN(
          date.getTime(),
        );
      }, "Informe uma data de início válida."),

    reason: z
      .string()
      .trim()
      .min(
        3,
        "Informe uma justificativa com pelo menos 3 caracteres.",
      )
      .max(
        500,
        "A justificativa deve ter no máximo 500 caracteres.",
      ),
  });