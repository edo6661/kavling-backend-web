import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { CreateSpkUseCase, UpdateSpkUseCase } from "./SpkUseCases.js";
import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { SpkEntity } from "../../../domain/entities/Spk.js";
import type { CreateSpkDTO } from "../../../domain/dtos/SpkDTO.js";

const SPK_URL = "https://cloudinary.com/spk.pdf";
const RAB_URL = "https://cloudinary.com/rab.pdf";

const baseCreateDto = (): CreateSpkDTO => ({
  noSpk: "001/2026",
  tanggalSpk: new Date("2026-01-15"),
  judulPekerjaan: "Pekerjaan rumah",
  nilaiKontrak: 100_000_000,
  mandorId: 3,
  kavlingIds: [10],
});

const buildSpkEntity = (overrides: Partial<SpkEntity> = {}): SpkEntity => ({
  id: 1,
  noSpk: "001/2026",
  jenis: "RUMAH",
  terminScheme: "RUMAH_DEFAULT",
  tanggalSpk: new Date("2026-01-15"),
  judulPekerjaan: "Pekerjaan rumah",
  nilaiKontrak: 100_000_000,
  bankRekeningPtId: null,
  zonaId: null,
  zona: null,
  nilaiSudahDibayarkan: 0,
  sisaNilaiKontrak: 100_000_000,
  progressOverride: null,
  progress: 0,
  progressIsOverride: false,
  notesPekerjaan: null,
  jatuhTempo: null,
  fileSpk: null,
  fileRab: null,
  mandorId: 3,
  mandor: { id: 3, username: "mandor1" },
  statusApproval: "PENDING",
  diajukanOlehId: 5,
  disetujuiOlehId: null,
  tanggalDisetujui: null,
  catatanPenolakan: null,
  diajukanOleh: { id: 5, username: "admin" },
  disetujuiOleh: null,
  kavlingItems: [],
  pekerjaanInfraItems: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("CreateSpkUseCase", () => {
  let repo: MockProxy<ISpkRepository>;
  let cloudinary: MockProxy<CloudinaryService>;
  let useCase: CreateSpkUseCase;

  beforeEach(() => {
    repo = mock<ISpkRepository>();
    cloudinary = mock<CloudinaryService>();
    useCase = new CreateSpkUseCase(repo, cloudinary);
    repo.create.mockImplementation(async (data) =>
      buildSpkEntity({
        fileSpk: data.fileSpk ?? null,
        fileRab: data.fileRab ?? null,
      }),
    );
  });

  it("menyimpan SPK tanpa dokumen jika tidak ada file yang diunggah", async () => {
    await useCase.execute(baseCreateDto(), undefined, undefined, 5);

    expect(cloudinary.uploadFile).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileSpk: null,
        fileRab: null,
        diajukanOlehId: 5,
      }),
    );
  });

  it("mengunggah fileSpk dan fileRab ke folder terpisah saat keduanya ada", async () => {
    const spkBuffer = Buffer.from("spk");
    const rabBuffer = Buffer.from("rab");
    cloudinary.uploadFile.mockImplementation(async (buffer, folder) => {
      if (folder === "bumantara/spk") return SPK_URL;
      if (folder === "bumantara/spk/rab") return RAB_URL;
      throw new Error(`folder tidak dikenal: ${folder}`);
    });

    const result = await useCase.execute(baseCreateDto(), spkBuffer, rabBuffer, 5);

    expect(cloudinary.uploadFile).toHaveBeenCalledTimes(2);
    expect(cloudinary.uploadFile).toHaveBeenCalledWith(spkBuffer, "bumantara/spk");
    expect(cloudinary.uploadFile).toHaveBeenCalledWith(rabBuffer, "bumantara/spk/rab");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileSpk: SPK_URL,
        fileRab: RAB_URL,
      }),
    );
    expect(result.fileSpk).toBe(SPK_URL);
    expect(result.fileRab).toBe(RAB_URL);
  });

  it("hanya mengunggah fileSpk jika fileRab tidak dikirim", async () => {
    cloudinary.uploadFile.mockResolvedValue(SPK_URL);

    await useCase.execute(baseCreateDto(), Buffer.from("spk"), undefined, 5);

    expect(cloudinary.uploadFile).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileSpk: SPK_URL,
        fileRab: null,
      }),
    );
  });
});

describe("UpdateSpkUseCase", () => {
  let repo: MockProxy<ISpkRepository>;
  let cloudinary: MockProxy<CloudinaryService>;
  let useCase: UpdateSpkUseCase;

  beforeEach(() => {
    repo = mock<ISpkRepository>();
    cloudinary = mock<CloudinaryService>();
    useCase = new UpdateSpkUseCase(repo, cloudinary);
    repo.findById.mockResolvedValue(
      buildSpkEntity({ fileSpk: SPK_URL, fileRab: null }),
    );
    repo.update.mockImplementation(async (_id, data) =>
      buildSpkEntity({
        fileSpk: data.fileSpk ?? SPK_URL,
        fileRab: data.fileRab ?? null,
      }),
    );
  });

  it("tidak mengubah dokumen jika tidak ada file baru", async () => {
    await useCase.execute(1, { judulPekerjaan: "Judul baru" });

    expect(cloudinary.uploadFile).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ fileSpk: expect.anything(), fileRab: expect.anything() }),
    );
  });

  it("hanya memperbarui fileRab tanpa menyentuh fileSpk yang sudah ada", async () => {
    cloudinary.uploadFile.mockResolvedValue(RAB_URL);

    await useCase.execute(1, {}, undefined, Buffer.from("rab"));

    expect(cloudinary.uploadFile).toHaveBeenCalledTimes(1);
    expect(cloudinary.uploadFile).toHaveBeenCalledWith(
      Buffer.from("rab"),
      "bumantara/spk/rab",
    );
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ fileRab: RAB_URL }),
    );
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ fileSpk: expect.anything() }),
    );
  });
});
