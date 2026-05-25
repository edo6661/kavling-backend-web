-- Perlebar kolom URL Cloudinary (signed URL bisa > 500 karakter)
ALTER TABLE `kode_billing_pph` MODIFY `file_billing` VARCHAR(1000) NOT NULL;
ALTER TABLE `kode_billing_pph` MODIFY `file_bukti_bayar` VARCHAR(1000) NULL;
