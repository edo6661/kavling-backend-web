import { env } from "../../config/env.js";

export class TelegramNotifyService {
  private readonly chatIds: number[];

  constructor() {
    this.chatIds = (env.TELEGRAM_NOTIFY_CHAT_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  isConfigured(): boolean {
    return Boolean(env.TELEGRAM_BOT_TOKEN) && this.chatIds.length > 0;
  }

  async sendApprovalAlert(title: string, message: string, linkPath?: string): Promise<void> {
    if (!this.isConfigured()) return;

    const baseUrl = env.CORS_ORIGINS[0]?.replace(/\/$/, "") ?? "";
    const linkLine =
      linkPath && baseUrl ? `\n\n🔗 ${baseUrl}${linkPath}` : linkPath ? `\n\n🔗 ${linkPath}` : "";

    const text = `🔔 ${title}\n\n${message}${linkLine}`;

    await Promise.all(
      this.chatIds.map((chatId) =>
        this.sendMessage(chatId, text).catch((err: unknown) => {
          console.error(`Gagal kirim notifikasi Telegram ke chat ${chatId}:`, err);
        }),
      ),
    );
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Telegram API ${response.status}: ${body}`);
    }
  }
}
