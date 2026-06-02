import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateSpkPembayaranRequestUseCase,
  GetSpkPembayaranBySpkUseCase,
  GetSpkPembayaranPaginatedUseCase,
  BayarSpkPembayaranUseCase,
  AddBuktiSpkPembayaranUseCase,
  RemoveBuktiSpkPembayaranUseCase,
  SetBsiCmsDilaporkanUseCase,
  UpdateSpkKasbonUseCase,
} from "../../application/usecases/spkPembayaran/SpkPembayaranUseCases.js";
import type { updateSpkKasbonSchema } from "../../validations/spkPembayaranSchema.js";
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
    private readonly addBuktiUseCase: AddBuktiSpkPembayaranUseCase,
    private readonly removeBuktiUseCase: RemoveBuktiSpkPembayaranUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetBsiCmsDilaporkanUseCase,
    private readonly updateKasbonUseCase: UpdateSpkKasbonUseCase,
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
            tanggalPo: req.body.tanggalPo ?? new Date(),
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
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body as { tanggalPembayaran?: string } | undefined;
    const tanggalRaw = body?.tanggalPembayaran;
    const tanggalPembayaran = tanggalRaw ? new Date(tanggalRaw) : undefined;

    const result = await this.bayarUseCase.execute(
      id,
      req.user!.userId,
      files?.map((file) => file.buffer) ?? [],
      tanggalPembayaran,
    );
    sendResponse(res, StatusCodes.OK, "Pembayaran SPK berhasil diproses", result);
  };

  addBukti = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(routeParam(req.params.id), 10);
    const files = req.files as Express.Multer.File[] | undefined;

    const result = await this.addBuktiUseCase.execute(
      id,
      files?.map((file) => file.buffer) ?? [],
    );
    sendResponse(res, StatusCodes.OK, "Bukti pembayaran berhasil ditambahkan", result);
  };

  removeBukti = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(routeParam(req.params.id), 10);
    const { buktiUrl } = req.body as { buktiUrl: string };
    const result = await this.removeBuktiUseCase.execute(id, buktiUrl);
    sendResponse(res, StatusCodes.OK, "Bukti pembayaran berhasil dihapus", result);
  };

  setBsiCmsDilaporkan = async (req: Request, res: Response): Promise<void> => {
    const { ids, dilaporkan } = req.body as { ids: number[]; dilaporkan: boolean };
    const result = await this.setBsiCmsDilaporkanUseCase.execute({ ids, dilaporkan });
    const message = dilaporkan
      ? "Pembayaran ditandai sudah dilaporkan di BSI CMS"
      : "Tanda lapor BSI CMS dibatalkan";
    sendResponse(res, StatusCodes.OK, message, result);
  };

  updateKasbon = async (
    req: TypedRequest<
      typeof updateSpkKasbonSchema.body,
      never,
      typeof updateSpkKasbonSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const result = await this.updateKasbonUseCase.execute(
      {
        id,
        keterangan: req.body.keterangan,
        nominal: req.body.nominal,
        tanggalPo: req.body.tanggalPo,
      },
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "Data kasbon berhasil diperbarui", result);
  };
}
