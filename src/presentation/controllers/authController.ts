import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { LoginUserUseCase } from "../../application/usecases/auth/LoginUserUseCase.js";
import type { RegisterUserUseCase } from "../../application/usecases/auth/RegisterUserUseCase.js";
import type { GetProfileUseCase } from "../../application/usecases/auth/GetProfileUseCase.js";
import type { CustomerLoginUseCase } from "../../application/usecases/auth/CustomerLoginUseCase.js";
import type { UpdateCustomerSelfUseCase } from "../../application/usecases/auth/UpdateCustomerSelfUseCase.js";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly customerLoginUseCase: CustomerLoginUseCase,
    private readonly updateCustomerSelfUseCase: UpdateCustomerSelfUseCase,
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

  updateSelf = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, "Sesi tidak valid");
      return;
    }

    const result = await this.updateCustomerSelfUseCase.execute(
      userId,
      req.body,
    );
    sendResponse(res, StatusCodes.OK, "Data akun berhasil diperbarui", result);
  };
}
