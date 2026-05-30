import { PrismaClient, Role } from "@prisma/client";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";

export async function seedSpk(prisma: PrismaClient) {
  console.log("==========================================================");
  console.log("  MEMULAI SEED SPK dari Daftar SPK Puri safana cikeas update 22 mei.xlsx");
  console.log("==========================================================");

  const excelPath = path.resolve(process.cwd(), "Daftar SPK Puri safana cikeas update 22 mei.xlsx");

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ File ${excelPath} tidak ditemukan di root folder!`);
    return;
  }

  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  
  // Sesuai dengan file CSV "Daftar SPK Rumah Terinput di Sy"
  const sheetName = "Daftar SPK Rumah Terinput di Sy"; 
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    console.error(`❌ Sheet '${sheetName}' tidak ditemukan! Pastikan nama sheet sesuai dengan yang ada di Excel.`);
    return;
  }

  const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:L1000");
  const maxRow = range.e.r + 1;

  console.log(`\n>>> Sheet ditemukan: '${sheetName}', total baris: ${maxRow}`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 2; i <= maxRow; i++) { // Asumsi baris 1 adalah header
    const getCell = (col: string) => {
      const cell = worksheet[`${col}${i}`];
      return cell ? cell.v : undefined;
    };

    const rawSpkNew = getCell("C");
    const rawNamaMandor = getCell("D");
    const rawKso = getCell("E"); // Kolom KSO
    const rawBlok = getCell("G");
    const rawNoUnit = getCell("H");
    const rawNilaiKontrak = getCell("J");

    // Jika no SPK new kosong, kita lewati baris ini
    if (rawSpkNew === undefined || String(rawSpkNew).trim() === "") {
      skipCount++;
      continue;
    }

    const noSpk = String(rawSpkNew).trim();
    const namaMandor = rawNamaMandor !== undefined ? String(rawNamaMandor).trim() : "Mandor Default";
    const ksoStr = rawKso !== undefined ? String(rawKso).trim().toUpperCase() : "";
    const blok = rawBlok !== undefined ? String(rawBlok).trim() : "";
    const nilaiKontrak = rawNilaiKontrak !== undefined ? Number(rawNilaiKontrak) : 0;
    const judulPekerjaan = `Pembangunan Blok ${blok}`;

    // Menentukan target Nomor Rekening berdasarkan KSO
    let targetNoRekening: string | null = null;
    if (ksoStr === "BSM") {
      targetNoRekening = "7326573692";
    } else if (ksoStr === "SGMP" || ksoStr === "BGMP") {
      targetNoRekening = "7326575644";
    }

    console.log(`\n========================================================`);
    console.log(`[BARIS EXCEL ${i}] LOG VALUE EXCEL & PARSED`);
    console.log(`========================================================`);
    console.log(`RAW VALUE EXCEL:`);
    console.log(`  - SPK New       :`, rawSpkNew);
    console.log(`  - Nama Mandor   :`, rawNamaMandor);
    console.log(`  - KSO           :`, rawKso);
    console.log(`  - Blok          :`, rawBlok);
    console.log(`  - No Unit       :`, rawNoUnit);
    console.log(`  - Nilai Kontrak :`, rawNilaiKontrak);
    
    console.log(`\nVALUE YANG AKAN MASUK KE DB:`);
    console.log(`  - noSpk         : "${noSpk}"`);
    console.log(`  - judulPekerjaan: "${judulPekerjaan}"`);
    console.log(`  - nilaiKontrak  : ${nilaiKontrak}`);
    console.log(`  - namaMandor    : "${namaMandor}"`);
    console.log(`  - KSO Parsed    : "${ksoStr}" -> Target No Rekening: ${targetNoRekening ?? "Tidak ada mapping"}`);
    
    try {
      // 1. Cari atau Buat User untuk Mandor
      const usernameMandor = namaMandor.replace(/\s+/g, '').toLowerCase(); 
      console.log(`  - [Mandor] Cek username : "${usernameMandor}"`);

      let mandorUser = await prisma.user.findFirst({
        where: { username: usernameMandor, role: Role.MANDOR },
      });

      if (!mandorUser) {
        console.log(`  -> Mandor belum ada, create user baru: { username: "${usernameMandor}", role: "${Role.MANDOR}" }`);
        mandorUser = await prisma.user.create({
          data: {
            username: usernameMandor,
            email: `${usernameMandor}@mandor.com`,
            password: "password123",
            role: Role.MANDOR,
          },
        });
      } else {
        console.log(`  -> Mandor sudah ada (User ID: ${mandorUser.id})`);
      }

      // 2. Cari Bank Rekening PT berdasarkan Nomor Rekening
      let bankRekeningPtId: number | null = null;
      if (targetNoRekening) {
        const bank = await prisma.bankRekeningPt.findFirst({
          where: { noRekening: targetNoRekening }
        });
        if (bank) {
          bankRekeningPtId = bank.id;
          console.log(`  -> Bank ditemukan: ID ${bank.id} (${bank.atasNama})`);
        } else {
          console.log(`  ⚠️ Bank dengan no rekening ${targetNoRekening} (KSO: ${ksoStr}) TIDAK DITEMUKAN di tabel BankRekeningPt!`);
        }
      }

      // 3. Cari atau Buat data SPK utama
      let spk = await prisma.spk.findUnique({
        where: { noSpk: noSpk },
      });

      if (!spk) {
        console.log(`  -> SPK belum ada, create SPK baru: { noSpk: "${noSpk}", mandorId: ${mandorUser.id}, bankRekeningPtId: ${bankRekeningPtId}, nilaiKontrak: ${nilaiKontrak} }`);
        spk = await prisma.spk.create({
          data: {
            noSpk: noSpk,
            judulPekerjaan: judulPekerjaan,
            nilaiKontrak: nilaiKontrak,
            mandorId: mandorUser.id,
            bankRekeningPtId: bankRekeningPtId,
            tanggalSpk: new Date(),
          },
        });
      } else {
        console.log(`  -> SPK sudah ada (SPK ID: ${spk.id}), update data.`);
        spk = await prisma.spk.update({
          where: { id: spk.id },
          data: { 
            nilaiKontrak: nilaiKontrak,
            bankRekeningPtId: bankRekeningPtId // Update bank ID in case it was null or changed
          }
        });
      }

      // 4. Proses Nomor Unit dan Relasikan ke SpkPenjualan
      if (rawNoUnit !== undefined && String(rawNoUnit).trim() !== "") {
        const unitsRaw = String(rawNoUnit).trim();
        const unitsArray: string[] = [];

        const parts = unitsRaw.split(',').map(p => p.trim());
        
        for (const part of parts) {
          if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr.trim());
            const end = parseInt(endStr.trim());
            
            if (!isNaN(start) && !isNaN(end)) {
              for (let n = start; n <= end; n++) {
                unitsArray.push(n.toString());
              }
            } else {
              unitsArray.push(part);
            }
          } else {
            unitsArray.push(part);
          }
        }

        console.log(`  - [Unit Kavling] Raw string   : "${unitsRaw}"`);
        console.log(`  - [Unit Kavling] Array parsed :`, unitsArray);

        for (const nomorUnit of unitsArray) {
          const kavling = await prisma.kavling.findFirst({
            where: { perumahanId: 1, blok: blok, nomorUnit: nomorUnit }
          });

          if (kavling) {
            const existingSpkPenjualan = await prisma.spkPenjualan.findFirst({
              where: { spkId: spk.id, kavlingId: kavling.id }
            });

            if (!existingSpkPenjualan) {
              console.log(`  -> Insert SpkPenjualan: { spkId: ${spk.id}, kavlingId: ${kavling.id} } // Kavling ${blok}-${nomorUnit}`);
              await prisma.spkPenjualan.create({
                data: {
                  spkId: spk.id,
                  kavlingId: kavling.id
                }
              });
            } else {
              console.log(`  -> Skip SpkPenjualan: Relasi SPK ${noSpk} dengan Kavling ${blok}-${nomorUnit} sudah ada.`);
            }
          } else {
            console.log(`  ⚠️  Kavling Blok ${blok} Unit ${nomorUnit} TIDAK DITEMUKAN di database. (Skip insert SpkPenjualan)`);
          }
        }
      } else {
        console.log(`  - [Unit Kavling] Tidak ada data unit kavling (kolom H kosong).`);
      }

      successCount++;
      console.log(`✅ [Baris ${i}] SELESAI PROSES BARIS.`);

    } catch (err: any) {
      errorCount++;
      console.error(`❌ [Baris ${i}] ERROR: ${err.message}`);
    }
  }

  console.log(`\n==========================================================`);
  console.log(`  SELESAI SEED SPK`);
  console.log(`  ✅ Sukses : ${successCount}`);
  console.log(`  ⏭️  Skip   : ${skipCount} (Kolom SPK new kosong)`);
  console.log(`  ❌ Error  : ${errorCount}`);
  console.log(`==========================================================\n`);
}