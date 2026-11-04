export interface SlksProposalRecord {
  id: string;
  nip: string;                // NIP (18 digit)
  nama: string;               // NAMA
  pangkatGol: string;         // PANGKAT/GOL
  jabatan: string;            // JABATAN
  usulSlks: string;           // USUL SLKS (10 Tahun / 20 Tahun / 30 Tahun)
  tahunMengusulkan: string;   // TAHUN MENGUSULKAN
  periodeTahunUsulan: string; // PERIODE TAHUN USULAN
  status: string;             // STATUS
  keterangan?: string;
}

export interface ParsedNipInfo {
  isValid: boolean;
  rawNip: string;
  formattedNip: string;
  tglLahir?: string;
  usiaTahun?: number;
  jenisKelamin?: 'L' | 'P';
  genderLabel?: string;
  tmtCpns?: string;
  tmtTahun?: number;
  tmtBulan?: number;
  masaKerjaTahun?: number;
  masaKerjaBulan?: number;
  error?: string;
}
