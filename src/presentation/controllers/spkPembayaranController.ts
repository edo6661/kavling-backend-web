import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateSpkPembayaranRequestUseCase,
  GetSpkPembayaranBySpkUseCase,
  GetSpkKasbonDraftUseCase,
  SaveSpkKasbonDraftUseCase,
  SubmitSpkKasbonDraftUseCase,
  GetSpkPembayaranPaginatedUseCase,
  BayarSpkPembayaranUseCase,
  AddBuktiSpkPembayaranUseCase,
  RemoveBuktiSpkPembayaranUseCase,
  SetBsiCmsDilaporkanUseCase,
  UpdateSpkKasbonUseCase,
  UpdateSpkUpahUseCase,
  DeleteSpkPenguranganUseCase,
  UploadKasbonFotoBonUseCase,
  ApproveSpkPembayaranUseCase,
} from "../../application/usecases/spkPembayaran/SpkPembayaranUseCases.js";
import type {
  updateSpkKasbonSchema,
  updateSpkUpahSchema,
} from "../../validations/spkPembayaranSchema.js";
import type { createSpkPembayaranSchema } from "../../validations/spkPembayaranSchema.js";
import { getSpkPembayaranPaginatedSchema } from "../../validations/spkPembayaranSchema.js";
import type {
  CreateSpkPembayaranDTO,
  SpkPembayaranFilterDTO,
  SpkPembayaranUpahBarisInput,
} from "../../domain/dtos/SpkPembayaranDTO.js";
import { routeParam } from "../../utils/object.js";

const withOptionalMandorRekeningId = (mandorRekeningId?: number) =>
  mandorRekeningId !== undefined ? { mandorRekeningId } : {};

const mapUpahBarisInput = (
  baris: {
    nik: string;
    nama: string;
    tukangId?: number | null | undefined;
    nominal?: number | undefined;
  }[],
): SpkPembayaranUpahBarisInput[] =>
  baris.map((b) => {
    const row: SpkPembayaranUpahBarisInput = {
      nik: b.nik,
      nama: b.nama,
    };
    if (b.tukangId !== undefined) row.tukangId = b.tukangId;
    if (b.nominal !== undefined) row.nominal = b.nominal;
    return row;
  });

export class SpkPembayaranController {
  constructor(
    private readonly createRequestUseCase: CreateSpkPembayaranRequestUseCase,
    private readonly getBySpkUseCase: GetSpkPembayaranBySpkUseCase,
    private readonly getKasbonDraftUseCase: GetSpkKasbonDraftUseCase,
    private readonly saveKasbonDraftUseCase: SaveSpkKasbonDraftUseCase,
    private readonly submitKasbonDraftUseCase: SubmitSpkKasbonDraftUseCase,
    private readonly getPaginatedUseCase: GetSpkPembayaranPaginatedUseCase,
    private readonly bayarUseCase: BayarSpkPembayaranUseCase,
    private readonly addBuktiUseCase: AddBuktiSpkPembayaranUseCase,
    private readonly removeBuktiUseCase: RemoveBuktiSpkPembayaranUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetBsiCmsDilaporkanUseCase,
    private readonly updateKasbonUseCase: UpdateSpkKasbonUseCase,
    private readonly updateUpahUseCase: UpdateSpkUpahUseCase,
    private readonly deletePenguranganUseCase: DeleteSpkPenguranganUseCase,
    private readonly uploadKasbonFotoBonUseCase: UploadKasbonFotoBonUseCase,
    private readonly approveUseCase: ApproveSpkPembayaranUseCase,
  ) {}

