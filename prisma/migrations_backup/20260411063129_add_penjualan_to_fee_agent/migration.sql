/*
  Warnings:

  - You are about to drop the column `tipe` on the `kavling` table. All the data in the column will be lost.
  - You are about to drop the column `paket_promosi` on the `penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `keterangan` on the `tagihan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[penjualan_id]` on the table `fee_agent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `penjualan_id` to the `fee_agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `luas_bangunan` to the `kavling` table without a default value. This is not possible if the table is not empty.
  - Added the required column `luas_tanah` to the `kavling` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_tipe` to the `kavling` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pembayaran` to the `tagihan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fee_agent` ADD COLUMN `penjualan_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `kavling` DROP COLUMN `tipe`,
    ADD COLUMN `luas_bangunan` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `luas_tanah` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `nama_tipe` VARCHAR(50) NOT NULL,
    ADD COLUMN `rekening_tujuan_id` INTEGER NULL,
    MODIFY `status` ENUM('Available', 'Booking', 'Terjual', 'Hold') NOT NULL DEFAULT 'Available';

-- AlterTable
ALTER TABLE `penjualan` DROP COLUMN `paket_promosi`,
    ADD COLUMN `file_bukti_booking` VARCHAR(255) NULL,
    ADD COLUMN `file_bukti_dp` VARCHAR(255) NULL,
    ADD COLUMN `harga_promosi` DECIMAL(15, 2) NULL;

-- AlterTable
ALTER TABLE `tagihan` DROP COLUMN `keterangan`,
    ADD COLUMN `pembayaran` VARCHAR(255) NOT NULL,
    ADD COLUMN `reminder_berikutnya` DATE NULL;

-- CreateIndex
CREATE UNIQUE INDEX `fee_agent_penjualan_id_key` ON `fee_agent`(`penjualan_id`);

-- AddForeignKey
ALTER TABLE `kavling` ADD CONSTRAINT `kavling_rekening_tujuan_id_fkey` FOREIGN KEY (`rekening_tujuan_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_agent` ADD CONSTRAINT `fee_agent_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
