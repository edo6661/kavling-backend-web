import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";
import type { Spr, SprPayment } from "@prisma/client";
import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo.js";
import type { IBankRekeningPtRepository } from "../../../domain/repositories/IBankRekeningPtRepo.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

type SprWithPayments = Spr & { payments?: SprPayment[] };

// Helper untuk fetch gambar dari Cloudinary/URL menjadi Buffer untuk PDFKit
async function fetchImageBuffer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export class GenerateSprPdfUseCase {
  constructor(
    private readonly sprRepo: ISprRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly unitRepo: IUnitRepository,
    private readonly bankRekeningPtRepo: IBankRekeningPtRepository,
  ) {}

  async execute(id: number): Promise<Buffer> {
    const spr = await this.sprRepo.findById(id);
    if (!spr) {
      throw new NotFoundError("Data SPR tidak ditemukan");
    }

    const customer = await this.customerRepo.findById(spr.customerId);
    if (!customer) {
      throw new NotFoundError("Data Customer tidak ditemukan");
    }

    const unit = await this.unitRepo.findById(spr.unitId);
    if (!unit) {
      throw new NotFoundError("Data Unit tidak ditemukan");
    }

    const bankRekening = await this.bankRekeningPtRepo.findById(
      spr.bankRekeningPtId,
    );
    if (!bankRekening) {
      throw new NotFoundError("Data Rekening PT tidak ditemukan");
    }

    // Fetch semua gambar tanda tangan secara paralel sebelum membuat PDF
    const [imgPemesan, imgMarketing, imgSpv, imgManager, imgAdmin] =
      await Promise.all([
        fetchImageBuffer(spr.ttdPemesan),
        fetchImageBuffer(spr.ttdMarketing),
        fetchImageBuffer(spr.ttdSupervisor),
        fetchImageBuffer(spr.ttdManager),
        fetchImageBuffer(spr.ttdSalesAdmin),
      ]);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        let y = 40;
        const startX = 50;
        const contentWidth = 495;
        const pageBottomLimit = 780; // Batas aman sebelum pindah halaman

        // Fungsi pengecekan batas halaman
        const checkY = (neededHeight: number) => {
          if (y + neededHeight > pageBottomLimit) {
            doc.addPage();
            y = 50; // Reset Y ke atas kertas setelah pindah halaman
          }
        };

        // --- HEADER ---
        checkY(130);
        doc.fontSize(22).font("Helvetica-Bold").text("PURI SAFANA", startX, y);
        doc.fontSize(16).text("CIKEAS", startX, y + 24);

        y += 70;

        doc.fontSize(14).text("SURAT KONFIRMASI UNIT PEMESANAN", startX, y, {
          width: contentWidth,
          align: "center",
          underline: true,
        });
        y += 30;

        doc
          .fontSize(10)
          .font("Helvetica")
          .text("Yang bertanda tangan di bawah ini :", startX, y);
        y += 20;

        const drawField = (label: string, value: string, extraMargin = 8) => {
          const labelWidth = 130;
          const textHeight =
            doc.heightOfString(value, {
              width: contentWidth - labelWidth - 10,
            }) || 12;

          checkY(textHeight + extraMargin);

          doc.font("Helvetica").text(label, startX, y);
          doc.text(":", startX + labelWidth, y);
          doc.font("Helvetica-Bold").text(value, startX + labelWidth + 10, y, {
            width: contentWidth - labelWidth - 10,
            lineBreak: true,
          });

          y += textHeight + extraMargin;
        };

        // --- CUSTOMER INFO ---
        drawField("Nama", customer.nama);
        drawField("Alamat", customer.alamatKtp);
        drawField(
          "No. Telepon / HP",
          `${customer.noHp}      Email: ${customer.email ?? "-"}`,
        );
        drawField("No. Identitas", customer.nikKtp);
        drawField("Perusahaan", customer.perusahaan ?? "-");
        drawField(
          "Alamat Koresponden",
          customer.alamatKorespondensi ?? "-",
          15,
        );

        checkY(20);
        doc
          .font("Helvetica")
          .text(
            "Telah menyetujui untuk memesan / membeli unit rumah dan atau kavling sebagai berikut:",
            startX,
            y,
          );
        y += 20;

        // --- FORMATTER ---
        const formatRp = (val: Prisma.Decimal | number | null | undefined) => {
          let num = 0;
          if (val !== null && val !== undefined) {
            if (typeof val === "object" && "toNumber" in val) {
              num = val.toNumber();
            } else {
              num = Number(val);
            }
          }
          return `Rp. ${num.toLocaleString("id-ID")}`;
        };

        // --- UNIT INFO ---
        drawField("Perumahan", unit.namaPerumahan);
        drawField(
          "Blok/Type",
          `${unit.blok} ${unit.nomorUnit} / ${unit.tipe ?? "-"}`,
        );
        drawField("Harga Jual *", formatRp(spr.hargaJual));

        if (spr.diskonPenjualan && Number(spr.diskonPenjualan) > 0) {
          drawField("Diskon Penjualan", formatRp(spr.diskonPenjualan));
        }

        if (spr.paketPromosi && spr.paketPromosi.trim() !== "") {
          drawField("Paket Promosi", spr.paketPromosi);
        }

        drawField("Cara Pembayaran", spr.caraPembayaran.replace(/_/g, " "));

        if (spr.bankKpr && spr.bankKpr.trim() !== "") {
          drawField("Bank KPR", spr.bankKpr);
        }

        const isNilaiKprValid =
          spr.nilaiPengajuanKpr !== null &&
          spr.nilaiPengajuanKpr !== undefined &&
          Number(spr.nilaiPengajuanKpr) > 0;

        if (isNilaiKprValid) {
          drawField("Nilai Pengajuan KPR", formatRp(spr.nilaiPengajuanKpr), 15);
        } else {
          y += 7; // Menggantikan sisa extraMargin (15 - 8) agar jarak ke Checklist tetap rapi
        }

        // --- CHECKLIST DOKUMEN ---
        checkY(25);
        doc.font("Helvetica").text("Kelengkapan Dokumen :", startX, y);

        const drawCheckbox = (
          label: string,
          isChecked: boolean,
          xPos: number,
          yPos: number,
        ) => {
          doc.rect(xPos, yPos, 10, 10).stroke();
          if (isChecked) {
            doc
              .moveTo(xPos + 2, yPos + 5)
              .lineTo(xPos + 4, yPos + 8)
              .lineTo(xPos + 8, yPos + 2)
              .stroke();
          }
          doc.text(label, xPos + 15, yPos);
        };

        drawCheckbox("KTP", !!customer.fileKtp, startX + 130, y);
        drawCheckbox("KK", !!customer.fileKk, startX + 180, y);
        drawCheckbox("NPWP", !!customer.fileNpwp, startX + 230, y);
        y += 25;

        // --- TABLE PEMBAYARAN ---
        const colNo = startX;
        const colKet = startX + 35;
        const colTempo = startX + 230;
        const colNilai = startX + 360;
        const rowHeight = 20;

        checkY(rowHeight);
        doc
          .rect(startX, y, contentWidth, rowHeight)
          .fillAndStroke("#f0f0f0", "#000");
        doc.fillColor("#000").font("Helvetica-Bold").fontSize(9);
        doc.text("NO", colNo + 5, y + 6);
        doc.text("KETERANGAN", colKet + 5, y + 6);
        doc.text("JATUH TEMPO", colTempo + 5, y + 6);
        doc.text("NILAI", colNilai + 5, y + 6);
        y += rowHeight;

        let totalNilai = 0;
        const sprData = spr as SprWithPayments;
        const payments = sprData.payments ?? [];

        doc.font("Helvetica").fontSize(9);

        if (payments.length > 0) {
          payments.forEach((p, idx) => {
            checkY(rowHeight);
            const dateStr =
              p.jatuhTempo instanceof Date
                ? p.jatuhTempo
                    .toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    .replace(/\//g, "-")
                : "-";

            doc.rect(startX, y, contentWidth, rowHeight).stroke();

            doc.text(`${idx + 1}.`, colNo + 5, y + 6);
            doc.text(p.keterangan, colKet + 5, y + 6);
            doc.text(dateStr, colTempo + 5, y + 6);
            doc.text(formatRp(p.nilai), colNilai + 5, y + 6);

            doc
              .moveTo(colKet, y)
              .lineTo(colKet, y + rowHeight)
              .stroke();
            doc
              .moveTo(colTempo, y)
              .lineTo(colTempo, y + rowHeight)
              .stroke();
            doc
              .moveTo(colNilai, y)
              .lineTo(colNilai, y + rowHeight)
              .stroke();

            totalNilai +=
              typeof p.nilai === "object" && "toNumber" in p.nilai
                ? p.nilai.toNumber()
                : Number(p.nilai);
            y += rowHeight;
          });
        }

        checkY(rowHeight);
        doc.rect(startX, y, contentWidth, rowHeight).stroke();
        doc.font("Helvetica-Bold").text("JUMLAH", colKet + 5, y + 6);
        doc.text(formatRp(totalNilai), colNilai + 5, y + 6);

        doc
          .moveTo(colKet, y)
          .lineTo(colKet, y + rowHeight)
          .stroke();
        doc
          .moveTo(colNilai, y)
          .lineTo(colNilai, y + rowHeight)
          .stroke();
        y += 35;

        // --- SIGNATURE AREA ---
        checkY(130);
        const today = new Date()
          .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(`Tanggal: ${today}`, startX, y, {
            width: contentWidth,
            align: "right",
          });
        y += 20;

        const w = contentWidth / 5;

        const sigData = [
          { title: "Pemesan", img: imgPemesan, date: spr.tanggalTtdPemesan },
          {
            title: "Marketing",
            img: imgMarketing,
            date: spr.tanggalTtdMarketing,
          },
          { title: "Supervisor", img: imgSpv, date: spr.tanggalTtdSupervisor },
          { title: "Manager", img: imgManager, date: spr.tanggalTtdManager },
          {
            title: "Sales Admin",
            img: imgAdmin,
            date: spr.tanggalTtdSalesAdmin,
          },
        ];

        sigData.forEach((sig, i) => {
          doc.text(sig.title, startX + w * i, y, { width: w, align: "center" });
        });

        const sigY = y + 15;
        y += 60; // Space for signature

        const lineW = w - 20;
        sigData.forEach((sig, i) => {
          const cx = startX + w * i + w / 2;

          if (sig.img) {
            try {
              doc.image(sig.img, cx - lineW / 2, sigY, {
                fit: [lineW, 40],
                align: "center",
                valign: "center",
              });
            } catch (err) {
              console.error("Gagal menggambar tanda tangan di PDF", err);
            }
          }

          // Garis TTD
          doc
            .moveTo(cx - lineW / 2, y)
            .lineTo(cx + lineW / 2, y)
            .stroke();

          if (sig.date) {
            const dateStr = sig.date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            doc.fontSize(6).text(dateStr, cx - lineW / 2, y + 2, {
              width: lineW,
              align: "center",
            });
            doc.fontSize(8); // Reset font
          }
        });

        y += 30;

        // --- TERMS & BANK INFO ---
        checkY(100);
        doc.fontSize(8).font("Helvetica");
        const termLines = [
          "1. Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, Biaya Proses KPR dan Notaris.",
          "2. Harga jual khusus pembelian kavling belum termasuk biaya BPHTB, PPJB, AJB, Sertipikat dan Biaya Mutasi PBB.",
          "3. Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.",
          "4. Surat konfirmasi ini sah apabila dilampirkan bukti transfer ke nomor rekening berikut:",
        ];

        termLines.forEach((text) => {
          doc.text(text, startX, y, { width: contentWidth, align: "justify" });
          y += 12;
        });

        y += 5;

        // Box Rekening Bank Berdasarkan bankRekeningPtId
        doc.rect(startX, y, 280, 45).stroke();
        doc
          .font("Helvetica-Bold")
          .text(
            `Bank ${bankRekening.namaBank} No Rekening : ${bankRekening.noRekening}`,
            startX + 5,
            y + 10,
          );
        doc
          .font("Helvetica")
          .text(`a/n ${bankRekening.atasNama}`, startX + 5, y + 25);

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
