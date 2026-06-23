import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { CreatePenjualanUseCase } from "../../application/usecases/penjualan/CreatePenjualanUseCase.js";
import type { GetPenjualanPaginatedUseCase } from "../../application/usecases/penjualan/GetPenjualanPaginatedUseCase.js";
import type { CancelPenjualanUseCase } from "../../application/usecases/penjualan/CancelPenjualanUseCase.js";
import type { UploadBuktiPenjualanUseCase } from "../../application/usecases/penjualan/UploadBuktiPenjualanUseCase.js";
import type { SaveSignatureUseCase } from "../../application/usecases/penjualan/SaveSignatureUseCase.js";
import type { UpdatePenjualanUseCase } from "../../application/usecases/penjualan/UpdatePenjualanUseCase.js";
import type { UpdateBatalPenjualanUseCase } from "../../application/usecases/penjualan/UpdateBatalPenjualanUseCase.js";
import type { GantiKavlingUseCase } from "../../application/usecases/penjualan/GantiKavlingUseCase.js";
import type { ApproveBatalUseCase } from "../../application/usecases/penjualan/ApproveBatalUseCase.js";
import type { ApproveGantiKavlingUseCase } from "../../application/usecases/penjualan/ApproveGantiKavlingUseCase.js";
import type { GetPengajuanBatalUseCase } from "../../application/usecases/penjualan/GetPengajuanBatalUseCase.js";
import type { GetPengajuanGantiKavlingUseCase } from "../../application/usecases/penjualan/GetPengajuanGantiKavlingUseCase.js";

import type {
  cancelPenjualanSchema,
  createPenjualanSchema,
  gantiKavlingSchema,
  updatePenjualanSchema,
  updateBatalPenjualanSchema,
  uploadBuktiPenjualanSchema,
  uploadSignatureSchema,
  approveSchema,
} from "../../validations/penjualanSchema.js";
import { getPenjualanPaginatedSchema } from "../../validations/penjualanSchema.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../../domain/dtos/PenjualanDTO.js";
import { Role } from "@prisma/client";
import { NotFoundError } from "../../domain/errors/NotFoundError.js";
import { omitUndefined } from "../../utils/object.js";
import type { RegenerateSprUseCase } from "../../application/usecases/penjualan/RegenerateSprUseCase.js";
import {
  resolveAgentIdFilter,
  resolveAgentNameForUser,
} from "../../utils/agentScope.js";

export class PenjualanController {
  constructor(
    private readonly createUseCase: CreatePenjualanUseCase,
    private readonly getPaginatedUseCase: GetPenjualanPaginatedUseCase,
    private readonly cancelUseCase: CancelPenjualanUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiPenjualanUseCase,
    private readonly saveSignatureUseCase: SaveSignatureUseCase,
    private readonly updateUseCase: UpdatePenjualanUseCase,
    private readonly updateBatalUseCase: UpdateBatalPenjualanUseCase,
    private readonly gantiKavlingUseCase: GantiKavlingUseCase,
    private readonly approveBatalUseCase: ApproveBatalUseCase,
    private readonly approveGantiKavlingUseCase: ApproveGantiKavlingUseCase,
    private readonly getPengajuanBatalUseCase: GetPengajuanBatalUseCase,
    private readonly getPengajuanGantiKavlingUseCase: GetPengajuanGantiKavlingUseCase,
    private readonly regenerateSprUseCase: RegenerateSprUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createPenjualanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const pembuat = req.user?.username ?? "Admin";
    const userId = req.user?.userId;

    if (!userId) {
      throw new NotFoundError("User tidak ditemukan");
    }

    let body = { ...req.body };
    if (req.user?.role === Role.AGENT) {
      body = {
        ...body,
        agent: await resolveAgentNameForUser(userId),
      };
    }

    const result = await this.createUseCase.execute(
      omitUndefined({
        ...body,
        createdBy: pembuat,
        userId,
      }),
    );

    sendResponse(
      res,
      StatusCodes.CREATED,
      "Data Penjualan berhasil disimpan dan tagihan awal telah dibuat.",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, ...filters } = getPenjualanPaginatedSchema.query.parse(
      req.query,
    );

    const agentId = await resolveAgentIdFilter(req);

    const filterDto = omitUndefined({
      ...filters,
      ...(agentId ? { agentId } : {}),
      ...(req.user?.role === Role.MANDOR && req.user.userId
        ? { mandorUserId: req.user.userId }
        : {}),
    }) as PenjualanFilterDTO & { status?: string };

    const result = await this.getPaginatedUseCase.execute(
      page,
      limit,
      filterDto,
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
    const userId = req.user!.userId;

    const result = await this.cancelUseCase.execute(id, alasanBatal, userId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Pengajuan pembatalan berhasil dikirim dan menunggu persetujuan Admin",
      result,
    );
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
  updateBatal = async (
    req: TypedRequest<
      typeof updateBatalPenjualanSchema.body,
      any,
      typeof updateBatalPenjualanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;

    const result = await this.updateBatalUseCase.execute(id, req.body);

    sendResponse(
      res,
      StatusCodes.OK,
      "Data penjualan batal berhasil diperbarui.",
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
    const userId = req.user!.userId;

    const result = await this.gantiKavlingUseCase.execute(
      id,
      kavlingBaruId,
      alasan,
      userId,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Pengajuan ganti kavling berhasil dikirim dan menunggu persetujuan Admin.",
      result,
    );
  };
  getPengajuanBatal = async (req: Request, res: Response): Promise<void> => {
    const status = req.query.status as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | undefined;
    const result = await this.getPengajuanBatalUseCase.execute(status);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pengajuan pembatalan berhasil diambil",
      result,
    );
  };

  getPengajuanGantiKavling = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const status = req.query.status as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | undefined;
    const result = await this.getPengajuanGantiKavlingUseCase.execute(status);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pengajuan ganti kavling berhasil diambil",
      result,
    );
  };

  approveBatal = async (
    req: TypedRequest<
      typeof approveSchema.body,
      any,
      typeof approveSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { isApproved } = req.body;
    const userId = req.user!.userId;

    const result = await this.approveBatalUseCase.execute(
      id,
      userId,
      isApproved,
    );
    const msg = isApproved
      ? "Pembatalan berhasil disetujui dan dieksekusi"
      : "Pengajuan pembatalan ditolak";
    sendResponse(res, StatusCodes.OK, msg, result);
  };

  approveGantiKavling = async (
    req: TypedRequest<
      typeof approveSchema.body,
      any,
      typeof approveSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { isApproved } = req.body;
    const userId = req.user!.userId;

    const result = await this.approveGantiKavlingUseCase.execute(
      id,
      userId,
      isApproved,
    );
    const msg = isApproved
      ? "Ganti Kavling berhasil disetujui dan dieksekusi"
      : "Pengajuan ganti kavling ditolak";
    sendResponse(res, StatusCodes.OK, msg, result);
  };
  regenerateSpr = async (
    req: TypedRequest<
      typeof approveSchema.body,
      any,
      typeof approveSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const result = await this.regenerateSprUseCase.execute(id);
    sendResponse(
      res,
      StatusCodes.OK,
      "Dokumen SPR berhasil di-generate ulang dengan aman.",
      result,
    );
  };
}
