-- Tambah status persetujuan admin setelah pengawas menyetujui pengajuan pembayaran SPK
ALTER TABLE `spk_pembayaran`
MODIFY `status` ENUM(
  'menunggu_pembayaran',
  'menunggu_persetujuan',
  'menunggu_approval_admin',
  'sudah_dibayar',
  'draft'
) NOT NULL DEFAULT 'menunggu_pembayaran';