  uploadFotoBon = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file?.buffer?.length) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File foto bon (foto_bon) wajib diunggah.",
      );
      return;
    }
    const result = await this.uploadKasbonFotoBonUseCase.execute(file.buffer);
    sendResponse(res, StatusCodes.OK, "Foto bon berhasil diunggah", result);
  };

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

    const mandorRekeningId = req.body.mandorRekeningId;
    const rekeningFields = withOptionalMandorRekeningId(mandorRekeningId);

    const payload: CreateSpkPembayaranDTO =
      req.body.jenis === "KASBON"
        ? {
            spkId,
            jenis: "KASBON",
            diajukanOlehId: userId,
            ...rekeningFields,
            ...(req.body.kasbonBaris?.length
              ? {
                  kasbonBaris: req.body.kasbonBaris.map((b) => ({
                    namaSupplier: b.namaSupplier,
                    keterangan: b.keterangan,
                    nominal: b.nominal,
                    tanggalPo: b.tanggalPo,
                    fotoBon: b.fotoBon ?? null,
                  })),
                }
              : {
                  keterangan: req.body.keterangan ?? "",
                  nominal: req.body.nominal ?? 0,
                  tanggalPo: req.body.tanggalPo ?? new Date(),
                }),
          }
        : req.body.jenis === "UPAH"
          ? {
              spkId,
              jenis: "UPAH",
              tanggalDari: req.body.tanggalDari ?? new Date(),
              tanggalSampai: req.body.tanggalSampai ?? new Date(),
              baris: mapUpahBarisInput(req.body.baris ?? []),
              nominal: req.body.upahNominal ?? 0,
              diajukanOlehId: userId,
              ...rekeningFields,
            }
          : {
              spkId,
              jenis: req.body.jenis,
              diajukanOlehId: userId,
              ...rekeningFields,
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

  getKasbonDraft = async (req: Request, res: Response): Promise<void> => {
    const spkId = parseInt(routeParam(req.params.spkId), 10);
    const userId = req.user!.userId;
    const result = await this.getKasbonDraftUseCase.execute(spkId, userId, req.user!.role);
    sendResponse(res, StatusCodes.OK, "Draft kasbon berhasil diambil", result);
  };

  saveKasbonDraft = async (req: Request, res: Response): Promise<void> => {
    const spkId = parseInt(routeParam(req.params.spkId), 10);
    const userId = req.user!.userId;
    const body = req.body as { kasbonBaris: any[] };

    const result = await this.saveKasbonDraftUseCase.execute(
      spkId,
      body.kasbonBaris.map((b) => ({
        namaSupplier: b.namaSupplier,
        keterangan: b.keterangan,
        nominal: b.nominal,
        tanggalPo: b.tanggalPo,
        fotoBon: b.fotoBon ?? null,
      })),
      userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "Draft kasbon berhasil disimpan", result);
  };

  submitKasbonDraft = async (req: Request, res: Response): Promise<void> => {
    const spkId = parseInt(routeParam(req.params.spkId), 10);
    const userId = req.user!.userId;
    const mandorRekeningId = req.body.mandorRekeningId as number | undefined;
    const result = await this.submitKasbonDraftUseCase.execute(
      spkId,
      userId,
      req.user!.role,
      mandorRekeningId,
    );
    sendResponse(res, StatusCodes.OK, "Draft kasbon berhasil diajukan ke pengawas", result);
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(routeParam(req.params.id), 10);
    const result = await this.approveUseCase.execute(
      id,
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Pengajuan pembayaran SPK disetujui dan diteruskan ke finance",
      result,
    );
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
      req.body.kasbonBaris?.length
        ? {
            id,
            kasbonBaris: req.body.kasbonBaris.map((b) => ({
              namaSupplier: b.namaSupplier,
              keterangan: b.keterangan,
              nominal: b.nominal,
              tanggalPo: b.tanggalPo,
              fotoBon: b.fotoBon ?? null,
            })),
          }
        : {
            id,
            keterangan: req.body.keterangan ?? "",
            nominal: req.body.nominal ?? 0,
            tanggalPo: req.body.tanggalPo ?? new Date(),
          },
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "Data kasbon berhasil diperbarui", result);
  };

  updateUpah = async (
    req: TypedRequest<
      typeof updateSpkUpahSchema.body,
      never,
      typeof updateSpkUpahSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const result = await this.updateUpahUseCase.execute(
      {
        id,
        tanggalDari: req.body.tanggalDari,
        tanggalSampai: req.body.tanggalSampai,
        baris: mapUpahBarisInput(req.body.baris ?? []),
        nominal: req.body.upahNominal,
      },
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "Data upah berhasil diperbarui", result);
  };

  deletePengurangan = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    await this.deletePenguranganUseCase.execute(
      id,
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "Pengajuan kasbon/upah berhasil dihapus", null);
  };
}
