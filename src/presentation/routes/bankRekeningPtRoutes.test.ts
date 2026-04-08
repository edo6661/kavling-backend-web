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
import { BankRekeningPtFactory } from "../../tests/factories/bankRekeningPtFactory";

describe("Integration Test: Bank Rekening PT Routes (E2E API)", () => {
  let adminToken: string;
  let marketingToken: string;

  beforeEach(async () => {
    await clearDatabase();
    adminToken = jwt.sign({ userId: 1, role: Role.ADMIN }, env.JWT_SECRET);
    marketingToken = jwt.sign(
      { userId: 2, role: Role.MARKETING },
      env.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/bank-rekening", () => {
    it("harus mengizinkan ADMIN membuat rekening (201)", async () => {
      const payload = {
        namaBank: "BCA",
        noRekening: "12345",
        atasNama: "PT ABC",
      };

      const res = await request(app)
        .post("/api/v1/bank-rekening")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.namaBank).toBe("BCA");
    });

    it("harus MENOLAK MARKETING membuat rekening (403)", async () => {
      const payload = {
        namaBank: "BNI",
        noRekening: "67890",
        atasNama: "PT XYZ",
      };

      const res = await request(app)
        .post("/api/v1/bank-rekening")
        .set("Authorization", `Bearer ${marketingToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/bank-rekening", () => {
    it("harus mengizinkan MARKETING melihat daftar rekening (200)", async () => {
      await BankRekeningPtFactory.create();

      const res = await request(app)
        .get("/api/v1/bank-rekening")
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PATCH /api/v1/bank-rekening/:id", () => {
    it("harus mengizinkan ADMIN mengupdate rekening (200)", async () => {
      const bank = await BankRekeningPtFactory.create({ namaBank: "BCA Lama" });

      const res = await request(app)
        .patch(`/api/v1/bank-rekening/${bank.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ namaBank: "BCA Baru" });

      expect(res.status).toBe(200);
      expect(res.body.data.namaBank).toBe("BCA Baru");
    });
  });

  describe("DELETE /api/v1/bank-rekening/:id", () => {
    it("harus mengizinkan ADMIN menghapus rekening (200)", async () => {
      const bank = await BankRekeningPtFactory.create();

      const res = await request(app)
        .delete(`/api/v1/bank-rekening/${bank.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
