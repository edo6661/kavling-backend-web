/*
  Warnings:

  - You are about to drop the column `biaya_kpr_asuransi` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `njop_bangunan` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `njop_tanah` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `total_nilai_rumah` on the `master_data_progress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `master_data_progress` DROP COLUMN `biaya_kpr_asuransi`,
    DROP COLUMN `njop_bangunan`,
    DROP COLUMN `njop_tanah`,
    DROP COLUMN `total_nilai_rumah`,
    ADD COLUMN `biaya_asuransi` DECIMAL(15, 2) NULL DEFAULT 0,
    ADD COLUMN `biaya_kpr` DECIMAL(15, 2) NULL DEFAULT 0,
    ADD COLUMN `diskon_lainnya` DECIMAL(15, 2) NULL DEFAULT 0,
    ADD COLUMN `pph` DECIMAL(15, 2) NULL DEFAULT 0,
    ADD COLUMN `ppn` DECIMAL(15, 2) NULL DEFAULT 0,
    MODIFY `status_akad_ppjb` ENUM('Notaris', 'Developer', '-') NULL;
