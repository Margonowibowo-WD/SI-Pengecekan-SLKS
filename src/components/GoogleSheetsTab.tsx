import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  ClipboardPaste,
  Save,
  FileText
} from 'lucide-react';
import { SlksProposalRecord } from '../types/asn';
import {
  convertToGoogleSheetsCsvUrl,
  parseCsv,
  mapCsvToSlksRecords,
  generateSlksTemplateCsv
} from '../utils/googleSheetsSync';
import { DEFAULT_USER_SHEET_URL } from '../data/defaultAsnData';

interface GoogleSheetsTabProps {
  asnRecords: SlksProposalRecord[];
  onUpdateRecords: (records: SlksProposalRecord[]) => void;
  onResetDefault: () => void;
  sheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
  adminPassword: string;
  onUpdateAdminPassword: (newPass: string) => void;
  adminNotes: string;
  onUpdateAdminNotes: (notes: string) => void;
}

export const GoogleSheetsTab: React.FC<GoogleSheetsTabProps> = ({
  asnRecords,
  onUpdateRecords,
  onResetDefault,
  sheetUrl,
  onSaveSheetUrl,
  adminPassword,
  onUpdateAdminPassword,
  adminNotes,
  onUpdateAdminNotes
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [inputUrl, setInputUrl] = useState(sheetUrl || DEFAULT_USER_SHEET_URL);
  const [inputNotes, setInputNotes] = useState(adminNotes || '');
  const [pasteData, setPasteData] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: ''
  });

  // State ubah password
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changePassStatus, setChangePassStatus] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      setIsUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Password salah. Silakan coba lagi.');
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordChange(false);
    setShowPasteBox(false);
  };

  const handleSyncFromUrl = async () => {
    if (!inputUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Masukkan tautan Google Sheets terlebih dahulu.'
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus({ type: 'idle', message: '' });

    try {
      const csvExportUrl = convertToGoogleSheetsCsvUrl(inputUrl);
      const res = await fetch(csvExportUrl);

      if (!res.ok) {
        throw new Error(`Google Sheets mengembalikan kode HTTP ${res.status}.`);
      }

      const csvText = await res.text();

      // Jika Google Sheets mengembalikan halaman HTML sign-in (belum disetel 'Anyone with link')
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Sign in to your Google Account')) {
        throw new Error(
          'Spreadsheet ini belum disetel "Siapa saja yang memiliki link dapat melihat" atau memerlukan login akun Google Anda. Buka Google Sheet > Bagikan (Share) > Ubah Akses Umum ke "Siapa saja dengan link". Anda juga bisa menggunakan tombol "Tempel/Paste Data Langsung" di bawah ini!'
        );
      }

      const parsedRows = parseCsv(csvText);

      if (parsedRows.length <= 1) {
        throw new Error('Spreadsheet kosong atau tidak memiliki baris data.');
      }

      const records = mapCsvToSlksRecords(parsedRows);
      if (records.length === 0) {
        throw new Error('Kolom NIP tidak ditemukan pada spreadsheet. Pastikan terdapat kolom NIP.');
      }

      onUpdateRecords(records);
      onSaveSheetUrl(inputUrl);
      setSyncStatus({
        type: 'success',
        message: `Berhasil terhubung! ${records.length} data usulan pegawai telah dimuat dari Google Sheet.`
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Gagal membaca spreadsheet.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPastedData = () => {
    if (!pasteData.trim()) {
      alert('Tempelkan teks data terlebih dahulu.');
      return;
    }

    try {
      const parsedRows = parseCsv(pasteData);
      const records = mapCsvToSlksRecords(parsedRows);

      if (records.length === 0) {
        alert('Gagal mendeteksi kolom. Pastikan baris pertama berisi header: NIP, NAMA, PANGKAT/GOL, JABATAN, USUL SLKS, TAHUN MENGUSULKAN, PERIODE TAHUN USULAN, STATUS.');
        return;
      }

      onUpdateRecords(records);
      setShowPasteBox(false);
      setPasteData('');
      setSyncStatus({
        type: 'success',
        message: `Berhasil mengimpor ${records.length} data usulan pegawai dari teks yang ditempel!`
      });
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateSlksTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'format_usulan_slks_8_kolom.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveNotes = () => {
    onUpdateAdminNotes(inputNotes);
    alert('Catatan pemberitahuan berhasil disimpan.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== adminPassword) {
      setChangePassStatus('Password lama salah.');
      return;
    }
    if (newPass.length < 4) {
      setChangePassStatus('Password minimal 4 karakter.');
      return;
    }
    onUpdateAdminPassword(newPass);
    setCurrentPass('');
    setNewPass('');
    setShowPasswordChange(false);
    setChangePassStatus('');
    alert('Password berhasil diperbarui.');
  };

  const maskUrl = (url: string) => {
    if (!url) return '(Belum dihubungkan)';
    return url.replace(/(spreadsheets\/d\/)([a-zA-Z0-9-_]+)/, '$1••••••••••••');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tampilan Terkunci */}
      {!isUnlocked ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <Lock className="w-6 h-6 text-slate-700" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            Koneksi Google Sheet (Khusus Pengelola)
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Halaman ini diproteksi password untuk menjaga kerahasiaan tautan Google Sheet Anda dari publik.
          </p>

          {/* Status Data Aman */}
          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status Data Saat Ini:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terhubung ({asnRecords.length} Data Pegawai)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tautan Spreadsheet:</span>
              <span className="font-mono text-slate-600 truncate max-w-[260px]">
                {maskUrl(sheetUrl || DEFAULT_USER_SHEET_URL)}
              </span>
            </div>
          </div>

          {/* Form Masukkan Password */}
          <form onSubmit={handleUnlock} className="max-w-sm mx-auto space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan Password Pengelola..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-rose-600 font-medium">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Buka Kunci Pengaturan
            </button>
            <p className="text-[11px] text-slate-400">
              *Password default: <span className="font-mono font-semibold text-slate-600">admin123</span>
            </p>
          </form>
        </div>
      ) : (
        /* Tampilan Mode Pengelola */
        <div className="space-y-6">
          {/* Header Buka Kunci */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Unlock className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-bold text-sm">Mode Pengelola Aktif</h4>
                <p className="text-[11px] text-slate-300">
                  Ubah tautan spreadsheet, sinkronkan data, atau perbarui catatan manual.
                </p>
              </div>
            </div>
            <button
              onClick={handleLockAgain}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Kunci Kembali
            </button>
          </div>

          {/* Form Link Google Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Tautan Google Sheets
                </h4>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer"
                title="Format: NIP, NAMA, PANGKAT/GOL, JABATAN, USUL SLKS, TAHUN MENGUSULKAN, PERIODE TAHUN USULAN, STATUS"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format 8 Kolom</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Format 8 Kolom yang dibaca: <br />
              <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-semibold">
                NIP · NAMA · PANGKAT/GOL · JABATAN · USUL SLKS · TAHUN MENGUSULKAN · PERIODE TAHUN USULAN · STATUS
              </code>
            </p>

            <div className="space-y-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-slate-900 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleSyncFromUrl}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Menghubungkan...' : 'Sinkronkan Google Sheets'}</span>
                </button>

                <button
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>{showPasteBox ? 'Tutup Tempel' : 'Tempel / Paste Data Manual'}</span>
                </button>
              </div>
            </div>

            {/* Kotak Tempel / Paste Langsung dari Google Sheets */}
            {showPasteBox && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Tempel Data Langsung (Salin dari Google Sheets / Excel):
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Buka Google Sheet Anda, blok seluruh tabel (termasuk baris judul NIP, NAMA, dst), tekan <strong>Ctrl + C</strong>, lalu tempelkan (<strong>Ctrl + V</strong>) di kotak bawah ini:
                </p>
                <textarea
                  rows={4}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder={`NIP\tNAMA\tPANGKAT/GOL\tJABATAN\tUSUL SLKS\tTAHUN MENGUSULKAN\tPERIODE TAHUN USULAN\tSTATUS\n198503152010011002\tAhmad Dahlan\tPenata (III/c)\tPranata Komputer\tSLKS 10 Tahun\t2026\tPeriode 17 Agustus 2026\tVerifikasi BKN`}
                  className="w-full p-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                />
                <button
                  onClick={handleProcessPastedData}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Proses & Simpan Data
                </button>
              </div>
            )}

            {syncStatus.message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* Form Catatan / Pedoman Manual */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Pedoman / Pengumuman yang Disampaikan Manual
              </h4>
            </div>

            <p className="text-xs text-slate-500">
              Tulis petunjuk manual yang ingin Anda tampilkan kepada pegawai saat mereka memeriksa NIP.
            </p>

            <textarea
              rows={3}
              value={inputNotes}
              onChange={(e) => setInputNotes(e.target.value)}
              placeholder="Contoh: Berkas fisik disampaikan secara manual ke Subbag Kepegawaian sebelum tanggal..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-slate-900 focus:outline-none"
            />

            <button
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Catatan</span>
            </button>
          </div>

          {/* Form Ganti Password */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-slate-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Ganti Password Pengelola
                </h4>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {showPasswordChange ? 'Tutup' : 'Ubah Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Password Saat Ini</label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Password Baru</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {changePassStatus && (
                  <p className="text-xs text-rose-600">{changePassStatus}</p>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Simpan Password Baru
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
