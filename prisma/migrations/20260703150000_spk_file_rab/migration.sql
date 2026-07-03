-- Optional RAB document for SPK (existing rows remain NULL)
ALTER TABLE `spk`
ADD COLUMN `file_rab` VARCHAR(255) NULL AFTER `file_spk`;
