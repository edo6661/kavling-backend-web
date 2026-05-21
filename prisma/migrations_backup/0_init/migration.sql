-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent') NOT NULL,
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
    `bank` VARCHAR(100) NULL,
    `dokumen_lainnya` JSON NULL,

    UNIQUE INDEX `customers_nik_ktp_key`(`nik_ktp`),
    INDEX `customers_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perumahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `alamat` VARCHAR(150) NOT NULL,
    `logo` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `perumahan_nama_key`(`nama`),
    UNIQUE INDEX `perumahan_alamat_key`(`alamat`),
    UNIQUE INDEX `perumahan_logo_key`(`logo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_rekening_pt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_bank` VARCHAR(100) NOT NULL,
    `no_rekening` VARCHAR(50) NOT NULL,
    `atas_nama` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `perumahan_id` INTEGER NOT NULL,

    INDEX `bank_rekening_pt_perumahan_id_fkey`(`perumahan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notaris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `biaya_ajb` DECIMAL(15, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `biaya_ppjb` DECIMAL(15, 2) NULL,
    `nomor_ijin` VARCHAR(50) NULL,
    `nomor_ktp` VARCHAR(20) NULL,
    `alamat` TEXT NULL,
    `no_hp` VARCHAR(20) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pic_notaris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notaris_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `alamat` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pic_notaris_notaris_id_fkey`(`notaris_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perusahaan_agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `akte` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `atas_nama_rekening` VARCHAR(150) NULL,
    `nama_bank` VARCHAR(100) NULL,
    `no_rekening` VARCHAR(50) NULL,
    `npwp` VARCHAR(50) NULL,

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
    `status` ENUM('Pending', 'Aktif', 'Nonaktif') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `file_ktp` VARCHAR(255) NULL,
    `file_ktp_direktur` VARCHAR(255) NULL,
    `file_npwp` VARCHAR(255) NULL,
    `file_npwp_perusahaan` VARCHAR(255) NULL,
    `file_surat_keterangan` VARCHAR(255) NULL,
    `kwitansi_booking_fee` VARCHAR(255) NULL,
    `type` ENUM('Pribadi', 'Perusahaan') NOT NULL DEFAULT 'Pribadi',
    `user_id` INTEGER NULL,
    `fee_marketing_pct` DECIMAL(5, 2) NULL,
    `potongan_pph` DECIMAL(5, 2) NULL,
    `atas_nama_rekening` VARCHAR(150) NULL,
    `nama_bank` VARCHAR(100) NULL,
    `no_rekening` VARCHAR(50) NULL,
    `perusahaan_agent_id` INTEGER NULL,
    `ttdData` LONGTEXT NULL,
    `file_surat_pernyataan` VARCHAR(255) NULL,
    `default_surat_pernyataan` VARCHAR(255) NULL,
    `fee_closing_nominal` DECIMAL(15, 2) NULL,

    UNIQUE INDEX `agents_nik_key`(`nik`),
    UNIQUE INDEX `agents_kode_sales_key`(`kode_sales`),
    INDEX `agents_perusahaan_agent_id_fkey`(`perusahaan_agent_id`),
    INDEX `agents_user_id_fkey`(`user_id`),
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

    INDEX `pic_agents_agent_id_fkey`(`agent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kavling` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `perumahan_id` INTEGER NOT NULL,
    `blok` VARCHAR(10) NOT NULL,
    `nomor_unit` VARCHAR(10) NOT NULL,
    `status` ENUM('Available', 'Booking', 'Terjual', 'Hold') NOT NULL DEFAULT 'Available',
    `file_pbg` VARCHAR(255) NULL,
    `file_sertifikat_tanah` VARCHAR(255) NULL,
    `file_nop_pbb` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `luas_bangunan` DECIMAL(10, 2) NOT NULL,
    `luas_tanah` DECIMAL(10, 2) NOT NULL,
    `nama_tipe` VARCHAR(50) NOT NULL,
    `rekening_tujuan_id` INTEGER NULL,
    `harga_dasar` DECIMAL(15, 2) NOT NULL,

    INDEX `kavling_rekening_tujuan_id_fkey`(`rekening_tujuan_id`),
    UNIQUE INDEX `kavling_perumahan_id_blok_nomor_unit_key`(`perumahan_id`, `blok`, `nomor_unit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_transaksi` VARCHAR(50) NOT NULL,
    `tanggal` DATE NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `kavling_id` INTEGER NOT NULL,
    `cara_pembayaran` ENUM('CASH KERAS', 'CASH BERTAHAP', 'KPR') NULL,
    `harga_jual` DECIMAL(15, 2) NULL,
    `dp` DECIMAL(15, 2) NULL,
    `diskon_penjualan` DECIMAL(15, 2) NULL,
    `bank` VARCHAR(100) NULL,
    `nilai_pengajuan_kpr` DECIMAL(15, 2) NULL,
    `booking_fee` DECIMAL(15, 2) NULL,
    `rekening_tujuan_id` INTEGER NULL,
    `status` ENUM('Booked', 'Proses', 'Lunas', 'Batal') NOT NULL DEFAULT 'Booked',
    `alasan_batal` TEXT NULL,
    `file_spr` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `agent_id` INTEGER NULL,
    `file_bukti_booking` VARCHAR(255) NULL,
    `file_bukti_dp` VARCHAR(255) NULL,
    `harga_promosi` DECIMAL(15, 2) NULL,
    `ttd_data` JSON NULL,
    `created_by` VARCHAR(100) NULL,
    `biaya_kpr` DECIMAL(15, 2) NULL,
    `harga_dasar` DECIMAL(15, 2) NOT NULL,
    `plafon_awal` DECIMAL(15, 2) NULL,
    `dp_tidak_dibayar` DECIMAL(15, 2) NULL,
    `plafon_kredit` DECIMAL(15, 2) NULL,
    `termin` INTEGER NULL,
    `keterangan_angsuran` TEXT NULL,
    `tambahan_kpr` JSON NULL,
    `plafon_acc` DECIMAL(15, 2) NULL,
    `dp_dibayar` DECIMAL(15, 2) NULL,

    UNIQUE INDEX `penjualan_no_transaksi_key`(`no_transaksi`),
    INDEX `penjualan_agent_id_fkey`(`agent_id`),
    INDEX `penjualan_customer_id_fkey`(`customer_id`),
    INDEX `penjualan_kavling_id_fkey`(`kavling_id`),
    INDEX `penjualan_rekening_tujuan_id_fkey`(`rekening_tujuan_id`),
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
    `sp3r` ENUM('BANK', 'Cash') NULL DEFAULT 'BANK',
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
    `ajb_njop_total` DECIMAL(15, 2) NULL,
    `ajb_total_bphtb_pph` DECIMAL(15, 2) NULL,
    `notaris_id` INTEGER NULL,
    `nr_nilai_penyerahan` DECIMAL(15, 2) NULL,
    `nr_total_subsidi` DECIMAL(15, 2) NULL,
    `pj_nilai_penyerahan` DECIMAL(15, 2) NULL,
    `pj_total_bphtb_pph` DECIMAL(15, 2) NULL,
    `pj_total_subsidi` DECIMAL(15, 2) NULL,
    `nr_biaya_notaris_ppjb` DECIMAL(15, 2) NULL,
    `biaya_notaris` DECIMAL(15, 2) NULL,

    UNIQUE INDEX `detail_kavling_pajak_penjualan_id_key`(`penjualan_id`),
    INDEX `detail_kavling_pajak_notaris_id_fkey`(`notaris_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_tagihan` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `jatuh_tempo` DATE NOT NULL,
    `status` ENUM('Belum Bayar', 'Menunggu Konfirmasi', 'Lunas') NOT NULL DEFAULT 'Belum Bayar',
    `file_bukti` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `pembayaran` VARCHAR(255) NOT NULL,
    `reminder_berikutnya` DATE NULL,
    `file_bukti_refund` VARCHAR(255) NULL,
    `is_refunded` BOOLEAN NOT NULL DEFAULT false,
    `ttd_data` JSON NULL,

    UNIQUE INDEX `tagihan_no_tagihan_key`(`no_tagihan`),
    INDEX `tagihan_customer_id_fkey`(`customer_id`),
    INDEX `tagihan_penjualan_id_fkey`(`penjualan_id`),
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
    `penjualan_id` INTEGER NOT NULL,

    UNIQUE INDEX `fee_agent_penjualan_id_key`(`penjualan_id`),
    INDEX `fee_agent_agent_id_fkey`(`agent_id`),
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
    `pelaksana` VARCHAR(150) NULL,
    `persentase` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `penjualan_id` INTEGER NOT NULL,

    UNIQUE INDEX `progress_proyek_penjualan_id_key`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tahapan_proyek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `progress_proyek_id` INTEGER NOT NULL,
    `nama_tahapan` VARCHAR(100) NOT NULL,
    `persentase` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `deskripsi` TEXT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `foto` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_name` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(50) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `changes` JSON NOT NULL,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_ganti_kavling` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `kavling_lama_id` INTEGER NOT NULL,
    `kavling_baru_id` INTEGER NOT NULL,
    `alasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_by_id` INTEGER NULL,
    `requested_by_id` INTEGER NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_ganti_kavling_approved_by_id_fkey`(`approved_by_id`),
    INDEX `riwayat_ganti_kavling_kavling_baru_id_fkey`(`kavling_baru_id`),
    INDEX `riwayat_ganti_kavling_kavling_lama_id_fkey`(`kavling_lama_id`),
    INDEX `riwayat_ganti_kavling_penjualan_id_fkey`(`penjualan_id`),
    INDEX `riwayat_ganti_kavling_requested_by_id_fkey`(`requested_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_batal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `alasan` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_by_id` INTEGER NULL,
    `approved_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pengajuan_batal_approved_by_id_fkey`(`approved_by_id`),
    INDEX `pengajuan_batal_penjualan_id_fkey`(`penjualan_id`),
    INDEX `pengajuan_batal_requested_by_id_fkey`(`requested_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_spr` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `file_spr` VARCHAR(255) NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_spr_penjualan_id_fkey`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `berkas_customer_valid` BOOLEAN NOT NULL DEFAULT false,
    `file_sp3k` VARCHAR(255) NULL,
    `file_salinan_ajb` VARCHAR(255) NULL,
    `file_ppjb` VARCHAR(255) NULL,
    `nilai_ajb` DECIMAL(15, 2) NULL,
    `biaya_bphtb` DECIMAL(15, 2) NULL,
    `biaya_pph` DECIMAL(15, 2) NULL,
    `file_ajb` VARCHAR(255) NULL,
    `file_bast` VARCHAR(255) NULL,
    `checklist_bast` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `nomor_ajb` VARCHAR(100) NULL,
    `tanggal_ajb` DATE NULL,

    UNIQUE INDEX `progress_penjualan_penjualan_id_key`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent') NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `canCreate` BOOLEAN NOT NULL DEFAULT false,
    `canRead` BOOLEAN NOT NULL DEFAULT false,
    `canUpdate` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_permissions_role_resource_key`(`role`, `resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_rekening_pt` ADD CONSTRAINT `bank_rekening_pt_perumahan_id_fkey` FOREIGN KEY (`perumahan_id`) REFERENCES `perumahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pic_notaris` ADD CONSTRAINT `pic_notaris_notaris_id_fkey` FOREIGN KEY (`notaris_id`) REFERENCES `notaris`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_perusahaan_agent_id_fkey` FOREIGN KEY (`perusahaan_agent_id`) REFERENCES `perusahaan_agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pic_agents` ADD CONSTRAINT `pic_agents_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kavling` ADD CONSTRAINT `kavling_perumahan_id_fkey` FOREIGN KEY (`perumahan_id`) REFERENCES `perumahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kavling` ADD CONSTRAINT `kavling_rekening_tujuan_id_fkey` FOREIGN KEY (`rekening_tujuan_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_rekening_tujuan_id_fkey` FOREIGN KEY (`rekening_tujuan_id`) REFERENCES `bank_rekening_pt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_kavling_pajak` ADD CONSTRAINT `detail_kavling_pajak_notaris_id_fkey` FOREIGN KEY (`notaris_id`) REFERENCES `notaris`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_kavling_pajak` ADD CONSTRAINT `detail_kavling_pajak_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_agent` ADD CONSTRAINT `fee_agent_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_agent` ADD CONSTRAINT `fee_agent_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_proyek` ADD CONSTRAINT `progress_proyek_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tahapan_proyek` ADD CONSTRAINT `tahapan_proyek_progress_proyek_id_fkey` FOREIGN KEY (`progress_proyek_id`) REFERENCES `progress_proyek`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_kavling_baru_id_fkey` FOREIGN KEY (`kavling_baru_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_kavling_lama_id_fkey` FOREIGN KEY (`kavling_lama_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_requested_by_id_fkey` FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_batal` ADD CONSTRAINT `pengajuan_batal_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_batal` ADD CONSTRAINT `pengajuan_batal_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_batal` ADD CONSTRAINT `pengajuan_batal_requested_by_id_fkey` FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_spr` ADD CONSTRAINT `riwayat_spr_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_penjualan` ADD CONSTRAINT `progress_penjualan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

