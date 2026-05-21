/*
  Warnings:

  - You are about to drop the `master_data_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spr` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spr_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `units` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `master_data_progress` DROP FOREIGN KEY `master_data_progress_spr_id_fkey`;

-- DropForeignKey
ALTER TABLE `spr` DROP FOREIGN KEY `spr_bank_rekening_pt_id_fkey`;

-- DropForeignKey
ALTER TABLE `spr` DROP FOREIGN KEY `spr_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `spr` DROP FOREIGN KEY `spr_marketing_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `spr` DROP FOREIGN KEY `spr_unit_id_fkey`;

-- DropForeignKey
ALTER TABLE `spr_payments` DROP FOREIGN KEY `spr_payments_spr_id_fkey`;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `bank` VARCHAR(100) NULL;

-- DropTable
DROP TABLE `master_data_progress`;

-- DropTable
DROP TABLE `spr`;

-- DropTable
DROP TABLE `spr_payments`;

-- DropTable
DROP TABLE `units`;

-- CreateTable
CREATE TABLE `notaris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `biaya_ajb` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nik` VARCHAR(20) NOT NULL,
    `kode_sales` VARCHAR(20) NULL,
    `nama` VARCHAR(150) NOT NULL,
    `alamat` TEXT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `target` VARCHAR(50) NULL,
    `pencapaian` VARCHAR(50) NULL,
    `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agents_nik_key`(`nik`),
    UNIQUE INDEX `agents_kode_sales_key`(`kode_sales`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perumahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `perumahan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kavling` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `perumahan_id` INTEGER NOT NULL,
    `blok` VARCHAR(10) NOT NULL,
    `nomor_unit` VARCHAR(10) NOT NULL,
    `tipe` VARCHAR(50) NOT NULL,
    `harga_jual` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('Available', 'Booking', 'Terjual') NOT NULL DEFAULT 'Available',
    `file_pbg` VARCHAR(255) NULL,
    `file_sertifikat_tanah` VARCHAR(255) NULL,
    `file_nop_pbb` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_transaksi` VARCHAR(50) NOT NULL,
    `tanggal` DATE NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `kavling_id` INTEGER NOT NULL,
    `cara_pembayaran` ENUM('CASH KERAS', 'CASH BERTAHAP', 'KPR') NOT NULL,
    `harga_jual` DECIMAL(15, 2) NOT NULL,
    `dp` DECIMAL(15, 2) NULL,
    `diskon_penjualan` DECIMAL(15, 2) NULL,
    `paket_promosi` VARCHAR(150) NULL,
    `bank` VARCHAR(100) NULL,
    `nilai_pengajuan_kpr` DECIMAL(15, 2) NULL,
    `booking_fee` DECIMAL(15, 2) NULL,
    `rekening_tujuan_id` INTEGER NULL,
    `status` ENUM('Booked', 'Proses', 'Lunas', 'Batal') NOT NULL DEFAULT 'Booked',
    `alasan_batal` TEXT NULL,
    `file_spr` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `penjualan_no_transaksi_key`(`no_transaksi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_kavling_pajak` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `lantai` VARCHAR(10) NULL,
    `luas_bangunan` VARCHAR(20) NULL,
    `lokasi_strategis` VARCHAR(50) NULL,
    `tanggal_akad_ppjb` DATE NULL,
    `akad_ppjb` VARCHAR(100) NULL,
    `tanggal_akad_ajb_ppat` DATE NULL,
    `tanggal_pembayaran_pph` DATE NULL,
    `tanggal_pembayaran_bphtb` DATE NULL,
    `pembiayaan` VARCHAR(100) NULL,
    `sp3r` VARCHAR(100) NULL,
    `lebih_tanah` DECIMAL(15, 2) NULL,
    `biaya_strategis` DECIMAL(15, 2) NULL,
    `nr_biaya_kpr_asuransi` DECIMAL(15, 2) NULL,
    `nr_diskon_angsuran` DECIMAL(15, 2) NULL,
    `nr_diskon_cash` DECIMAL(15, 2) NULL,
    `nr_biaya_bbn` DECIMAL(15, 2) NULL,
    `nr_biaya_notaris_ajb` DECIMAL(15, 2) NULL,
    `nr_biaya_appraisal` DECIMAL(15, 2) NULL,
    `nr_biaya_bphtb` DECIMAL(15, 2) NULL,
    `nr_lain_lain` DECIMAL(15, 2) NULL,
    `nr_ppn` DECIMAL(15, 2) NULL,
    `nr_bphtb` DECIMAL(15, 2) NULL,
    `nr_pph` DECIMAL(15, 2) NULL,
    `pj_biaya_kpr` DECIMAL(15, 2) NULL,
    `pj_biaya_asuransi` DECIMAL(15, 2) NULL,
    `pj_diskon_angsuran` DECIMAL(15, 2) NULL,
    `pj_biaya_bbn` DECIMAL(15, 2) NULL,
    `pj_biaya_ajb` DECIMAL(15, 2) NULL,
    `pj_biaya_appraisal` DECIMAL(15, 2) NULL,
    `pj_bphtb` DECIMAL(15, 2) NULL,
    `pj_lain_lain` DECIMAL(15, 2) NULL,
    `pj_ppn` DECIMAL(15, 2) NULL,
    `pj_bphtb_pajak` DECIMAL(15, 2) NULL,
    `pj_pph` DECIMAL(15, 2) NULL,
    `ajb_njop_tanah_per_meter` DECIMAL(15, 2) NULL,
    `ajb_njop_tanah` DECIMAL(15, 2) NULL,
    `ajb_njop_bangunan_per_meter` DECIMAL(15, 2) NULL,
    `ajb_njop_bangunan` DECIMAL(15, 2) NULL,
    `ajb_ppn` DECIMAL(15, 2) NULL,
    `ajb_bphtb` DECIMAL(15, 2) NULL,
    `ajb_pph` DECIMAL(15, 2) NULL,
    `ajb_selisih_pajak_pbb` DECIMAL(15, 2) NULL,
    `ajb_uping` DECIMAL(15, 2) NULL,

    UNIQUE INDEX `detail_kavling_pajak_penjualan_id_key`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_tagihan` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,
    `keterangan` VARCHAR(255) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `jatuh_tempo` DATE NOT NULL,
    `status` ENUM('Belum Bayar', 'Lunas') NOT NULL DEFAULT 'Belum Bayar',
    `file_bukti` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tagihan_no_tagihan_key`(`no_tagihan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_agent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `booking_nominal` DECIMAL(15, 2) NULL,
    `booking_tanggal` DATE NULL,
    `booking_bukti` VARCHAR(255) NULL,
    `closing_nominal` DECIMAL(15, 2) NULL,
    `closing_tanggal` DATE NULL,
    `closing_bukti` VARCHAR(255) NULL,
    `marketing_nominal` DECIMAL(15, 2) NULL,
    `marketing_tanggal` DATE NULL,
    `marketing_bukti` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_spk` VARCHAR(100) NOT NULL,
    `tanggal_spk` DATE NOT NULL,
    `judul_pekerjaan` VARCHAR(255) NOT NULL,
    `lokasi` TEXT NOT NULL,
    `jangka_waktu` INTEGER NOT NULL,
    `nilai_kontrak` DECIMAL(15, 2) NOT NULL,
    `nama_pihak_pertama` VARCHAR(150) NOT NULL,
    `nik_pihak_pertama` VARCHAR(20) NOT NULL,
    `nama_pihak_kedua` VARCHAR(150) NOT NULL,
    `nik_pihak_kedua` VARCHAR(20) NOT NULL,
    `alamat_pihak_kedua` TEXT NOT NULL,
    `nama_bank` VARCHAR(100) NOT NULL,
    `no_rekening` VARCHAR(50) NOT NULL,
    `atas_nama_rekening` VARCHAR(150) NOT NULL,
    `file_spk` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spk_no_spk_key`(`no_spk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_proyek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kavling_id` INTEGER NOT NULL,
    `pelaksana` VARCHAR(150) NOT NULL,
    `tanggal_laporan` DATE NOT NULL,
    `tahapan_pekerjaan` VARCHAR(150) NOT NULL,
    `persentase` INTEGER NOT NULL DEFAULT 0,
    `keterangan` TEXT NOT NULL,
    `kendala` TEXT NULL,
    `foto_lapangan` JSON NULL,
    `status` ENUM('Menunggu Verifikasi', 'Disetujui', 'Revisi') NOT NULL DEFAULT 'Menunggu Verifikasi',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kavling` ADD CONSTRAINT `kavling_perumahan_id_fkey` FOREIGN KEY (`perumahan_id`) REFERENCES `perumahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_rekening_tujuan_id_fkey` FOREIGN KEY (`rekening_tujuan_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_kavling_pajak` ADD CONSTRAINT `detail_kavling_pajak_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_agent` ADD CONSTRAINT `fee_agent_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_proyek` ADD CONSTRAINT `progress_proyek_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
