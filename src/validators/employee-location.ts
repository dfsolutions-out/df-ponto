import { z } from "zod";

const optionalRadiusSchema = z
  .union([
    z.literal(""),
    z.string(),
    z.number(),
    z.null(),
  ])
  .transform((value) => {
    if (
      value === "" ||
      value === null
    ) {
      return null;
    }

    return Number(value);
  })
  .refine(
    (value) =>
      value === null ||
      (
        Number.isInteger(value) &&
        value >= 30 &&
        value <= 50000
      ),
    "O raio individual deve estar entre 30 e 50.000 metros.",
  );

const optionalOutsideRadiusActionSchema =
  z
    .union([
      z.literal(""),
      z.enum([
        "block",
        "allow_with_alert",
        "require_justification",
      ]),
    ])
    .transform((value) =>
      value === "" ? null : value,
    );

export const employeeLocationAssignmentSchema =
  z
    .object({
      companyId: z
        .string()
        .uuid("Empresa inválida."),

      employeeId: z
        .string()
        .uuid("Funcionário inválido."),

      workLocationId: z
        .string()
        .uuid("Selecione um local válido."),

      isPrimary: z
        .enum(["true", "false"])
        .transform(
          (value) => value === "true",
        ),

      startsOn: z
        .string()
        .trim()
        .min(
          1,
          "Informe a data inicial.",
        ),

      endsOn: z
        .string()
        .trim()
        .optional()
        .transform(
          (value) => value || null,
        ),

      customRadiusMeters:
        optionalRadiusSchema,

      outsideRadiusActionOverride:
        optionalOutsideRadiusActionSchema,

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
    })
    .superRefine((data, context) => {
      if (
        data.endsOn &&
        data.endsOn < data.startsOn
      ) {
        context.addIssue({
          code: "custom",
          path: ["endsOn"],
          message:
            "A data final não pode ser anterior à inicial.",
        });
      }
    });

export const employeeLocationPrimarySchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    employeeId: z
      .string()
      .uuid("Funcionário inválido."),

    assignmentId: z
      .string()
      .uuid("Vínculo inválido."),

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

export const employeeLocationEndSchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    employeeId: z
      .string()
      .uuid("Funcionário inválido."),

    assignmentId: z
      .string()
      .uuid("Vínculo inválido."),

    endsOn: z
      .string()
      .trim()
      .min(
        1,
        "Informe a data de encerramento.",
      ),

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