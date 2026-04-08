import { z } from "zod";

export const emptyAsUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (val === "" || val === "null" || val === "undefined" || val === null) {
      return undefined;
    }
    return val;
  }, schema);
