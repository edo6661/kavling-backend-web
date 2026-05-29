import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateSpkPembayaranRequestUseCase,
  GetSpkPembayaranBySpkUseCase,
  GetSpkPembayaranPaginatedUseCase,
  BayarSpkPembayaranUseCase,
  SetBsiCmsDilaporkanUseCase,
} from "../../application/usecases/spkPembayaran/SpkPembayaranUseCases.js";
import type { createSpkPembayaranSchema } from "../../validations/spkPembayaranSchema.js";
import { getSpkPembayaranPaginatedSchema } from "../../validations/spkPembayaranSchema.js";
import type {
  CreateSpkPembayaranDTO,
  SpkPembayaranFilterDTO,
} from "../../domain/dtos/SpkPembayaranDTO.js";
import { routeParam } from "../../utils/object.js";

export class SpkPembayaranController {
  constructor(
    private readonly createRequestUseCase: CreateSpkPembayaranRequestUseCase,
    private readonly getBySpkUseCase: GetSpkPembayaranBySpkUseCase,
    private readonly getPaginatedUseCase: GetSpkPembayaranPaginatedUseCase,
    private readonly bayarUseCase: BayarSpkPembayaranUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetBsiCmsDilaporkanUseCase,
  ) {}

  createRequest = async (
    req: TypedRequest<
      typeof createSpkPembayaranSchema.body,
      never,
      typeof createSpkPembayaranSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const spkId = Number(req.params.spkId);
    const userId = req.user!.userId;

    const payload: CreateSpkPembayaranDTO =
      req.body.jenis === "KASBON"
        ? {
            spkId,
            jenis: "KASBON",
            keterangan: req.body.keterangan ?? "",
            nominal: req.body.nominal ?? 0,
            diajukanOlehId: userId,
          }
        : {
            spkId,
            jenis: req.body.jenis,
            diajukanOlehId: userId,
          };

    const result = await this.createRequestUseCase.execute(
      payload,
      userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.CREATED, "Pengajuan pembayaran SPK berhasil dibuat", result);
  };

  getBySpk = async (req: Request, res: Response): Promise<void> => {
    const spkId = parseInt(routeParam(req.params.spkId), 10);
    const result = await this.getBySpkUseCase.execute(spkId);
    sendResponse(res, StatusCodes.OK, "Riwayat pembayaran SPK berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status, search } =
      getSpkPembayaranPaginatedSchema.query.parse(req.query);

    const filters: SpkPembayaranFilterDTO = {};
    if (status && status !== "ALL") filters.status = status;
    if (search) filters.search = search;

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(res, StatusCodes.OK, "Daftar pembayaran SPK berhasil diambil", result);
  };

  bayar = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(routeParam(req.params.id), 10);
    const file = req.file as Express.Multer.File | undefined;
    const tanggalRaw = req.body?.tanggalPembayaran;
    const tanggalPembayaran = tanggalRaw ? new Date(tanggalRaw) : undefined;

    const result = await this.bayarUseCase.execute(
      id,
      req.user!.userId,
      file?.buffer ?? Buffer.alloc(0),
      tanggalPembayaran,
    );
    sendResponse(res, StatusCodes.OK, "Pembayaran SPK berhasil diproses", result);
  };

  setBsiCmsDilaporkan = async (req: Request, res: Response): Promise<void> => {
    const { ids, dilaporkan } = req.body as { ids: number[]; dilaporkan: boolean };
    const result = await this.setBsiCmsDilaporkanUseCase.execute({ ids, dilaporkan });
    const message = dilaporkan
      ? "Pembayaran ditandai sudah dilaporkan di BSI CMS"
      : "Tanda lapor BSI CMS dibatalkan";
    sendResponse(res, StatusCodes.OK, message, result);
  };
}
