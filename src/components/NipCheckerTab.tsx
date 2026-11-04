import React, { useState, useEffect } from 'react';
import {
  Search,
  Copy,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { SlksProposalRecord } from '../types/asn';
import { formatNip } from '../utils/nipParser';

interface NipCheckerTabProps {
  asnRecords: SlksProposalRecord[];
  initialNip?: string;
  adminNotes?: string;
}

export const NipCheckerTab: React.FC<NipCheckerTabProps> = ({
  asnRecords,
  initialNip = '',
  adminNotes = ''
}) => {
  const [nipInput, setNipInput] = useState(initialNip || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialNip) {
      setNipInput(initialNip);
    }
  }, [initialNip]);

  const cleanNip = nipInput.replace(/\D/g, '');

  // Cari di database data pegawai berdasarkan NIP persis
  const matchedRecord = asnRecords.find(r => r.nip.replace(/\D/g, '') === cleanNip);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 18) {
      setNipInput(val);
    }
  };

  const handleCopy = () => {
    if (!matchedRecord) return;
    const text = `DATA USULAN SATYALANCANA KARYA SATYA:
STATUS: ${matchedRecord.status}
NIP: ${matchedRecord.nip}
NAMA: ${matchedRecord.nama}
PANGKAT/GOL: ${matchedRecord.pangkatGol}
JABATAN: ${matchedRecord.jabatan}
USUL SLKS: ${matchedRecord.usulSlks}
TAHUN MENGUSULKAN: ${matchedRecord.tahunMengusulkan}
PERIODE TAHUN USULAN: ${matchedRecord.periodeTahunUsulan}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Status badge styling helper
  const getStatusStyle = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s.includes('terbit') || s.includes('keppres') || s.includes('selesai') || s.includes('dianugerahi')) {
      return {
        bgBanner: 'bg-emerald-950 text-emerald-50 border-emerald-800',
        badge: 'bg-emerald-400 text-slate-950',
        label: 'Sudah Diterbitkan SK / Dianugerahi',
        accentBorder: 'border-emerald-500'
      };
    }
    if (s.includes('bkn') || s.includes('setmilpres') || s.includes('verifikasi')) {
      return {
        bgBanner: 'bg-blue-950 text-blue-50 border-blue-800',
        badge: 'bg-blue-400 text-slate-950',
        label: 'Dalam Proses Pemeriksaan & Verifikasi',
        accentBorder: 'border-blue-500'
      };
    }
    if (s.includes('perbaikan') || s.includes('tidak') || s.includes('tolak') || s.includes('catatan')) {
      return {
        bgBanner: 'bg-rose-950 text-rose-50 border-rose-800',
        badge: 'bg-rose-400 text-slate-950',
        label: 'Perlu Konfirmasi / Catatan Berkas',
        accentBorder: 'border-rose-500'
      };
    }
    return {
      bgBanner: 'bg-slate-900 text-white border-slate-700',
      badge: 'bg-amber-400 text-slate-950',
      label: 'Status Proses Usulan',
      accentBorder: 'border-amber-500'
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Box Input NIP Tanpa Spasi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Ketikkan NIP (18 Digit Angka Tanpa Spasi)
        </label>
        <div className="relative">
          <input
            type="text"
            value={cleanNip}
            onChange={handleInputChange}
            placeholder="Ketik NIP..."
            autoFocus
            className="w-full pl-4 pr-24 py-3.5 text-base sm:text-lg font-mono font-bold tracking-normal text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {cleanNip && (
              <button
                onClick={() => setNipInput('')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                Hapus
              </button>
            )}
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-200 text-slate-700 rounded-lg">
              {cleanNip.length}/18
            </span>
          </div>
        </div>

        {cleanNip.length > 0 && cleanNip.length < 18 && (
          <p className="text-xs text-slate-500 mt-2">
            Masukkan 18 angka NIP lengkap (sisa {18 - cleanNip.length} angka lagi).
          </p>
        )}
      </div>

      {/* Belum Ada Input */}
      {cleanNip.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 shadow-sm">
          <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Silakan ketikkan 18 angka NIP pegawai di atas.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sistem akan langsung menampilkan posisi status usulan Satyalancana Karya Satya.
          </p>
        </div>
      )}

      {/* NIP 18 Digit Ditemukan: DITONJOLKAN STATUSNYA SAMPAI MANA */}
      {cleanNip.length === 18 && matchedRecord && (
        <div className="space-y-4">
          {/* BANNER UTAMA STATUS (Sangat Ditonjolkan) */}
          {(() => {
            const style = getStatusStyle(matchedRecord.status);
            return (
              <div className={`p-6 sm:p-7 rounded-2xl border-2 shadow-md ${style.bgBanner} ${style.accentBorder}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-300 block font-medium">
                        Posisi Status Usulan Terkini:
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 leading-snug">
                        {matchedRecord.status}
                      </h2>
                    </div>

                    {matchedRecord.keterangan && (
                      <p className="text-xs text-slate-300/90 pt-1">
                        Keterangan: {matchedRecord.keterangan}
                      </p>
                    )}
                  </div>

                  {/* Tombol Aksi Salin & Cetak */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 no-print">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-white/20"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Tersalin' : 'Salin Data'}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Rincian Seluruh Data Pegawai */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Rincian Data Pegawai & Usulan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* NIP (Tanpa Spasi) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  NIP
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block mt-1 tracking-normal">
                  {matchedRecord.nip}
                </span>
              </div>

              {/* NAMA */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  NAMA
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-1">
                  {matchedRecord.nama}
                </span>
              </div>

              {/* PANGKAT/GOL */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  PANGKAT/GOL
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-1">
                  {matchedRecord.pangkatGol}
                </span>
              </div>

              {/* JABATAN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  JABATAN
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-1">
                  {matchedRecord.jabatan}
                </span>
              </div>

              {/* USUL SLKS */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  USUL SLKS
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {matchedRecord.usulSlks}
                </span>
              </div>

              {/* TAHUN MENGUSULKAN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  TAHUN MENGUSULKAN
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {matchedRecord.tahunMengusulkan}
                </span>
              </div>

              {/* PERIODE TAHUN USULAN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  PERIODE TAHUN USULAN
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {matchedRecord.periodeTahunUsulan}
                </span>
              </div>

              {/* STATUS */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                  STATUS
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {matchedRecord.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NIP 18 Digit Tetapi Tidak Ditemukan di Database */}
      {cleanNip.length === 18 && !matchedRecord && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Data NIP Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            NIP <span className="font-mono font-bold text-slate-800">{cleanNip}</span> tidak terdaftar dalam basis data usulan Satyalancana Karya Satya.
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Pastikan NIP yang dimasukkan sudah benar atau hubungi pengelola kepegawaian.
          </p>
        </div>
      )}

      {/* Catatan Manual / Pengumuman Pengelola (Jika diisi) */}
      {adminNotes && (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">Pemberitahuan Pengelola:</span>
            <p className="mt-0.5 leading-relaxed">{adminNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
