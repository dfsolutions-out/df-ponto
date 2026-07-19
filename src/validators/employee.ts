import { z } from "zod";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let firstDigit = 11 - (sum % 11);

  if (firstDigit >= 10) {
    firstDigit = 0;
  }

  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  let secondDigit = 11 - (sum % 11);

  if (secondDigit >= 10) {
    secondDigit = 0;
  }

  return secondDigit === Number(cpf[10]);
}

const optionalUuidSchema = z
  .union([
    z.literal(""),
    z.string().uuid("Seleção inválida."),
  ])
  .transform((value) => value || null);

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

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

/*
 * Schema base dos dados trabalhistas.
 *
 * Ele não possui superRefine, então pode ser reutilizado
 * com extend, omit e outras operações do Zod.
 */
const employeeBaseSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      2,
      "Informe o nome com pelo menos 2 caracteres.",
    )
    .max(
      160,
      "O nome deve ter no máximo 160 caracteres.",
    ),

  cpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) => isValidCpf(value),
      "Informe um CPF válido.",
    ),

  registrationNumber: z
    .string()
    .trim()
    .min(1, "Informe a matrícula.")
    .max(
      50,
      "A matrícula deve ter no máximo 50 caracteres.",
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(
      255,
      "O e-mail deve ter no máximo 255 caracteres.",
    ),

  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine(
      (value) =>
        value.length >= 10 &&
        value.length <= 15,
      "Informe um telefone válido.",
    ),

  admissionDate: z
    .string()
    .trim()
    .min(1, "Informe a data de admissão.")
    .refine((value) => {
      const date = new Date(`${value}T12:00:00`);

      return !Number.isNaN(date.getTime());
    }, "Informe uma data de admissão válida."),

  departmentId: optionalUuidSchema,

  jobPositionId: optionalUuidSchema,

  teamId: optionalUuidSchema,

  notes: optionalTextSchema.refine(
    (value) =>
      value === null || value.length <= 2000,
    "As observações devem ter no máximo 2.000 caracteres.",
  ),
});

/*
 * Cadastro do funcionário.
 *
 * Acrescenta a opção de criar acesso e valida as duas
 * senhas provisórias somente quando o acesso for solicitado.
 */
export const employeeSchema =
  employeeBaseSchema
    .extend({
      grantAccess: booleanFormSchema,

      temporaryPassword: z
        .string()
        .optional()
        .transform((value) => value ?? ""),

      confirmTemporaryPassword: z
        .string()
        .optional()
        .transform((value) => value ?? ""),
    })
    .superRefine((data, context) => {
      if (!data.grantAccess) {
        return;
      }

      if (
        data.temporaryPassword.trim().length < 8
      ) {
        context.addIssue({
          code: "custom",
          path: ["temporaryPassword"],
          message:
            "A senha provisória deve ter pelo menos 8 caracteres.",
        });
      }

      if (
        data.temporaryPassword !==
        data.confirmTemporaryPassword
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "confirmTemporaryPassword",
          ],
          message: "As senhas não coincidem.",
        });
      }
    });

/*
 * Edição do funcionário.
 *
 * Usa diretamente o schema base porque a edição não cria
 * conta, não solicita senha e não altera a conta vinculada.
 */
export const employeeUpdateSchema =
  employeeBaseSchema;

export const employeeStatusSchema = z
  .object({
    employeeId: z
      .string()
      .uuid("Funcionário inválido."),

    companyId: z
      .string()
      .uuid("Empresa inválida."),

    status: z.enum([
      "active",
      "on_leave",
      "terminated",
      "blocked",
    ]),

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

    terminationDate: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || null),
  })
  .superRefine((data, context) => {
    if (
      data.status === "terminated" &&
      !data.terminationDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["terminationDate"],
        message:
          "Informe a data de desligamento.",
      });

      return;
    }

    if (data.terminationDate) {
      const terminationDate = new Date(
        `${data.terminationDate}T12:00:00`,
      );

      if (
        Number.isNaN(
          terminationDate.getTime(),
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["terminationDate"],
          message:
            "Informe uma data de desligamento válida.",
        });
      }
    }
  });