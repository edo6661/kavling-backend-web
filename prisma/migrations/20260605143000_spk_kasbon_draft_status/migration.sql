-- Add DRAFT status to spk_pembayaran.status enum
ALTER TABLE `spk_pembayaran`
MODIFY `status` ENUM('menunggu_pembayaran', 'sudah_dibayar', 'draft')
  NOT NULL
  DEFAULT 'menunggu_pembayaran';

