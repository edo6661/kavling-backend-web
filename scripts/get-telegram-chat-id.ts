/**
 * Ambil Chat ID dari pesan terakhir ke bot Telegram.
 *
 * Cara pakai:
 * 1. Kirim /start atau /chatid ke bot di Telegram
 * 2. Jalankan: npx tsx scripts/get-telegram-chat-id.ts
 */
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN tidak ada di .env");
  process.exit(1);
}

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    text?: string;
    chat: { id: number; type: string; username?: string; first_name?: string };
    from?: { id: number; username?: string; first_name?: string };
  };
};

async function main() {
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = (await meRes.json()) as { ok: boolean; result?: { username?: string } };
  if (!me.ok) {
    console.error("Token bot tidak valid. Cek TELEGRAM_BOT_TOKEN di .env");
    process.exit(1);
  }
  console.log(`Bot: @${me.result?.username ?? "?"}\n`);

  const updatesRes = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?limit=20`,
  );
  const updates = (await updatesRes.json()) as {
    ok: boolean;
    result?: TelegramUpdate[];
    description?: string;
  };

  if (!updates.ok) {
    console.error("Gagal getUpdates:", updates.description ?? "unknown error");
    process.exit(1);
  }

  const messages = (updates.result ?? [])
    .map((u) => u.message)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  if (!messages.length) {
    console.log("Belum ada pesan masuk ke bot.");
    console.log("Kirim /start ke bot di Telegram, lalu jalankan script ini lagi.");
    process.exit(0);
  }

  const seen = new Set<number>();
  console.log("Chat ID yang ditemukan:\n");

  for (const msg of messages.reverse()) {
    const chatId = msg.chat.id;
    if (seen.has(chatId)) continue;
    seen.add(chatId);

    const name =
      msg.from?.username ??
      msg.from?.first_name ??
      msg.chat.username ??
      msg.chat.first_name ??
      "unknown";
    const lastText = msg.text ?? "(bukan teks)";
    console.log(`- Chat ID: ${chatId}`);
    console.log(`  Nama/username: ${name}`);
    console.log(`  Pesan terakhir: ${lastText}`);
    console.log("");
  }

  const latest = messages[messages.length - 1]!;
  console.log("Salin ke .env:");
  console.log(`TELEGRAM_NOTIFY_CHAT_IDS=${latest.chat.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
