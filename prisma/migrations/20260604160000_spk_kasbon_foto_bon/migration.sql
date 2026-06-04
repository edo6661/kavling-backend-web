-- Foto nota/bon per baris kasbon material (URL Cloudinary)
ALTER TABLE `spk_pembayaran_kasbon_baris`
ADD COLUMN `foto_bon` VARCHAR(500) NULL AFTER `nominal`;
