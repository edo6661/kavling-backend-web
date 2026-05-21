/*
  Warnings:

  - A unique constraint covering the columns `[perumahan_id,blok,nomor_unit]` on the table `kavling` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `kavling_perumahan_id_blok_nomor_unit_key` ON `kavling`(`perumahan_id`, `blok`, `nomor_unit`);
