import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { RegisterUserUseCase } from "./RegisterUserUseCase";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import { ConflictError } from "../../../domain/errors/ConflictError";
import type { UserEntity } from "../../../domain/entities/User";
import { Role } from "@prisma/client";

vi.mock("../../../utils/hashing", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_password_123"),
}));

describe("RegisterUserUseCase", () => {
  let userRepoMock: MockProxy<IUserRepository>;
  let registerUserUseCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepoMock = mock<IUserRepository>();
    registerUserUseCase = new RegisterUserUseCase(userRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil mendaftarkan user baru", async () => {
    const payload = {
      username: "Test User",
      email: "test@example.com",
      password: "password",
      role: Role.CUSTOMER,
    };

    userRepoMock.findByEmail.mockResolvedValue(null);

    const createdUser: UserEntity = {
      id: 1,
      username: payload.username,
      email: payload.email,
      password: "hashed_password_123",
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepoMock.create.mockResolvedValue(createdUser);

    const result = await registerUserUseCase.execute(payload);

    expect(userRepoMock.findByEmail).toHaveBeenCalledWith(payload.email);
    expect(userRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "hashed_password_123",
        role: Role.CUSTOMER,
      }),
    );
    expect(result).toEqual({
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
      createdAt: createdUser.createdAt,
    });
  });

  it("harus melempar ConflictError jika email sudah terdaftar", async () => {
    const payload = {
      username: "Duplicate User",
      email: "exist@example.com",
      password: "password",
      role: Role.CUSTOMER,
    };

    const existingUser = mock<UserEntity>();
    userRepoMock.findByEmail.mockResolvedValue(existingUser);

    await expect(registerUserUseCase.execute(payload)).rejects.toThrow(
      ConflictError,
    );
    expect(userRepoMock.create).not.toHaveBeenCalled();
  });
});
