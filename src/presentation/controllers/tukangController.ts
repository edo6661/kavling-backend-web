import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TukangRepository } from "../../domain/repositories/tukangRepo.js";
import { getTukangListSchema } from "../../validations/tukangSchema.js";
import type { TypedRequest } from "../../types/request.js";
import type { upsertTukangSchema } from "../../validations/tukangSchema.js";

export class TukangController {
  constructor(private readonly tukangRepo: TukangRepository) {}

  getList = async (req: Request, res: Response): Promise<void> => {
    const { search } = getTukangListSchema.query.parse(req.query);
    const result = await this.tukangRepo.findAll(
      search ? { search } : undefined,
    );
    sendResponse(res, StatusCodes.OK, "Daftar tukang berhasil diambil", result);
  };

  upsert = async (
    req: TypedRequest<typeof upsertTukangSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.tukangRepo.upsertByNik(req.body);
    sendResponse(res, StatusCodes.OK, "Data tukang berhasil disimpan", result);
  };
}
