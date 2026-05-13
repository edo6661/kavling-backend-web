-- AlterTable
ALTER TABLE `agents` ADD COLUMN `perusahaan_agent_id` INTEGER NULL,
    MODIFY `status` ENUM('Pending', 'Aktif', 'Nonaktif') NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE `perusahaan_agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `akte` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_perusahaan_agent_id_fkey` FOREIGN KEY (`perusahaan_agent_id`) REFERENCES `perusahaan_agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
