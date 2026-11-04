import React, { useState, useEffect } from 'react';
import {
  Search,
  Lock,
  Award,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { SlksProposalRecord } from './types/asn';
import { DEFAULT_ASN_RECORDS, DEFAULT_USER_SHEET_URL } from './data/defaultAsnData';
import { NipCheckerTab } from './components/NipCheckerTab';
import { GoogleSheetsTab } from './components/GoogleSheetsTab';

const LOCAL_STORAGE_KEY = 'sip_slks_asn_records_v1';
const LOCAL_STORAGE_SHEET_URL = 'sip_slks_sheet_url_v1';
const LOCAL_STORAGE_PIN = 'sip_slks_admin_pin_v1';
const LOCAL_STORAGE_NOTES = 'sip_slks_admin_notes_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'checker' | 'sheets'>('checker');
  const [selectedNip, setSelectedNip] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_SHEET_URL) || DEFAULT_USER_SHEET_URL;
  });

  // Password admin untuk proteksi link Google Sheet (Default: admin123)
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_PIN) || 'admin123';
  });

  // Catatan manual dari admin untuk pegawai
  const [adminNotes, setAdminNotes] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_NOTES) || 'Pemberitahuan berkas dan syarat usulan Satyalancana disampaikan secara manual oleh Pengelola Kepegawaian.';
  });

  // Data ASN
  const [asnRecords, setAsnRecords] = useState<SlksProposalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ASN_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(asnRecords));
    } catch (e) {
      console.error(e);
    }
  }, [asnRecords]);

  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_SHEET_URL);
      if (savedUrl) setSheetUrl(savedUrl);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveSheetUrl = (url: string) => {
    setSheetUrl(url);
    try {
      localStorage.setItem(LOCAL_STORAGE_SHEET_URL, url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    try {
      localStorage.setItem(LOCAL_STORAGE_PIN, newPass);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAdminNotes = (notes: string) => {
    setAdminNotes(notes);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES, notes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDefault = () => {
    setAsnRecords(DEFAULT_ASN_RECORDS);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Sederhana & Bersih */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Judul */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                SIP-SLKS
              </span>
              <span className="text-[10px] text-slate-500 block leading-none">
                Cek Satyalancana Karya Satya
              </span>
            </div>
          </div>

          {/* 2 Tab Sederhana */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('checker')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checker'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek NIP</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sheets'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Google Sheet</span>
              <Lock className="w-3 h-3 text-slate-400" />
            </button>
          </nav>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'checker' && (
          <NipCheckerTab
            asnRecords={asnRecords}
            initialNip={selectedNip}
            adminNotes={adminNotes}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsTab
            asnRecords={asnRecords}
            onUpdateRecords={setAsnRecords}
            onResetDefault={handleResetDefault}
            sheetUrl={sheetUrl}
            onSaveSheetUrl={handleSaveSheetUrl}
            adminPassword={adminPassword}
            onUpdateAdminPassword={handleUpdateAdminPassword}
            adminNotes={adminNotes}
            onUpdateAdminNotes={handleUpdateAdminNotes}
          />
        )}
      </main>

      {/* Footer Minimalis */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] text-slate-400">
          <span>SIP-SLKS · Layanan Pemeriksaan Satyalancana Karya Satya</span>
          <span>PP No. 35 Tahun 2010</span>
        </div>
      </footer>
    </div>
  );
}
