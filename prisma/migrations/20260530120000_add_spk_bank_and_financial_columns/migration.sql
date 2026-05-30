-- Kolom ini ada di schema.prisma tapi sebelumnya hanya ter-apply via db push (dev).
-- Idempotent: aman di production (belum ada) dan local (sudah ada).

SET @has_bank_rekening := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND COLUMN_NAME = 'bank_rekening_pt_id'
);
SET @add_spk_columns := IF(
  @has_bank_rekening = 0,
  'ALTER TABLE `spk`
    ADD COLUMN `bank_rekening_pt_id` INTEGER NULL,
    ADD COLUMN `nilai_sudah_dibayarkan` DECIMAL(15, 2) NULL,
    ADD COLUMN `sisa_nilai_kontrak` DECIMAL(15, 2) NULL,
    ADD COLUMN `progress_override` DECIMAL(5, 2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @add_spk_columns;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_spk_bank_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND INDEX_NAME = 'spk_bank_rekening_pt_id_fkey'
);
SET @add_spk_bank_index := IF(
  @has_spk_bank_index = 0,
  'CREATE INDEX `spk_bank_rekening_pt_id_fkey` ON `spk`(`bank_rekening_pt_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @add_spk_bank_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_spk_bank_fk := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND CONSTRAINT_NAME = 'spk_bank_rekening_pt_id_fkey'
);
SET @add_spk_bank_fk := IF(
  @has_spk_bank_fk = 0,
  'ALTER TABLE `spk` ADD CONSTRAINT `spk_bank_rekening_pt_id_fkey` FOREIGN KEY (`bank_rekening_pt_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_spk_bank_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill agar record lama punya nilai awal yang konsisten dengan create SPK di app
UPDATE `spk`
SET
  `nilai_sudah_dibayarkan` = COALESCE(`nilai_sudah_dibayarkan`, 0),
  `sisa_nilai_kontrak` = COALESCE(`sisa_nilai_kontrak`, `nilai_kontrak`)
WHERE `nilai_sudah_dibayarkan` IS NULL OR `sisa_nilai_kontrak` IS NULL;
