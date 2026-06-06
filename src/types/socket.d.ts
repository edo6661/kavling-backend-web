import type { JwtUserPayload } from "../domain/dtos/UserDTO.js";

declare module "socket.io" {
  interface Socket {
    data: {
      user?: JwtUserPayload;
    };
  }
}
