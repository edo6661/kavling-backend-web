import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateTagihanUseCase,
  UpdateTagihanUseCase,
  GetTagihanByIdUseCase,
  GetTagihansPaginatedUseCase,
  DeleteTagihanUseCase,
} from "../../application/usecases/tagihan/TagihanUseCases.js";
import type { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";

import type {
  createTagihanSchema,
  updateTagihanSchema,
  uploadBuktiByNoTagihanSchema,
} from "../../validations/tagihanSchema.js";
import { getTagihansPaginatedSchema } from "../../validations/tagihanSchema.js";
import type { TagihanFilterDTO } from "../../domain/dtos/TagihanDTO.js";
import type { UploadBuktiRefundUseCase } from "../../application/usecases/tagihan/UploadBuktiRefundUseCase.js";
import type { SaveTagihanSignatureUseCase } from "../../application/usecases/tagihan/SaveTagihanSignatureUseCase.js";
import type { uploadSignatureSchema } from "../../validations/penjualanSchema.js";
import type { ApproveBuktiTagihanUseCase } from "../../application/usecases/tagihan/ApproveBuktiTagihanUseCase.js";

export class TagihanController {
  constructor(
    private readonly createUseCase: CreateTagihanUseCase,
    private readonly updateUseCase: UpdateTagihanUseCase,
    private readonly getByIdUseCase: GetTagihanByIdUseCase,
    private readonly getPaginatedUseCase: GetTagihansPaginatedUseCase,
    private readonly deleteUseCase: DeleteTagihanUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiTagihanUseCase,
    private readonly uploadBuktiRefundUseCase: UploadBuktiRefundUseCase,
    private readonly saveSignatureUseCase: SaveTagihanSignatureUseCase,
    private readonly approveBuktiTagihanUseCase: ApproveBuktiTagihanUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createTagihanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(res, StatusCodes.CREATED, "Tagihan berhasil dibuat", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateTagihanSchema.body,
      any,
      typeof updateTagihanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Tagihan berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data tagihan berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getTagihansPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as TagihanFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar tagihan berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Tagihan berhasil dihapus");
  };

  uploadBukti = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(id, req.file.buffer);
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti pembayaran berhasil diunggah",
      result,
    );
  };
  uploadBuktiRefund = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }
    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File bukti refund wajib diunggah",
      );
      return;
    }

    const result = await this.uploadBuktiRefundUseCase.execute(
      id,
      req.file.buffer,
    );
    sendResponse(res, StatusCodes.OK, "Bukti Refund berhasil diunggah", result);
  };
  uploadSignature = async (
    req: TypedRequest<
      typeof uploadSignatureSchema.body,
      any,
      typeof uploadSignatureSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
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
      `Tanda tangan untuk kwitansi berhasil disimpan`,
      result,
    );
  };
  uploadBuktiByNoTagihan = async (
    req: TypedRequest<any, any, typeof uploadBuktiByNoTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const { noTagihan } = req.params;

    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File gambar bukti wajib diunggah",
      );
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(
      noTagihan,
      req.file.buffer,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti pembayaran dari Telegram berhasil diunggah",
      result,
    );
  };
  approveBukti = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const { isApproved } = req.body;
    const result = await this.approveBuktiTagihanUseCase.execute(
      id,
      isApproved,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      isApproved ? "Bukti disetujui" : "Bukti ditolak",
      result,
    );
  };
}
