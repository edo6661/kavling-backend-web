import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { UserRepository } from "./userRepo";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import type { RegisterUserDTO } from "../dtos/UserDTO";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import { Role } from "@prisma/client";

describe("Integration Test: UserRepository", () => {
  let repo: UserRepository;

  beforeEach(async () => {
    await clearDatabase();
    repo = new UserRepository(prismaTest);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("harus berhasil membuat user baru", async () => {
    const data: RegisterUserDTO = {
      username: "Integration User",
      email: "int@test.com",
      password: "hashed_pw",
      role: Role.CUSTOMER,
    };

    const user = await repo.create(data);
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe("number");
    expect(user.email).toBe(data.email);
    expect(user.role).toBe(Role.CUSTOMER);

    const dbUser = await prismaTest.user.findUnique({
      where: { id: user.id },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe(Role.CUSTOMER);
  });

  it("harus melempar ConflictError saat membuat user dengan email duplikat", async () => {
    const data: RegisterUserDTO = {
      username: "User A",
      email: "duplicate@test.com",
      password: "pw",
      role: Role.CUSTOMER,
    };
    await repo.create(data);

    await expect(repo.create(data)).rejects.toThrow(ConflictError);
  });

  it("harus bisa mencari user berdasarkan email", async () => {
    await repo.create({
      username: "Finder",
      email: "find@me.com",
      password: "pw",
      role: Role.CUSTOMER,
    });

    const found = await repo.findByEmail("find@me.com");
    expect(found).not.toBeNull();
    expect(found?.username).toBe("Finder");

    const notFound = await repo.findByEmail("404@me.com");
    expect(notFound).toBeNull();
  });

  describe("Update User", () => {
    it("harus berhasil mengupdate data user (Happy Path)", async () => {
      const user = await repo.create({
        username: "Old Name",
        email: "old@test.com",
        password: "pw",
        role: Role.CUSTOMER,
      });

      const updated = await repo.update(user.id, {
        username: "New Name",
        email: "new@test.com",
      });

      expect(updated.username).toBe("New Name");
      expect(updated.email).toBe("new@test.com");

      const dbCheck = await prismaTest.user.findUnique({
        where: { id: user.id },
      });
      expect(dbCheck?.username).toBe("New Name");
    });

    it("harus melempar ConflictError jika update email ke email milik user lain", async () => {
      await repo.create({
        username: "User A",
        email: "a@test.com",
        password: "pw",
        role: Role.CUSTOMER,
      });
      const userB = await repo.create({
        username: "User B",
        email: "b@test.com",
        password: "pw",
        role: Role.CUSTOMER,
      });

      await expect(
        repo.update(userB.id, { email: "a@test.com" }),
      ).rejects.toThrow(ConflictError);
    });

    it("harus melempar NotFoundError jika ID user tidak ditemukan saat update", async () => {
      await expect(repo.update(999999, { username: "Ghost" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("Find Operations", () => {
    it("findAll harus mengembalikan semua user aktif", async () => {
      await repo.create({
        username: "U1",
        email: "u1@t.com",
        password: "p",
        role: Role.ADMIN,
      });
      await repo.create({
        username: "U2",
        email: "u2@t.com",
        password: "p",
        role: Role.CUSTOMER,
      });

      const result = await repo.findAll();
      expect(result).toHaveLength(2);
    });

    it("findById harus mengembalikan user yang benar", async () => {
      const user = await repo.create({
        username: "Target",
        email: "target@t.com",
        password: "p",
        role: Role.ADMIN,
      });

      const result = await repo.findById(user.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
      expect(result?.role).toBe(Role.ADMIN);
    });
  });
});
