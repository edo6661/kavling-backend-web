/*
  Warnings:

  - You are about to alter the column `sp3r` on the `detail_kavling_pajak` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `detail_kavling_pajak` MODIFY `sp3r` ENUM('BANK', 'Cash') NULL;
