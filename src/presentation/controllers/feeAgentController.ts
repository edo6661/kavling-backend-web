import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  BackfillFeeAgentUseCase,
  GetFeeAgentsPaginatedUseCase,
  UpdateFeeAgentUseCase,
  UploadBuktiFeeUseCase,
} from "../../application/usecases/feeAgent/FeeAgentUseCases.js";
import type { updateFeeAgentSchema } from "../../validations/feeAgentSchema.js";
import { getFeeAgentsPaginatedSchema } from "../../validations/feeAgentSchema.js";
import type { FeeAgentFilterDTO } from "../../domain/dtos/FeeAgentDTO.js";

export class FeeAgentController {
  constructor(
    private readonly getPaginatedUseCase: GetFeeAgentsPaginatedUseCase,
    private readonly updateUseCase: UpdateFeeAgentUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiFeeUseCase,
    private readonly backfillUseCase: BackfillFeeAgentUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getFeeAgentsPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as FeeAgentFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data fee agent berhasil diambil",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateFeeAgentSchema.body,
      any,
      typeof updateFeeAgentSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data fee agent berhasil diperbarui",
      result,
    );
  };

  backfill = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.backfillUseCase.execute();
    const message =
      result.created > 0
        ? `${result.created} data fee agent berhasil dibuat`
        : "Tidak ada penjualan yang perlu di-backfill";
    sendResponse(res, StatusCodes.OK, message, result);
  };

  uploadBukti = async (
    req: Request<{ id: string; type: string }>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const type = req.params.type;

    if (!["bookingBukti", "closingBukti", "marketingBukti"].includes(type)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "Tipe bukti tidak valid");
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(
      id,
      req.file.buffer,
      type as "bookingBukti" | "closingBukti" | "marketingBukti",
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti fee agent berhasil diunggah",
      result,
    );
  };
}
