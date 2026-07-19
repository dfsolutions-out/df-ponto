import { z } from "zod";

function nullableNumberSchema(
  minimum: number,
  maximum: number,
  message: string,
) {
  return z
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

      const number = Number(
        String(value).replace(",", "."),
      );

      return number;
    })
    .refine(
      (value) =>
        value === null ||
        (
          Number.isFinite(value) &&
          value >= minimum &&
          value <= maximum
        ),
      message,
    );
}

const baseWorkLocationSchema = z.object({
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

  locationType: z.enum([
    "fixed",
    "temporary",
    "external",
    "route",
    "free",
  ]),

  address: z
    .string()
    .trim()
    .max(
      500,
      "O endereço deve ter no máximo 500 caracteres.",
    )
    .optional()
    .transform((value) => value || null),

  latitude: nullableNumberSchema(
    -90,
    90,
    "Informe uma latitude entre -90 e 90.",
  ),

  longitude: nullableNumberSchema(
    -180,
    180,
    "Informe uma longitude entre -180 e 180.",
  ),

  radiusMeters: z.coerce
    .number()
    .int("Informe um número inteiro.")
    .min(
      30,
      "O raio mínimo permitido é de 30 metros.",
    )
    .max(
      50000,
      "O raio máximo permitido é de 50.000 metros.",
    ),

  minimumAccuracyMeters: z.coerce
    .number()
    .int("Informe um número inteiro.")
    .min(
      5,
      "A precisão mínima deve ser de pelo menos 5 metros.",
    )
    .max(
      5000,
      "A precisão máxima permitida é de 5.000 metros.",
    ),

  outsideRadiusAction: z.enum([
    "block",
    "allow_with_alert",
    "require_justification",
  ]),

  startsOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),

  endsOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),

  notes: z
    .string()
    .trim()
    .max(
      2000,
      "As observações devem ter no máximo 2.000 caracteres.",
    )
    .optional()
    .transform((value) => value || null),
});

export const workLocationSchema =
  baseWorkLocationSchema.superRefine(
    (data, context) => {
      const requiresCoordinates =
        data.locationType === "fixed" ||
        data.locationType === "temporary";

      if (
        requiresCoordinates &&
        data.latitude === null
      ) {
        context.addIssue({
          code: "custom",
          path: ["latitude"],
          message:
            "Informe a latitude deste local.",
        });
      }

      if (
        requiresCoordinates &&
        data.longitude === null
      ) {
        context.addIssue({
          code: "custom",
          path: ["longitude"],
          message:
            "Informe a longitude deste local.",
        });
      }

      if (
        (
          data.latitude === null &&
          data.longitude !== null
        )
        ||
        (
          data.latitude !== null &&
          data.longitude === null
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["latitude"],
          message:
            "Latitude e longitude devem ser informadas juntas.",
        });
      }

      if (
        data.locationType ===
        "temporary"
      ) {
        if (!data.startsOn) {
          context.addIssue({
            code: "custom",
            path: ["startsOn"],
            message:
              "Informe a data inicial do local temporário.",
          });
        }

        if (!data.endsOn) {
          context.addIssue({
            code: "custom",
            path: ["endsOn"],
            message:
              "Informe a data final do local temporário.",
          });
        }
      }

      if (
        data.startsOn &&
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
    },
  );

export const workLocationStatusSchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    locationId: z
      .string()
      .uuid("Local inválido."),

    isActive: z
      .enum(["true", "false"])
      .transform(
        (value) => value === "true",
      ),

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