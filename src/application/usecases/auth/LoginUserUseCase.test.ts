import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { LoginUserUseCase } from "./LoginUserUseCase";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import { StatusCodes } from "http-status-codes";
import type { UserEntity } from "../../../domain/entities/User";
import jwt from "jsonwebtoken";
import * as hashingUtils from "../../../utils/hashing";
import { Role } from "@prisma/client";

vi.mock("jsonwebtoken");
vi.mock("../../../utils/hashing");

describe("LoginUserUseCase", () => {
  let userRepoMock: MockProxy<IUserRepository>;
  let loginUserUseCase: LoginUserUseCase;

  beforeEach(() => {
    userRepoMock = mock<IUserRepository>();
    loginUserUseCase = new LoginUserUseCase(userRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil login dan mengembalikan token serta data user", async () => {
    const payload = { email: "valid@example.com", password: "password" };
    const user: UserEntity = {
      id: 1,
      username: "Valid User",
      email: payload.email,
      password: "hashed_password",
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepoMock.findByEmail.mockResolvedValue(user);
    vi.spyOn(hashingUtils, "comparePassword").mockResolvedValue(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (jwt.sign as any).mockReturnValue("mock_jwt_token");

    const result = await loginUserUseCase.execute(payload);

    expect(userRepoMock.findByEmail).toHaveBeenCalledWith(payload.email);
    expect(hashingUtils.comparePassword).toHaveBeenCalledWith(
      payload.password,
      user.password,
    );
    expect(jwt.sign).toHaveBeenCalled();
    expect(result).toEqual({
      token: "mock_jwt_token",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });

  it("harus melempar error UNAUTHORIZED jika email tidak ditemukan", async () => {
    userRepoMock.findByEmail.mockResolvedValue(null);

    await expect(
      loginUserUseCase.execute({
        email: "unknown@example.com",
        password: "any",
      }),
    ).rejects.toThrow(
      expect.objectContaining({ statusCode: StatusCodes.UNAUTHORIZED }),
    );
  });

  it("harus melempar error UNAUTHORIZED jika password salah", async () => {
    const user = mock<UserEntity>();
    user.password = "hashed_real";
    userRepoMock.findByEmail.mockResolvedValue(user);
    vi.spyOn(hashingUtils, "comparePassword").mockResolvedValue(false);

    await expect(
      loginUserUseCase.execute({
        email: "valid@example.com",
        password: "wrong_password",
      }),
    ).rejects.toThrow(
      expect.objectContaining({ statusCode: StatusCodes.UNAUTHORIZED }),
    );
  });

  it("harus melempar error jika repository mengalami kegagalan sistem (misal DB down)", async () => {
    const dbError = new Error("Connection refused");
    userRepoMock.findByEmail.mockRejectedValue(dbError);

    await expect(
      loginUserUseCase.execute({
        email: "valid@example.com",
        password: "any",
      }),
    ).rejects.toThrow("Connection refused");
  });
});
