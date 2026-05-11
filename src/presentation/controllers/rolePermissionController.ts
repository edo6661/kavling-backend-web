import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  UpsertRolePermissionUseCase,
  GetRolePermissionsUseCase,
  DeleteRolePermissionUseCase,
} from "../../application/usecases/rolePermission/RolePermissionUseCases.js";
import type {
  upsertRolePermissionSchema,
  rolePermissionIdParamSchema,
} from "../../validations/rolePermissionSchema.js";

export class RolePermissionController {
  constructor(
    private readonly upsertUseCase: UpsertRolePermissionUseCase,
    private readonly getUseCase: GetRolePermissionsUseCase,
    private readonly deleteUseCase: DeleteRolePermissionUseCase,
  ) {}

  upsert = async (
    req: TypedRequest<typeof upsertRolePermissionSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.upsertUseCase.execute(req.body);
    sendResponse(res, StatusCodes.OK, "Hak akses berhasil disimpan", result);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getUseCase.execute(req.query);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar hak akses berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof rolePermissionIdParamSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Hak akses berhasil dihapus");
  };
}
