import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";

export class GenerateSprPdfUseCase {
  constructor(private readonly penjualanRepo: IPenjualanRepository) {}

  async execute(penjualanId: number): Promise<Buffer> {
    const penjualan = await this.penjualanRepo.findById(penjualanId);

    if (!penjualan) {
      throw new NotFoundError("Data Penjualan tidak ditemukan");
    }

    // Karena return type findById sudah jelas (PenjualanWithCompleteRelations),
    // TypeScript sekarang tahu bentuk exact dari objek di bawah ini.
    const { customer, kavling, rekeningTujuan, tagihan } = penjualan;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        let y = 40;
        const startX = 50;
        const contentWidth = 495;
        const pageBottomLimit = 780;

        const checkY = (neededHeight: number) => {
          if (y + neededHeight > pageBottomLimit) {
            doc.addPage();
            y = 50;
          }
        };

        // --- HEADER ---
        checkY(130);
        doc
          .fontSize(22)
          .font("Helvetica-Bold")
          .text(kavling.perumahan.nama.toUpperCase(), startX, y);
        doc.fontSize(16).text("BUMANTARA", startX, y + 24);

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
        drawField("Alamat Koresponden", customer.alamatKoresponden ?? "-", 15);

        checkY(20);
        doc
          .font("Helvetica")
          .text(
            "Telah menyetujui untuk memesan / membeli unit rumah dan atau kavling sebagai berikut:",
            startX,
            y,
          );
        y += 20;

        const formatRp = (num: number | Prisma.Decimal) => {
          const val =
            typeof num === "object" && "toNumber" in num
              ? num.toNumber()
              : Number(num);
          return `Rp. ${val.toLocaleString("id-ID")}`;
        };

        // --- UNIT INFO ---
        drawField("Perumahan", kavling.perumahan.nama);
        drawField(
          "Blok/Type",
          `Blok ${kavling.blok} No. ${kavling.nomorUnit} / ${kavling.namaTipe}`,
        );
        drawField("Harga Jual", formatRp(penjualan.hargaJual));

        if (
          penjualan.diskonPenjualan &&
          Number(penjualan.diskonPenjualan) > 0
        ) {
          drawField("Diskon Penjualan", formatRp(penjualan.diskonPenjualan));
        }

        drawField(
          "Cara Pembayaran",
          penjualan.caraPembayaran.replace(/_/g, " "),
        );

        if (penjualan.bank) {
          const bankLabel =
            penjualan.caraPembayaran === "KPR" ? "Bank KPR" : "Bank";
          drawField(bankLabel, penjualan.bank);
        }
        if (
          penjualan.nilaiPengajuanKpr &&
          Number(penjualan.nilaiPengajuanKpr) > 0
        ) {
          drawField(
            "Nilai Pengajuan KPR",
            formatRp(penjualan.nilaiPengajuanKpr),
            15,
          );
        }

        // --- TABLE PEMBAYARAN (DARI TAGIHAN) ---
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
        doc.font("Helvetica").fontSize(9);

        if (tagihan && tagihan.length > 0) {
          tagihan.forEach((p, idx) => {
            checkY(rowHeight);

            // Karena kita pakai TS Type dari Prisma, p.jatuhTempo pasti valid Date object
            const dateStr = p.jatuhTempo
              .toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              .replace(/\//g, "-");

            doc.rect(startX, y, contentWidth, rowHeight).stroke();
            doc.text(`${idx + 1}.`, colNo + 5, y + 6);
            doc.text(p.pembayaran, colKet + 5, y + 6);
            doc.text(dateStr, colTempo + 5, y + 6);
            doc.text(formatRp(p.nominal), colNilai + 5, y + 6);

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
              typeof p.nominal === "object" && "toNumber" in p.nominal
                ? p.nominal.toNumber()
                : Number(p.nominal);

            y += rowHeight;
          });
        }

        // Row Total
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

        const w = contentWidth / 4;
        const sigData = ["Pemesan", "Marketing", "Supervisor", "Manager"];

        sigData.forEach((title, i) => {
          doc.text(title, startX + w * i, y, { width: w, align: "center" });
        });

        y += 60;
        const lineW = w - 20;

        sigData.forEach((_, i) => {
          const cx = startX + w * i + w / 2;
          doc
            .moveTo(cx - lineW / 2, y)
            .lineTo(cx + lineW / 2, y)
            .stroke();
        });

        y += 30;

        // --- TERMS & BANK INFO ---
        checkY(100);
        doc.fontSize(8).font("Helvetica");
        const termLines = [
          "1. Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, Biaya Proses KPR dan Notaris.",
          "2. Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.",
          "3. Surat konfirmasi ini sah apabila dilampirkan bukti transfer ke nomor rekening berikut:",
        ];

        termLines.forEach((text) => {
          doc.text(text, startX, y, { width: contentWidth, align: "justify" });
          y += 12;
        });

        y += 5;

        if (rekeningTujuan) {
          doc.rect(startX, y, 280, 45).stroke();
          doc
            .font("Helvetica-Bold")
            .text(
              `Bank ${rekeningTujuan.namaBank} No Rekening : ${rekeningTujuan.noRekening}`,
              startX + 5,
              y + 10,
            );
          doc
            .font("Helvetica")
            .text(`a/n ${rekeningTujuan.atasNama}`, startX + 5, y + 25);
        }

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
