import { z } from "zod";

function coordinateSchema(
  minimum: number,
  maximum: number,
  message: string,
) {
  return z
    .union([
      z.string(),
      z.number(),
    ])
    .transform((value) =>
      Number(
        String(value).replace(",", "."),
      ),
    )
    .refine(
      (value) =>
        Number.isFinite(value) &&
        value >= minimum &&
        value <= maximum,
      message,
    );
}

export const registerTimeEntrySchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    employeeId: z
      .string()
      .uuid("Funcionário inválido."),

    latitude: coordinateSchema(
      -90,
      90,
      "Latitude inválida.",
    ),

    longitude: coordinateSchema(
      -180,
      180,
      "Longitude inválida.",
    ),

    accuracyMeters: z.coerce
      .number()
      .finite(
        "A precisão do GPS é inválida.",
      )
      .min(
        0,
        "A precisão do GPS é inválida.",
      )
      .max(
        50000,
        "A precisão informada é inválida.",
      ),

    justification: z
      .string()
      .trim()
      .max(
        1000,
        "A justificativa deve ter no máximo 1.000 caracteres.",
      )
      .optional()
      .transform(
        (value) => value || null,
      ),

    clientIdempotencyKey: z
      .string()
      .uuid(
        "Identificador da marcação inválido.",
      ),

    clientRecordedAt: z
      .string()
      .datetime({
        offset: true,
      }),

    source: z.enum([
      "web",
      "pwa",
    ]),

    deviceIdentifier: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform(
        (value) => value || null,
      ),

    userAgent: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform(
        (value) => value || null,
      ),
  });