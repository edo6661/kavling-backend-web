-- Perubahan sudah ada di DB (via db push); migrasi ini menyamakan history.
ALTER TABLE `kavling` MODIFY COLUMN `nama_tipe` VARCHAR(50) NULL;

ALTER TABLE `spk` MODIFY COLUMN `tanggal_spk` DATE NOT NULL DEFAULT (CURDATE());
