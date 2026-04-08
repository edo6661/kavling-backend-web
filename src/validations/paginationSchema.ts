import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";

const baseFilterSchema = z.object({
  search: emptyAsUndefined(z.string().optional()),
  startDate: emptyAsUndefined(z.string().datetime().optional()),
  endDate: emptyAsUndefined(z.string().datetime().optional()),
  orderBy: emptyAsUndefined(
    z
      .string()
      .regex(
        /^[a-zA-Z0-9_]+:(asc|desc)$/,
        "Format harus field:asc atau field:desc",
      )
      .optional(),
  ),
});

export const cursorPaginationQuerySchema = baseFilterSchema.extend({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: emptyAsUndefined(z.string().optional()),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
