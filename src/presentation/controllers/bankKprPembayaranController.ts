import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type {
  BayarBankKprPembayaranUseCase,
  GetBankKprPembayaranPaginatedUseCase,
  SetBankKprBsiCmsDilaporkanUseCase,
  SyncAllBankKprPembayaranUseCase,
} from "../../application/usecases/bankKprPembayaran/BankKprPembayaranUseCases.js";
import { getBankKprPembayaranPaginatedSchema } from "../../validations/bankKprPembayaranSchema.js";
import type { BankKprPembayaranFilterDTO } from "../../domain/dtos/BankKprPembayaranDTO.js";
import { routeParam } from "../../utils/object.js";

export class BankKprPembayaranController {
  constructor(
    private readonly getPaginatedUseCase: GetBankKprPembayaranPaginatedUseCase,
    private readonly bayarUseCase: BayarBankKprPembayaranUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetBankKprBsiCmsDilaporkanUseCase,
    private readonly syncAllUseCase: SyncAllBankKprPembayaranUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status, search } =
      getBankKprPembayaranPaginatedSchema.query.parse(req.query);

    const filters: BankKprPembayaranFilterDTO = {};
    if (status && status !== "ALL") filters.status = status;
    if (search) filters.search = search;

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pembayaran bank KPR berhasil diambil",
      result,
    );
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
    sendResponse(res, StatusCodes.OK, "Pembayaran bank KPR berhasil diproses", result);
  };

  setBsiCmsDilaporkan = async (req: Request, res: Response): Promise<void> => {
    const { ids, dilaporkan } = req.body as { ids: number[]; dilaporkan: boolean };
    const result = await this.setBsiCmsDilaporkanUseCase.execute({ ids, dilaporkan });
    const message = dilaporkan
      ? "Pembayaran ditandai sudah dilaporkan di BSI CMS"
      : "Tanda lapor BSI CMS dibatalkan";
    sendResponse(res, StatusCodes.OK, message, result);
  };

  syncAll = async (_req: Request, res: Response): Promise<void> => {
    await this.syncAllUseCase.execute();
    sendResponse(
      res,
      StatusCodes.OK,
      "Sync pembayaran bank KPR selesai",
      null,
    );
  };
}
