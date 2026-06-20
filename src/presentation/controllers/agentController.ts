import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateAgentUseCase,
  UpdateAgentUseCase,
  GetAgentByIdUseCase,
  GetAgentsPaginatedUseCase,
  DeleteAgentUseCase,
  GetAgentProfileUseCase,
  UpdateAgentSelfUseCase,
} from "../../application/usecases/agent/AgentUseCases.js";

import type {
  createAgentSchema,
  generateAgentAccountSchema,
  updateAgentSchema,
  updateAgentSelfSchema,
} from "../../validations/agentSchema.js";
import { getAgentsPaginatedSchema } from "../../validations/agentSchema.js";
import type { AgentFilterDTO } from "../../domain/dtos/AgentDTO.js";
import type { UploadAgentDocumentUseCase } from "../../application/usecases/agent/UploadAgentDocumentUseCase.js";
import type { GenerateAgentAccountUseCase } from "../../application/usecases/agent/GenerateAgentAccountUseCase.js";
import { AppError } from "../../domain/errors/AppError.js";

export class AgentController {
  constructor(
    private readonly createUseCase: CreateAgentUseCase,
    private readonly updateUseCase: UpdateAgentUseCase,
    private readonly getByIdUseCase: GetAgentByIdUseCase,
    private readonly getPaginatedUseCase: GetAgentsPaginatedUseCase,
    private readonly deleteUseCase: DeleteAgentUseCase,
    private readonly uploadDocumentUseCase: UploadAgentDocumentUseCase,
    private readonly generateAccountUseCase: GenerateAgentAccountUseCase,
    private readonly getProfileUseCase: GetAgentProfileUseCase,
    private readonly updateSelfUseCase: UpdateAgentSelfUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createAgentSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Agent berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateAgentSchema.body,
      any,
      typeof updateAgentSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Agent berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateAgentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data agent berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, ...filters } = getAgentsPaginatedSchema.query.parse(
      req.query,
    );

    const result = await this.getPaginatedUseCase.execute(
      page,
      limit,
      filters as AgentFilterDTO,
    );
    sendResponse(res, StatusCodes.OK, "Daftar agent berhasil diambil", result);
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateAgentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Agent berhasil dihapus");
  };

  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const docType = req.params.docType as string;

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }
    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadDocumentUseCase.execute(
      id,
      req.file.buffer,
      docType,
    );
    sendResponse(res, StatusCodes.OK, "Dokumen berhasil diunggah", result);
  };

  generateAccount = async (
    req: TypedRequest<
      typeof generateAgentAccountSchema.body,
      any,
      typeof generateAgentAccountSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { password } = req.body;
    const result = await this.generateAccountUseCase.execute(id, password);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Akun portal agent berhasil di-generate",
      result,
    );
  };

  getMyProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, "Sesi tidak valid");

    const result = await this.getProfileUseCase.execute(userId);
    sendResponse(res, StatusCodes.OK, "Data profil berhasil diambil", result);
  };

  updateMyProfile = async (
    req: TypedRequest<typeof updateAgentSelfSchema.body>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, "Sesi tidak valid");

    const result = await this.updateSelfUseCase.execute(userId, req.body);
    sendResponse(res, StatusCodes.OK, "Profil agent berhasil diperbarui", result);
  };

  uploadMyDocument = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const docType = req.params.docType as string;

    if (!userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, "Sesi tidak valid");
    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const agent = await this.getProfileUseCase.execute(userId);

    const result = await this.uploadDocumentUseCase.execute(
      agent.id,
      req.file.buffer,
      docType,
    );
    sendResponse(res, StatusCodes.OK, "Dokumen Anda berhasil diunggah", result);
  };
}
