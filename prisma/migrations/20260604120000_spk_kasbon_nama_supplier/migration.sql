-- Tambah nama supplier per baris material kasbon (data lama: string kosong)
ALTER TABLE `spk_pembayaran_kasbon_baris`
  ADD COLUMN `nama_supplier` VARCHAR(200) NOT NULL DEFAULT '' AFTER `spk_pembayaran_id`;
