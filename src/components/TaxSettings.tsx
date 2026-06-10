import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  HelpCircle, 
  Save, 
  Calculator, 
  RefreshCw, 
  Info,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

// 1. Define interface for our Tax Settings values
export interface TaxSettingsData {
  ppnPengurusan: number;      // e.g., 12 for 12%
  dppMultiplierRaw: string;   // e.g., "11/12"
  ppnTrucking: number;        // e.g., 1.1 for 1.1%
  pph23: number;              // e.g., 2 for 2%
}

// Default fallback settings
const DEFAULT_TAX_SETTINGS: TaxSettingsData = {
  ppnPengurusan: 12,
  dppMultiplierRaw: '11/12',
  ppnTrucking: 1.1,
  pph23: 2
};

// 2. LOGIKA KALKULATOR PAJAK (SMART BILLING)
export function calculateTax(
  dppAmount: number, 
  category: 'EMKL' | 'PPJK' | 'TRUCKING' | 'REIMBURSEMENT' | string, 
  taxSettings: TaxSettingsData = DEFAULT_TAX_SETTINGS
) {
  // Parse DPP Multiplier Fraction (e.g. "11/12")
  let multiplier = 1;
  const rawMult = taxSettings.dppMultiplierRaw || '11/12';
  
  if (rawMult.includes('/')) {
    const parts = rawMult.split('/');
    const textNum = parseFloat(parts[0]);
    const textDen = parseFloat(parts[1]);
    if (!isNaN(textNum) && !isNaN(textDen) && textDen !== 0) {
      multiplier = textNum / textDen;
    }
  } else {
    const parsed = parseFloat(rawMult);
    if (!isNaN(parsed)) {
      multiplier = parsed;
    }
  }

  const categoryUpper = category.toUpperCase().trim();
  let ppn = 0;
  let pph23Val = 0;
  let calculationNoteStr = '';

  // Calculate PPN & PPh 23 according to rules
  if (categoryUpper === 'EMKL' || categoryUpper === 'PPJK') {
    ppn = multiplier * dppAmount * (taxSettings.ppnPengurusan / 100);
    calculationNoteStr = `PPN Jasa Pengurusan: (${rawMult}) * Rp ${dppAmount.toLocaleString('id-ID')} * ${taxSettings.ppnPengurusan}%`;
    pph23Val = dppAmount * (taxSettings.pph23 / 100);
  } else if (categoryUpper === 'TRUCKING') {
    ppn = dppAmount * (taxSettings.ppnTrucking / 100);
    calculationNoteStr = `PPN Jasa Trucking: Rp ${dppAmount.toLocaleString('id-ID')} * ${taxSettings.ppnTrucking}%`;
    pph23Val = dppAmount * (taxSettings.pph23 / 100);
  } else if (categoryUpper === 'REIMBURSEMENT') {
    ppn = 0;
    pph23Val = 0;
    calculationNoteStr = `Reimbursement (Bebas Pajak / Dana Talangan Murni)`;
  } else {
    ppn = dppAmount * (taxSettings.ppnPengurusan / 100);
    pph23Val = dppAmount * (taxSettings.pph23 / 100);
    calculationNoteStr = `Fallback Standard Calculation: Rp ${dppAmount.toLocaleString('id-ID')} * ${taxSettings.ppnPengurusan}%`;
  }

  return {
    dpp: dppAmount,
    multiplier,
    ppnRate: categoryUpper === 'EMKL' || categoryUpper === 'PPJK' ? taxSettings.ppnPengurusan : (categoryUpper === 'TRUCKING' ? taxSettings.ppnTrucking : 0),
    pph23Rate: categoryUpper === 'REIMBURSEMENT' ? 0 : taxSettings.pph23,
    ppn: Math.round(ppn),
    pph23: Math.round(pph23Val),
    netAmount: Math.round(dppAmount + ppn - pph23Val),
    formula: calculationNoteStr
  };
}

// Run Startup Simulation to client/developer console as requested
try {
  const simDPP = 1000000;
  const simResult = calculateTax(simDPP, 'EMKL', DEFAULT_TAX_SETTINGS);
  console.log("=== SIMULASI KALKULATOR PAJAK LOGISTIK SSL ===");
  console.log(`DPP Jasa Pengurusan (EMKL): Rp ${simDPP.toLocaleString('id-ID')}`);
  console.log(`Rumus PPN: (11/12) * DPP * ${DEFAULT_TAX_SETTINGS.ppnPengurusan}%`);
  console.log(`Hasil Perhitungan PPN: Rp ${simResult.ppn.toLocaleString('id-ID')}`);
  console.log(`PPh 23 (2%): Rp ${simResult.pph23.toLocaleString('id-ID')}`);
  console.log(`Net Tagihan: Rp ${simResult.netAmount.toLocaleString('id-ID')}`);
  console.log("=================================================");
} catch (e) {
  console.warn("Simulasi pajak gagal berjalan di console: ", e);
}

