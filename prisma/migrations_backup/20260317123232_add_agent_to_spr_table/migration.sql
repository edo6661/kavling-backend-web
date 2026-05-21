/*
  Warnings:

  - The values [CASH,KPR] on the enum `spr_cara_pembayaran` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `spr` ADD COLUMN `agent` VARCHAR(150) NULL,
    MODIFY `cara_pembayaran` ENUM('KPR_BRI', 'KPR_BTN', 'KPR_BSN', 'KPR_BJBS', 'KPR_BSI', 'KPR_BNI', 'CASH_TAHAP', 'CASH_KERAS') NOT NULL;
