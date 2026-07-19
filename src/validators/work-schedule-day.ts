import { z } from "zod";

const punchSchema = z.object({
  id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((value) => value ?? null),

  sequence: z.coerce
    .number()
    .int()
    .min(1)
    .max(20),

  punchType: z.enum([
    "entry",
    "break_start",
    "break_end",
    "exit",
    "custom",
  ]),

  label: z
    .string()
    .trim()
    .max(
      80,
      "O nome da marcação deve ter no máximo 80 caracteres.",
    ),

  expectedTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Informe um horário válido.",
    ),

  dayOffset: z
    .union([
      z.literal(0),
      z.literal(1),
    ]),

  isRequired: z.boolean(),
});

const daySchema = z
  .object({
    id: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .transform((value) => value ?? null),

    dayIndex: z.coerce
      .number()
      .int()
      .min(1)
      .max(31),

    weekday: z
      .number()
      .int()
      .min(0)
      .max(6)
      .nullable(),

    label: z
      .string()
      .trim()
      .max(
        80,
        "O nome do dia deve ter no máximo 80 caracteres.",
      ),

    isWorkday: z.boolean(),

    expectedWorkMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(1440),

    punches: z
      .array(punchSchema)
      .max(
        20,
        "Cada dia pode possuir no máximo 20 marcações.",
      ),
  })
  .superRefine((day, context) => {
    if (!day.isWorkday) {
      return;
    }

    if (day.punches.length < 2) {
      context.addIssue({
        code: "custom",
        path: ["punches"],
        message:
          "Um dia trabalhado deve possuir pelo menos duas marcações.",
      });
    }

    if (day.punches.length % 2 !== 0) {
      context.addIssue({
        code: "custom",
        path: ["punches"],
        message:
          "A quantidade de marcações de um dia trabalhado precisa ser par.",
      });
    }

    const sequences = new Set(
      day.punches.map(
        (punch) => punch.sequence,
      ),
    );

    if (
      sequences.size !==
      day.punches.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["punches"],
        message:
          "Existem sequências duplicadas nas marcações.",
      });
    }

    const sortedPunches = [
      ...day.punches,
    ].sort(
      (first, second) =>
        first.sequence - second.sequence,
    );

    for (
      let index = 0;
      index < sortedPunches.length;
      index += 2
    ) {
      const start =
        sortedPunches[index];

      const end =
        sortedPunches[index + 1];

      if (!start || !end) {
        continue;
      }

      const [
        startHour,
        startMinute,
      ] = start.expectedTime
        .split(":")
        .map(Number);

      const [endHour, endMinute] =
        end.expectedTime
          .split(":")
          .map(Number);

      const startMinutes =
        startHour * 60 +
        startMinute +
        start.dayOffset * 1440;

      const endMinutes =
        endHour * 60 +
        endMinute +
        end.dayOffset * 1440;

      if (endMinutes < startMinutes) {
        context.addIssue({
          code: "custom",
          path: ["punches", index + 1],
          message:
            "O final de um período não pode ser anterior ao início.",
        });
      }
    }
  });

export const workScheduleConfigurationSchema =
  z.object({
    companyId: z
      .string()
      .uuid("Empresa inválida."),

    scheduleId: z
      .string()
      .uuid("Jornada inválida."),

    days: z
      .array(daySchema)
      .min(
        1,
        "A jornada precisa possuir pelo menos um dia.",
      )
      .max(
        31,
        "A jornada pode possuir no máximo 31 dias.",
      ),
  });