/*
  Warnings:

  - You are about to drop the column `harga_jual` on the `kavling` table. All the data in the column will be lost.
  - Added the required column `harga_dasar` to the `kavling` table without a default value. This is not possible if the table is not empty.
  - Added the required column `harga_dasar` to the `penjualan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plafon_awal` to the `penjualan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `kavling` DROP COLUMN `harga_jual`,
    ADD COLUMN `harga_dasar` DECIMAL(15, 2) NOT NULL;

-- AlterTable
ALTER TABLE `penjualan` ADD COLUMN `biaya_kpr` DECIMAL(15, 2) NULL,
    ADD COLUMN `harga_dasar` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `plafon_awal` DECIMAL(15, 2) NOT NULL;
