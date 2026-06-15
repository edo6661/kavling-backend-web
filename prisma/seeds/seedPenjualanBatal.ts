import {
    PrismaClient,
    PenjualanStatus,
    PaymentStatus,
    TagihanTujuan,
  } from "@prisma/client";
  import * as xlsx from "xlsx";
  import path from "path";
  import fs from "fs";
  
  export async function seedPenjualanBatal(prisma: PrismaClient) {
    // Ganti nama file sesuai dengan file Excel/CSV yang akan kamu gunakan nanti
    const filePath = path.resolve(process.cwd(), "Data_Batal_120626.xls");
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File ${filePath} tidak ditemukan!`);
      return;
    }
  
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // Ambil sheet pertama
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert ke array of objects
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
    console.log(`🚀 Mulai memproses ${rows.length} baris data batal...`);
  
    try {
      // Jalankan seluruh proses di dalam transaction
      await prisma.$transaction(async (tx) => {
        let countInserted = 0;
  
        for (let i = 0; i < rows.length; i++) {
          const row: any = rows[i];
          
          // --- 1. PARSING KOLOM EXCEL/CSV ---
          const rawBlok = row["Blok"] ? String(row["Blok"]).trim() : "";
          const namaCustomer = row["Nama Customer"] ? String(row["Nama Customer"]).trim() : "";
          const alasanBatal = row["Alasan"] && String(row["Alasan"]).trim() !== "" ? String(row["Alasan"]).trim() : "-";
          const sumberAgent = row["Sumber"] ? String(row["Sumber"]).trim() : "";
          const hargaDasar = Number(row["Harga"]) || 0;
          const diskon = Number(row["Diskon"]) || 0;
          const hargaNett = Number(row["Harga Nett"]) || 0;
          const bookingFee = Number(row["Booking Fee"]) || 0;
  
          if (!rawBlok || !namaCustomer) {
            console.log(`⚠️ Baris ${i + 1}: Di-skip karena Blok atau Nama Customer kosong.`);
            continue;
          }
  
          // --- 2. PECAH BLOK & NOMOR UNIT ---
          // Contoh: AA28-8 -> blok = AA28, nomorUnit = 8
          const splitted = rawBlok.split("-");
          const blok = splitted[0] ? splitted[0].trim() : "";
          const nomorUnit = splitted[1] ? splitted[1].trim() : "";
  
          // --- 3. CARI KAVLING ---
          const kavling = await tx.kavling.findFirst({
            where: { blok: blok, nomorUnit: nomorUnit },
          });
  
          if (!kavling) {
            console.log(`❌ Baris ${i + 1}: Kavling ${rawBlok} tidak ditemukan. Skip insert.`);
            continue;
          }
  
          // --- 4. CARI ATAU BUAT CUSTOMER ---
          let customer = await tx.customer.findFirst({
            where: { nama: namaCustomer }
          });
  
          if (!customer) {
            // Kita potong Date.now() agar tidak melebihi 20 karakter VarChar MySQL
            const shortTimestamp = Date.now().toString().slice(-8);
            const dummyNik = `BTL-${shortTimestamp}-${i}`;
            
            customer = await tx.customer.create({
              data: {
                nama: namaCustomer,
                nikKtp: dummyNik,
                noHp: "080000000000",
                alamatKtp: "Alamat belum tersedia (Data Batal Awal)"
              }
            });
            console.log(`👤 Dibuat Customer Baru: ${namaCustomer} (NIK: ${dummyNik})`);
          }
  
          // --- 5. CARI AGENT ---
          let agentId: number | null = null;
          if (sumberAgent) {
            // Mencari agent dengan "contains" (contoh di CSV "Agen Chris" akan match dengan "Chris")
            const agentNameClean = sumberAgent.replace(/agen /i, "").trim();
            const agent = await tx.agent.findFirst({
              where: { nama: { contains: agentNameClean } }
            });
            if (agent) {
              agentId = agent.id;
            } else {
              console.log(`⚠️ Baris ${i + 1}: Agent "${sumberAgent}" tidak ditemukan di database.`);
            }
          }
  
          // --- 6. ATUR TANGGAL (Opsional: Silakan sesuaikan jika tanggal ada di Excel nantinya) ---
          const dummyTanggalPenjualan = new Date("2024-01-01"); // Ganti jika butuh tanggal spesifik
          const dummyTanggalBayarBF = new Date("2024-01-02");
  
          // --- 7. INSERT PENJUALAN (BATAL) ---
          const noTransaksi = `TRX-BTL-${blok}${nomorUnit}-${Date.now()}-${i}`;
          
          const penjualanBaru = await tx.penjualan.create({
            data: {
              noTransaksi: noTransaksi,
              tanggal: dummyTanggalPenjualan,
              status: PenjualanStatus.BATAL,
              alasanBatal: alasanBatal,
              hargaDasar: hargaDasar,
              hargaJual: hargaNett,
              diskonPenjualan: diskon,
              bookingFee: bookingFee,
              fileBuktiBooking: "-", 
              customerId: customer.id,
              kavlingId: kavling.id,
              agentId: agentId,
              rekeningTujuanId: kavling.rekeningTujuanId,
            }
          });
  
          // --- 8. INSERT TAGIHAN BOOKING FEE SEBAGAI PENANDA DUIT MASUK ---
          await tx.tagihan.create({
            data: {
              noTagihan: `INV-BF-${noTransaksi}`,
              customerId: customer.id,
              penjualanId: penjualanBaru.id,
              tujuan: TagihanTujuan.BOOKING_FEE,
              nominal: bookingFee,
              jatuhTempo: dummyTanggalBayarBF, // Tanggal bayar BF
              status: PaymentStatus.LUNAS,
              pembayaran: "Transfer",
              fileBukti: "-", // Sesuai permintaan
            }
          });
  
          console.log(`✅ Sukses Insert Penjualan Batal: ${rawBlok} - Customer: ${namaCustomer}`);
          countInserted++;
        }
  
        console.log(`\n🎉 SELESAI! Total data siap di-insert: ${countInserted} baris.`);
  
      }, {
        // Perpanjang timeout jika data excelnya nanti besar
        timeout: 120000
      });
  
    } catch (error: any) {
      if (error.message === "ROLLBACK_TESTING") {
        console.log("\n⚠️ TRANSACTION ROLLBACK BERHASIL.");
        console.log("Semua data log di atas adalah simulasi. Tidak ada data production yang berubah.");
        console.log("Jika log sudah dirasa benar, hapus baris 'throw new Error(\"ROLLBACK_TESTING\");' di kode.");
      } else {
        console.error("\n❌ Terjadi error saat menjalankan seed:", error);
      }
    }
  }