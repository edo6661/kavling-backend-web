/*
  Warnings:

  - You are about to drop the column `bphtb_5` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `nilai_penyerahan_setelah_subsidi` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `pph_2_5` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `ppn_11` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `selisih_pajak_pbb` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `total_nilai_rumah` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `total_njop` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `total_pajak` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `total_subsidi` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to alter the column `status_akad_ppjb` on the `master_data_progress` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(5))`.
  - You are about to drop the column `blok_unit` on the `units` table. All the data in the column will be lost.
  - Added the required column `blok` to the `units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomor_unit` to the `units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `master_data_progress` DROP COLUMN `bphtb_5`,
    DROP COLUMN `nilai_penyerahan_setelah_subsidi`,
    DROP COLUMN `pph_2_5`,
    DROP COLUMN `ppn_11`,
    DROP COLUMN `selisih_pajak_pbb`,
    DROP COLUMN `total_nilai_rumah`,
    DROP COLUMN `total_njop`,
    DROP COLUMN `total_pajak`,
    DROP COLUMN `total_subsidi`,
    ADD COLUMN `booking_fee` DECIMAL(15, 2) NULL DEFAULT 0,
    ADD COLUMN `bukti_transfer_booking_fee` VARCHAR(255) NULL,
    ADD COLUMN `tanggal_transfer_booking_fee` DATE NULL,
    MODIFY `status_akad_ppjb` ENUM('Notaris', 'Developer') NULL;

-- AlterTable
ALTER TABLE `spr` MODIFY `cara_pembayaran` ENUM('KPR_BRI', 'KPR_BTN', 'KPR_BSN', 'KPR_BJBS', 'KPR_BSI', 'KPR_BNI', 'CASH_TAHAP', 'CASH_KERAS', 'BANK') NOT NULL;

-- AlterTable
ALTER TABLE `units` DROP COLUMN `blok_unit`,
    ADD COLUMN `blok` VARCHAR(50) NOT NULL,
    ADD COLUMN `nomor_unit` VARCHAR(50) NOT NULL;
