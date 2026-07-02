-- Recovery migration: pastikan kolom file_ktp ada di tukang.
-- Menangani kasus migration 20260702120000 sudah ter-apply versi lama (kolom `ktp`).

SET @db = DATABASE();

SET @add_file_ktp = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `tukang` ADD COLUMN `file_ktp` VARCHAR(255) NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'tukang'
    AND COLUMN_NAME = 'file_ktp'
);
PREPARE stmt_add_file_ktp FROM @add_file_ktp;
EXECUTE stmt_add_file_ktp;
DEALLOCATE PREPARE stmt_add_file_ktp;

SET @drop_wrong_ktp = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `tukang` DROP COLUMN `ktp`',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'tukang'
    AND COLUMN_NAME = 'ktp'
);
PREPARE stmt_drop_wrong_ktp FROM @drop_wrong_ktp;
EXECUTE stmt_drop_wrong_ktp;
DEALLOCATE PREPARE stmt_drop_wrong_ktp;
