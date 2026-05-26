-- Table missing in some environments (marked migrated but never created)
CREATE TABLE IF NOT EXISTS `tahapan_proyek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `progress_proyek_id` INTEGER NOT NULL,
    `nama_tahapan` VARCHAR(100) NOT NULL,
    `persentase` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `deskripsi` TEXT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `foto` JSON NULL,
    `reported_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (ignore if already present — run manually if migration fails on duplicate)
ALTER TABLE `tahapan_proyek`
  ADD CONSTRAINT `tahapan_proyek_progress_proyek_id_fkey`
  FOREIGN KEY (`progress_proyek_id`) REFERENCES `progress_proyek`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tahapan_proyek`
  ADD CONSTRAINT `tahapan_proyek_reported_by_id_fkey`
  FOREIGN KEY (`reported_by_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `tahapan_proyek_reported_by_id_fkey` ON `tahapan_proyek`(`reported_by_id`);
