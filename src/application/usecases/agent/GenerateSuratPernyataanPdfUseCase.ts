import PDFDocument from "pdfkit";

export class GenerateSuratPernyataanPdfUseCase {
  async execute(data: {
    nama: string;
    perusahaan: string;
    alamat: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", (b) => buffers.push(b));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc.on("error", (err) => {
          reject(err instanceof Error ? err : new Error(String(err)));
        });

        // Logo dihapus, langsung mulai dari Y: 80
        doc.y = 80;
        doc.moveDown(2);

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Surat Pernyataan", { align: "center", underline: true });
        doc.moveDown(2);

        doc.font("Helvetica").fontSize(11);
        doc.text("Yang bertanda tangan di bawah ini:");
        doc.moveDown(0.5);

        const startX = 50;
        let y = doc.y;
        doc.text("Nama", startX, y);
        doc.text(
          `: ${data.nama || "____________________________"}`,
          startX + 100,
          y,
        );
        y += 15;
        doc.text("Perusahaan", startX, y);
        doc.text(`: ${data.perusahaan || "Pribadi"}`, startX + 100, y);
        y += 15;
        doc.text("Alamat", startX, y);
        doc.text(
          `: ${data.alamat || "____________________________"}`,
          startX + 100,
          y,
        );
        y += 25;

        // Teks pembuka diubah
        doc.text(
          "Saya bersedia untuk menjadi agent Perumahan Puri Safana Cikeas dan menyatakan menyetujui hal-hal sebagai berikut:",
          startX,
          y,
          { width: 480, align: "justify" }, // Tambahkan batas lebar agar PDFKit bisa menghitung tinggi teks yang turun ke bawah
        );
        y = doc.y + 15; // Ambil posisi Y otomatis dari PDFKit (doc.y) lalu tambah jarak spasi 15
        // Aturan diubah (kata "perusahaan" diganti "Puri Safana Cikeas")
        const rules = [
          "Bahwa saya akan menjalankan kegiatan pemasaran dan penjualan unit perumahan sesuai dengan ketentuan, SOP, kebijakan Puri Safana Cikeas, serta arahan manajemen developer.",
          "Bahwa saya tidak akan memberikan informasi yang tidak benar, menyesatkan, dimanipulasi, atau berbeda dari data resmi Puri Safana Cikeas kepada calon konsumen.",
          "Bahwa saya dilarang melakukan:\n  - Mark up harga unit; Pengambilan keuntungan pribadi; Double booking unit;\n  - Penahanan booking fee; Manipulasi data penjualan; Penjualan unit fiktif;\n  - Pengalihan konsumen secara tidak sah; Tindakan merugikan Puri Safana Cikeas/konsumen.",
          "Bahwa seluruh pembayaran konsumen wajib dilakukan langsung ke rekening resmi Puri Safana Cikeas dan saya dilarang menguasai dana konsumen dalam bentuk apa pun.",
          "Bahwa saya dilarang menyebarluaskan atau memperjualbelikan data identitas, nomor telepon, dan dokumen pribadi konsumen tanpa izin tertulis dari Puri Safana Cikeas.",
          "Bahwa saya dilarang bekerja sama dengan pihak internal maupun ketiga yang dapat menimbulkan konflik kepentingan atau kerugian bagi Puri Safana Cikeas.",
          "Bahwa saya wajib menjaga nama baik Puri Safana Cikeas, kerahasiaan data, serta menjalankan etika profesi dalam kegiatan pemasaran dan penjualan.",
          "Bahwa apabila terjadi pelanggaran, Puri Safana Cikeas berhak:\n  - Memberikan sanksi; Membatalkan komisi; Menonaktifkan akses kerja;\n  - Memberhentikan secara sepihak; Menempuh jalur hukum (pidana/perdata).",
          "Bahwa saya membuat pernyataan ini dalam keadaan sadar, sehat jasmani dan rohani, tanpa paksaan, serta bersedia mematuhi seluruh ketentuan Puri Safana Cikeas.",
        ];

        rules.forEach((rule, index) => {
          doc.text(`${index + 1}.`, startX, y);
          doc.text(rule, startX + 15, y, { width: 480, align: "justify" });
          y = doc.y + 5;
        });

        doc.moveDown(1);
        doc.text(
          "Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.",
          startX,
          doc.y,
          { align: "justify" },
        );

        doc.moveDown(3);
        const signatureY = doc.y;
        doc.text("Yang Membuat Pernyataan,", 350, signatureY, {
          align: "center",
          width: 150,
        });

        doc.rect(385, signatureY + 20, 80, 40).stroke();
        doc
          .fontSize(8)
          .fillColor("#999")
          .text("Materai\n10.000", 385, signatureY + 30, {
            width: 80,
            align: "center",
          });

        doc.fontSize(11).fillColor("#000").font("Helvetica-Bold");
        doc.text(data.nama || "( Nama Lengkap )", 350, signatureY + 80, {
          align: "center",
          width: 150,
          underline: true,
        });

        doc.end();
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
