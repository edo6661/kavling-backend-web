import type { Request } from "express";
import type { z } from "zod";

export type TypedRequest<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
> = Request<z.infer<TParams>, unknown, z.infer<TBody>, z.infer<TQuery>>;
