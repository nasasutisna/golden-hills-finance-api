/**
 * Import data warga master dari `Search IKK dan Iuran.xlsx` (sheet "Search IKK").
 *
 * Sumber: kolom Blok Rumah, Nama Pemilik, Luas Tanah, Status IKK.
 * Target: tabel house_blocks, house_units, residents.
 * Matriks pembayaran bulanan TIDAK diimport (hanya master data).
 *
 * Idempoten:
 *  - houseBlock  : upsert by blockCode (insert-only, tidak clobber existing)
 *  - houseUnit   : upsert by unitCode (update landArea/buildingArea/status/ipl%/block)
 *  - resident    : find-by-unit → kalau sudah ada: update LINK saja (bukan nama);
 *                  kalau belum: create dgn residentCode RES + (max sequence)+1
 *
 * AMAN dijalankan ulang. 4 warga existing (RES006–009) dikenali via unit-nya.
 *
 * Run (review dulu, tanpa tulis DB):
 *   DRY_RUN=1 npx ts-node prisma/scripts/import-warga-ikk.ts
 * Lalu eksekusi sungguhan:
 *   npx ts-node prisma/scripts/import-warga-ikk.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import 'dotenv/config';

class SeedPrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaMariaDb(connectionString as string);
    super({ adapter });
  }
}

const prisma = new SeedPrismaService();
const DRY_RUN = process.env.DRY_RUN === '1';
const EXCEL_PATH =
  process.env.EXCEL_PATH ?? path.resolve(process.cwd(), 'Search IKK dan Iuran.xlsx');

// ── Mapping status hunian Excel → DB ────────────────────────────────────────
type StatusMap = { occupancy: string; ipl: number };
function mapStatus(raw: string): StatusMap {
  const s = String(raw ?? '').trim().toLowerCase();
  switch (s) {
    case 'ditempati':
      return { occupancy: 'FULLY_OCCUPIED', ipl: 100 };
    case '0.5':
      return { occupancy: 'OCCASIONALLY', ipl: 50 };
    case 'kosong':
      return { occupancy: 'VACANT', ipl: 0 };
    case 'estate':
      return { occupancy: 'ESTATE', ipl: 0 };
    default:
      return { occupancy: 'VACANT', ipl: 0 };
  }
}

// ── Grouping blok kasar (gaya "BLOK A-B") ───────────────────────────────────
const BLOCK_GROUPS: { letters: string[]; code: string }[] = [
  { letters: ['A', 'B'], code: 'BLOK A-B' },
  { letters: ['C', 'D'], code: 'BLOK C-D' },
  { letters: ['E', 'F'], code: 'BLOK E-F' },
  { letters: ['G', 'H'], code: 'BLOK G-H' },
  { letters: ['I', 'J'], code: 'BLOK I-J' },
  { letters: ['K', 'L'], code: 'BLOK K-L' },
  { letters: ['M', 'N'], code: 'BLOK M-N' },
  { letters: ['O', 'P'], code: 'BLOK O-P' },
  { letters: ['Q', 'R', 'S'], code: 'BLOK Q-S' },
  { letters: ['AA'], code: 'BLOK AA' },
  { letters: ['BB', 'BC'], code: 'BLOK BB-BC' },
  { letters: ['CC'], code: 'BLOK CC' },
];
const LETTER_TO_BLOCK: Record<string, string> = {};
for (const g of BLOCK_GROUPS) for (const l of g.letters) LETTER_TO_BLOCK[l] = g.code;

function blockForUnit(blok: string): string {
  const m = blok.match(/^([A-Z]+)/);
  const lead = m ? m[1] : '?';
  return LETTER_TO_BLOCK[lead] ?? `BLOK ${lead}`;
}

// ── Parsing nama pemilik → firstName / lastName ─────────────────────────────
function parseName(raw: string): { firstName: string; lastName: string } | null {
  let name = String(raw ?? '').trim();
  if (!name || name.toLowerCase() === 'none') return null;
  // buang catatan dalam kurung: "(dikontrak: ...)", "(Oma)", "(kontrak: ...)"
  name = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!name) return null;
  const tokens = name.split(/\s+/);
  const firstName = tokens[0];
  const lastName = tokens.slice(1).join(' ');
  return { firstName, lastName };
}

// ── Helper nilai cell exceljs (formula / rich text / primitif) ──────────────
function cellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value as any;
  if (v && typeof v === 'object') {
    if ('result' in v) return v.result; // formula
    if ('richText' in v) return v.richText.map((t: any) => t.text).join('');
    if ('text' in v) return v.text;
  }
  return v;
}

interface Stats {
  rows: number;
  blocksCreated: number;
  blocksExisting: number;
  unitsCreated: number;
  unitsUpdated: number;
  residentsCreated: number;
  residentsUpdated: number;
  noOwner: number;
}
const stats: Stats = {
  rows: 0,
  blocksCreated: 0,
  blocksExisting: 0,
  unitsCreated: 0,
  unitsUpdated: 0,
  residentsCreated: 0,
  residentsUpdated: 0,
  noOwner: 0,
};

async function main() {
  console.log(`Mode: ${DRY_RUN ? '⛔ DRY-RUN (tidak menulis DB)' : '✅ EKSEKUSI'}`);
  console.log(`Excel: ${EXCEL_PATH}\n`);

  // ── Pre-fetch state untuk decision (create vs update) ─────────────────────
  const blocks = await prisma.houseBlock.findMany({
    where: { deletedAt: null },
    select: { id: true, blockCode: true },
  });
  const blockCache: Record<string, string> = {}; // blockCode → id
  const existingBlockCodes = new Set<string>();
  const processedBlocks = new Set<string>(); // dedup stat block per run
  for (const b of blocks) {
    blockCache[b.blockCode] = b.id;
    existingBlockCodes.add(b.blockCode);
  }

  const units = await prisma.houseUnit.findMany({
    where: { deletedAt: null },
    select: { id: true, unitCode: true },
  });
  const existingUnitIds = new Set<string>(units.map((u) => u.unitCode));
  const unitIdByCode: Record<string, string> = {};
  for (const u of units) unitIdByCode[u.unitCode] = u.id;

  const residents = await prisma.resident.findMany({
    where: { deletedAt: null },
    select: { id: true, residentCode: true, houseUnitId: true },
  });
  const residentByUnit: Record<string, { id: string; code: string }> = {};
  const unitsWithResident = new Set<string>(); // unitCode yang sudah punya resident
  let maxSeq = 0;
  for (const r of residents) {
    if (r.houseUnitId) {
      residentByUnit[r.houseUnitId] = { id: r.id, code: r.residentCode };
      // cari unitCode untuk houseUnitId ini
      for (const [code, id] of Object.entries(unitIdByCode)) {
        if (id === r.houseUnitId) unitsWithResident.add(code);
      }
    }
    const m = r.residentCode.match(/(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  let residentSeq = maxSeq; // diinkremen sebelum pakai
  const nextResidentCode = (): string => {
    residentSeq += 1;
    return `RES${String(residentSeq).padStart(3, '0')}`;
  };

  // ── Baca Excel ───────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.getWorksheet('Search IKK');
  if (!ws) throw new Error("Sheet 'Search IKK' tidak ditemukan");

  const START_ROW = 6; // baris 6 = data pertama (A1)
  for (let rowNo = START_ROW; rowNo <= ws.rowCount; rowNo++) {
    const row = ws.getRow(rowNo);
    const blokRaw = cellValue(row.getCell(1));
    const namaRaw = cellValue(row.getCell(2));
    const luasRaw = cellValue(row.getCell(3));
    const statusRaw = cellValue(row.getCell(5));

    const blok = String(blokRaw ?? '').trim();
    if (!blok) continue; // baris kosong
    // skip header/teks panduan
    if (/^(blok rumah|ketik|>>>)/i.test(blok)) continue;
    stats.rows++;

    const blockCode = blockForUnit(blok);
    const luas = parseFloat(String(luasRaw ?? '0').replace(',', '.')) || 0;
    const { occupancy, ipl } = mapStatus(String(statusRaw));

    // ── 1. Block (upsert, insert-only) — stat per-blok-unik ──
    let blockId = blockCache[blockCode];
    if (!processedBlocks.has(blockCode)) {
      processedBlocks.add(blockCode);
      if (blockId) stats.blocksExisting++;
      else stats.blocksCreated++;
    }
    if (!blockId && !DRY_RUN) {
      const created = await prisma.houseBlock.create({
        data: { blockCode, blockName: blockCode },
      });
      blockId = created.id;
      blockCache[blockCode] = blockId;
    }

    // ── 2. Unit (upsert by unitCode) ──
    const unitExists = existingUnitIds.has(blok);
    const unitNumber = blok;
    let unitId: string | undefined;
    if (!DRY_RUN) {
      const unit = await prisma.houseUnit.upsert({
        where: { unitCode: blok },
        update: {
          landArea: luas,
          buildingArea: 0,
          occupancyStatus: occupancy,
          iplPercentage: ipl,
          houseBlockId: blockId ?? null,
          // Excel = source of truth master data: pastikan unit aktif
          // (mencegah collision dgn unit soft-deleted lama, mis. seed "C11").
          deletedAt: null,
        },
        create: {
          unitCode: blok,
          unitNumber,
          landArea: luas,
          buildingArea: 0,
          occupancyStatus: occupancy,
          iplPercentage: ipl,
          houseBlockId: blockId ?? null,
        },
      });
      unitId = unit.id;
    }
    if (unitExists) stats.unitsUpdated++;
    else stats.unitsCreated++;

    // ── 3. Resident (find-by-unit → update link / create) ──
    const name = parseName(String(namaRaw ?? ''));
    if (!name) {
      stats.noOwner++;
      if (rowNo <= START_ROW + 10 || stats.noOwner <= 3) {
        console.log(`  ⓘ ${blok}: tanpa pemilik → unit dibuat tanpa resident`);
      }
      continue;
    }

    if (!DRY_RUN && unitId) {
      const existing = residentByUnit[unitId];
      if (existing) {
        // update LINK saja, JANGAN overwrite nama (lihat catatan B15)
        await prisma.resident.update({
          where: { id: existing.id },
          data: { houseBlockId: blockId ?? null, houseUnitId: unitId, unitNumber },
        });
        stats.residentsUpdated++;
      } else {
        const residentCode = nextResidentCode();
        await prisma.resident.create({
          data: {
            residentCode,
            firstName: name.firstName,
            lastName: name.lastName,
            houseBlockId: blockId ?? null,
            houseUnitId: unitId,
            unitNumber,
            ownershipType: 'OWNER',
            isActive: true,
          },
        });
        stats.residentsCreated++;
      }
    } else if (DRY_RUN) {
      // estimasi: unit existing dgn resident → update; lainnya → create
      if (unitsWithResident.has(blok)) stats.residentsUpdated++;
      else stats.residentsCreated++;
    }
  }

  // ── Ringkasan ────────────────────────────────────────────────────────────
  console.log('\n═══════════ RINGKASAN ═══════════');
  console.log(`Baris data diproses : ${stats.rows}`);
  console.log(`Blok   - dibuat     : ${stats.blocksCreated}`);
  console.log(`Blok   - sudah ada  : ${stats.blocksExisting}`);
  console.log(`Unit   - dibuat     : ${stats.unitsCreated}`);
  console.log(`Unit   - diupdate   : ${stats.unitsUpdated}`);
  console.log(`Warga  - dibuat     : ${stats.residentsCreated}`);
  console.log(`Warga  - diupdate   : ${stats.residentsUpdated}  (link saja, nama dipertahankan)`);
  console.log(`Unit tanpa pemilik  : ${stats.noOwner}`);
  const nextSeq = DRY_RUN ? maxSeq + 1 : residentSeq + 1;
  console.log(`ResidentCode berikut: RES${String(nextSeq).padStart(3, '0')}`);
  if (DRY_RUN) {
    console.log('\n⛔ DRY-RUN — tidak ada yang ditulis. Jalankan tanpa DRY_RUN untuk eksekusi.');
  } else {
    console.log('\n✅ Import selesai.');
  }
}

main()
  .catch((e) => {
    console.error('Import warga IKK gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
