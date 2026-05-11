import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import QRCode from "qrcode";

export class GenerateSprPdfUseCase {
  constructor(private readonly penjualanRepo: IPenjualanRepository) {}

  async execute(penjualanId: number): Promise<Buffer> {
    const penjualan = await this.penjualanRepo.findById(penjualanId);

    if (!penjualan) {
      throw new NotFoundError("Data Penjualan tidak ditemukan");
    }

    const { customer, kavling, rekeningTujuan, tagihan } = penjualan;

    // --- 1. PRE-FETCH DATA TANDA TANGAN & LOGO (ASINKRON) ---
    const sigData = ["Pemesan", "Marketing", "Supervisor", "Manager"];
    const ttdData = penjualan.ttdData as Record<
      string,
      { nama: string; tanggal: string; url: string }
    > | null;
    const sigBuffers: Record<string, Buffer> = {};

    const verifyUrl = `http://localhost:5173/verify/${penjualan.noTransaksi}`;
    let qrCodeBuffer: Buffer | null = null;
    let logoBuffer: Buffer | null = null;

    // Ambil logo dari Cloudinary
    if (kavling.perumahan.logo) {
      try {
        const response = await fetch(kavling.perumahan.logo);
        const arrayBuffer = await response.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
      } catch (err) {
        console.error("Gagal download logo perumahan", err);
      }
    }

    try {
      const qrDataUri = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 80,
      });

      const base64Data = qrDataUri.split(",")[1];

