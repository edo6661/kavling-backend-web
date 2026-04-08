import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { GetAllUsersUseCase } from "../../application/usecases/user/GetAllUsersUseCase.js";
import type { UpdateUserUseCase } from "../../application/usecases/user/UpdateUserUseCase.js";
import type { GetUsersPaginatedUseCase } from "../../application/usecases/user/GetUsersPaginatedUseCase.js";

import type {
  updateUserSchema} from "../../validations/userSchema.js";
import {
  getUsersPaginatedSchema
} from "../../validations/userSchema.js";
import type { UserFilterDTO } from "../../domain/dtos/UserDTO.js";

export class UserController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getUsersPaginatedUseCase: GetUsersPaginatedUseCase,
  ) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getAllUsersUseCase.execute();
    sendResponse(res, StatusCodes.OK, "Semua user berhasil diambil", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateUserSchema.body,
      any,
      typeof updateUserSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    const result = await this.updateUserUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "User berhasil diupdate", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } = getUsersPaginatedSchema.query.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getUsersPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as UserFilterDTO,
    );
    sendResponse(res, StatusCodes.OK, "Data user berhasil diambil", result);
  };
}
