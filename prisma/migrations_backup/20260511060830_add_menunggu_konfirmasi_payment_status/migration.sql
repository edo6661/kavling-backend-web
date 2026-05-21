-- AlterTable
ALTER TABLE `tagihan` MODIFY `status` ENUM('Belum Bayar', 'Menunggu Konfirmasi', 'Lunas') NOT NULL DEFAULT 'Belum Bayar';
