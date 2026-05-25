import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  UploadKodeBillingPphUseCase,
  UploadBuktiBayarKodeBillingPphUseCase,
  GetKodeBillingPphPaginatedUseCase,
} from "../../application/usecases/kodeBillingPph/KodeBillingPphUseCases.js";
import type { uploadKodeBillingPphSchema } from "../../validations/kodeBillingPphSchema.js";
import { getKodeBillingPphPaginatedSchema } from "../../validations/kodeBillingPphSchema.js";
import type { KodeBillingPphFilterDTO } from "../../domain/dtos/KodeBillingPphDTO.js";
import { AppError } from "../../domain/errors/AppError.js";

function parseOrderBy(orderBy?: string): KodeBillingPphFilterDTO["orderBy"] {
  if (!orderBy) return undefined;
  const [field, direction] = orderBy.split(":");
  if (!field || !direction) return undefined;
  if (!["asc", "desc"].includes(direction)) return undefined;
  return { field, direction: direction as "asc" | "desc" };
}

export class KodeBillingPphController {
  constructor(
    private readonly uploadUseCase: UploadKodeBillingPphUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiBayarKodeBillingPphUseCase,
    private readonly getPaginatedUseCase: GetKodeBillingPphPaginatedUseCase,
  ) {}

  upload = async (
    req: TypedRequest<typeof uploadKodeBillingPphSchema.body>,
    res: Response,
  ): Promise<void> => {
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File PDF wajib diunggah");
    }

    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    const result = await this.uploadUseCase.execute({
      customerId: req.body.customerId,
      penjualanId: req.body.penjualanId,
      fileBuffer: file.buffer,
      pdfPassword: req.body.pdfPassword,
      uploadedBy: userId,
    });

    sendResponse(
      res,
      StatusCodes.CREATED,
      `Kode billing PPh ${result.kodeBilling} berhasil disimpan`,
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status, customerId, orderBy } =
      getKodeBillingPphPaginatedSchema.query.parse(req.query);

    const filters: KodeBillingPphFilterDTO = {
      search,
      customerId,
      orderBy: parseOrderBy(orderBy),
      status: status && status !== "ALL" ? status : undefined,
    };

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(res, StatusCodes.OK, "Data kode billing PPh berhasil diambil", result);
  };

  uploadBuktiBayar = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File bukti wajib diunggah");
    }

    const result = await this.uploadBuktiUseCase.execute(id, file.buffer);
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti pembayaran kode billing PPh berhasil diunggah",
      result,
    );
  };
}
