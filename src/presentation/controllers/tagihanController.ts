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
  removeBuktiTagihanSchema,
} from "../../validations/tagihanSchema.js";
import { getTagihansPaginatedSchema } from "../../validations/tagihanSchema.js";
import type { TagihanFilterDTO } from "../../domain/dtos/TagihanDTO.js";
import type { UploadBuktiRefundUseCase } from "../../application/usecases/tagihan/UploadBuktiRefundUseCase.js";
import type { SaveTagihanSignatureUseCase } from "../../application/usecases/tagihan/SaveTagihanSignatureUseCase.js";
import type { uploadSignatureSchema } from "../../validations/penjualanSchema.js";
import type { ApproveBuktiTagihanUseCase } from "../../application/usecases/tagihan/ApproveBuktiTagihanUseCase.js";
import type { RemoveBuktiTagihanUseCase } from "../../application/usecases/tagihan/RemoveBuktiTagihanUseCase.js";

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
    private readonly removeBuktiTagihanUseCase: RemoveBuktiTagihanUseCase,
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
    // Ambil page & limit
    const { page, limit, ...filters } = getTagihansPaginatedSchema.query.parse(
      req.query,
    );

    const result = await this.getPaginatedUseCase.execute(
      page,
      limit,
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

    const files = req.files as Express.Multer.File[] | undefined;
    const buffers =
      files?.map((file) => file.buffer) ??
      (req.file?.buffer ? [req.file.buffer] : []);

    if (!buffers.length) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(id, buffers);
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

  removeBukti = async (
    req: TypedRequest<
      typeof removeBuktiTagihanSchema.body,
      any,
      typeof removeBuktiTagihanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { buktiUrl } = req.body;
    const result = await this.removeBuktiTagihanUseCase.execute(id, buktiUrl);
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti pembayaran berhasil dihapus",
      result,
    );
  };
}
