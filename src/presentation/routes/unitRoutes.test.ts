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
import { Role, UnitStatus } from "@prisma/client";
import { UnitFactory } from "../../tests/factories";

describe("Integration Test: Unit Routes (API E2E)", () => {
  let adminToken: string;
  let marketingToken: string;
  let customerToken: string;

  beforeEach(async () => {
    await clearDatabase();

    adminToken = jwt.sign({ userId: 1, role: Role.ADMIN }, env.JWT_SECRET);
    marketingToken = jwt.sign(
      { userId: 2, role: Role.MARKETING },
      env.JWT_SECRET,
    );
    customerToken = jwt.sign(
      { userId: 3, role: Role.CUSTOMER },
      env.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/units", () => {
    it("harus mengizinkan ADMIN membuat unit baru (201)", async () => {
      const payload = {
        namaPerumahan: "Bumantara",
        blokUnit: "A1",
        tipe: "36/60",
        luasTanah: 60,
        luasBangunan: 36,
        status: UnitStatus.TERSEDIA,
      };

      const res = await request(app)
        .post("/api/v1/units")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.blokUnit).toBe("A1");
    });

    it("harus menolak CUSTOMER membuat unit (403)", async () => {
      const res = await request(app)
        .post("/api/v1/units")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ namaPerumahan: "Bumantara", blokUnit: "A2" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/units", () => {
    it("harus mengizinkan MARKETING melihat daftar unit (200)", async () => {
      await UnitFactory.create({ blokUnit: "B1" });
      await UnitFactory.create({ blokUnit: "B2" });

      const res = await request(app)
        .get("/api/v1/units")
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PATCH /api/v1/units/:id", () => {
    it("harus mengizinkan ADMIN mengupdate unit (200)", async () => {
      const unit = await UnitFactory.create({ status: UnitStatus.TERSEDIA });

      const res = await request(app)
        .patch(`/api/v1/units/${unit.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: UnitStatus.TERJUAL });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(UnitStatus.TERJUAL);
    });
  });

  describe("DELETE /api/v1/units/:id", () => {
    it("harus mengizinkan ADMIN menghapus unit (200)", async () => {
      const unit = await UnitFactory.create();

      const res = await request(app)
        .delete(`/api/v1/units/${unit.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Unit berhasil dihapus");
    });

    it("harus MENOLAK MARKETING menghapus unit (403)", async () => {
      const unit = await UnitFactory.create();

      const res = await request(app)
        .delete(`/api/v1/units/${unit.id}`)
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(403);
    });
  });
});
