-- Drop unique constraint (allow multiple kasbon per SPK)
SET @has_unique_jenis := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk_pembayaran'
    AND INDEX_NAME = 'spk_pembayaran_spk_id_jenis_key'
);
SET @drop_unique_jenis := IF(
  @has_unique_jenis > 0,
  'ALTER TABLE `spk_pembayaran` DROP INDEX `spk_pembayaran_spk_id_jenis_key`',
  'SELECT 1'
);
PREPARE stmt FROM @drop_unique_jenis;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add kasbon to jenis enum + new columns (skip if already applied from a partial run)
SET @has_keterangan := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk_pembayaran'
    AND COLUMN_NAME = 'keterangan'
);
SET @alter_pembayaran := IF(
  @has_keterangan = 0,
  'ALTER TABLE `spk_pembayaran`
    MODIFY `jenis` ENUM(''termin_55'', ''termin_100'', ''retensi'', ''kasbon'') NOT NULL,
    ADD COLUMN `keterangan` VARCHAR(500) NULL,
    ADD COLUMN `mengurangi_termin` ENUM(''termin_55'', ''termin_100'') NULL',
  'ALTER TABLE `spk_pembayaran`
    MODIFY `jenis` ENUM(''termin_55'', ''termin_100'', ''retensi'', ''kasbon'') NOT NULL'
);
PREPARE stmt FROM @alter_pembayaran;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Legacy kasbon columns on spk only existed via db push (never in migration history)
SET @drop_kasbon_2 := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND COLUMN_NAME = 'kasbon_sebelum_termin_2'
);
SET @drop_kasbon_3 := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND COLUMN_NAME = 'kasbon_sebelum_termin_3'
);
SET @drop_kasbon_4 := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND COLUMN_NAME = 'kasbon_sebelum_termin_4'
);
SET @drop_nilai_tagih := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'spk'
    AND COLUMN_NAME = 'nilai_bisa_ditagihkan'
);

SET @drop_spk_legacy := IF(
  @drop_kasbon_2 > 0,
  'ALTER TABLE `spk` DROP COLUMN `kasbon_sebelum_termin_2`',
  'SELECT 1'
);
PREPARE stmt FROM @drop_spk_legacy;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_spk_legacy := IF(
  @drop_kasbon_3 > 0,
  'ALTER TABLE `spk` DROP COLUMN `kasbon_sebelum_termin_3`',
  'SELECT 1'
);
PREPARE stmt FROM @drop_spk_legacy;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_spk_legacy := IF(
  @drop_kasbon_4 > 0,
  'ALTER TABLE `spk` DROP COLUMN `kasbon_sebelum_termin_4`',
  'SELECT 1'
);
PREPARE stmt FROM @drop_spk_legacy;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_spk_legacy := IF(
  @drop_nilai_tagih > 0,
  'ALTER TABLE `spk` DROP COLUMN `nilai_bisa_ditagihkan`',
  'SELECT 1'
);
PREPARE stmt FROM @drop_spk_legacy;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
