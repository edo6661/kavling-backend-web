import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import { hashPassword } from "../../utils/hashing";
import { Role } from "@prisma/client";

describe("Integration Test: Auth Routes (E2E API)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    it("harus berhasil register user baru (201)", async () => {
      const payload = {
        username: "New User",
        email: "new@user.com",
        password: "password",
        role: Role.CUSTOMER,
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe(payload.email);
      expect(res.body.data.role).toBe(Role.CUSTOMER);
    });

    it("harus gagal jika email format salah (400)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        username: "Bad Email",
        email: "not-an-email",
        password: "password",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation Error");
    });

    it("harus gagal jika email sudah terdaftar (409)", async () => {
      const existingPayload = {
        username: "User 1",
        email: "same@email.com",
        password: "password",
      };

      await prismaTest.user.create({
        data: {
          ...existingPayload,
          role: Role.CUSTOMER,
        },
      });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...existingPayload,
          role: Role.CUSTOMER,
        });

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("harus berhasil login dengan kredensial yang benar (200)", async () => {
      const password = "securepassword";
      const hashedPassword = await hashPassword(password);

      await prismaTest.user.create({
        data: {
          username: "Login User",
          email: "login@user.com",
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@user.com",
        password: password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.role).toBe(Role.ADMIN);
    });

    it("harus gagal login jika password salah (401)", async () => {
      const password = "securepassword";
      const hashedPassword = await hashPassword(password);

      await prismaTest.user.create({
        data: {
          username: "Login User",
          email: "wrongpass@user.com",
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "wrongpass@user.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    it("harus bisa mengakses profile dengan token valid", async () => {
      const userPayload = {
        username: "Profile User",
        email: "profile@test.com",
        password: "password",
        role: Role.ADMIN,
      };

      await request(app).post("/api/v1/auth/register").send(userPayload);

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: userPayload.email,
        password: userPayload.password,
      });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(userPayload.email);
      expect(res.body.data.user.role).toBe(Role.ADMIN);
    });

    it("harus ditolak jika tanpa token (401)", async () => {
      const res = await request(app).get("/api/v1/auth/profile");
      expect(res.status).toBe(401);
    });
  });

  it("harus gagal register jika password kurang dari 6 karakter (400)", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "Weak User",
      email: "weak@user.com",
      password: "123",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
  });
});
