import { SlksProposalRecord } from '../types/asn';
import { parseNip } from './nipParser';

/**
 * Mengubah URL Google Sheets (format web edit/view) menjadi URL ekspor CSV
 */
export function convertToGoogleSheetsCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.includes('output=csv') || trimmed.endsWith('.csv')) {
    return trimmed;
  }

  // Pola Google Sheets: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const matchId = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matchId && matchId[1]) {
    const sheetId = matchId[1];
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  if (trimmed.includes('/pubhtml')) {
    return trimmed.replace('/pubhtml', '/pub?output=csv');
  }

  return trimmed;
}

/**
 * Parser CSV / TSV untuk memisahkan baris dan kolom (koma, titik-koma, tab)
 */
export function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount) {
    delimiter = ';';
  }

  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Memetakan baris-baris spreadsheet ke format 8 kolom:
 * NIP, NAMA, PANGKAT/GOL, JABATAN, USUL SLKS, TAHUN MENGUSULKAN, PERIODE TAHUN USULAN, STATUS
 */
export function mapCsvToSlksRecords(rows: string[][]): SlksProposalRecord[] {
  if (rows.length < 2) return [];

  // Normalisasi header
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

  const findCol = (...keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const colNip = findCol('nip', 'nomorinduk');
  const colNama = findCol('nama');
  const colPangkat = findCol('pangkatgol', 'pangkat', 'golongan', 'gol');
  const colJabatan = findCol('jabatan', 'posisi');
  const colUsulSlks = findCol('usulslks', 'usul', 'slks', 'jenjang', 'tingkat');
  const colTahun = findCol('tahunmengusulkan', 'tahunusul', 'tahun');
  const colPeriode = findCol('periodetahunusulan', 'periodeusulan', 'periode');
  const colStatus = findCol('status', 'keterangan');

  const records: SlksProposalRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawNip = colNip >= 0 && row[colNip] ? row[colNip].replace(/\D/g, '') : '';
    if (!rawNip || rawNip.length < 8) continue;

    const parsedNip = parseNip(rawNip);
    const nama = colNama >= 0 && row[colNama] ? row[colNama].trim() : `Pegawai ${rawNip}`;
    const pangkatGol = colPangkat >= 0 && row[colPangkat] ? row[colPangkat].trim() : '-';
    const jabatan = colJabatan >= 0 && row[colJabatan] ? row[colJabatan].trim() : 'Pegawai Negeri Sipil';

    // Estimasi usul jika kosong dari masa kerja
    let usulSlks = colUsulSlks >= 0 && row[colUsulSlks] ? row[colUsulSlks].trim() : '';
    if (usulSlks === 'XXX') usulSlks = 'SLKS 30 Tahun (XXX)';
    else if (usulSlks === 'XX') usulSlks = 'SLKS 20 Tahun (XX)';
    else if (usulSlks === 'X') usulSlks = 'SLKS 10 Tahun (X)';
    else if (!usulSlks) {
      const th = parsedNip.masaKerjaTahun ?? 10;
      if (th >= 30) usulSlks = 'SLKS 30 Tahun (XXX)';
      else if (th >= 20) usulSlks = 'SLKS 20 Tahun (XX)';
      else usulSlks = 'SLKS 10 Tahun (X)';
    }

    const tahunMengusulkan = colTahun >= 0 && row[colTahun] ? row[colTahun].trim() : `${new Date().getFullYear()}`;
    const periodeTahunUsulan = colPeriode >= 0 && row[colPeriode] ? row[colPeriode].trim() : 'Periode 17 Agustus';
    const status = colStatus >= 0 && row[colStatus] ? row[colStatus].trim() : 'Dalam Proses Verifikasi';

    records.push({
      id: `sheet-${i}-${rawNip}`,
      nip: rawNip,
      nama,
      pangkatGol,
      jabatan,
      usulSlks,
      tahunMengusulkan,
      periodeTahunUsulan,
      status
    });
  }

  return records;
}

/**
 * Generate CSV template string dengan 8 kolom standar yang diminta pengguna
 */
export function generateSlksTemplateCsv(): string {
  const headers = [
    'NIP',
    'NAMA',
    'PANGKAT/GOL',
    'JABATAN',
    'USUL SLKS',
    'TAHUN MENGUSULKAN',
    'PERIODE TAHUN USULAN',
    'STATUS'
  ];

  const sampleRows = [
    [
      '196804121992031004',
      'Dr. Ir. H. Bambang Sutrisno, M.Si.',
      'Pembina Utama (IV/e)',
      'Sekretaris Daerah',
      'SLKS 30 Tahun (Emas)',
      '2025',
      'Periode 17 Agustus 2025',
      'Sudah Terbit SK Keppres RI No. 81/TK/2025'
    ],
    [
      '197609252002122003',
      'Dra. Hj. Sri Wahyuni, M.Pd.',
      'Pembina Tk. I (IV/b)',
      'Kepala Bidang Pembinaan Ketenagaan',
      'SLKS 20 Tahun (Perak)',
      '2026',
      'Periode 17 Agustus 2026',
      'Verifikasi BKN (Disetujui)'
    ],
    [
      '198703142011011005',
      'Ahmad Fauzi, S.Kom., M.T.I.',
      'Penata Tk. I (III/d)',
      'Pranata Komputer Ahli Muda',
      'SLKS 10 Tahun (Perunggu)',
      '2026',
      'Periode Hari KORPRI 2026',
      'Proses Verifikasi Berkas Instansi'
    ]
  ];

  const csvLines = [
    headers.map(h => `"${h}"`).join(','),
    ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))
  ];

  return csvLines.join('\n');
}
