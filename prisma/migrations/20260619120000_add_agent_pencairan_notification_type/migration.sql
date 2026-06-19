-- AlterEnum: tambah tipe notifikasi pengajuan pencairan agent
ALTER TABLE `notifications` MODIFY `type` ENUM('spk_pengajuan_baru', 'spk_disetujui', 'spk_dibayar', 'upload_bukti', 'ganti_kavling', 'kode_billing_pph', 'agent_pencairan') NOT NULL;
