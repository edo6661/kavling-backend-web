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

    const { customer, kavling, rekeningTujuan, tagihan } = penjualan;

    // --- 1. PRE-FETCH DATA TANDA TANGAN (ASINKRON) ---
    const sigData = ["Pemesan", "Marketing", "Supervisor", "Manager"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ttdData = penjualan.ttdData as Record<
      string,
      { nama: string; tanggal: string; url: string }
    > | null;
    const sigBuffers: Record<string, Buffer> = {};

    if (ttdData) {
      await Promise.all(
        sigData.map(async (role) => {
          if (ttdData[role]?.url) {
            try {
              const response = await fetch(ttdData[role].url);
              const arrayBuffer = await response.arrayBuffer();
              sigBuffers[role] = Buffer.from(arrayBuffer);
            } catch (e) {
              console.error(`Gagal download TTD ${role} dari Cloudinary`, e);
            }
          }
        }),
      );
    }

    // --- 2. PEMBUATAN DOKUMEN PDF (SINKRON) ---
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
        drawField("Alamat", customer.alamatKtp ?? "-", 15);

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
          const labelPengajuan =
            penjualan.caraPembayaran === "KPR"
              ? "Nilai Pengajuan KPR"
              : "Nilai Pengajuan (Plafon)";

          drawField(labelPengajuan, formatRp(penjualan.nilaiPengajuanKpr));
        }

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

        // 1. Filter tagihan: Hanya ambil Booking Fee dan DP
        const tagihanAwal =
          tagihan?.filter((t) => {
            const namaPembayaran = t.pembayaran.toLowerCase();
            return (
              namaPembayaran.includes("booking") ||
              namaPembayaran.includes("dp") ||
              namaPembayaran.includes("down")
            );
          }) || [];

        // 2. Render hanya tagihan yang sudah difilter
        if (tagihanAwal.length > 0) {
          tagihanAwal.forEach((p, idx) => {
            checkY(rowHeight);

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
          .text(`Dibuat Tanggal: ${today}`, startX, y, {
            width: contentWidth,
            align: "right",
          });
        y += 20;

        const w = contentWidth / 4;

        // Render Tanda Tangan & Nama
        sigData.forEach((title, i) => {
          const currentX = startX + w * i;
          // Cetak Title (Pemesan, Marketing, dll)
          doc
            .font("Helvetica")
            .fontSize(10)
            .text(title, currentX, y, { width: w, align: "center" });

          if (ttdData?.[title]) {
            const ttd = ttdData[title];

            // Cetak gambar TTD
            if (sigBuffers[title]) {
              try {
                // PERBAIKAN: y + 15 agar gambar turun dan tidak menabrak teks judul
                doc.image(sigBuffers[title], currentX + w / 2 - 25, y + 15, {
                  width: 50,
                  height: 35,
                });
              } catch (imgErr) {
                console.error(`Gagal render gambar PDF untuk ${title}`, imgErr);
              }
            }

            // Cetak Tanggal TTD
            if (ttd.tanggal) {
              const tglStr = new Date(ttd.tanggal).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              // PERBAIKAN: y + 52 agar berada pas di bawah gambar tanda tangan
              doc
                .fontSize(7)
                .font("Helvetica")
                .text(tglStr, currentX, y + 52, { width: w, align: "center" });
            }

            // Cetak Nama (di bawah garis)
            // PERBAIKAN: y + 70 agar berada tepat di bawah garis hitam
            doc
              .fontSize(8)
              .font("Helvetica-Bold")
              .text(ttd.nama, currentX, y + 70, { width: w, align: "center" });
            doc.fontSize(10).font("Helvetica"); // Reset
          }
        });

        // PERBAIKAN: Jarak garis diturunkan ke y + 65 agar tidak menabrak tanggal
        y += 65;
        const lineW = w - 20;

        // Render Garis TTD
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
