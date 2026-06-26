-- Tambah kolom dokumen pengajuan SPK (nullable untuk data lama)
ALTER TABLE `spk_pembayaran`
  ADD COLUMN `dokumen_invoice` VARCHAR(500) NULL,
  ADD COLUMN `dokumen_material` VARCHAR(500) NULL,
  ADD COLUMN `dokumen_berita_acara` VARCHAR(500) NULL,
  ADD COLUMN `dokumen_progress_spk` VARCHAR(500) NULL;
