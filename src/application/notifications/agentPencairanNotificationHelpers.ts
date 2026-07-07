import type { AgentPencairanEntity } from "../../domain/entities/AgentPencairan.js";
import { formatPencairanTahapLabel } from "../../domain/agent/agentPencairanCalc.js";
import type { NotificationPayload } from "../../infrastructure/notifications/NotificationService.js";

function formatKavlingLabel(record: AgentPencairanEntity): string {
  const kavling = record.penjualan?.kavling;
  if (!kavling) return "kavling";
  const perumahan = kavling.perumahan?.nama;
  const unit = `${kavling.blok} ${kavling.nomorUnit}`.trim();
  return perumahan ? `${perumahan} · ${unit}` : unit;
}

export function buildAgentPencairanBaruNotification(
  record: AgentPencairanEntity,
): NotificationPayload {
  const agentName = record.agent?.nama ?? "Agent";
  const customerName = record.penjualan?.customer?.nama ?? "customer";
  const kavling = formatKavlingLabel(record);
  const tahapLabel = formatPencairanTahapLabel(record.tahap, null);

  return {
    type: "AGENT_PENCAIRAN",
    title: "Pengajuan Pencairan Agent",
    message: `${agentName} — ${customerName} (${kavling}): pengajuan ${tahapLabel} menunggu pembayaran.`,
    data: {
      agentPencairanId: record.id,
      agentId: record.agentId,
      penjualanId: record.penjualanId,
      feeAgentId: record.feeAgentId,
      tahap: record.tahap,
    },
    linkPath: "/finance/bayar-agent",
  };
}
