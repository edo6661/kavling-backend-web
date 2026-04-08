import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message: string) {
    super(StatusCodes.CONFLICT, message, true);
    this.name = "ConflictError";
  }
}
