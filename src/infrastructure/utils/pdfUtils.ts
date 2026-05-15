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
    const passwordArg = password ? `--password=${password}` : "";
    execSync(`qpdf ${passwordArg} --decrypt "${inputPath}" "${outputPath}"`, {
      stdio: "pipe",
    });

    return fs.readFileSync(outputPath);
  } catch (err: unknown) {
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

    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Gagal memproses PDF: ${message || "File rusak atau format tidak didukung."}`,
      true,
    );
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}
