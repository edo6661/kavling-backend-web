import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type {
  BayarNotarisPembayaranUseCase,
  GetNotarisPembayaranPaginatedUseCase,
  SetNotarisBsiCmsDilaporkanUseCase,
} from "../../application/usecases/notarisPembayaran/NotarisPembayaranUseCases.js";
import { getNotarisPembayaranPaginatedSchema } from "../../validations/notarisPembayaranSchema";
import type { NotarisPembayaranFilterDTO } from "../../domain/dtos/NotarisPembayaranDTO.js";
import { routeParam } from "../../utils/object.js";

export class NotarisPembayaranController {
  constructor(
    private readonly getPaginatedUseCase: GetNotarisPembayaranPaginatedUseCase,
    private readonly bayarUseCase: BayarNotarisPembayaranUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetNotarisBsiCmsDilaporkanUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status, search } =
      getNotarisPembayaranPaginatedSchema.query.parse(req.query);

    const filters: NotarisPembayaranFilterDTO = {};
    if (status && status !== "ALL") filters.status = status;
    if (search) filters.search = search;

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pembayaran notaris berhasil diambil",
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
    sendResponse(res, StatusCodes.OK, "Pembayaran notaris berhasil diproses", result);
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
