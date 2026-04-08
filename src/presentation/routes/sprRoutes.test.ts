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
import { Role, UnitStatus, CaraPembayaran, SprStatus } from "@prisma/client";
import {
  UnitFactory,
  CustomerFactory,
  UserFactory,
  BankRekeningPtFactory,
  SprFactory,
} from "../../tests/factories";

describe("Integration Test: SPR Routes (E2E API)", () => {
  let adminToken: string;
  let marketingToken: string;
  let customerToken: string;
  let adminUser: any;
  let marketingUser: any;
  let regularCustomer: any;

  beforeEach(async () => {
    await clearDatabase();

    // Setup Users
    adminUser = await UserFactory.create({ role: Role.ADMIN });
    marketingUser = await UserFactory.create({ role: Role.MARKETING });
    regularCustomer = await UserFactory.create({ role: Role.CUSTOMER });

    // Generate Tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      env.JWT_SECRET,
    );
    marketingToken = jwt.sign(
      { userId: marketingUser.id, role: marketingUser.role },
      env.JWT_SECRET,
    );
    customerToken = jwt.sign(
      { userId: regularCustomer.id, role: regularCustomer.role },
      env.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/v1/spr", () => {
    it("harus mengizinkan MARKETING membuat SPR (201)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.TERSEDIA });
      const bank = await BankRekeningPtFactory.create();

      const payload = {
        customerId: customer.id,
        unitId: unit.id,
        bankRekeningPtId: bank.id,
        hargaJual: 450000000,
        caraPembayaran: CaraPembayaran.KPR_BRI,
      };

      const res = await request(app)
        .post("/api/v1/spr")
        .set("Authorization", `Bearer ${marketingToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("nomorSpr");
      expect(res.body.data.marketingUserId).toBe(marketingUser.id);
    });

    it("harus menolak pembuatan SPR jika unit sudah tidak TERSEDIA (409)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.BOOKING }); // Unit sudah di-booking
      const bank = await BankRekeningPtFactory.create();

      const payload = {
        customerId: customer.id,
        unitId: unit.id,
        bankRekeningPtId: bank.id,
        hargaJual: 450000000,
        // Gunakan Enum KPR yang pasti valid agar tidak terkena validasi 400 Zod
        caraPembayaran: CaraPembayaran.KPR_BRI,
      };

      const res = await request(app)
        .post("/api/v1/spr")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("tidak tersedia");
    });
  });

  describe("GET /api/v1/spr", () => {
    it("harus mengembalikan list SPR terpaginasi (200)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create();
      const bank = await BankRekeningPtFactory.create();

      await SprFactory.create({
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketingUser.id,
        bankRekeningPtId: bank.id,
      });

      const res = await request(app)
        .get("/api/v1/spr")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe("GET /api/v1/spr/:id", () => {
    it("harus bisa mengambil detail SPR berdasarkan ID (200)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create();
      const bank = await BankRekeningPtFactory.create();

      const spr = await SprFactory.create({
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketingUser.id,
        bankRekeningPtId: bank.id,
        hargaJual: 500000000,
      });

      const res = await request(app)
        .get(`/api/v1/spr/${spr.id}`)
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(spr.id);
      expect(res.body.data.hargaJual).toBe(500000000);
    });

    it("harus melempar 404 jika SPR tidak ditemukan", async () => {
      const res = await request(app)
        .get(`/api/v1/spr/99999`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/spr/:id", () => {
    it("harus berhasil mengupdate data SPR oleh ADMIN (200)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create();
      const bank = await BankRekeningPtFactory.create();

      const spr = await SprFactory.create({
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketingUser.id,
        bankRekeningPtId: bank.id,
        hargaJual: 500000000,
      });

      const res = await request(app)
        .patch(`/api/v1/spr/${spr.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        // Kita ubah hargaJual dan diskon saja untuk menghindari ketidakcocokan Enum Status
        .send({ hargaJual: 480000000, diskonPenjualan: 5000000 });

      expect(res.status).toBe(200);
      expect(res.body.data.hargaJual).toBe(480000000);
      expect(res.body.data.diskonPenjualan).toBe(5000000);
    });

    it("harus menolak CUSTOMER biasa mengupdate data SPR (403)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create();
      const bank = await BankRekeningPtFactory.create();

      const spr = await SprFactory.create({
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketingUser.id,
        bankRekeningPtId: bank.id,
      });

      const res = await request(app)
        .patch(`/api/v1/spr/${spr.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ hargaJual: 1000 });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/spr/:id", () => {
    it("harus berhasil menghapus SPR dan mengembalikan status unit ke TERSEDIA (200)", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.BOOKING });
      const bank = await BankRekeningPtFactory.create();

      const spr = await SprFactory.create({
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketingUser.id,
        bankRekeningPtId: bank.id,
      });

      const res = await request(app)
        .delete(`/api/v1/spr/${spr.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deletedSpr = await prismaTest.spr.findUnique({
        where: { id: spr.id },
      });
      expect(deletedSpr).toBeNull();

      const updatedUnit = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(updatedUnit?.status).toBe(UnitStatus.TERSEDIA);
    });

    it("harus menolak MARKETING menghapus SPR (403)", async () => {
      const res = await request(app)
        .delete(`/api/v1/spr/1`)
        .set("Authorization", `Bearer ${marketingToken}`);

      expect(res.status).toBe(403);
    });
  });
});
