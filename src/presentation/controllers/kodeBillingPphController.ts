import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  UploadKodeBillingPphUseCase,
  UploadBuktiBayarKodeBillingPphUseCase,
  GetKodeBillingPphPaginatedUseCase,
  GetKodeBillingPphByPenjualanUseCase,
  GetAllKodeBillingPphByPenjualanUseCase,
} from "../../application/usecases/kodeBillingPph/KodeBillingPphUseCases.js";
import type { uploadKodeBillingPphSchema } from "../../validations/kodeBillingPphSchema.js";
import { getKodeBillingPphPaginatedSchema } from "../../validations/kodeBillingPphSchema.js";
import type { KodeBillingPphFilterDTO } from "../../domain/dtos/KodeBillingPphDTO.js";
import { AppError } from "../../domain/errors/AppError.js";
import { omitUndefined } from "../../utils/object.js";

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
    private readonly getByPenjualanUseCase: GetKodeBillingPphByPenjualanUseCase,
    private readonly getAllByPenjualanUseCase: GetAllKodeBillingPphByPenjualanUseCase,
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

    const result = await this.uploadUseCase.execute(
      omitUndefined({
        customerId: req.body.customerId,
        penjualanId: req.body.penjualanId,
        sertifikatUrutan: req.body.sertifikatUrutan,
        fileBuffer: file.buffer,
        pdfPassword: req.body.pdfPassword,
        uploadedBy: userId,
      }),
    );

    sendResponse(
      res,
      StatusCodes.CREATED,
      `Kode billing PPh ${result.kodeBilling} berhasil disimpan`,
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status, customerId, penjualanId, orderBy } =
      getKodeBillingPphPaginatedSchema.query.parse(req.query);

    const filters = omitUndefined({
      search,
      customerId,
      penjualanId,
      orderBy: parseOrderBy(orderBy),
      status: status && status !== "ALL" ? status : undefined,
    }) as KodeBillingPphFilterDTO;

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(res, StatusCodes.OK, "Data kode billing PPh berhasil diambil", result);
  };

  getByPenjualan = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.penjualanId as string, 10);
    const result = await this.getByPenjualanUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      result ? "Data kode billing PPh berhasil diambil" : "Belum ada kode billing PPh",
      result,
    );
  };

  getAllByPenjualan = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.penjualanId as string, 10);
    const result = await this.getAllByPenjualanUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar kode billing PPh berhasil diambil",
      result,
    );
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
