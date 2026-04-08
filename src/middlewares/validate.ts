import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        const validatedParams = schemas.params.parse(req.params);
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, validatedParams);
      }

      if (schemas.query) {
        const validatedQuery = schemas.query.parse(req.query);

        Object.keys(req.query).forEach((key) => delete req.query[key]);

        Object.assign(req.query, validatedQuery);
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
};
