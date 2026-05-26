/** Removes keys with `undefined` values (for exactOptionalPropertyTypes / Zod → DTO). */
export type OmitUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): OmitUndefined<T> {
  const result = {} as OmitUndefined<T>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    if (value !== undefined) {
      result[key as keyof OmitUndefined<T>] = value as OmitUndefined<T>[keyof OmitUndefined<T>];
    }
  }
  return result;
}

/** Express route param → string (safe for parseInt). */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
