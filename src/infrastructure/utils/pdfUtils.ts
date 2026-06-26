import { AppError } from "../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

export function isPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length > 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}
export function isPdfEncrypted(buffer: Buffer): boolean {
  const checkSize = Math.min(buffer.length, 8192);
  const content = buffer.toString("latin1", 0, checkSize);
  return content.includes("/Encrypt");
}
export function unlockPdf(buffer: Buffer, password?: string): Buffer {
  const tmpDir = os.tmpdir();
  const randomId = crypto.randomBytes(8).toString("hex");
  const inputPath = path.join(tmpDir, `input_${randomId}.pdf`);
  const outputPath = path.join(tmpDir, `output_${randomId}.pdf`);

  try {
    fs.writeFileSync(inputPath, buffer);

    // Selalu jalankan qpdf — dia sendiri yang tahu apakah perlu decrypt atau tidak
    // --decrypt pada PDF tidak terenkripsi tetap menghasilkan PDF valid
    // --warning-exit-0: PDF rusak/non-standar (mis. scan KK) sering berhasil diproses
    // dengan peringatan; tanpa flag ini qpdf exit 3 dan execSync menganggap gagal
    const passwordArg = password ? `--password=${password}` : "";
    execSync(
      `qpdf --warning-exit-0 ${passwordArg} --decrypt "${inputPath}" "${outputPath}"`,
      { stdio: "pipe" },
    );

    return fs.readFileSync(outputPath);
  } catch (err: unknown) {
    // qpdf kadang exit non-zero meski file output sudah terbentuk (PDF rusak tapi bisa diperbaiki)
    if (fs.existsSync(outputPath)) {
      try {
        const repaired = fs.readFileSync(outputPath);
        if (repaired.length > 0) {
          console.warn(
            "[pdfUtils] qpdf selesai dengan peringatan, memakai file hasil perbaikan",
          );
          return repaired;
        }
      } catch {
        // lanjut ke penanganan error di bawah
      }
    }

    const stderr =
      err instanceof Error && "stderr" in err
        ? String((err as NodeJS.ErrnoException & { stderr?: Buffer }).stderr)
        : "";
    const message = err instanceof Error ? err.message : "";
    const combined = (stderr + message).toLowerCase();

    console.error("[pdfUtils] qpdf error:", combined);

    if (
      combined.includes("invalid password") ||
      combined.includes("bad password")
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Password PDF salah. Periksa kembali password yang dimasukkan.",
        true,
      );
    }

    if (combined.includes("password")) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "PDF ini terkunci dengan password. Harap masukkan password PDF.",
        true,
      );
    }

    // PDF tidak terenkripsi: unggah buffer asli jika qpdf benar-benar gagal
    if (!password && !isPdfEncrypted(buffer)) {
      console.warn(
        "[pdfUtils] qpdf gagal pada PDF tidak terenkripsi, memakai file asli",
      );
      return buffer;
    }

    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Gagal memproses PDF. File mungkin rusak atau format tidak didukung. Coba simpan ulang PDF dari aplikasi asalnya.",
      true,
    );
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}
