import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { UpdateUserUseCase } from "./UpdateUserUseCase";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import * as hashingUtils from "../../../utils/hashing";
import { Role } from "@prisma/client";

vi.mock("../../../utils/hashing");

describe("UpdateUserUseCase", () => {
  let userRepoMock: MockProxy<IUserRepository>;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    userRepoMock = mock<IUserRepository>();
    useCase = new UpdateUserUseCase(userRepoMock);
    vi.clearAllMocks();
  });

  it("harus men-hash password jika field password disertakan dalam update", async () => {
    const payload = { password: "newpassword" };
    vi.spyOn(hashingUtils, "hashPassword").mockResolvedValue(
      "hashed_new_secret",
    );

    userRepoMock.update.mockResolvedValue({
      id: 1,
      username: "User",
      email: "a@a.com",
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await useCase.execute(1, payload);

    expect(hashingUtils.hashPassword).toHaveBeenCalledWith("newpassword");
    expect(userRepoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        password: "hashed_new_secret",
      }),
    );
  });

  it("JANGAN men-hash apapun jika field password tidak ada/undefined", async () => {
    const payload = { username: "Ganti Nama" };
    userRepoMock.update.mockResolvedValue({
      id: 1,
      username: "Ganti Nama",
      email: "a@a.com",
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await useCase.execute(1, payload);

    expect(hashingUtils.hashPassword).not.toHaveBeenCalled();
    expect(userRepoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        username: "Ganti Nama",
      }),
    );
  });
});
