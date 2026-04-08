import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { Role } from "@prisma/client";

describe("Integration: User Routes (RBAC)", () => {
  let adminToken: string;
  let customerToken: string;

  beforeEach(async () => {
    await clearDatabase();

    adminToken = jwt.sign({ userId: 1, role: Role.ADMIN }, env.JWT_SECRET);
    customerToken = jwt.sign(
      { userId: 2, role: Role.CUSTOMER },
      env.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/v1/users", () => {
    it("harus mengizinkan ADMIN mengakses list user (200)", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("harus MELARANG CUSTOMER mengakses list user (403)", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("harus MELARANG Public/Guest (401)", async () => {
      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/users/:id", () => {
    it("harus MELARANG CUSTOMER mengupdate user (403)", async () => {
      const res = await request(app)
        .patch("/api/v1/users/1")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ username: "Hacker" });

      expect(res.status).toBe(403);
    });
  });
});
