-- CreateTable
CREATE TABLE `zona` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `hgb` VARCHAR(255) NOT NULL,
    `luas` VARCHAR(50) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pekerjaan_infra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(255) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pekerjaan_infra_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `spk` ADD COLUMN `jenis` ENUM('rumah', 'infrastruktur') NOT NULL DEFAULT 'rumah',
    ADD COLUMN `zona_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `spk_pekerjaan_infra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spk_id` INTEGER NOT NULL,
    `pekerjaan_infra_id` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,

    INDEX `spk_pekerjaan_infra_spk_id_fkey`(`spk_id`),
    UNIQUE INDEX `spk_pekerjaan_infra_spk_id_pekerjaan_infra_id_key`(`spk_id`, `pekerjaan_infra_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `spk_zona_id_fkey` ON `spk`(`zona_id`);

-- CreateIndex
CREATE INDEX `spk_jenis_idx` ON `spk`(`jenis`);

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_zona_id_fkey` FOREIGN KEY (`zona_id`) REFERENCES `zona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk_pekerjaan_infra` ADD CONSTRAINT `spk_pekerjaan_infra_spk_id_fkey` FOREIGN KEY (`spk_id`) REFERENCES `spk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk_pekerjaan_infra` ADD CONSTRAINT `spk_pekerjaan_infra_pekerjaan_infra_id_fkey` FOREIGN KEY (`pekerjaan_infra_id`) REFERENCES `pekerjaan_infra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
