import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_EMAIL,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendAgentRegistrationEmail(
    to: string,
    pdfBuffer: Buffer,
    agentName: string,
  ): Promise<void> {
    if (!env.SMTP_EMAIL || !env.SMTP_PASSWORD) {
      console.warn("SMTP credentials belum diset, email tidak dikirim.");
      return;
    }

    const mailOptions = {
      from: `"Bumantara" <${env.SMTP_EMAIL}>`,
      to,
      subject: "Registrasi Agent Berhasil - Surat Pernyataan",
      text: `Halo ${agentName},\n\nRegistrasi Berhasil!\nAkun portal Anda telah dibuat. Silakan Print / Cetak dokumen ini (PDF), beri Materai dan tanda tangan basah, lalu upload kembali di dalam Portal Agent.`,
      attachments: [
        {
          filename: `Surat_Pernyataan_${agentName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email registrasi berhasil dikirim ke ${to}`);
    } catch (error) {
      console.error(`Gagal mengirim email ke ${to}:`, error);
    }
  }
}
