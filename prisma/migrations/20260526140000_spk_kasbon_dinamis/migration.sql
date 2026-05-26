-- Drop unique constraint (allow multiple kasbon per SPK)
DROP INDEX `spk_pembayaran_spk_id_jenis_key` ON `spk_pembayaran`;

-- Add kasbon to jenis enum + new columns
ALTER TABLE `spk_pembayaran`
  MODIFY `jenis` ENUM('termin_55', 'termin_100', 'retensi', 'kasbon') NOT NULL,
  ADD COLUMN `keterangan` VARCHAR(500) NULL,
  ADD COLUMN `mengurangi_termin` ENUM('termin_55', 'termin_100') NULL;

-- Remove legacy static kasbon & nilai tagih from spk
ALTER TABLE `spk`
  DROP COLUMN `kasbon_sebelum_termin_2`,
  DROP COLUMN `kasbon_sebelum_termin_3`,
  DROP COLUMN `kasbon_sebelum_termin_4`,
  DROP COLUMN `nilai_bisa_ditagihkan`;