export default function TaxSettings() {
  const { parameters, addEntity, updateEntity } = useFirebase();
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form states with default fallbacks
  const [form, setForm] = useState<TaxSettingsData>(DEFAULT_TAX_SETTINGS);

  // Simulator Interactive States
  const [simDppInput, setSimDppInput] = useState<number>(1000000);
  const [simCategory, setSimCategory] = useState<string>('EMKL');

  // Load existing tax parameters from Firestore context if saved
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const ppnFF = parameters.find(p => p.id === 'TAX_PPN_FORWARDING' || p.key === 'TAX_PPN_FORWARDING');
      const dppMult = parameters.find(p => p.id === 'TAX_DPP_MULTIPLIER' || p.key === 'TAX_DPP_MULTIPLIER');
      const ppnTrk = parameters.find(p => p.id === 'TAX_PPN_TRUCKING' || p.key === 'TAX_PPN_TRUCKING');
      const pph23val = parameters.find(p => p.id === 'TAX_PPH_23' || p.key === 'TAX_PPH_23');

      setForm({
        ppnPengurusan: ppnFF ? Number(ppnFF.value) : DEFAULT_TAX_SETTINGS.ppnPengurusan,
        dppMultiplierRaw: dppMult ? String(dppMult.value) : DEFAULT_TAX_SETTINGS.dppMultiplierRaw,
        ppnTrucking: ppnTrk ? Number(ppnTrk.value) : DEFAULT_TAX_SETTINGS.ppnTrucking,
        pph23: pph23val ? Number(pph23val.value) : DEFAULT_TAX_SETTINGS.pph23,
      });
    } else {
      // Look up inside localStorage first for quick UI hot reload
      const local = localStorage.getItem('ssl_cached_tax_settings');
      if (local) {
        try {
          setForm(JSON.parse(local));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [parameters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'dppMultiplierRaw' ? value : Number(value)
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Save settings object securely in localStorage
      localStorage.setItem('ssl_cached_tax_settings', JSON.stringify(form));

      // Save as standard key-value parameters inside the parameters collection
      const paramsToSave = [
        { id: 'TAX_PPN_FORWARDING', key: 'TAX_PPN_FORWARDING', value: String(form.ppnPengurusan), category: 'PAJAK', description: 'PPN % Jasa Pengurusan / Freight Forwarding' },
        { id: 'TAX_DPP_MULTIPLIER', key: 'TAX_DPP_MULTIPLIER', value: String(form.dppMultiplierRaw), category: 'PAJAK', description: 'Faktor Pengali DPP Jasa Pengurusan' },
        { id: 'TAX_PPN_TRUCKING', key: 'TAX_PPN_TRUCKING', value: String(form.ppnTrucking), category: 'PAJAK', description: 'PPN Jasa Trucking / Logistik Efektif' },
        { id: 'TAX_PPH_23', key: 'TAX_PPH_23', value: String(form.pph23), category: 'PAJAK', description: 'Tarif Potongan PPh Pasal 23' },
      ];

      for (const p of paramsToSave) {
        try {
          await updateEntity('parameters', p.id, p);
        } catch (err) {
          await addEntity('parameters', p);
        }
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err: any) {
      console.error(err);
      alert("Simpan pengaturan pajak gagal: " + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live simulation calculations
  const simResult = calculateTax(simDppInput, simCategory, form);

  return (
    <div className="space-y-6" id="tax-settings-container">
      
      {/* Toast Notifikasi */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[250] bg-neutral-900 text-white rounded-2xl px-5 py-3.5 shadow-xl border border-neutral-800 font-extrabold text-xs flex items-center space-x-2 animate-bounce-once">
          <CheckCircle className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Konfigurasi Pajak & Parameter Berhasil Sinkron!</span>
        </div>
      )}

      {/* Main Grid: Form Setup vs Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANEL KIRI: PARAMETER FORM - BEAUTIFIED WITH CREXTIO GLASS STYLES */}
        <div className="bg-white/70 backdrop-blur-md rounded-[32px] border border-white/60 shadow-2xs p-8 space-y-6 glow-yellow-corner">
          <div className="border-b border-slate-200/50 pb-4">
            <h2 className="text-slate-950 font-black text-base tracking-tight flex items-center space-x-2">
              <span className="p-1 px-2 mb-1.5 inline-block text-[11px] rounded-lg bg-amber-400/10 border border-amber-400/20 text-[#997311] font-mono font-black">%</span>
              <span>Konfigurasi Pajak Logistik Indonesia</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
              Sesuaikan dasar perhitungan PPN (UU Coretax) & PPh 23 untuk tagihan EMKL, PPJK, dan Jasa Trucking.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* 1. PPN Freight Forwarding */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block flex items-center justify-between font-mono">
                <span>PPN Jasa Pengurusan / Freight Forwarding</span>
                <span className="text-[#997311] lowercase font-mono font-bold">Standard 12%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="ppnPengurusan"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={form.ppnPengurusan}
                  onChange={handleInputChange}
                  className="w-full bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/20 focus:border-[#fbc449] outline-none transition pr-10"
                />
                <span className="absolute right-4 top-3 text-xs font-black text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                Tarif PPN Utama atas penyerahan jasa pengurusan transportasi (Freight Forwarding).
              </p>
            </div>

            {/* 2. Faktor Pengali DPP Jasa Pengurusan */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block flex items-center justify-between font-mono">
                <span>Faktor Pengali DPP Jasa Pengurusan (Fraction)</span>
                <span className="text-[#997311] lowercase font-mono font-bold">11/12 DPP</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    name="dppMultiplierRaw"
                    placeholder="11/12"
                    required
                    value={form.dppMultiplierRaw}
                    onChange={handleInputChange}
                    className="w-full bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/20 focus:border-[#fbc449] outline-none transition font-mono"
                  />
                </div>
                <div className="bg-neutral-100/80 border border-slate-200/60 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-600 font-mono">
                  &asymp; {(evalMultiplier(form.dppMultiplierRaw) * 100).toFixed(2)}% DPP
                </div>
              </div>
              <p className="text-[10px] text-slate-455 leading-relaxed font-semibold">
                Faktor penetapan Dasar Pengenaan Pajak (DPP) nilai lain untuk menghitung PPN Jasa EMKL/PPJK.
              </p>
            </div>

            {/* 3. PPN Jasa Trucking */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block flex items-center justify-between font-mono">
                <span>PPN Jasa Trucking / Logistik</span>
                <span className="text-[#997311] lowercase font-mono font-bold">Effective 1.1%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="ppnTrucking"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={form.ppnTrucking}
                  onChange={handleInputChange}
                  className="w-full bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/20 focus:border-[#fbc449] outline-none transition pr-10"
                />
                <span className="absolute right-4 top-3 text-xs font-black text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[10px] text-slate-455 leading-relaxed font-semibold">
                Nilai PPN efektif untuk penyerahan jasa angkutan darat atau pengiriman barang / trucking.
              </p>
            </div>

            {/* 4. PPh 23 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block flex items-center justify-between font-mono">
                <span>PPh Pasal 23 (PPh 23)</span>
                <span className="text-[#997311] lowercase font-mono font-bold">Tarif Potong 2%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="pph23"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={form.pph23}
                  onChange={handleInputChange}
                  className="w-full bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/20 focus:border-[#fbc449] outline-none transition pr-10"
                />
                <span className="absolute right-4 top-3 text-xs font-black text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[10px] text-slate-455 leading-relaxed font-semibold">
                Tarif pemotongan pajak penghasilan atas jasa trucking/logistik dan jasa EMKL yang dipungut klien.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-neutral-900 border border-neutral-800 text-amber-400 hover:text-white hover:bg-black font-extrabold text-xs uppercase tracking-widest py-4 px-4 rounded-full shadow-xs inline-flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan Parameter...' : 'Simpan Parameter Pajak'}</span>
              </button>
            </div>

          </form>
        </div>


        {/* PANEL KANAN: LIVE CALCULATOR PLAYGROUND (SIMULATION) - DEEP CHIC DARK BENTO */}
        <div className="bg-neutral-900 border border-neutral-850 rounded-[32px] p-8 shadow-lg text-slate-100 flex flex-col justify-between space-y-6 glow-yellow-corner relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbc449]/5 rounded-full blur-[80px]" />

          <div className="space-y-4 relative z-10 w-full">
            <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 font-mono">
                  <Calculator className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Interactive Tax Simulator</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
                  Uji performa dan simulasikan hasil tagihan PPN & PPh secara <i>Real-Time</i> berdasarkan isian konfigurasi aktif.
                </p>
              </div>

              <span className="shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase font-mono tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/20">
                PRO-BUILD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Input DPP */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">DPP Nilai Jual (IDR)</label>
                <div className="relative border-b border-neutral-800 py-1">
                  <span className="absolute left-0 top-3 text-xs font-black text-[#fbc449] font-mono">Rp</span>
                  <input
                    type="text"
                    className="w-full bg-transparent border-0 pl-7 py-2.5 text-xs font-bold text-slate-100 placeholder-neutral-800 focus:outline-none focus:ring-0"
                    placeholder="1.000.000"
                    value={simDppInput ? simDppInput.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setSimDppInput(Number(digits) || 0);
                    }}
                  />
                </div>
              </div>

              {/* Kategori Jasa */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Kategori Transaksi</label>
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700/60 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 focus:ring-1 focus:ring-amber-500 cursor-pointer outline-none"
                >
                  <option value="EMKL">EMKL / Jasa PPJK / Forwarding</option>
                  <option value="TRUCKING">TRUCKING / Jasa Transportasi</option>
                  <option value="REIMBURSEMENT">REIMBURSEMENT (Talangan Murni)</option>
                </select>
              </div>

            </div>

            {/* BREAKDOWN BOX */}
            <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-5 space-y-4 font-mono">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider pb-2 border-b border-neutral-900 flex items-center justify-between">
                <span>Rincian Hasil Output Perhitungan</span>
                <span className="font-mono text-emerald-400 capitalize text-[9px] font-bold">SINKRON CORETAPE</span>
              </h4>

              <div className="space-y-3 text-xs font-medium">
                {/* DPP */}
                <div className="flex justify-between items-center text-slate-400">
                  <span>Dasar Pengenaan Pajak (DPP):</span>
                  <span className="font-extrabold text-slate-200">Rp {simDppInput.toLocaleString('id-ID')}</span>
                </div>

                {/* Formula note */}
                <div className="text-[10px] bg-neutral-900 p-3 rounded-xl text-amber-400/80 leading-relaxed font-semibold border border-neutral-800">
                  <span className="font-black text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">Rumus Acuan:</span>
                  {simResult.formula}
                </div>

                {/* PPN */}
                <div className="flex justify-between items-center text-slate-400 border-t border-neutral-900 pt-2">
                  <span>PPN ({simResult.ppnRate}%):</span>
                  <span className="font-extrabold text-emerald-400">+ Rp {simResult.ppn.toLocaleString('id-ID')}</span>
                </div>

                {/* PPh 23 */}
                <div className="flex justify-between items-center text-slate-400">
                  <span>Potongan PPh 23 ({simResult.pph23Rate}%):</span>
                  <span className="font-extrabold text-red-400">- Rp {simResult.pph23.toLocaleString('id-ID')}</span>
                </div>

                {/* Net Tagihan Bill */}
                <div className="flex justify-between items-center text-sm font-black border-t-2 border-dashed border-neutral-800 pt-3 text-slate-100">
                  <span className="uppercase text-xs tracking-wider font-sans font-bold">Total Bersih Tagihan:</span>
                  <span className="text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 text-xs">
                    Rp {simResult.netAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Info Banner footer */}
          <div className="bg-neutral-950/50 border border-neutral-850 rounded-2xl p-4 flex items-start space-x-3 text-[9.5px] leading-relaxed text-slate-400 font-semibold font-sans relative z-10">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[#fbc449] tracking-wider block">Ketaatan Regulasi Perpajakan:</span>
              <p>
                Berdasarkan ketentuan Ditjen Pajak terkait Kargo & Transportasi, penetapan PPN menggunakan DPP Nilai Lain melestarikan kepatuhan dan integritas data audit ERP SSL tanpa selisih pembulatan.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// Helper to evaluate divisor expression like "11/12" safely without eval()
function evalMultiplier(expr: string): number {
  if (!expr) return 1;
  if (expr.includes('/')) {
    const parts = expr.split('/');
    const n = parseFloat(parts[0]);
    const d = parseFloat(parts[1]);
    if (!isNaN(n) && !isNaN(d) && d !== 0) {
      return n / d;
    }
  }
  const parsed = parseFloat(expr);
  return isNaN(parsed) ? 1 : parsed;
}
