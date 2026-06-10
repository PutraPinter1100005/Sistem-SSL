import React, { useState, useMemo } from "react";
import { AlertCircle, FileText, CheckCircle, Wallet, Users, LayoutDashboard, Wrench, Calendar, Info } from "lucide-react";
import { Invoice, JobOrder } from "../types/erp";
import { Card, Tbl, Bdg, Btn } from "./Shared";
import { IDR, FD } from "../utils/format";
import { CUSTOMERS } from "../data/mockData";
import { TInv, SJob } from "./DashboardView";

interface ReportsProps {
  invs: Invoice[];
  jobs: JobOrder[];
  reps?: any[];
  nav?: (tab: string, id: string, title: string, payload?: any) => void;
}

export const Reports: React.FC<ReportsProps> = ({ invs, jobs, reps = [], nav }) => {
  const [tab, setTab] = useState<'piutang' | 'pengeluaran' | 'belum_tagih' | 'bulanan' | 'repair'>('piutang');

  // Filter States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Ringkasan Bulanan States
  const [selectedMonth, setSelectedMonth] = useState<string>('06'); // June
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Repair Filter States
  const [repairCustomer, setRepairCustomer] = useState<string>('ALL');
  const [repairStatus, setRepairStatus] = useState<string>('ALL');
  const [repairPelayaran, setRepairPelayaran] = useState<string>('ALL');

  // Aging calculation: Today is June 8, 2026
  const hitungUmurPiutang = (tglInvoice: string, term: string) => {
    if (!tglInvoice) return 0;
    const parts = tglInvoice.split('-');
    if (parts.length < 3) return 0;
    
    const invoiceDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const termDays = parseInt(term?.replace(/\D/g, '')) || 15;
    
    // Due Date
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + termDays);
    
    const today = new Date(2026, 5, 8); // 8 June 2026
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const withinDateRange = (dateStr: string) => {
    if (!dateStr) return false;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
  };

  // ==================== TAB 1: PIUTANG ====================
  const piutangFiltered = useMemo(() => {
    return invs.filter(inv => {
      if (inv.status !== 'BELUM_LUNAS') return false;
      if (selectedCustomerId !== 'ALL' && inv.customerId !== selectedCustomerId) return false;
      if (selectedType !== 'ALL' && inv.type !== selectedType) return false;
      if (startDate || endDate) {
        if (!withinDateRange(inv.tanggal)) return false;
      }
      return true;
    });
  }, [invs, selectedCustomerId, selectedType, startDate, endDate]);

  const totalPiutang = useMemo(() => piutangFiltered.reduce((sum, inv) => sum + (inv.totalBayar || 0), 0), [piutangFiltered]);
  const piutangINK = useMemo(() => piutangFiltered.filter(i => i.type === 'INK').reduce((sum, i) => sum + i.totalBayar, 0), [piutangFiltered]);
  const piutangTRK = useMemo(() => piutangFiltered.filter(i => i.type === 'TRK').reduce((sum, i) => sum + i.totalBayar, 0), [piutangFiltered]);
  const piutangRMB = useMemo(() => piutangFiltered.filter(i => ['RMB', 'RMB-A'].includes(i.type)).reduce((sum, i) => sum + i.totalBayar, 0), [piutangFiltered]);

  // Grouped by customer for subtotals
  const piutangByCustomer = useMemo(() => {
    const map: Record<string, { customerName: string; total: number; count: number }> = {};
    piutangFiltered.forEach(inv => {
      const cust = CUSTOMERS.find(c => c.code === inv.customerId);
      const name = cust ? cust.name : inv.customerId;
      if (!map[inv.customerId]) {
        map[inv.customerId] = { customerName: name, total: 0, count: 0 };
      }
      map[inv.customerId].total += inv.totalBayar;
      map[inv.customerId].count += 1;
    });
    return Object.entries(map).map(([code, d]) => ({ code, ...d }));
  }, [piutangFiltered]);

  // ==================== TAB 2: PENGELUARAN JOB ORDER ====================
  const pengeluaranFiltered = useMemo(() => {
    return jobs.map(j => {
      const expensesTotal = j.pettyCash.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      return {
        ...j,
        totalExp: expensesTotal,
        balance: j.pettyCash.allocated - expensesTotal,
        percent: j.pettyCash.allocated > 0 ? Math.round((expensesTotal / j.pettyCash.allocated) * 100) : 0
      };
    }).filter(j => {
      if (selectedCustomerId !== 'ALL' && j.customerId !== selectedCustomerId) return false;
      if (selectedType !== 'ALL' && j.type !== selectedType) return false;
      if (startDate || endDate) {
        if (!withinDateRange(j.tglETA)) return false;
      }
      return true;
    });
  }, [jobs, selectedCustomerId, selectedType, startDate, endDate]);

  const grandTotalAllocated = useMemo(() => pengeluaranFiltered.reduce((sum, j) => sum + j.pettyCash.allocated, 0), [pengeluaranFiltered]);
  const grandTotalExp = useMemo(() => pengeluaranFiltered.reduce((sum, j) => sum + j.totalExp, 0), [pengeluaranFiltered]);
  const grandTotalBalance = grandTotalAllocated - grandTotalExp;

  // ==================== TAB 3: BELUM TAGIH ====================
  const unbilled = useMemo(() => {
    return jobs.filter((j) => {
      const hasInvoice = j.invoiceIds && j.invoiceIds.length > 0;
      return (j.status === 'READY_INVOICE' || j.status === 'IN_PROGRESS') && !hasInvoice;
    }).filter(j => {
      if (selectedCustomerId !== 'ALL' && j.customerId !== selectedCustomerId) return false;
      if (startDate || endDate) {
        if (!withinDateRange(j.tglETA)) return false;
      }
      return true;
    });
  }, [jobs, selectedCustomerId, startDate, endDate]);

  // Checks if any ready-invoice job orders do not have an invoice generated
  const showUnbilledAlert = useMemo(() => {
    return jobs.some(j => j.status === 'READY_INVOICE' && (!j.invoiceIds || j.invoiceIds.length === 0));
  }, [jobs]);

  // ==================== TAB 4: BULANAN ====================
  const matchesMonthAndYear = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr.startsWith(`${selectedYear}-${selectedMonth}`);
  };

  const monthlyJobs = useMemo(() => jobs.filter(j => matchesMonthAndYear(j.tglETA)), [jobs, selectedMonth, selectedYear]);
  const monthlyInvoices = useMemo(() => invs.filter(i => matchesMonthAndYear(i.tanggal)), [invs, selectedMonth, selectedYear]);

  const statsBulanan = useMemo(() => {
    const totalINKVal = monthlyInvoices.filter(i => i.type === 'INK').reduce((s, i) => s + i.totalBayar, 0);
    const totalTRKVal = monthlyInvoices.filter(i => i.type === 'TRK').reduce((s, i) => s + i.totalBayar, 0);
    const totalRMBVal = monthlyInvoices.filter(i => i.type === 'RMB-A').reduce((s, i) => s + i.totalBayar, 0);
    
    // Real collected cash in the given month (marked LUNAS and tglBayar in that month)
    const totalCollected = invs
      .filter(i => i.status === 'LUNAS' && i.tglBayar && matchesMonthAndYear(i.tglBayar))
      .reduce((s, i) => s + i.totalBayar, 0);

    return {
      jobsCount: monthlyJobs.length,
      invoicesCount: monthlyInvoices.length,
      inkTotal: totalINKVal,
      trkTotal: totalTRKVal,
      rmbTotal: totalRMBVal,
      collected: totalCollected
    };
  }, [monthlyJobs, monthlyInvoices, invs, selectedMonth, selectedYear]);

  // ==================== TAB 5: REPAIR REPORT ====================
  const repairFiltered = useMemo(() => {
    return reps.filter(r => {
      if (repairCustomer !== 'ALL' && r.customerId !== repairCustomer) return false;
      if (repairStatus !== 'ALL' && r.status !== repairStatus) return false;
      if (repairPelayaran !== 'ALL' && r.pelayaran !== repairPelayaran) return false;
      return true;
    });
  }, [reps, repairCustomer, repairStatus, repairPelayaran]);

  const repairStats = useMemo(() => {
    const count = repairFiltered.length;
    const totalBiaya = repairFiltered.reduce((sum, r) => sum + (r.biayaEstimasi || 0), 0);
    const totalDitagihkan = repairFiltered.reduce((sum, r) => sum + (r.nominalDitagihkan || 0), 0);
    const totalDibebaskan = repairFiltered.reduce((sum, r) => {
      // Waive full or status dibebaskan
      if (r.status === 'DI_BEBASKAN' || r.hasilWaive === 'WAIVE_100') {
        return sum + (r.biayaEstimasi || 0);
      }
      return sum + ((r.biayaEstimasi || 0) - (r.nominalDitagihkan || 0));
    }, 0);

    return { count, totalBiaya, totalDitagihkan, totalDibebaskan };
  }, [repairFiltered]);

  return (
    <div className="space-y-4 print:hidden">
      
      {/* Visual Report Selection buttons */}
      <div className="flex gap-1.5 flex-wrap bg-white p-3 rounded-2xl border border-slate-200/85 shadow-3xs select-none">
        {(
          [
            ['piutang', 'Outstanding Piutang Buku', Users],
            ['pengeluaran', 'Uang Jalan Realisasi', Wallet],
            ['belum_tagih', 'JO Belum Ditagih', FileText],
            ['bulanan', 'Ringkasan Bulanan', Calendar],
            ['repair', 'Laporan Waive Repair', Wrench],
          ] as const
        ).map(([id, label, IconComp]) => (
          <button 
            key={id} 
            onClick={() => setTab(id)} 
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition duration-150 cursor-pointer ${
              tab === id 
                ? 'bg-[#1B2B5E] text-white shadow-xs' 
                : 'bg-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <IconComp className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* FILTER PANEL (Used globally across reports except ringkasan bulanan) */}
      {tab !== 'bulanan' && tab !== 'repair' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs grid grid-cols-1 md:grid-cols-4 gap-3 select-none">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B2B5E]"
            >
              <option value="ALL">Semua Customer</option>
              {CUSTOMERS.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {tab !== 'belum_tagih' && (
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Tipe Layanan / Order</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B2B5E]"
              >
                <option value="ALL">Semua Tipe</option>
                {tab === 'piutang' ? (
                  <>
                    <option value="INK">Inklaring (INK)</option>
                    <option value="TRK">Trucking (TRK)</option>
                    <option value="RMB-A">Repair RMB (RMB-A)</option>
                  </>
                ) : (
                  <>
                    <option value="IMPORT">IMPORT</option>
                    <option value="EXPORT">EXPORT</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Dari Tanggal</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B2B5E]"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Sampai Tanggal</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B2B5E]"
            />
          </div>
        </div>
      )}

      {/* FILTER PANEL - TAB REPAIR */}
      {tab === 'repair' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-3 select-none">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Customer</span>
            <select
              value={repairCustomer}
              onChange={(e) => setRepairCustomer(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Customer</option>
              {CUSTOMERS.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Status Klaim</span>
            <select
              value={repairStatus}
              onChange={(e) => setRepairStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENGAJUAN">PENGAJUAN</option>
              <option value="KONFIRMASI">KONFIRMASI</option>
              <option value="DI_TOLAK">DI DEPRECATED / TOLAK</option>
              <option value="DI_BEBASKAN">DI BEBASKAN</option>
              <option value="TERIMA_INV">SUDAH INVOICED</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Pelayaran Line</span>
            <select
              value={repairPelayaran}
              onChange={(e) => setRepairPelayaran(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Pelayaran</option>
              <option value="ONE LINE">ONE LINE</option>
              <option value="MAERSK">MAERSK</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="COSCO">COSCO</option>
            </select>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: PIUTANG ==================== */}
      {tab === 'piutang' && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold">
          
          {/* Piutang Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl">
              <p className="text-[9px] text-rose-500 font-black uppercase tracking-wider">Total Outstanding Piutang</p>
              <p className="text-xl font-black text-rose-700 mt-1">Rp {IDR(totalPiutang)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Outstanding INK</p>
              <p className="text-md font-black text-slate-800 mt-1">Rp {IDR(piutangINK)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Outstanding TRK</p>
              <p className="text-md font-black text-slate-800 mt-1">Rp {IDR(piutangTRK)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Outstanding Repair RMB</p>
              <p className="text-md font-black text-slate-800 mt-1">Rp {IDR(piutangRMB)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left side detail invoice books */}
            <div className="lg:col-span-2">
              <Card title={`Daftar Buku Piutang per Faktur (${piutangFiltered.length} invoice outstanding)`}>
                <Tbl 
                  cols={[
                    { l: 'Nomor Invoice', fn: (r) => <span className="font-mono text-xs font-black text-blue-800">{r.noInvoice}</span> },
                    { l: 'Tipe', fn: (r) => <TInv t={r.type} /> },
                    { l: 'Pelanggan', fn: (r) => <span className="text-slate-800 block truncate max-w-[120px]">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                    { l: 'Terbit', fn: (r) => <span className="font-mono text-slate-400">{FD(r.tanggal)}</span> },
                    { 
                      l: 'Umur Piutang (Hari)', 
                      fn: (r) => {
                        const umur = hitungUmurPiutang(r.tanggal, r.term);
                        let col = 'bg-emerald-50 text-emerald-700'; // Belum jatuh tempo
                        let label = `${Math.abs(umur)} hari dlm j tempo`;
                        
                        if (umur > 0) {
                          col = 'bg-rose-50 text-rose-700 font-bold animate-pulse';
                          label = `LEWAT ${umur} hari`;
                        } else if (umur >= -7 && umur <= 0) {
                          col = 'bg-amber-50 text-amber-700 font-bold';
                          label = `${Math.abs(umur)} hari jatuh tempo`;
                        }
                        
                        return <span className={`px-2 py-0.5 rounded-sm text-[9.5px] font-mono ${col}`}>{label}</span>;
                      }
                    },
                    { l: 'Nilai Piutang', r: true, fn: (r) => <span className="font-black text-slate-900">Rp {IDR(r.totalBayar)}</span> },
                  ]} 
                  rows={piutangFiltered} 
                  compact 
                />
                
                {/* Book Grand totals visual footnote */}
                <div className="p-4 border-t bg-slate-50 flex justify-between font-extrabold text-xs text-slate-800">
                  <span>GRAND TOTAL PIUTANG REKAP</span>
                  <span className="text-rose-700 font-black">Rp {IDR(totalPiutang)}</span>
                </div>
              </Card>
            </div>

            {/* Right side customer outstanding summary lists */}
            <div className="space-y-4">
              <Card title="Peta Tagihan per Customer">
                <div className="p-1 divide-y divide-slate-100">
                  {piutangByCustomer.length === 0 ? (
                    <p className="text-center p-6 text-slate-400 font-semibold">Tidak ada piutang saat ini.</p>
                  ) : (
                    piutangByCustomer.map(c => (
                      <div key={c.code} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-800 leading-tight">{c.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{c.code} | {c.count} Invoice Masalah</p>
                        </div>
                        <span className="font-black font-mono text-rose-600">Rp {IDR(c.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 flex gap-2 text-blue-950 leading-relaxed text-xs">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  Metode estimasi umur piutang mengacu pada tanggal terbit ditambahkan limit kredit **Term of Payment (TOP)** masing-masing faktur logistik.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 2: PENGELUARAN ==================== */}
      {tab === 'pengeluaran' && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold">
          
          {/* Expenses overall cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Total Kas Dialokasikan</p>
              <p className="text-md font-black text-slate-850 mt-1">Rp {IDR(grandTotalAllocated)}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
              <p className="text-[9px] text-orange-500 font-black uppercase tracking-wider">Realisasi Pengeluaran Lapangan</p>
              <p className="text-md font-black text-orange-700 mt-1">Rp {IDR(grandTotalExp)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-wider">Sisa Likuiditas Kembali</p>
              <p className="text-md font-black text-emerald-700 mt-1">Rp {IDR(grandTotalBalance)}</p>
            </div>
          </div>

          <Card title="Uang Jalan & Operasional Lapangan per Job Order">
            <Tbl 
              cols={[
                { l: 'Nomor BL (Bill of Lading)', fn: (r) => <span className="font-mono text-xs font-bold text-slate-700">{r.noBL}</span> },
                { l: 'Pelanggan', fn: (r) => <span className="font-bold text-slate-800">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                { l: 'Kategori', fn: (r) => <Bdg v={r.type === 'IMPORT' ? 'blue' : 'orange'} xs>{r.type}</Bdg> },
                { l: 'Uang Ops Jalan', r: true, fn: (r) => <span className="font-mono">Rp {IDR(r.pettyCash.allocated)}</span> },
                { l: 'Biaya Terpakai', r: true, fn: (r) => <span className="font-bold text-orange-600 font-mono">Rp {IDR(r.totalExp)}</span> },
                { 
                  l: 'Sisa Sarpas', 
                  r: true, 
                  fn: (r) => (
                    <span className={`font-black font-mono ${r.balance >= 0 ? "text-emerald-600" : "text-rose-600 font-black"}`}>
                      Rp {IDR(r.balance)}
                    </span>
                  ) 
                },
                { 
                  l: '% Penggunaan', 
                  fn: (r) => {
                    let col = 'bg-blue-600';
                    if (r.percent > 100) col = 'bg-rose-600';
                    else if (r.percent > 85) col = 'bg-amber-500';
                    
                    return (
                      <div className="flex items-center space-x-2 w-28 select-none">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div style={{ width: `${Math.min(r.percent, 100)}%` }} className={`h-full rounded-full ${col}`} />
                        </div>
                        <span className={`font-mono text-[10px] font-bold ${r.percent > 100 ? 'text-rose-600' : 'text-slate-500'}`}>{r.percent}%</span>
                      </div>
                    );
                  } 
                },
              ]} 
              rows={pengeluaranFiltered} 
              compact 
            />

            <div className="p-4 border-t bg-slate-50 flex justify-between font-black text-xs text-slate-850 select-none">
              <span>FOOTER GRAND TOTALS ({pengeluaranFiltered.length} JO)</span>
              <div className="space-x-4 font-mono">
                <span>Alokasi: <span className="text-slate-800">Rp {IDR(grandTotalAllocated)}</span></span>
                <span>Terpakai: <span className="text-orange-650">Rp {IDR(grandTotalExp)}</span></span>
                <span>Sisa: <span className={grandTotalBalance >= 0 ? "text-emerald-700" : "text-rose-600"}>Rp {IDR(grandTotalBalance)}</span></span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== TAB 3: BELUM TAGIH ==================== */}
      {tab === 'belum_tagih' && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold">
          
          {showUnbilledAlert && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 flex gap-3 leading-relaxed">
              <AlertCircle size={18} className="text-red-650 mt-0.5 shrink-0 stroke-[2.3] animate-bounce" />
              <div className="text-slate-800 space-y-1">
                <p className="font-black text-red-700">Peringatan: Terdapat Job Order status READY_INVOICE yang belum memiliki Dokumen Tagihan!</p>
                <p className="font-semibold text-slate-600">Arus kas kasbon logistik terganggu apabila billing tidak segera diterbitkan kepada customer bersangkutan.</p>
              </div>
            </div>
          )}

          <Card title={`Daftar Job Order Belum Ditagih (${unbilled.length} Record Terdeteksi)`}>
            <Tbl 
              cols={[
                { l: 'Nomor BL Utama', fn: (r) => <span className="font-mono text-xs font-black text-blue-800">{r.noBL}</span> },
                { l: 'Klien Pelanggan', fn: (r) => <span className="font-bold text-slate-850">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                { l: 'Kategori', fn: (r) => <Bdg v={r.type === 'IMPORT' ? 'blue' : 'orange'} xs>{r.type}</Bdg> },
                { l: 'Status Operasi', fn: (r) => <SJob s={r.status} /> },
                { 
                  l: 'Kelengkapan Checklist Dok', 
                  fn: (r) => {
                    const vals = Object.values(r.checklist || {});
                    const ok = vals.every(Boolean);
                    return (
                      <span className={`font-mono font-bold ${ok ? "text-emerald-600" : "text-amber-600"}`}>
                        {vals.filter(Boolean).length}/{vals.length} Dokumen {ok ? '✓' : '(Pending)'}
                      </span>
                    );
                  } 
                },
                { l: 'Hari ETA Pelabuhan', fn: (r) => <span className="font-semibold text-slate-500 font-mono">{FD(r.tglETA)}</span> },
                { 
                  l: 'Rilis Billing Baru', 
                  fn: (r) => (
                    <Btn 
                      v="primary" 
                      xs 
                      icon={FileText} 
                      onClick={() => {
                        if (nav) {
                          nav('add-invoice', `job-${r.id}-INK`, 'Rilis Invoice INK', { job: r, type: 'INK' });
                        } else {
                          alert("Aktivator navigasi tidak terpasang.");
                        }
                      }}
                    >
                      Buka Invoice →
                    </Btn>
                  )
                },
              ]} 
              rows={unbilled} 
              compact 
            />
          </Card>
        </div>
      )}

      {/* ==================== TAB 4: BULANAN ==================== */}
      {tab === 'bulanan' && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold">
          
          {/* Selector header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="font-black text-slate-850 text-sm">Arsip Ringkasan Buku Bulanan</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Gunakan filter periode di samping untuk mengagregasikan sirkulasi keuangan bulanan logistik PT SSL.</p>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 bg-white"
              >
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 bg-white"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* Aggregated KPI displays */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-2xl p-4.5 space-y-1 shadow-3xs">
              <p className="text-[9px] text-[#1B2B5E] font-black uppercase tracking-wider block">Job Order Aktif ETA</p>
              <p className="text-xl font-black mt-1 font-mono text-slate-800">{statsBulanan.jobsCount} JO</p>
            </div>
            <div className="bg-white border rounded-2xl p-4.5 space-y-1 shadow-3xs">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Invoice Terbit</p>
              <p className="text-xl font-black mt-1 font-mono text-slate-800">{statsBulanan.invoicesCount} Faktur</p>
            </div>
            <div className="bg-white border rounded-2xl p-4.5 space-y-1 shadow-3xs">
              <p className="text-[9px] text-green-600 font-black uppercase tracking-wider block font-sans">Omset Terbit INK+TRK+RMB</p>
              <p className="text-md font-black mt-1 text-slate-900">
                Rp {IDR(statsBulanan.inkTotal + statsBulanan.trkTotal + statsBulanan.rmbTotal)}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 space-y-1">
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider block">Realisasi Kas Masuk (LUNAS)</p>
              <p className="text-xl font-black mt-1 text-emerald-800">Rp {IDR(statsBulanan.collected)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Monthly Job Orders */}
            <Card title={`Job Order Terjadwal ETA (${selectedMonth}/${selectedYear} - ${monthlyJobs.length} JO)`}>
              <Tbl 
                cols={[
                  { l: 'Nomor BL', fn: (r) => <span className="font-mono text-[10.5px] font-bold text-slate-800">{r.noBL}</span> },
                  { l: 'Pelanggan', fn: (r) => <span className="text-slate-600 block truncate max-w-[130px]">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                  { l: 'Tgl ETA', fn: (r) => <span className="font-mono text-slate-400">{FD(r.tglETA)}</span> },
                  { l: 'Status Ops', fn: (r) => <SJob s={r.status} /> },
                ]}
                rows={monthlyJobs}
                compact
              />
            </Card>

            {/* Monthly Invoices */}
            <Card title={`Dokumen Invoice Rilis Periode Ini (${monthlyInvoices.length} Faktur)`}>
              <Tbl 
                cols={[
                  { l: 'Nomor Faktur', fn: (r) => <span className="font-mono text-[10.5px] font-black text-blue-800">{r.noInvoice}</span> },
                  { l: 'Tipe', fn: (r) => <TInv t={r.type} /> },
                  { l: 'Status', fn: (r) => <span className="font-bold">{r.status}</span> },
                  { l: 'Total Tagihan', r: true, fn: (r) => <span className="font-black text-slate-900 font-mono">Rp {IDR(r.totalBayar)}</span> },
                ]}
                rows={monthlyInvoices}
                compact
              />
            </Card>

          </div>
        </div>
      )}

      {/* ==================== TAB 5: LAPORAN REPAIR ==================== */}
      {tab === 'repair' && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold animate-in fade-in">
          
          {/* Repair summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border p-4 rounded-xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Total Kasus Repair</p>
              <p className="text-xl font-black text-slate-800 mt-1 font-mono">{repairStats.count} Peti Kemas</p>
            </div>
            <div className="bg-slate-50 border p-4 rounded-xl">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Total Kerusakan Estimasi</p>
              <p className="text-md font-black text-slate-800 mt-1">Rp {IDR(repairStats.totalBiaya)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-[9px] text-blue-650 font-black uppercase tracking-wider">Klaim Dibebankan (Ditagihkan)</p>
              <p className="text-lg font-black text-blue-800 mt-1">Rp {IDR(repairStats.totalDitagihkan)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <p className="text-[9px] text-emerald-605 font-black uppercase tracking-wider">Waive Keuntungan (Bebas Biaya)</p>
              <p className="text-lg font-black text-emerald-800 mt-1">Rp {IDR(repairStats.totalDibebaskan)}</p>
            </div>
          </div>

          <Card title={`Laporan Detail Klaim Repair Kontainer Depo (${repairFiltered.length} Record)`}>
            <Tbl 
              cols={[
                { l: 'No Kontainer', fn: (r) => <span className="font-mono text-xs font-black text-blue-800">{r.noContainer || '—'}</span> },
                { l: 'Pelayaran', fn: (r) => <Bdg v="gray" xs>{r.pelayaran}</Bdg> },
                { l: 'Depo', fn: (r) => <span className="font-bold text-slate-700">{r.depo || '—'}</span> },
                { l: 'Customer Klien', fn: (r) => <span className="font-bold text-slate-700 block truncate max-w-[120px]">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                { l: 'Total Biaya', r: true, fn: (r) => `Rp ${IDR(r.biayaEstimasi || 0)}` },
                { l: 'Hasil Waive', fn: (r) => <span className="font-extrabold text-indigo-700 text-[10px]">{r.hasilWaive || 'WAIVE_PENDING'}</span> },
                { l: 'Nilai Refund', r: true, fn: (r) => `Rp ${IDR(r.nilaiRefund || 0)}` },
                { l: 'Hasil Ditagihkan', r: true, fn: (r) => <span className="font-black text-blue-800 font-mono">Rp {IDR(r.nominalDitagihkan || 0)}</span> },
                { 
                  l: 'Status Tagih', 
                  fn: (r) => {
                    const col = r.statusTagih === 'DITAGIHKAN' ? 'green' : 'orange';
                    return <Bdg v={col as any} xs>{r.statusTagih || 'PENDING_BILLING'}</Bdg>;
                  }
                },
              ]}
              rows={repairFiltered}
              compact
            />
          </Card>
        </div>
      )}

    </div>
  );
};
export default Reports;
