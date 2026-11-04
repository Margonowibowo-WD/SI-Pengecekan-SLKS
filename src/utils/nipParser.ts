import { ParsedNipInfo } from '../types/asn';

/**
 * Mengembalikan NIP polos tanpa spasi sesuai permintaan pengguna:
 * contoh: 198503152010011002
 */
export function formatNip(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Mengurai NIP 18 digit resmi ASN:
 * - 8 digit pertama: Tgl Lahir (YYYYMMDD)
 * - 6 digit kedua: TMT CPNS (YYYYMM)
 * - 1 digit ketiga: Jenis Kelamin (1 = Laki-laki, 2 = Perempuan)
 * - 3 digit terakhir: Nomor Urut
 */
export function parseNip(nipInput: string): ParsedNipInfo {
  const clean = nipInput.replace(/\D/g, '');

  if (clean.length !== 18) {
    return {
      isValid: false,
      rawNip: clean,
      formattedNip: clean,
      error: `Panjang NIP ${clean.length} digit (NIP harus 18 digit angka)`
    };
  }

  const thLahir = parseInt(clean.slice(0, 4), 10);
  const blnLahir = parseInt(clean.slice(4, 6), 10);
  const tglLahir = parseInt(clean.slice(6, 8), 10);

  const thTmt = parseInt(clean.slice(8, 12), 10);
  const blnTmt = parseInt(clean.slice(12, 14), 10);

  const genderCode = clean.slice(14, 15);
  const jenisKelamin: 'L' | 'P' = genderCode === '2' ? 'P' : 'L';
  const genderLabel = genderCode === '2' ? 'Perempuan' : 'Laki-laki';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let usiaTahun = currentYear - thLahir;
  if (currentMonth < blnLahir || (currentMonth === blnLahir && now.getDate() < tglLahir)) {
    usiaTahun--;
  }

  let masaKerjaTahun = currentYear - thTmt;
  let masaKerjaBulan = currentMonth - blnTmt;

  if (masaKerjaBulan < 0) {
    masaKerjaTahun--;
    masaKerjaBulan += 12;
  }

  if (masaKerjaTahun < 0) {
    masaKerjaTahun = 0;
    masaKerjaBulan = 0;
  }

  return {
    isValid: true,
    rawNip: clean,
    formattedNip: clean,
    usiaTahun,
    jenisKelamin,
    genderLabel,
    tmtTahun: thTmt,
    tmtBulan: blnTmt,
    masaKerjaTahun,
    masaKerjaBulan
  };
}
