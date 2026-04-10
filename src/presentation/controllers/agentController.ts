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
} from "../../application/usecases/agent/AgentUseCases.js";

import type {
  createAgentSchema,
  updateAgentSchema,
} from "../../validations/agentSchema.js";
import { getAgentsPaginatedSchema } from "../../validations/agentSchema.js";
import type { AgentFilterDTO } from "../../domain/dtos/AgentDTO.js";

export class AgentController {
  constructor(
    private readonly createUseCase: CreateAgentUseCase,
    private readonly updateUseCase: UpdateAgentUseCase,
    private readonly getByIdUseCase: GetAgentByIdUseCase,
    private readonly getPaginatedUseCase: GetAgentsPaginatedUseCase,
    private readonly deleteUseCase: DeleteAgentUseCase,
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
    const { limit, cursor, ...filters } = getAgentsPaginatedSchema.query.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
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
}
