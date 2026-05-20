import type { JwtUserPayload } from "../domain/dtos/UserDTO.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      files?: Multer.File[];
    }
  }
}
