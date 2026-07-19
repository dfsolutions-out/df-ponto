import { z } from "zod";

const optionalUuidSchema = z
  .union([
    z.literal(""),
    z.string().uuid("Seleção inválida."),
  ])
  .transform((value) => value || null);

export const teamSchema = z
  .object({
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
        "A descrição deve ter no máximo 1000 caracteres.",
      )
      .optional()
      .transform((value) => value || null),

    departmentId: optionalUuidSchema,

    managerMembershipId: optionalUuidSchema,

    supervisorMembershipId: optionalUuidSchema,
  })
  .refine(
    (data) =>
      !data.managerMembershipId ||
      !data.supervisorMembershipId ||
      data.managerMembershipId !==
        data.supervisorMembershipId,
    {
      message:
        "O gestor e o supervisor precisam ser pessoas diferentes.",
      path: ["supervisorMembershipId"],
    },
  );

export const teamStatusSchema = z.object({
  teamId: z.string().uuid("Equipe inválida."),

  companyId: z.string().uuid("Empresa inválida."),

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