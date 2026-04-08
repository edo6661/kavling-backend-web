import { describe, it, expect } from "vitest";
import { UserMapper } from "./UserMapper";
import { Role } from "@prisma/client";

describe("UserMapper", () => {
  it("harus memetakan Prisma User ke Domain Entity dengan benar", () => {
    const mockPrismaUser: any = {
      id: 1,
      username: "Test",
      email: "test@example.com",
      password: "hashed_password",
      role: Role.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const domain = UserMapper.toDomain(mockPrismaUser);

    expect(domain.id).toBe(1);
    expect(domain.username).toBe("Test");
    expect(domain.role).toBe(Role.ADMIN);
  });
});
