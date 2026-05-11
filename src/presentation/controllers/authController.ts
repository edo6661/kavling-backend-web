import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response";
import type { LoginUserUseCase } from "../../application/usecases/auth/LoginUserUseCase";
import type { RegisterUserUseCase } from "../../application/usecases/auth/RegisterUserUseCase.js";
import type { GetProfileUseCase } from "../../application/usecases/auth/GetProfileUseCase.js";
import type { CustomerLoginUseCase } from "../../application/usecases/auth/CustomerLoginUseCase.js";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly customerLoginUseCase: CustomerLoginUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.registerUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "User registered successfully",
      result,
    );
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUseCase.execute(req.body);
    sendResponse(res, StatusCodes.OK, "Login Sukses", result);
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.userId) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, "User ID tidak valid");
      return;
    }

    const user = await this.getProfileUseCase.execute(req.user.userId);
    sendResponse(res, StatusCodes.OK, "Berhasil mengambil profil", { user });
  };
  loginCustomer = async (req: Request, res: Response): Promise<void> => {
    const result = await this.customerLoginUseCase.execute(req.body);
    sendResponse(res, StatusCodes.OK, "Login Customer Sukses", result);
  };
}
