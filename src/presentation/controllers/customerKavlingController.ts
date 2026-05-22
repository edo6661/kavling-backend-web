import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  GetCustomerKavlingsPaginatedUseCase,
  UpdateCustomerKavlingUseCase,
} from "../../application/usecases/customerKavling/CustomerKavlingUseCases.js";
import type { updateCustomerKavlingSchema } from "../../validations/customerKavlingSchema.js";
import { getCustomerKavlingsPaginatedSchema } from "../../validations/customerKavlingSchema.js";
import type { CustomerKavlingFilterDTO } from "../../domain/dtos/CustomerKavlingDTO.js";

export class CustomerKavlingController {
  constructor(
    private readonly getPaginatedUseCase: GetCustomerKavlingsPaginatedUseCase,
    private readonly updateUseCase: UpdateCustomerKavlingUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, ...filters } =
      getCustomerKavlingsPaginatedSchema.query.parse(req.query);

    const result = await this.getPaginatedUseCase.execute(
      page,
      limit,
      filters as CustomerKavlingFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data Kavling Customer berhasil diambil",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateCustomerKavlingSchema.body,
      any,
      typeof updateCustomerKavlingSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Kavling Customer berhasil diperbarui",
      result,
    );
  };
}
