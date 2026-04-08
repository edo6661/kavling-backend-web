-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'marketing', 'customer') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `nik_ktp` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `alamat_ktp` TEXT NOT NULL,
    `alamat_tinggal` TEXT NULL,
    `email` VARCHAR(100) NULL,
    `pekerjaan` VARCHAR(100) NULL,
    `perusahaan` VARCHAR(150) NULL,
    `alamat_korespondensi` TEXT NULL,
    `file_ktp` VARCHAR(255) NULL,
    `file_kk` VARCHAR(255) NULL,
    `file_npwp` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_nik_ktp_key`(`nik_ktp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_perumahan` VARCHAR(150) NOT NULL,
    `blok_unit` VARCHAR(50) NOT NULL,
    `tipe` VARCHAR(50) NULL,
    `luas_tanah` INTEGER NULL,
    `luas_bangunan` INTEGER NULL,
    `lantai` INTEGER NULL,
    `lokasi_strategis` VARCHAR(100) NULL,
    `status` ENUM('Tersedia', 'Booking', 'Terjual') NOT NULL DEFAULT 'Tersedia',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_rekening_pt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_bank` VARCHAR(100) NOT NULL,
    `no_rekening` VARCHAR(50) NOT NULL,
    `atas_nama` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spr` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomor_spr` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `unit_id` INTEGER NOT NULL,
    `marketing_user_id` INTEGER NOT NULL,
    `bank_rekening_pt_id` INTEGER NOT NULL,
    `harga_jual` DECIMAL(15, 2) NOT NULL,
    `diskon_penjualan` DECIMAL(15, 2) NULL DEFAULT 0,
    `paket_promosi` VARCHAR(255) NULL,
    `cara_pembayaran` ENUM('CASH', 'KPR') NOT NULL,
    `bank_kpr` VARCHAR(100) NULL,
    `nilai_pengajuan_kpr` DECIMAL(15, 2) NULL DEFAULT 0,
    `ttd_pemesan` VARCHAR(255) NULL,
    `ttd_marketing` VARCHAR(255) NULL,
    `ttd_supervisor` VARCHAR(255) NULL,
    `ttd_manager` VARCHAR(255) NULL,
    `ttd_sales_admin` VARCHAR(255) NULL,
    `status` ENUM('Draft', 'Menunggu Pembayaran', 'Aktif', 'Dibatalkan') NOT NULL DEFAULT 'Draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spr_nomor_spr_key`(`nomor_spr`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spr_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spr_id` INTEGER NOT NULL,
    `keterangan` VARCHAR(100) NOT NULL,
    `jatuh_tempo` DATE NOT NULL,
    `nilai` DECIMAL(15, 2) NOT NULL,
    `bukti_transfer` VARCHAR(255) NULL,
    `status_pembayaran` ENUM('Belum Bayar', 'Menunggu Konfirmasi', 'Lunas') NOT NULL DEFAULT 'Belum Bayar',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_data_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spr_id` INTEGER NOT NULL,
    `tanggal_akad_ppjb` DATE NULL,
    `status_akad_ppjb` VARCHAR(100) NULL,
    `tanggal_akad_ajb_ppat` DATE NULL,
    `tanggal_pembayaran_pph` DATE NULL,
    `tanggal_pembayaran_bphtb` DATE NULL,
    `pembiayaan` VARCHAR(100) NULL,
    `sp3r` VARCHAR(100) NULL,
    `harga_lebih_tanah` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_strategis` DECIMAL(15, 2) NULL DEFAULT 0,
    `total_nilai_rumah` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_kpr_asuransi` DECIMAL(15, 2) NULL DEFAULT 0,
    `diskon_angsuran` DECIMAL(15, 2) NULL DEFAULT 0,
    `diskon_cash_keras` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_balik_nama` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_notaris_ajb` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_appraisal` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_bphtb` DECIMAL(15, 2) NULL DEFAULT 0,
    `biaya_lain_lain` DECIMAL(15, 2) NULL DEFAULT 0,
    `total_subsidi` DECIMAL(15, 2) NULL DEFAULT 0,
    `nilai_penyerahan_setelah_subsidi` DECIMAL(15, 2) NULL DEFAULT 0,
    `ppn_11` DECIMAL(15, 2) NULL DEFAULT 0,
    `bphtb_5` DECIMAL(15, 2) NULL DEFAULT 0,
    `pph_2_5` DECIMAL(15, 2) NULL DEFAULT 0,
    `total_pajak` DECIMAL(15, 2) NULL DEFAULT 0,
    `njop_tanah_per_meter` DECIMAL(15, 2) NULL DEFAULT 0,
    `njop_tanah` DECIMAL(15, 2) NULL DEFAULT 0,
    `njop_bangunan_per_meter` DECIMAL(15, 2) NULL DEFAULT 0,
    `njop_bangunan` DECIMAL(15, 2) NULL DEFAULT 0,
    `total_njop` DECIMAL(15, 2) NULL DEFAULT 0,
    `selisih_pajak_pbb` DECIMAL(15, 2) NULL DEFAULT 0,
    `uping` DECIMAL(15, 2) NULL DEFAULT 0,
    `closing_fee` DECIMAL(15, 2) NULL DEFAULT 0,
    `tanggal_transfer_closing_fee` DATE NULL,
    `bukti_transfer_closing_fee` VARCHAR(255) NULL,
    `marketing_fee` DECIMAL(15, 2) NULL DEFAULT 0,
    `tanggal_transfer_marketing_fee` DATE NULL,
    `bukti_transfer_marketing_fee` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_data_progress_spr_id_key`(`spr_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spr` ADD CONSTRAINT `spr_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spr` ADD CONSTRAINT `spr_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spr` ADD CONSTRAINT `spr_marketing_user_id_fkey` FOREIGN KEY (`marketing_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spr` ADD CONSTRAINT `spr_bank_rekening_pt_id_fkey` FOREIGN KEY (`bank_rekening_pt_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spr_payments` ADD CONSTRAINT `spr_payments_spr_id_fkey` FOREIGN KEY (`spr_id`) REFERENCES `spr`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `master_data_progress` ADD CONSTRAINT `master_data_progress_spr_id_fkey` FOREIGN KEY (`spr_id`) REFERENCES `spr`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
