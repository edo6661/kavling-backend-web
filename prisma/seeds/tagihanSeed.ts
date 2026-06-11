import {
  PrismaClient,
  TagihanTujuan,
  PaymentStatus,
  PenjualanStatus,
} from "@prisma/client";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";

// Fungsi untuk mengekstrak angka dari string (contoh: "IrmaDp1" -> "1", "Yunelda2" -> "2")
function extractNumber(text: string): string | null {
  const match = text.match(/\d+/);
  return match ? match[0] : null;
}

// Fungsi sederhana untuk cek string kemiripan (mengabaikan spasi & huruf besar/kecil)
function isNameSimilar(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().replace(/\s/g, "");
  const n2 = name2.toLowerCase().replace(/\s/g, "");
  return n1.includes(n2) || n2.includes(n1);
}
function parseDateFlexible(value: any): Date | null {
  if (value === undefined || value === null || value === "") return null;

  // 1. Jika value dibaca sebagai angka oleh Excel (Serial Date)
  // Rumus konversi serial Excel ke JS Date
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  // 2. Jika value dibaca sebagai text/string (contoh: "2025-11-25")
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}
export async function seedTagihan(prisma: PrismaClient) {
  console.log("==========================================================");
  console.log("  MEMULAI SEED TAGIHAN (DRY RUN MODE)");
  console.log("==========================================================");

  // Ubah nama file menyesuaikan dengan nama file yang kamu miliki di lokal
  const filePath = path.resolve(process.cwd(), "Data_Tagihan.xlsx"); 
  // Jika formatnya CSV, ganti saja menjadi "Data_Tagihan.csv"
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File ${filePath} tidak ditemukan di root folder!`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  
  // Mengambil sheet pertama
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`❌ Sheet tidak ditemukan!`);
    return;
  }

  const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:G1000");
  const maxRow = range.e.r + 1;

  console.log(`\n>>> File dibaca, total baris terdeteksi: ${maxRow}`);

  try {
    // KITA GUNAKAN TRANSACTION UNTUK FITUR DRY-RUN (ROLLBACK)
    await prisma.$transaction(async (tx) => {
      let successCount = 0;
      let skipCount = 0;
      let warningCount = 0;

      // Asumsi baris 1 adalah header, data mulai di baris 2 (index 1 di xlsx, tapi pakai i=2 untuk visualisasi baris excel)
      for (let i = 2; i <= maxRow; i++) {
        const getCell = (col: string) => {
          const cell = worksheet[`${col}${i}`];
          return cell ? cell.v : undefined;
        };

        const rawNo = getCell("A"); // NO
        const rawBlok = getCell("B"); // BLOK (e.g., AA18-14)
        const rawNama = getCell("C"); // NAMA CUSTOMER
        const rawTanggal = getCell("D"); // TANGGAL (e.g., 2025-11-25)
        const rawNominal = getCell("E"); // NOMINAL
        const rawKeterangan = getCell("F"); // KETERANGAN (e.g., IrmaDp1, Yunelda2)

        if (!rawBlok || !rawKeterangan) {
          continue; // Lewati jika baris kosong
        }

        console.log(`\n========================================================`);
        console.log(`[BARIS EXCEL ${i}] Memproses tagihan untuk ${rawNama}...`);

        // 1. Parsing BLOK dan NOMOR UNIT
        const blokRaw = String(rawBlok).trim();
        const dashIdx = blokRaw.indexOf("-");
        const blok = dashIdx !== -1 ? blokRaw.substring(0, dashIdx) : blokRaw;
        const nomorUnit = dashIdx !== -1 ? blokRaw.substring(dashIdx + 1) : "";

        // 2. Parsing KETERANGAN (Untuk menentukan DP atau Harga Jual)
        const keterangan = String(rawKeterangan).trim();
        const isDp = keterangan.toLowerCase().includes("dp");
        const tujuan = isDp ? TagihanTujuan.DP : TagihanTujuan.HARGA_JUAL;
        
        const cicilanKe = extractNumber(keterangan);
        let namaPembayaran = "";
        
        if (isDp) {
          namaPembayaran = cicilanKe ? `DP ${cicilanKe}` : "DP";
        } else {
          namaPembayaran = cicilanKe ? `Cicilan Harga Jual ${cicilanKe}` : "Cicilan Harga Jual";
        }

        // 3. Cari Kavling & Penjualan Aktif di DB
        const kavling = await tx.kavling.findFirst({
          where: { blok: blok, nomorUnit: nomorUnit },
          include: {
            penjualan: {
              where: { status: { not: PenjualanStatus.BATAL } },
              include: { customer: true },
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!kavling) {
          console.log(`  ❌ SKIP: Kavling ${blok}-${nomorUnit} tidak ditemukan di sistem.`);
          skipCount++;
          continue;
        }

        if (!kavling.penjualan || kavling.penjualan.length === 0) {
          console.log(`  ❌ SKIP: Kavling ${blok}-${nomorUnit} tidak memiliki data Penjualan aktif.`);
          skipCount++;
          continue;
        }

        const activePenjualan = kavling.penjualan[0];
        const customerDb = activePenjualan.customer;
        const customerNameExcel = String(rawNama).trim();

        // 4. Validasi typo nama customer
        if (!isNameSimilar(customerDb.nama, customerNameExcel)) {
          console.log(`  ⚠️  WARNING: Nama di excel ("${customerNameExcel}") berbeda dengan di DB ("${customerDb.nama}"). Namun tetap diproses menggunakan data DB karena Kavling cocok.`);
          warningCount++;
        }

        // 5. Build Payload Tagihan
        const nominal = Number(rawNominal);
        const tanggalJatuhTempo = parseDateFlexible(rawTanggal);
        
        // Generate nomor tagihan unik (misal: INV-DP-AA18-14-1)
        const noTagihan = `INV-${tujuan}-${blok}-${nomorUnit}-${cicilanKe || 'X'}-${Date.now().toString().slice(-4)}`;

        const payloadTagihan = {
          noTagihan: noTagihan,
          customerId: customerDb.id,
          penjualanId: activePenjualan.id,
          nominal: nominal,
          jatuhTempo: tanggalJatuhTempo ?? new Date(),
          tujuan: tujuan,
          pembayaran: namaPembayaran,
          status: PaymentStatus.BELUM_BAYAR, // Set default status (Asumsi perlu ditagihkan)
        };

        // Print LOG sebelum insert
        console.log(`  ✅ TARGET INSERT:`);
        console.log(`     - Kavling     : ${blok}-${nomorUnit}`);
        console.log(`     - Customer    : ${customerDb.nama} (ID: ${customerDb.id})`);
        console.log(`     - PenjualanID : ${activePenjualan.id}`);
        console.log(`     - Keterangan  : ${keterangan}  =>  ${namaPembayaran}`);
        console.log(`     - Tujuan      : ${tujuan}`);
        console.log(`     - Nominal     : Rp ${nominal.toLocaleString("id-ID")}`);

        // Insert Data (Masih dalam transaksi yang nanti di rollback)
        await tx.tagihan.create({
          data: payloadTagihan,
        });

        successCount++;
      }

      console.log(`\n==========================================================`);
      console.log(`  HASIL SIMULASI INSERT TAGIHAN`);
      console.log(`  ✅ Sukses Disiapkan : ${successCount}`);
      console.log(`  ⚠️  Warning (Typo)  : ${warningCount}`);
      console.log(`  ⏭️  Skip (Ga Nemu)  : ${skipCount}`);
      console.log(`==========================================================`);

      // 🛑 MEKANISME DRY-RUN ROLLBACK
      // Kita lemparkan error secara sengaja agar Prisma menggagalkan (rollback) seluruh insert yang baru saja dilakukan.
      throw new Error("DRY_RUN_ROLLBACK");
      
    });
  } catch (error: any) {
    if (error.message === "DRY_RUN_ROLLBACK") {
      console.log("\n🔄 DRY RUN SELESAI: Semua data yang disimulasikan barusan telah di-ROLLBACK dengan sukses.");
      console.log("   (Database kamu tetap bersih. Cek log di atas. Jika sudah dirasa benar, hapus error throw di script untuk insert beneran.)\n");
    } else {
      console.error("\n❌ TERJADI ERROR FATAL SAAT SEEDING:", error);
    }
  }
}