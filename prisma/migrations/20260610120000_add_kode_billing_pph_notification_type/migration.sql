-- AlterEnum: tambah tipe notifikasi kode billing PPh
ALTER TABLE `notifications` MODIFY `type` ENUM('spk_pengajuan_baru', 'spk_disetujui', 'spk_dibayar', 'upload_bukti', 'ganti_kavling', 'kode_billing_pph') NOT NULL;
