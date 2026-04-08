import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { validate } from "./validate";
import { z } from "zod";

describe("Validate Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = { body: {}, params: {}, query: {} };
    mockResponse = {};
    nextFunction = vi.fn();
  });

  it("harus memanggil next() dan mereassign body jika validasi body berhasil", () => {
    const schema = {
      body: z.object({ name: z.string() }),
    };
    mockRequest.body = { name: "Valid String", extraData: "Akan Dibuang" };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith();

    expect(mockRequest.body).toEqual({ name: "Valid String" });
  });

  it("harus memanggil next(error) jika validasi gagal", () => {
    const schema = {
      body: z.object({ age: z.number() }),
    };
    mockRequest.body = { age: "bukan_angka" };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);

    const errorArg = (nextFunction as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(errorArg).toBeInstanceOf(z.ZodError);
  });

  it("harus memvalidasi query dan params dengan benar", () => {
    const schema = {
      params: z.object({ id: z.string().cuid() }),
      query: z.object({ limit: z.coerce.number() }),
    };

    mockRequest.params = { id: "cuid123456789" };
    mockRequest.query = { limit: "10" };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(mockRequest.query).toEqual({ limit: 10 });
  });
});
