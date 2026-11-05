import React, { useState, useEffect } from 'react';
import {
  Award,
  Shield,
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { SlksProposalRecord } from './types/asn';
import { DEFAULT_ASN_RECORDS } from './data/defaultAsnData';
import { APP_CONFIG } from './config/sheetConfig';
import { NipCheckerTab } from './components/NipCheckerTab';
import {
  convertToGoogleSheetsCsvUrl,
  parseCsv,
  mapCsvToSlksRecords
} from './utils/googleSheetsSync';

const LOCAL_STORAGE_KEY = 'sip_slks_asn_records_v1';
const LOCAL_STORAGE_SHEET_URL = 'sip_slks_sheet_url_v1';
const LOCAL_STORAGE_NOTES = 'sip_slks_admin_notes_v1';

export default function App() {
  const [sheetUrl] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_SHEET_URL) || APP_CONFIG.googleSheetUrl;
  });

  const [adminNotes] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_NOTES) || APP_CONFIG.defaultNotes;
  });

  // Data ASN (Menggunakan 244 data nyata dari Google Sheet yang terpasang permanen)
  const [asnRecords, setAsnRecords] = useState<SlksProposalRecord[]>(DEFAULT_ASN_RECORDS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');

  // Otomatis sinkronkan langsung dengan Google Sheet setiap kali web dibuka oleh siapa saja
  useEffect(() => {
    let isMounted = true;
    const fetchLiveSheet = async () => {
      try {
        setIsSyncing(true);
        const targetUrl = sheetUrl || APP_CONFIG.googleSheetUrl;
        const csvUrl = convertToGoogleSheetsCsvUrl(targetUrl);
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE html>') && !text.includes('Sign in to your Google Account')) {
            const rows = parseCsv(text);
            const liveRecords = mapCsvToSlksRecords(rows);
            if (liveRecords.length > 0 && isMounted) {
              setAsnRecords(liveRecords);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(liveRecords));
              const now = new Date();
              setLastSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            }
          }
        }
      } catch (err) {
        console.warn('Auto-fetch Google Sheet:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    fetchLiveSheet();
    return () => {
      isMounted = false;
    };
  }, [sheetUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Header Modern Tanpa Tab */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Judul Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 text-amber-400 flex items-center justify-center font-bold shadow-md shadow-slate-950/10 border border-slate-700/40">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 block leading-tight">
                SIP-SLKS
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-none mt-0.5">
                Sistem Informasi Satyalancana Karya Satya
              </span>
            </div>
          </div>

          {/* Indikator Status Data Live Google Sheet */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-[11px] font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Google Sheet Terhubung</span>
              <span className="font-mono font-bold text-slate-900">
                {asnRecords.length} Data
              </span>
              {isSyncing && (
                <RefreshCw className="w-3 h-3 text-slate-400 animate-spin ml-0.5" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Konten Utama 1 Halaman */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <NipCheckerTab
          asnRecords={asnRecords}
          adminNotes={adminNotes}
        />
      </main>

      {/* Footer Minimalis & Bersih */}
      <footer className="no-print bg-white/70 backdrop-blur border-t border-slate-200/80 mt-auto py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">
              SIP-SLKS · Layanan Pemeriksaan Usulan Satyalancana Karya Satya
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            PP No. 35 Tahun 2010 Republik Indonesia
          </span>
        </div>
      </footer>
    </div>
  );
}
