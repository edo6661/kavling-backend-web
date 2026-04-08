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
import { CustomerFactory } from "../../tests/factories";

describe("Integration Test: Customer Routes (E2E API)", () => {
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

  describe("POST /api/v1/customers", () => {
    it("harus mengizinkan MARKETING membuat customer baru (201)", async () => {
      const payload = {
        nikKtp: "3201234567890123",
        nama: "Budi Baru",
        noHp: "081234567890",
        alamatKtp: "Jl. Merdeka",
      };

      const res = await request(app)
        .post("/api/v1/customers")
        .set("Authorization", `Bearer ${marketingToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.nama).toBe("Budi Baru");
      expect(res.body.data.nikKtp).toBe("3201234567890123");
    });

    it("harus MENOLAK akses jika CUSTOMER mencoba membuat data (403)", async () => {
      const res = await request(app)
        .post("/api/v1/customers")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ nikKtp: "123", nama: "Gagal", noHp: "081", alamatKtp: "X" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/customers", () => {
    it("harus mengizinkan ADMIN melihat daftar customer (200)", async () => {
      await CustomerFactory.create({ nama: "Test Get 1" });
      await CustomerFactory.create({ nama: "Test Get 2" });

      const res = await request(app)
        .get("/api/v1/customers")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PATCH /api/v1/customers/:id", () => {
    it("harus mengizinkan MARKETING mengupdate data customer (200)", async () => {
      const customer = await CustomerFactory.create({ nama: "Budi Lama" });

      const res = await request(app)
        .patch(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${marketingToken}`)
        .send({ nama: "Budi Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.nama).toBe("Budi Updated");
    });
  });

  describe("DELETE /api/v1/customers/:id", () => {
    it("harus mengizinkan ADMIN menghapus customer (200)", async () => {
      const customer = await CustomerFactory.create();

      const res = await request(app)
        .delete(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Customer berhasil dihapus");
    });

    it("harus MENOLAK MARKETING menghapus customer (403)", async () => {
      const customer = await CustomerFactory.create();

      const res = await request(app)
        .delete(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(403);
    });
  });
});
