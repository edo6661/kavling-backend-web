import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type { GantiKavlingUseCase } from "../../application/usecases/penjualan/GantiKavlingUseCase.js";
import type { GetPenjualanPaginatedUseCase } from "../../application/usecases/penjualan/GetPenjualanPaginatedUseCase.js";
import type {
  cancelPenjualanSchema,
  createPenjualanSchema,
  gantiKavlingSchema,
  updatePenjualanSchema,
  uploadBuktiPenjualanSchema,
  uploadSignatureSchema,
} from "../../validations/penjualanSchema.js";
import { getPenjualanPaginatedSchema } from "../../validations/penjualanSchema.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../../domain/dtos/PenjualanDTO.js";
import type { CreatePenjualanUseCase } from "../../application/usecases/penjualan/CreatePenjualanUseCase.js";
import type { CancelPenjualanUseCase } from "../../application/usecases/penjualan/CancelPenjualanUseCase.js";
import type { UploadBuktiPenjualanUseCase } from "../../application/usecases/penjualan/UploadBuktiPenjualanUseCase.js";
import type { SaveSignatureUseCase } from "../../application/usecases/penjualan/SaveSignatureUseCase.js";
import type { UpdatePenjualanUseCase } from "../../application/usecases/penjualan/UpdatePenjualanUseCase.js";

export class PenjualanController {
  constructor(
    private readonly createUseCase: CreatePenjualanUseCase,
    private readonly getPaginatedUseCase: GetPenjualanPaginatedUseCase,
    private readonly cancelUseCase: CancelPenjualanUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiPenjualanUseCase,
    private readonly saveSignatureUseCase: SaveSignatureUseCase,
    private readonly updateUseCase: UpdatePenjualanUseCase,
    private readonly gantiKavlingUseCase: GantiKavlingUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createPenjualanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const pembuat = req.user?.username ?? "Admin";

    const result = await this.createUseCase.execute({
      ...req.body,
      createdBy: pembuat,
    });
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Data Penjualan berhasil disimpan dan tagihan awal telah dibuat.",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getPenjualanPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as PenjualanFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data penjualan berhasil diambil",
      result,
    );
  };
  cancel = async (
    req: TypedRequest<
      typeof cancelPenjualanSchema.body,
      any,
      typeof cancelPenjualanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { alasanBatal } = req.body;

    const result = await this.cancelUseCase.execute(id, alasanBatal);
    sendResponse(res, StatusCodes.OK, "Penjualan berhasil dibatalkan", result);
  };
  uploadBukti = async (
    req: TypedRequest<
      typeof cancelPenjualanSchema.body,
      any,
      typeof uploadBuktiPenjualanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id, type } = req.params;
    if (!["booking", "dp"].includes(type)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "Tipe upload tidak valid.");
      return;
    }
    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File dokumen wajib diunggah.",
      );
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(
      id,
      type as "booking" | "dp",
      req.file.buffer,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      `Bukti ${type} berhasil diunggah`,
      result,
    );
  };
  uploadSignature = async (
    req: TypedRequest<
      typeof uploadSignatureSchema.body,
      any,
      typeof uploadSignatureSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { signatureBase64, nama, peran, tanggal } = req.body;

    const result = await this.saveSignatureUseCase.execute(
      id,
      signatureBase64,
      nama,
      peran,
      tanggal,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      `Tanda tangan digital untuk ${peran} berhasil disimpan`,
      result,
    );
  };
  update = async (
    req: TypedRequest<
      typeof updatePenjualanSchema.body,
      any,
      typeof updatePenjualanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await this.updateUseCase.execute(
      id,
      req.body as Partial<CreatePenjualanDTO>,
      userId,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data penjualan berhasil diperbarui dan direkam.",
      result,
    );
  };
  gantiKavling = async (
    req: TypedRequest<
      typeof gantiKavlingSchema.body,
      any,
      typeof gantiKavlingSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { kavlingBaruId, alasan } = req.body;

    const result = await this.gantiKavlingUseCase.execute(
      id,
      kavlingBaruId,
      alasan,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil ganti kavling. Status telah diperbarui.",
      result,
    );
  };
}
