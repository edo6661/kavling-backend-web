import { describe, it, expect, beforeEach } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { GetAllUsersUseCase } from "./GetAllUsersUseCase";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import type { UserEntity } from "../../../domain/entities/User";
import { Role } from "@prisma/client";

describe("GetAllUsersUseCase", () => {
  let userRepo: MockProxy<IUserRepository>;
  let useCase: GetAllUsersUseCase;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    useCase = new GetAllUsersUseCase(userRepo);
  });

  it("harus mengembalikan daftar user dan memapping data dengan benar", async () => {
    const mockUsers: UserEntity[] = [
      {
        id: 1,
        username: "User 1",
        email: "u1@test.com",
        password: "hashed_pw",
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        username: "User 2",
        email: "u2@test.com",
        password: "hashed_pw",
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    userRepo.findAll.mockResolvedValue(mockUsers);

    const result = await useCase.execute();

    expect(userRepo.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]?.username).toBe("User 1");
    expect(result[1]?.role).toBe(Role.CUSTOMER);
  });
});
