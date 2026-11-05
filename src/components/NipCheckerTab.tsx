import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  User,
  Award,
  Calendar,
  Briefcase,
  Layers,
  FileCheck2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SlksProposalRecord } from '../types/asn';

interface NipCheckerTabProps {
  asnRecords: SlksProposalRecord[];
  initialQuery?: string;
  adminNotes?: string;
}

export const NipCheckerTab: React.FC<NipCheckerTabProps> = ({
  asnRecords,
  initialQuery = '',
  adminNotes = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRecord, setSelectedRecord] = useState<SlksProposalRecord | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const cleanQuery = searchQuery.trim();
  const isNumericOnly = /^\d+$/.test(cleanQuery);

  // Live filter baik berdasarkan NIP maupun Nama
  const searchResults = useMemo(() => {
    if (!cleanQuery) return [];

    const qLower = cleanQuery.toLowerCase();
    const qDigits = cleanQuery.replace(/\D/g, '');

    return asnRecords.filter((record) => {
      // Pencarian angka (NIP)
      if (qDigits && record.nip.includes(qDigits)) {
        return true;
      }
      // Pencarian huruf (Nama Lengkap)
      if (record.nama.toLowerCase().includes(qLower)) {
        return true;
      }
      return false;
    });
  }, [cleanQuery, asnRecords]);

  // Otomatis tentukan record terpilih:
  // 1. Jika query persis 18 digit NIP dan cocok
  // 2. Atau jika hasil pencarian tepat 1 orang
  // 3. Atau record yang dipilih pengguna secara manual
  const activeRecord = useMemo(() => {
    if (cleanQuery.length === 18 && isNumericOnly) {
      const exactNip = asnRecords.find((r) => r.nip === cleanQuery);
      if (exactNip) return exactNip;
    }

    if (selectedRecord && searchResults.some((r) => r.id === selectedRecord.id)) {
      return selectedRecord;
    }

    if (searchResults.length === 1) {
      return searchResults[0];
    }

    return null;
  }, [cleanQuery, isNumericOnly, asnRecords, searchResults, selectedRecord]);

  const handleSelectPerson = (record: SlksProposalRecord) => {
    setSelectedRecord(record);
    // Jika mencari via nama, jangan hapus teks agar pengguna tetap tahu konteksnya
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedRecord(null);
  };

  // Status visual color configuration
  const getStatusTheme = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('terbit') || s.includes('keppres') || s.includes('selesai') || s.includes('dianugerahi')) {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900',
        badgeBg: 'bg-emerald-400 text-slate-950',
        badgeLabel: 'SK Keppres Terbit / Dianugerahi',
        glow: 'border-emerald-500/40 shadow-emerald-950/20',
        accentText: 'text-emerald-300'
      };
    }
    if (s.includes('perbaikan') || s.includes('tolak') || s.includes('catatan') || s.includes('disiplin')) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950',
        badgeBg: 'bg-rose-400 text-slate-950',
        badgeLabel: 'Perlu Konfirmasi / Catatan',
        glow: 'border-rose-500/40 shadow-rose-950/20',
        accentText: 'text-rose-300'
      };
    }
    // Default: Dalam Proses Usulan (Kemendagri / BKN / Setmilpres)
    return {
      cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950',
      badgeBg: 'bg-amber-400 text-slate-950',
      badgeLabel: 'Dalam Proses Verifikasi & Usulan',
      glow: 'border-amber-400/30 shadow-slate-950/30',
      accentText: 'text-amber-300'
    };
  };

  return (
    <div className="space-y-6">
      {/* Search Header Hero - Minimalis, Elegan, Modern */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm transition-all">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Pemeriksaan Status Satyalancana Karya Satya</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lacak Posisi Usulan Satyalancana
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Ketik <span className="font-semibold text-slate-800">18 Digit NIP</span> atau ketik <span className="font-semibold text-slate-800">Nama Pegawai</span> untuk memeriksa posisi status usulan tanda kehormatan.
          </p>

          {/* Input Pencarian Universal (NIP atau Nama) */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedRecord(null);
                }}
                placeholder="Ketik NIP atau ketik Nama Pegawai (contoh: Novizar, 196711...)"
                autoFocus
                className="w-full pl-12 pr-20 py-4 text-base sm:text-lg font-medium text-slate-900 bg-slate-50/90 hover:bg-white focus:bg-white border-2 border-slate-200/90 focus:border-slate-900 rounded-2xl focus:outline-none transition-all shadow-inner"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Kosongkan pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <span className="text-[11px] font-mono font-bold bg-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg">
                  {cleanQuery ? `${searchResults.length} Data` : `${asnRecords.length} Data`}
                </span>
              </div>
            </div>

            {/* Helper teks ringkas */}
            {cleanQuery && !activeRecord && searchResults.length > 1 && (
              <p className="text-left text-xs font-semibold text-slate-500 mt-2.5 flex items-center gap-1.5">
                <span>Ditemukan {searchResults.length} pegawai yang cocok. Pilih salah satu di bawah:</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Pilihan Jika Menemukan Banyak Hasil Nama */}
      {cleanQuery && searchResults.length > 1 && !activeRecord && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
          <div className="p-3.5 bg-slate-50/70 text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Daftar Pegawai Ditemukan ({searchResults.length})</span>
            <span className="text-[11px] font-normal lowercase text-slate-400">Klik untuk melihat status usulan</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((rec) => (
              <div
                key={rec.id}
                onClick={() => handleSelectPerson(rec)}
                className="p-4 hover:bg-amber-50/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-amber-900 transition-colors truncate">
                      {rec.nama}
                    </span>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {rec.nip}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {rec.pangkatGol} · {rec.jabatan}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-1 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200">
                    {rec.usulSlks}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jika Belum Mengetik Apapun */}
      {!cleanQuery && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 shadow-sm">
          <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Ketik NIP atau Nama Pegawai untuk memulai pencarian
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Data terhubung langsung dengan basis data usulan Satyalancana ({asnRecords.length} data pegawai).
          </p>
        </div>
      )}

      {/* Jika Tidak Ditemukan Hasil */}
      {cleanQuery && searchResults.length === 0 && (
        <div className="bg-white rounded-2xl border border-rose-200/80 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Data Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            Tidak ditemukan pegawai dengan kata kunci <span className="font-semibold text-slate-900">"{cleanQuery}"</span> dalam daftar usulan Satyalancana Karya Satya.
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Pastikan NIP (18 angka) atau ejaan nama sudah sesuai.
          </p>
        </div>
      )}

      {/* TAMPILAN DATA & STATUS TERKINI YANG SANGAT DITONJOLKAN */}
      {activeRecord && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Card Status Hero yang Sangat Ditonjolkan */}
          {(() => {
            const theme = getStatusTheme(activeRecord.status);
            return (
              <div
                className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl border-2 text-white shadow-xl transition-all ${theme.cardBg} ${theme.glow}`}
              >
                {/* Visual watermark icon background */}
                <Award className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 text-white pointer-events-none" />

                <div className="relative space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${theme.badgeBg}`}
                    >
                      {theme.badgeLabel}
                    </span>

                    {/* Jika hasil filter banyak, tampilkan tombol kembali ke list */}
                    {searchResults.length > 1 && (
                      <button
                        onClick={() => setSelectedRecord(null)}
                        className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Pilih nama lain ({searchResults.length})
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                      Posisi Status Usulan Terkini
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 leading-tight text-white">
                      {activeRecord.status}
                    </h1>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300/90 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Periode: <strong className="text-white font-semibold">{activeRecord.periodeTahunUsulan}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tahun Usulan: <strong className="text-white font-semibold">{activeRecord.tahunMengusulkan}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Rincian Seluruh Data Pegawai (Grid Modern) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                <span>Rincian Data Usulan Pegawai</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* 1. NIP */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  NIP Pegawai
                </span>
                <span className="text-base font-mono font-extrabold text-slate-900 block mt-1 tracking-tight">
                  {activeRecord.nip}
                </span>
              </div>

              {/* 2. NAMA */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Lengkap
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-1 leading-snug">
                  {activeRecord.nama}
                </span>
              </div>

              {/* 3. PANGKAT/GOL */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pangkat / Golongan
                </span>
                <span className="text-sm font-bold text-slate-800 block mt-1">
                  {activeRecord.pangkatGol}
                </span>
              </div>

              {/* 4. JABATAN */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jabatan & Unit Kerja
                </span>
                <span className="text-xs font-medium text-slate-800 block mt-1 leading-relaxed">
                  {activeRecord.jabatan}
                </span>
              </div>

              {/* 5. USUL SLKS */}
              <div className="p-4 bg-gradient-to-br from-amber-50/90 to-yellow-50/50 rounded-2xl border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Tingkatan Usulan SLKS
                </span>
                <span className="text-base font-black text-amber-950 block mt-1">
                  {activeRecord.usulSlks}
                </span>
              </div>

              {/* 6. TAHUN MENGUSULKAN */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tahun Pengusulan
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-1">
                  {activeRecord.tahunMengusulkan}
                </span>
              </div>

              {/* 7. PERIODE TAHUN USULAN */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Periode Tahun Usulan
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-1">
                  {activeRecord.periodeTahunUsulan}
                </span>
              </div>

              {/* 8. STATUS */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Status Terkini
                </span>
                <span className="text-sm font-extrabold text-white block mt-1">
                  {activeRecord.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catatan / Pengumuman Pengelola Jika Ada */}
      {adminNotes && (
        <div className="p-4 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">Pemberitahuan Pengelola:</span>
            <p className="mt-0.5 leading-relaxed text-slate-600">{adminNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
