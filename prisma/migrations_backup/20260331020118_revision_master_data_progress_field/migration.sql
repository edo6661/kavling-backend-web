/*
  Warnings:

  - You are about to drop the column `booking_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `bukti_transfer_booking_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `bukti_transfer_closing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `bukti_transfer_marketing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `closing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `marketing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_transfer_booking_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_transfer_closing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_transfer_marketing_fee` on the `master_data_progress` table. All the data in the column will be lost.
  - You are about to alter the column `sp3r` on the `master_data_progress` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(6))`.

*/
-- AlterTable
ALTER TABLE `master_data_progress` DROP COLUMN `booking_fee`,
    DROP COLUMN `bukti_transfer_booking_fee`,
    DROP COLUMN `bukti_transfer_closing_fee`,
    DROP COLUMN `bukti_transfer_marketing_fee`,
    DROP COLUMN `closing_fee`,
    DROP COLUMN `marketing_fee`,
    DROP COLUMN `tanggal_transfer_booking_fee`,
    DROP COLUMN `tanggal_transfer_closing_fee`,
    DROP COLUMN `tanggal_transfer_marketing_fee`,
    MODIFY `sp3r` ENUM('Bank', 'Cash Keras') NULL;
