/*
  Warnings:

  - You are about to drop the column `fee_closing_pct` on the `agents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `agents` DROP COLUMN `fee_closing_pct`,
    ADD COLUMN `fee_closing_nominal` DECIMAL(15, 2) NULL;

-- AlterTable
ALTER TABLE `perusahaan_agents` ADD COLUMN `atas_nama_rekening` VARCHAR(150) NULL,
    ADD COLUMN `nama_bank` VARCHAR(100) NULL,
    ADD COLUMN `no_rekening` VARCHAR(50) NULL,
    ADD COLUMN `npwp` VARCHAR(50) NULL;
