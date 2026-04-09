/*
  Warnings:

  - You are about to drop the column `pencapaian` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `agents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[logo]` on the table `perumahan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alamat]` on the table `perumahan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `perumahan_id` to the `bank_rekening_pt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alamat` to the `perumahan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logo` to the `perumahan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agents` DROP COLUMN `pencapaian`,
    DROP COLUMN `target`;

-- AlterTable
ALTER TABLE `bank_rekening_pt` ADD COLUMN `perumahan_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `detail_kavling_pajak` ADD COLUMN `ajb_njop_total` DECIMAL(15, 2) NULL,
    ADD COLUMN `ajb_total_bphtb_pph` DECIMAL(15, 2) NULL,
    ADD COLUMN `notaris_id` INTEGER NULL,
    ADD COLUMN `nr_nilai_penyerahan` DECIMAL(15, 2) NULL,
    ADD COLUMN `nr_total_subsidi` DECIMAL(15, 2) NULL,
    ADD COLUMN `pj_nilai_penyerahan` DECIMAL(15, 2) NULL,
    ADD COLUMN `pj_total_bphtb_pph` DECIMAL(15, 2) NULL,
    ADD COLUMN `pj_total_subsidi` DECIMAL(15, 2) NULL,
    MODIFY `sp3r` ENUM('BANK', 'Cash') NULL DEFAULT 'BANK';

-- AlterTable
ALTER TABLE `penjualan` ADD COLUMN `agent_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `perumahan` ADD COLUMN `alamat` VARCHAR(150) NOT NULL,
    ADD COLUMN `logo` VARCHAR(150) NOT NULL;

-- CreateTable
CREATE TABLE `pic_notaris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notaris_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `alamat` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pic_agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `alamat` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `perumahan_logo_key` ON `perumahan`(`logo`);

-- CreateIndex
CREATE UNIQUE INDEX `perumahan_alamat_key` ON `perumahan`(`alamat`);

-- AddForeignKey
ALTER TABLE `bank_rekening_pt` ADD CONSTRAINT `bank_rekening_pt_perumahan_id_fkey` FOREIGN KEY (`perumahan_id`) REFERENCES `perumahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pic_notaris` ADD CONSTRAINT `pic_notaris_notaris_id_fkey` FOREIGN KEY (`notaris_id`) REFERENCES `notaris`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pic_agents` ADD CONSTRAINT `pic_agents_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_kavling_pajak` ADD CONSTRAINT `detail_kavling_pajak_notaris_id_fkey` FOREIGN KEY (`notaris_id`) REFERENCES `notaris`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