      if (base64Data) {
        qrCodeBuffer = Buffer.from(base64Data, "base64");
      }
    } catch (err) {
      console.error("Gagal generate QR Code", err);
    }

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
        const doc = new PDFDocument({ size: "A4", margin: 40 }); // Margin diperkecil
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        let y = 40;
        const startX = 40; // Margin kiri
        const contentWidth = 515; // Lebar konten dimaksimalkan
        const pageBottomLimit = 800;

        const checkY = (neededHeight: number) => {
          if (y + neededHeight > pageBottomLimit) {
            doc.addPage();
            y = 40;
          }
        };

        // --- HEADER LOGO ---
        checkY(80);
        if (logoBuffer) {
          // Hanya logo, hapus nama perumahan
          doc.image(logoBuffer, startX, y, { height: 50 });
        } else {
          doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .fillColor("#0f172a")
            .text("BUMANTARA", startX, y);
        }

        y += 60; // Jarak setelah logo sangat ditekan

        // --- JUDUL DOKUMEN ---
        doc
          .fontSize(14)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("SURAT KONFIRMASI UNIT PEMESANAN", startX, y, {
            width: contentWidth,
            align: "center",
            underline: true,
          });
        y += 20;

        doc
          .fontSize(10)
          .font("Helvetica")
          .text("Yang bertanda tangan di bawah ini :", startX, y);
        y += 15;

        // Fungsi Helper untuk merender list data dengan jarak rapat
        const drawField = (label: string, value: string, extraMargin = 4) => {
          const labelWidth = 120;
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
        let phoneStr = customer.noHp || "";
        if (phoneStr.startsWith("8")) {
          phoneStr = "0" + phoneStr;
        }

        // 2. Format Email (Sembunyikan jika kosong atau '-')
        const emailStr =
          customer.email && customer.email !== "-"
            ? `      Email: ${customer.email}`
            : "";

        // 3. Perbaiki NIK (Hilangkan prefix DUMMY- jika ada)
        let nikStr = customer.nikKtp || "";
        if (nikStr.startsWith("DUMMY-")) {
          nikStr = nikStr.replace("DUMMY-", "");
        }
        drawField("Nama", customer.nama);
        drawField("Alamat", customer.alamatKtp);
        drawField("No. Telepon / HP", `${phoneStr}${emailStr}`);

        // Render opsional jika data tersedia
        if (nikStr && nikStr !== "-") {
          drawField("No. Identitas", nikStr);
        }

        if (customer.perusahaan && customer.perusahaan !== "-") {
          drawField("Perusahaan", customer.perusahaan);
        }

        if (customer.alamatKoresponden && customer.alamatKoresponden !== "-") {
          // extraMargin dibesarkan sedikit khusus baris terakhir dari blok ini
          drawField("Alamat Korespondensi", customer.alamatKoresponden, 8);
        } else {
          y += 8; // Tetap berikan jarak jika field ini tidak dirender
        }
        checkY(15);
        doc
          .font("Helvetica")
          .text(
            "Telah menyetujui untuk memesan / membeli unit rumah dan atau kavling sebagai berikut:",
            startX,
            y,
          );
        y += 15;

        const formatRp = (num: number | Prisma.Decimal) => {
          const val =
            typeof num === "object" && "toNumber" in num
              ? num.toNumber()
              : Number(num);

          const roundedVal = Math.round(val);

          return `Rp. ${roundedVal.toLocaleString("id-ID")}`;
        };

        // --- UNIT INFO ---
        drawField("Perumahan", kavling.perumahan.nama);
        drawField(
          "Blok/Type",
          `Blok ${kavling.blok} No. ${kavling.nomorUnit} / ${kavling.namaTipe} / LT: ${kavling.luasTanah?.toString()} / LB: ${kavling.luasBangunan?.toString()}`,
        );
        drawField("Harga Jual", formatRp(penjualan.hargaJual!));

        if (
          penjualan.diskonPenjualan &&
          Number(penjualan.diskonPenjualan) > 0
        ) {
          drawField("Diskon Penjualan", formatRp(penjualan.diskonPenjualan));
        }

        // --- UPDATE 1: Menampilkan Termin di Cara Pembayaran ---
        const caraBayarText = penjualan.caraPembayaran
          ? penjualan.caraPembayaran.replace(/_/g, " ")
          : "-";

        drawField("Cara Pembayaran", caraBayarText);

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

          drawField(labelPengajuan, formatRp(penjualan.nilaiPengajuanKpr), 10);
        }

        // --- TABEL PEMBAYARAN ---
        const colNo = startX;
        const colKet = startX + 30;
        const colTempo = startX + 240;
        const colNilai = startX + 370;
        const rowHeight = 18; // Row height dipadatkan

        checkY(rowHeight);
        doc
          .rect(startX, y, contentWidth, rowHeight)
          .fillAndStroke("#f0f0f0", "#000");
        doc.fillColor("#000").font("Helvetica-Bold").fontSize(9);
        doc.text("NO", colNo + 5, y + 5);
        doc.text("KETERANGAN", colKet + 5, y + 5);
        doc.text("JATUH TEMPO", colTempo + 5, y + 5);
        doc.text("NILAI", colNilai + 5, y + 5);
        y += rowHeight;

        let totalNilai = 0;
        doc.font("Helvetica").fontSize(9);

        const tagihanAwal =
          tagihan?.filter((t) => {
            const namaPembayaran = t.pembayaran.toLowerCase();
            return (
              namaPembayaran.includes("booking") ||
              namaPembayaran.includes("dp") ||
              namaPembayaran.includes("down")
            );
          }) || [];

        // Render tagihan
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
            doc.text(`${idx + 1}.`, colNo + 5, y + 5);
            doc.text(p.pembayaran, colKet + 5, y + 5);
            doc.text(dateStr, colTempo + 5, y + 5);
            doc.text(formatRp(p.nominal), colNilai + 5, y + 5);

            // Garis vertikal pemisah kolom
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
        doc.font("Helvetica-Bold").text("JUMLAH", colKet + 5, y + 5);
        doc.text(formatRp(totalNilai), colNilai + 5, y + 5);
        doc
          .moveTo(colKet, y)
          .lineTo(colKet, y + rowHeight)
          .stroke();
        doc
          .moveTo(colNilai, y)
          .lineTo(colNilai, y + rowHeight)
          .stroke();

        // UBAH BAGIAN INI:
        y += rowHeight + 15; // Jarak setelah tabel: Tinggi baris + gap ekstra 15 poin

        const today = new Date()
          .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");

        let extraGap = 15; // Jarak default jika tidak ada keterangan

        if (
          penjualan.caraPembayaran === "CASH_BERTAHAP" &&
          penjualan.keteranganAngsuran
        ) {
          const ketText = `Keterangan: ${penjualan.keteranganAngsuran}`;
          doc.font("Helvetica-Bold").fontSize(9);

          // Hitung tinggi teks aktual berdasarkan batas lebarnya
          const textHeight = doc.heightOfString(ketText, {
            width: contentWidth / 2,
          });

          doc.text(ketText, startX, y, {
            width: contentWidth / 2,
            align: "left",
          });

          // Gap dinamis: tinggi teks + jarak ekstra 25 poin ke bawah agar lega
          extraGap = textHeight + 25;
        }

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(`Dibuat Tanggal: ${today}`, startX, y, {
            width: contentWidth,
            align: "right",
          });

        y += extraGap; // Terapkan gap yang sudah dikalkulasi

        const w = contentWidth / 4;

        // Render Tanda Tangan & Nama
        sigData.forEach((title, i) => {
          const currentX = startX + w * i;

          doc
            .font("Helvetica")
            .fontSize(9)
            .text(title, currentX, y, { width: w, align: "center" });

          if (ttdData?.[title]) {
            const ttd = ttdData[title];

            // Cetak gambar TTD
            if (sigBuffers[title]) {
              try {
                // Diangkat ke y + 5 agar tidak membuang space kosong
                doc.image(sigBuffers[title], currentX + w / 2 - 25, y + 5, {
                  width: 50,
                  height: 30,
                });
              } catch (imgErr) {
                console.error(`Gagal render gambar PDF untuk ${title}`, imgErr);
              }
            }

            // Cetak Tanggal TTD ditarik ke atas
            if (ttd.tanggal) {
              const tglStr = new Date(ttd.tanggal).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              doc
                .fontSize(7)
                .font("Helvetica")
                .text(tglStr, currentX, y + 40, { width: w, align: "center" });
            }

            // Cetak Nama ditarik ke atas
            doc
              .fontSize(8)
              .font("Helvetica-Bold")
              .text(ttd.nama, currentX, y + 55, { width: w, align: "center" });

            doc.fontSize(9).font("Helvetica"); // Reset
          }
        });

        y += 50; // Jarak untuk menarik garis jauh lebih pendek
        const lineW = w - 20;

        // Render Garis TTD
        sigData.forEach((_, i) => {
          const cx = startX + w * i + w / 2;
          doc
            .moveTo(cx - lineW / 2, y)
            .lineTo(cx + lineW / 2, y)
            .stroke();
        });

        y += 20; // Jarak sebelum Terms dikurangi drastis

        // --- TERMS & BANK INFO ---
        checkY(70);
        doc.fontSize(8).font("Helvetica");
        const termLines = [
          "1. Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, Biaya Proses KPR dan Notaris.",
          "2. Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.",
          "3. Surat konfirmasi ini sah apabila dilampirkan bukti transfer ke nomor rekening berikut:",
        ];

        termLines.forEach((text) => {
          doc.text(text, startX, y, { width: contentWidth, align: "justify" });
          y += 10; // Line height dipadatkan
        });

        y += 5;

        // Render Kotak Bank Rekening
        if (rekeningTujuan) {
          doc.rect(startX, y, 260, 40).stroke(); // Tinggi kotak diperkecil
          doc
            .font("Helvetica-Bold")
            .text(
              `Bank ${rekeningTujuan.namaBank} No Rekening : ${rekeningTujuan.noRekening}`,
              startX + 5,
              y + 8,
            );
          doc
            .font("Helvetica")
            .text(`a/n ${rekeningTujuan.atasNama}`, startX + 5, y + 22);
        }

        // Render QR Code
        if (qrCodeBuffer) {
          const qrX = startX + 360;
          const qrY = y - 10;

          // Gambar kotak pembungkus QR (Lebih kecil)
          doc.rect(qrX - 5, qrY - 5, 75, 85).stroke("#e2e8f0");

          // Masukkan gambar QR
          doc.image(qrCodeBuffer, qrX, qrY, { width: 65, height: 65 });

          // Tambahkan teks validasi di bawah QR
          doc.fontSize(6).font("Helvetica-Bold").fillColor("#64748b");
          doc.text("SCAN UNTUK VALIDASI", qrX - 5, qrY + 70, {
            width: 75,
            align: "center",
          });
        }

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
