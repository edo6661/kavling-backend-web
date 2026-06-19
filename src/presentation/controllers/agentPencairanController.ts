import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type {
  AjukanAgentPencairanUseCase,
  BayarAgentPencairanUseCase,
  GetAgentPencairanPaginatedUseCase,
  SetAgentBsiCmsDilaporkanUseCase,
} from "../../application/usecases/agentPencairan/AgentPencairanUseCases.js";
import { getAgentPencairanPaginatedSchema } from "../../validations/agentPencairanSchema.js";
import type { AgentPencairanFilterDTO } from "../../domain/dtos/AgentPencairanDTO.js";
import { routeParam } from "../../utils/object.js";

export class AgentPencairanController {
  constructor(
    private readonly getPaginatedUseCase: GetAgentPencairanPaginatedUseCase,
    private readonly ajukanUseCase: AjukanAgentPencairanUseCase,
    private readonly bayarUseCase: BayarAgentPencairanUseCase,
    private readonly setBsiCmsDilaporkanUseCase: SetAgentBsiCmsDilaporkanUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status, search, agentId, feeAgentId } =
      getAgentPencairanPaginatedSchema.query.parse(req.query);

    const filters: AgentPencairanFilterDTO = {};
    if (status && status !== "ALL") filters.status = status;
    if (search) filters.search = search;
    if (agentId) filters.agentId = agentId;
    if (feeAgentId) filters.feeAgentId = feeAgentId;

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pencairan agent berhasil diambil",
      result,
    );
  };

  ajukan = async (req: Request, res: Response): Promise<void> => {
    const { feeAgentId, includeClosing, includeMarketing } = req.body as {
      feeAgentId: number;
      includeClosing: boolean;
      includeMarketing: boolean;
    };
    const files = req.files as Express.Multer.File[] | undefined;
    const invoiceFileBuffers =
      files?.map((file) => file.buffer) ??
      (req.file?.buffer ? [req.file.buffer] : []);

    const result = await this.ajukanUseCase.execute({
      feeAgentId,
      includeClosing,
      includeMarketing,
      diajukanOlehId: req.user!.userId,
      invoiceFileBuffers,
    });
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Pengajuan pencairan agent berhasil dikirim ke finance",
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
    sendResponse(res, StatusCodes.OK, "Pembayaran agent berhasil diproses", result);
  };

  setBsiCmsDilaporkan = async (req: Request, res: Response): Promise<void> => {
    const { ids, dilaporkan } = req.body as { ids: number[]; dilaporkan: boolean };
    const result = await this.setBsiCmsDilaporkanUseCase.execute({ ids, dilaporkan });
    const message = dilaporkan
      ? "Pencairan ditandai sudah dilaporkan di BSI CMS"
      : "Tanda lapor BSI CMS dibatalkan";
    sendResponse(res, StatusCodes.OK, message, result);
  };
}
