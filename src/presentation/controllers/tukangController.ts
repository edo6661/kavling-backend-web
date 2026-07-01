import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TukangRepository } from "../../domain/repositories/tukangRepo.js";
import { getTukangListSchema } from "../../validations/tukangSchema.js";
import type { TypedRequest } from "../../types/request.js";
import type { upsertTukangSchema } from "../../validations/tukangSchema.js";
import { AppError } from "../../domain/errors/AppError.js";

export class TukangController {
  constructor(private readonly tukangRepo: TukangRepository) {}

  private listContext(req: Request) {
    return {
      userId: req.user!.userId,
      role: req.user!.role,
    };
  }

  getList = async (req: Request, res: Response): Promise<void> => {
    const { search } = getTukangListSchema.query.parse(req.query);
    const result = await this.tukangRepo.findAll(
      search ? { search } : undefined,
      this.listContext(req),
    );
    sendResponse(res, StatusCodes.OK, "Daftar tukang berhasil diambil", result);
  };

  upsert = async (
    req: TypedRequest<typeof upsertTukangSchema.body>,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.tukangRepo.upsertForUser(
        req.body,
        this.listContext(req),
      );
      sendResponse(res, StatusCodes.OK, "Data tukang berhasil disimpan", result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "TUKANG_NIK_OTHER_MANDOR") {
        throw new AppError(
          StatusCodes.CONFLICT,
          "NIK tukang sudah terdaftar untuk mandor lain.",
        );
      }
      if (msg === "TUKANG_JUMLAH_ANAK_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Jumlah anak wajib diisi jika sudah menikah.",
        );
      }
      if (msg === "TUKANG_JUMLAH_ANAK_INVALID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Jumlah anak harus antara 0 sampai 3.",
        );
      }
      throw err;
    }
  };
}
