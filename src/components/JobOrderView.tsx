import React, { useState, useMemo } from "react";
import { Plus, Search, RefreshCw, CheckCircle, Clock, Truck, FileText, Banknote, TrendingUp, Wallet, XCircle, Upload, Edit2, AlertTriangle, Printer, Calendar, ShieldAlert, Trash2 } from "lucide-react";
import { JobOrder, Invoice, Container, PettyExpense, Driver } from "../types/erp";
import { Card, Tbl, Bdg, Btn, Stat } from "./Shared";
import { IDR, FD, cx, TODAY, hitungTotalJam, hitungBiayaGenset, formatJam, hitungHariTitipan, hitungBiayaTitipan } from "../utils/format";
import { CUSTOMERS, buildMilestoneList } from "../data/mockData";
import { MilestoneItem, Milestone } from "../types/erp";
import { SJob, SInv, TInv } from "./DashboardView";

const JobOrderViewPlaceholder = () => null;
export default JobOrderViewPlaceholder;

interface JobListProps {
  jobs: JobOrder[];
  nav: (p: string, tid: string, label: string, d?: any) => void;
  onAddJob?: () => void;
  currentUser?: { username: string; role: string; name: string } | null;
}

export const JobList: React.FC<JobListProps> = ({ jobs, nav, onAddJob, currentUser }) => {
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('ALL');
  const [ft, setFt] = useState('ALL');

  const canAddJob = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'CS';

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const ms = !q ||
        j.noBL.toLowerCase().includes(q.toLowerCase()) ||
        j.noAju.includes(q) ||
        j.customerId.toLowerCase().includes(q.toLowerCase()) ||
        j.barang.toLowerCase().includes(q.toLowerCase());
      return ms && (fs === 'ALL' || j.status === fs) && (ft === 'ALL' || j.type === ft);
    });
  }, [jobs, q, fs, ft]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
        {canAddJob ? (
          <Btn v="primary" icon={Plus} onClick={onAddJob}>Data Baru</Btn>
        ) : (
          <div className="text-slate-400 font-extrabold text-[11px] bg-slate-100 px-3 py-2 rounded-xl">
            🔒 Hanya CS / DIREKTUR yang bisa membuat Data Baru
          </div>
        )}
        <div className="flex-1" />
        
        {/* Search tool */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.3]" />
          <input 
            className="pl-9 pr-4 py-2 text-xs border border-gray-200 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 w-52 md:w-60 font-semibold text-slate-800" 
            placeholder="Cari BL, Aju, Customer, Barang..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
        </div>

        {/* Filters */}
        <select 
          className="text-xs border border-gray-200 bg-gray-50 font-bold text-slate-650 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/15" 
          value={fs} 
          onChange={(e) => setFs(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="IN_PROGRESS">Proses</option>
          <option value="READY_INVOICE">Siap Invoice</option>
          <option value="INVOICED">Ditagihkan</option>
          <option value="CLOSED">Selesai</option>
        </select>

        <select 
          className="text-xs border border-gray-200 bg-gray-50 font-bold text-slate-650 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/15" 
          value={ft} 
          onChange={(e) => setFt(e.target.value)}
        >
          <option value="ALL">Semua Tipe</option>
          <option value="IMPORT">Import</option>
          <option value="EXPORT">Export</option>
        </select>
      </div>

      <Card>
        <Tbl 
          cols={[
            { l: '#', fn: (_, i) => <span className="text-gray-400 text-xs font-bold font-mono">{i + 1}</span> },
            { 
              l: 'No BL / Urutan / Aju', 
              fn: (r: JobOrder) => (
                <div className="py-0.5">
                  <p className="font-mono text-xs font-black text-blue-700">{r.noBL}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">Aju: {r.noAju} · Urut: #{r.noUrut}</p>
                </div>
              ) 
            },
            { 
              l: 'Customer', 
              fn: (r: JobOrder) => (
                <div>
                  <p className="text-xs font-bold text-slate-850">{CUSTOMERS.find((c) => c.code === r.customerId)?.name || r.customerId}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold block mt-0.5 font-mono">{r.customerId}</p>
                </div>
              ) 
            },
            { l: 'Barang', fn: (r: JobOrder) => <span className="text-xs font-medium leading-normal max-w-xs block truncate" title={r.barang}>{r.barang}</span> },
            { 
              l: 'Karakteristik', 
              fn: (r: JobOrder) => (
                <div className="flex flex-col gap-1">
                  <Bdg v={r.type === 'IMPORT' ? 'blue' : 'orange'} xs>{r.type}</Bdg>
                  <Bdg v={r.jalur === 'MERAH' ? 'red' : 'green'} xs>{r.jalur}</Bdg>
                </div>
              ) 
            },
            { l: 'Party', fn: (r: JobOrder) => <span className="text-xs font-extrabold font-mono text-slate-900">{r.party}</span> },
            { l: 'ETA/ETD', fn: (r: JobOrder) => <span className="font-semibold text-slate-650">{FD(r.tglETA)}</span> },
            { l: 'Status SPPB', fn: (r: JobOrder) => <span className="font-semibold text-slate-650">{r.tglSPPB ? FD(r.tglSPPB) : <span className="text-slate-300 font-normal">Belum SPPB</span>}</span> },
            { 
              l: 'Checklist', 
              fn: (r: JobOrder) => {
                const vals = Object.values(r.checklist);
                const count = vals.filter(Boolean).length;
                const pct = vals.length > 0 ? (count / vals.length) * 100 : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-150 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-150" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500">{count}/{vals.length}</span>
                  </div>
                );
              } 
            },
            { l: 'Status', fn: (r: JobOrder) => <SJob s={r.status} /> },
            { 
              l: 'Kaitan Tagihan', 
              fn: (r: JobOrder) => {
                const ids = r.invoiceIds || [];
                return (
                  <div className="flex gap-1">
                    {['INK', 'TRK', 'RMB'].map((t) => {
                      const hasType = ids.some((id) => id.toString().includes(t));
                      return (
                        <span 
                          key={t} 
                          className={cx(
                            'text-[9.5px] px-1.5 py-0.5 rounded font-black border transition-all', 
                            hasType 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-350 line-through opacity-70'
                          )}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                );
              } 
            },
          ]} 
          rows={filtered} 
          onRow={(r: JobOrder) => nav('job-detail', r.id, 'JO ' + r.noBL.slice(-8), r)} 
          compact 
        />
        <div className="px-5 py-3.5 text-xs text-slate-400 font-extrabold border-t border-slate-100 bg-slate-50/20">
          Showing {filtered.length} out of {jobs.length} Job Orders
        </div>
      </Card>
    </div>
  );
};

const getGnstFlat    = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['GNST_FLAT'] || 3100000;

const getGnstPerJam  = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['GNST_PER_JAM'] || 350000;

const getTtpPerHari  = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['TTP_PER_HARI'] || 0; // 0 = belum diset, wajib diisi

const getTtpLO       = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['TTP_LO'] || 150000;

const getTtpLI       = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['TTP_LI'] || 150000;

const getTtpADM      = (customerId: string, rates: Record<string, Record<string, number>>) =>
  rates[customerId]?.['TTP_ADM'] || 50000;

interface JobDetailProps {
  job: JobOrder;
  invs: Invoice[];
  nav: (p: string, tid: string, label: string, d?: any) => void;
  onUpdateJob?: (updated: JobOrder) => void;
  onGenerateInvoice?: (job: JobOrder, type: 'INK' | 'TRK' | 'RMB') => void;
  onEditJob?: (job: JobOrder) => void;
  onDeleteJob?: (jobId: string) => void;
  drivers: Driver[];
  onAssignDriver: (jobId: string, containerId: string, driverId: string, uangJalan: number) => void;
  currentUser?: { username: string; role: string; name: string } | null;
  customerRates?: Record<string, Record<string, number>>;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  invs,
  nav,
  onUpdateJob,
  onGenerateInvoice,
  onEditJob,
  onDeleteJob,
  drivers = [],
  onAssignDriver,
  currentUser,
  customerRates = {}
}) => {
  const [tab, setTab] = useState<'info' | 'progress' | 'container' | 'pengeluaran' | 'invoice'>('info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState<{ket: string; amount: number; noRef: string; tgl: string; dok: boolean}>({
    ket: '', amount: 0, noRef: '', tgl: TODAY, dok: true
  });

  const canUpdateMilestone = (key: string) => {
    const role = currentUser?.role;
    if (!role || role === 'DIREKTUR') return true;
    const truckingKeys = ['assignTruck', 'truckJalan', 'barangDiterima', 'kontainerDepo', 'ambilContainer', 'stuffing', 'containerMasuk', 'karantinaFumigasi', 'customsClearance', 'kapalBerangkat'];
    if (truckingKeys.includes(key)) {
      return role === 'MGR_TRUCKING';
    }
    return role === 'OPERASIONAL';
  };

  const canUpdateChecklist = (key: string) => {
    const role = currentUser?.role;
    if (!role || role === 'DIREKTUR') return true;
    if (key === 'operasional') return role === 'OPERASIONAL' || role === 'ADMIN_INVOICE';
    if (key === 'trucking') return role === 'MGR_TRUCKING' || role === 'ADMIN_INVOICE';
    if (key === 'adminDok') return role === 'ADMIN_INVOICE';
    return false;
  };

  const canAssignDriver = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'MGR_TRUCKING';
  const canAddExpense = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'OPERASIONAL' || currentUser?.role === 'ADMIN_INVOICE';
  const canCreateInvoice = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'ADMIN_INVOICE';
  const cust = CUSTOMERS.find((c) => c.code === job.customerId);
  const related = invs.filter((i) => i.jobOrderId === job.id);
  const isImport = job.type === 'IMPORT';
  const canInvoice = Object.values(job.checklist).every(Boolean);
  const totalExp = job.pettyCash.expenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Phase 2 Milestones inline variables
  const [editingMilestoneKey, setEditingMilestoneKey] = useState<string | null>(null);

  // Jalur modal (IMPORT only)
  const [isJalurModalOpen, setIsJalurModalOpen] = useState(false);
  const [chosenJalur, setChosenJalur] = useState<'HIJAU' | 'MERAH'>('HIJAU');

  // Driver Assignment modal
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [driverSelectId, setDriverSelectId] = useState<string>('');
  const [uangJalanVal, setUangJalanVal] = useState<number>(500000);
  const [driverAssignError, setDriverAssignError] = useState<string | null>(null);

  const alreadyAssignedInThisJob = selectedContainer 
    ? job.containers
        .filter(c => c.driverId !== null && c.id !== selectedContainer.id)
        .map(c => c.driverId as string)
    : [];

  // Milestone list (urutan & keterangan tersimpan di job; data lama di-derive otomatis)
  const mList = buildMilestoneList(job);
  const applicableMs = mList.filter(m => !m.na);
  const progress = applicableMs.filter(m => m.done).length;
  const totalMs = applicableMs.length || 1;

  // Commit perubahan milestoneList + sinkronkan Record `milestones` (backward-compat)
  const commitMilestones = (newList: MilestoneItem[], extra?: Partial<JobOrder>) => {
    if (!onUpdateJob) return;
    const rec: Record<string, Milestone> = {};
    newList.forEach(m => { rec[m.id] = { done: m.done, tgl: m.tgl, na: m.na }; });
    onUpdateJob({ ...job, milestoneList: newList, milestones: rec, ...(extra || {}) });
  };

  const toggleMilestone = (id: string) => {
    if (!canUpdateMilestone(id)) {
      alert(`Akses Ditolak: Peran Anda (${currentUser?.role}) tidak diizinkan mengubah milestone ini.`);
      return;
    }
    if (!onUpdateJob) return;
    const item = mList.find(m => m.id === id);
    const wasDone = !!item?.done;

    // Penentuan Jalur dicentang pertama kali → tampilkan modal pilih jalur (khusus IMPORT)
    if (id === 'jalurDitentukan' && !wasDone && isImport) {
      setChosenJalur(job.jalur);
      setIsJalurModalOpen(true);
      return;
    }

    const newList = mList.map(m => m.id === id
      ? { ...m, done: !m.done, tgl: !m.done ? TODAY : undefined }
      : m
    );
    commitMilestones(newList);
  };

  const handleEditMilestoneDate = (id: string, nextDate: string) => {
    if (!canUpdateMilestone(id)) {
      alert(`Akses Ditolak: Peran Anda (${currentUser?.role}) tidak diizinkan mengedit tanggal milestone ini.`);
      return;
    }
    if (!onUpdateJob || !nextDate) return;
    const newList = mList.map(m => m.id === id ? { ...m, tgl: nextDate } : m);
    commitMilestones(newList);

    if (id === 'jalurDitentukan' && isImport) {
      setChosenJalur(job.jalur);
      setIsJalurModalOpen(true);
    }
  };

  const handleSaveJalurPathway = () => {
    if (!onUpdateJob) return;

    // HIJAU -> behandle na:true (bypass), MERAH -> behandle na:false (wajib)
    const newList = mList.map(m => {
      if (m.id === 'jalurDitentukan') return { ...m, done: true, tgl: m.tgl || TODAY };
      if (m.id === 'behandle') return { ...m, na: chosenJalur === 'HIJAU', done: chosenJalur === 'HIJAU' ? false : m.done };
      return m;
    });
    commitMilestones(newList, { jalur: chosenJalur });
    setIsJalurModalOpen(false);
  };

  const toggleChecklist = (key: keyof typeof job.checklist) => {
    if (!canUpdateChecklist(key as string)) {
      alert(`Akses Ditolak: Peran Anda (${currentUser?.role}) tidak diizinkan mengubah checklist ini.`);
      return;
    }
    if (!onUpdateJob) return;
    const updatedChecklist = {
      ...job.checklist,
      [key]: !job.checklist[key],
    };
    onUpdateJob({
      ...job,
      checklist: updatedChecklist,
      status: Object.values(updatedChecklist).every(Boolean) ? 'READY_INVOICE' : 'IN_PROGRESS',
    });
  };

  const addExpenseRow = () => {
    if (!canAddExpense) {
      alert(`Akses Ditolak: Peran Anda (${currentUser?.role}) tidak diizinkan merekam pengeluaran kas.`);
      return;
    }
    // Reset form ke state kosong untuk tambah baru
    setEditingExpenseId('NEW');
    setEditExpenseForm({
      ket: 'D.O/ADM/THC',
      amount: 0,
      noRef: '',
      tgl: TODAY,
      dok: true
    });
  };

  // Assign Driver Modal Launcher
  const openAssignDriverModal = (cont: Container) => {
    setSelectedContainer(cont);
    setDriverAssignError(null);
    const available = drivers.filter(d => d.status === 'TERSEDIA');
    if (available.length > 0) {
      setDriverSelectId(available[0].id);
    } else {
      setDriverSelectId('');
    }

    // Default pre-fill based on size
    const defValue = cont.ukuran.includes('20') ? 350000 : 500000;
    setUangJalanVal(defValue);
  };

  const handleExecuteDriverAssign = () => {
    if (!selectedContainer || !driverSelectId) return;

    const drvObj = drivers.find(d => d.id === driverSelectId);
    if (!drvObj) return;

    onAssignDriver(job.id, selectedContainer.id, driverSelectId, uangJalanVal);
    setSelectedContainer(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-3xs overflow-hidden">
      {/* Header Info */}
      <div className="bg-slate-50/50 border-b border-slate-200/80 px-6 py-5 shrink-0 select-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Bdg v={job.type === 'IMPORT' ? 'blue' : 'orange'}>{job.type}</Bdg>
              <Bdg v={job.jalur === 'MERAH' ? 'red' : 'green'}>{job.jalur}</Bdg>
              <SJob s={job.status} />
            </div>
            <h2 className="text-xl font-black font-mono text-slate-850 tracking-tight leading-tight">{job.noBL}</h2>
            <p className="text-xs text-slate-450 font-bold leading-normal">
              Customer: <span className="text-slate-800">{cust?.name || job.customerId}</span> · No Aju: <span className="font-mono text-slate-855">{job.noAju}</span> · Party: <span className="font-mono text-slate-855">{job.party}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(currentUser?.role === 'CS' || currentUser?.role === 'DIREKTUR') && (
              <Btn v="danger" icon={Trash2} sm onClick={() => setShowDeleteConfirm(true)}>
                Hapus JO
              </Btn>
            )}
            <Btn v="secondary" icon={Edit2} sm onClick={() => onEditJob?.(job)}>
              Edit Order
            </Btn>
            <Btn v="secondary" icon={Printer} sm onClick={() => window.print()}>Cetak Gating SPK</Btn>
          </div>
        </div>

        {/* Action Checklists */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              ['operasional', 'Operasional Lapangan', 'Pemeriksaan s/d SPPB OK'],
              ['trucking', 'Manajer Trucking', 'Penerbitan SPK supir & POD'],
              ['adminDok', 'Pemeriksa Administrasi', 'Dokumen inklaring lengkap'],
            ] as const
          ).map(([key, label, desc]) => (
            <button
              onClick={() => toggleChecklist(key)}
              key={key}
              className={cx(
                'flex items-start text-left gap-3 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10',
                job.checklist[key]
                  ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-orange-50/50 border-orange-200 hover:bg-orange-50'
              )}
            >
              {job.checklist[key] ? (
                <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
              ) : (
                <Clock size={16} className="text-orange-400 shrink-0 mt-0.5 stroke-[2.3]" />
              )}
              <div className="min-w-0">
                <p className={cx('font-black text-xs', job.checklist[key] ? 'text-emerald-800' : 'text-orange-855')}>{label}</p>
                <p className="text-[10px] text-slate-400 font-bold block mt-1 leading-normal truncate">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Selector list */}
      <div className="bg-slate-50/10 border-b border-slate-200 overflow-x-auto flex shrink-0">
        {(
          [
            ['info', 'Detail Order'],
            ['progress', 'Proses Milestones'],
            ['container', 'Container & Supir'],
            ['pengeluaran', 'Kas Operasional Lapangan'],
            ['invoice', 'Buat & Kelola Invoice'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cx(
              'px-5 py-3.5 text-xs font-black whitespace-nowrap border-b-2 transition-all outline-none focus:outline-none flex-1 text-center cursor-pointer',
              tab === k 
                ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/5' 
                : 'border-transparent text-slate-455 hover:text-slate-800 hover:bg-slate-50/40'
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tabs Content block */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10">
        {tab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Metanilai Job Order">
              <div className="p-4 divide-y divide-slate-100">
                {[
                  ['Pelanggan Utama', cust?.name],
                  ['No. NPWP', cust?.npwp],
                  ['Komoditas Barang', job.barang],
                  ['No PO Dokumen', job.noPO],
                  ['No BL (Bill of Lading)', <span className="font-mono text-blue-700 font-extrabold">{job.noBL}</span>],
                  ['Asosiasi Vessel', job.vessel],
                  ['Penetapan Jalur Beacukai', <Bdg v={job.jalur === 'MERAH' ? 'red' : 'green'}>{job.jalur}</Bdg>],
                  ['Hari ETA/ETD pelabuhan', FD(job.tglETA)],
                  ['Tanggal Terbit SPPB', job.tglSPPB ? FD(job.tglSPPB) : '—'],
                  ['Kuantitas Party Volume', job.party],
                  ...(job.type === 'DOMESTIK' ? [['Jenis Trucking Domestik', <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[10px] tracking-wider">{job.jenisTruckingDomestik || 'CITY_DELIVERY'}</span>]] : []),
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between py-3 text-xs gap-4">
                    <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider shrink-0">{k as string}</span>
                    <span className="text-slate-800 text-right font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card title="Keuangan Ringkas">
                <div className="p-4 divide-y divide-slate-100">
                  {[
                    ['Dana Cadangan Operasional Kas', `Rp ${IDR(job.pettyCash.allocated)}`, 'font-bold text-slate-700'],
                    ['Realisasi Biaya Lapangan', `Rp ${IDR(totalExp)}`, 'font-bold text-orange-650'],
                    [
                      'Kas Tersisa Saat Ini',
                      `Rp ${IDR(job.pettyCash.allocated - totalExp)}`,
                      job.pettyCash.allocated - totalExp >= 0 ? 'text-emerald-600 font-black' : 'text-red-500 font-black',
                    ],
                    ['line', ''],
                    ['Kaitan Tagihan INK (Inklaring)', related.find((i) => i.type === 'INK') ? `Rp ${IDR(related.find((i) => i.type === 'INK')?.totalBayar || 0)}` : 'Belum Terbit', 'font-semibold'],
                    ['Kaitan Tagihan TRK (Trucking)', related.find((i) => i.type === 'TRK') ? `Rp ${IDR(related.find((i) => i.type === 'TRK')?.totalBayar || 0)}` : 'Belum Terbit', 'font-semibold'],
                    ['Kaitan Biaya RMB (Reimburse)', related.find((i) => i.type === 'RMB') ? `Rp ${IDR(related.find((i) => i.type === 'RMB')?.totalBayar || 0)}` : 'Belum Terbit', 'font-semibold'],
                  ].map(([k, v, cls], idx) =>
                    k === 'line' ? (
                      <div key={idx} className="my-2 border-t border-dashed border-slate-200" />
                    ) : (
                      <div key={k as string} className="flex justify-between py-3 text-xs gap-4">
                        <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider shrink-0">{k as string}</span>
                        <span className={cx(cls)}>{v}</span>
                      </div>
                    )
                  )}
                </div>
              </Card>

              {/* Tampilkan hanya jika ada genset atau titipan yang aktif */}
              {job.containers.some(c => c.genset?.isActive || c.titipan?.isActive) && (
                <Card title="Ringkasan Biaya Genset & Titipan">
                  <div className="p-4 divide-y divide-slate-100">
                    {job.containers.map(c => (
                      <div key={c.id}>
                        {c.genset?.isActive && (
                          <div className="flex justify-between py-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">⚡ Genset — {c.no || c.ukuran}</p>
                              <p className="text-[10px] text-slate-400">{formatJam(c.genset.totalJam)}</p>
                            </div>
                            <span className="font-black text-blue-700">Rp {IDR(c.genset.totalBiaya)}</span>
                          </div>
                        )}
                        {c.titipan?.isActive && (
                          <div className="flex justify-between py-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">🏭 Titipan — {c.no || c.ukuran}</p>
                              <p className="text-[10px] text-slate-400">{c.titipan.jumlahHari} hari</p>
                            </div>
                            <span className="font-black text-orange-700">Rp {IDR(c.titipan.totalBiaya)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between py-3 font-black text-sm text-[#1B2B5E] border-t border-slate-100 pt-2">
                      <span>TOTAL GENSET + TITIPAN</span>
                      <span>Rp {IDR(
                        job.containers.reduce((s, c) =>
                          s + (c.genset?.totalBiaya || 0) + (c.titipan?.totalBiaya || 0), 0)
                      )}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS WORKFLOWS (MILESTONES EDITOR) */}
        {tab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={`Milestone Integrasi PPJK (${progress}/${totalMs} Selesai)`}>
              <div className="p-4 space-y-2 select-none">
                <div className="mb-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-150" style={{ width: `${(progress / totalMs) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-450 font-bold block mt-1.5">{Math.round((progress / totalMs) * 100)}% progress selesai</p>
                </div>

                <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                  {mList.map((node) => {
                    const key = node.id;
                    const label = node.label;
                    const isEditingDate = editingMilestoneKey === key;

                    return (
                      <div
                        key={key}
                        className={cx(
                          "flex items-center justify-between p-2.5 rounded-xl border border-slate-100/80 transition group",
                          node.done ? "bg-emerald-50/20 border-emerald-100" : "bg-white hover:bg-slate-50/40"
                        )}
                      >
                        {/* Checkbox trigger section */}
                        <div
                          onClick={() => toggleMilestone(key)}
                          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                        >
                          <div className="shrink-0">
                            {node.na ? (
                              <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 bg-slate-100" />
                            ) : node.done ? (
                              <CheckCircle size={16} className="text-emerald-500 stroke-[2.3]" />
                            ) : (
                              <Clock size={16} className="text-slate-350 stroke-[2.1]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className={cx('text-xs font-bold leading-tight block', node.done ? 'text-slate-800' : node.na ? 'text-slate-300 line-through' : 'text-slate-500')}>
                              {label}
                            </span>
                            {/* Short sub-labels for N/A or set check */}
                            {node.na && <span className="text-[9px] text-slate-300 font-extrabold uppercase italic">Tidak Berlaku / Bypass</span>}
                          </div>
                        </div>

                        {/* Inline Date details */}
                        {node.done && !node.na && (
                          <div className="ml-3 shrink-0 flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                            {isEditingDate ? (
                              <input
                                type="date"
                                className="font-mono text-[9px] font-bold text-slate-800 outline-none select-none bg-white border border-slate-300 rounded p-0.5"
                                value={node.tgl || TODAY}
                                onBlur={() => setEditingMilestoneKey(null)}
                                onChange={e => handleEditMilestoneDate(key, e.target.value)}
                              />
                            ) : (
                              <>
                                <span className="font-mono text-[10px] font-black text-slate-700">{node.tgl ? FD(node.tgl) : '—'}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMilestoneKey(key);
                                  }}
                                  className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  title="Edit Tanggal"
                                >
                                  <Edit2 size={10} className="stroke-[2.2]" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card title="Status Dispatch Container">
              <div className="p-4 space-y-4">
                {job.containers.map((c) => {
                  const driver = drivers.find((d) => d.id === c.driverId);
                  const statusColors = { BALIK_DEPO: 'green', JALAN: 'blue', DALAM_PROSES: 'yellow' };

                  return (
                    <div key={c.id} className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-sm font-black text-blue-700">{c.no || '(Kontainer Belum Di-Input)'}</span>
                        <Bdg v={statusColors[c.status as keyof typeof statusColors] as any || 'gray'}>{c.status.replace('_', ' ')}</Bdg>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-650 font-semibold">
                        <span>Ukuran Armada: <b className="text-slate-855">{c.ukuran}</b></span>
                        <span>Depo Tujuan: <b className="text-slate-855">{c.tujuan}</b></span>
                        <span>Pengemudi Jalan: <b className="text-slate-855">{driver?.nama || 'Belum Ditugaskan'}</b></span>
                        <span>Titipan Uang Jalan: <b className="text-slate-855">{c.uangJalan ? `Rp ${IDR(c.uangJalan)}` : '—'}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* CONTAINER & DRIVER MANAGEMENT PANEL */}
        {tab === 'container' && (
          <Card title="Spesifikasi List Kontainer & Pengemudi">
            <div className="p-4 space-y-4">
              {job.containers.map((c, i) => {
                const driver = drivers.find((d) => d.id === c.driverId);
                return (
                  <div key={c.id} className="p-5 border border-slate-200 hover:border-slate-350 rounded-2xl transition duration-150 bg-white relative">
                    
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest leading-none">
                        Unit Kontainer #{i + 1} — <span className="font-mono text-sm font-black text-blue-700 normal-case">{c.no || 'Tanpa No Ref'}</span>
                      </h4>
                      <div>
                        {driver ? (
                          <Bdg v="blue" xs>Supir Jalan: {driver.nama}</Bdg>
                        ) : (
                          <button 
                            onClick={() => {
                              if (!canAssignDriver) {
                                alert("Akses Ditolak: Hanya MGR_TRUCKING atau DIREKTUR yang dapat menugaskan pengemudi.");
                                return;
                              }
                              openAssignDriverModal(c);
                            }}
                            className="bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10.5px] px-3 py-1 rounded-xl hover:bg-blue-100 active:scale-97 cursor-pointer transition"
                          >
                            Assign Driver
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
                      {[
                        ['Dimensi Ukuran', c.ukuran],
                        ['Rute Tujuan Depo', c.tujuan],
                        ['Supir Bertugas', driver?.nama || <span className="text-amber-600 font-semibold italic">Belum ditugaskan</span>],
                        ['Plat Nomor Gating', driver?.platNo || '—'],
                        ['Saku Uang Jalan', c.uangJalan ? `Rp ${IDR(c.uangJalan)}` : '—'],
                        ['Sewa Uang Inap', c.inap ? `Rp ${IDR(c.inap)}` : '—'],
                      ].map(([k, v]) => (
                        <div key={k as any}>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">{k as any}</p>
                          <p className="font-bold text-slate-800">{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── GENSET SECTION ── */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            ⚡ Genset / Reefer
                          </span>
                          {c.genset?.isActive && c.genset.totalBiaya > 0 && (
                            <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-black">
                              Rp {IDR(c.genset.totalBiaya)}
                            </span>
                          )}
                        </div>
                        {/* Toggle aktif/nonaktif */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox"
                            checked={c.genset?.isActive || false}
                            onChange={e => {
                              const isActive = e.target.checked;
                              const tarifFlat   = getGnstFlat(job.customerId, customerRates || {});
                              const tarifPerJam = getGnstPerJam(job.customerId, customerRates || {});
                              const updated: Container = {
                                ...c,
                                genset: isActive
                                  ? {
                                      isActive: true,
                                      tglMulai: TODAY, jamMulai: '08:00',
                                      tglSelesai: TODAY, jamSelesai: '14:00',
                                      totalJam: 6,
                                      tarifFlat, tarifPerJam,
                                      totalBiaya: tarifFlat
                                    }
                                  : null
                              };
                              // Update container dalam job
                              if (onUpdateJob) {
                                onUpdateJob({
                                  ...job,
                                  containers: job.containers.map(x => x.id === c.id ? updated : x)
                                });
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 animate-none" />
                        </label>
                      </div>

                      {/* Form genset — muncul jika isActive */}
                      {c.genset?.isActive && (
                        <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 space-y-3">

                          {/* Baris 1: Tanggal & Jam Mulai */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tanggal Mulai</label>
                              <input type="date"
                                value={c.genset.tglMulai}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const jam = hitungTotalJam(val, c.genset!.jamMulai, c.genset!.tglSelesai, c.genset!.jamSelesai);
                                  const biaya = hitungBiayaGenset(jam, c.genset!.tarifFlat, c.genset!.tarifPerJam);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, genset: { ...x.genset!, tglMulai: val, totalJam: jam, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Jam Mulai</label>
                              <input type="time"
                                value={c.genset.jamMulai}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const jam = hitungTotalJam(c.genset!.tglMulai, val, c.genset!.tglSelesai, c.genset!.jamSelesai);
                                  const biaya = hitungBiayaGenset(jam, c.genset!.tarifFlat, c.genset!.tarifPerJam);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, genset: { ...x.genset!, jamMulai: val, totalJam: jam, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                          </div>

                          {/* Baris 2: Tanggal & Jam Selesai */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tanggal Selesai</label>
                              <input type="date"
                                value={c.genset.tglSelesai}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const jam = hitungTotalJam(c.genset!.tglMulai, c.genset!.jamMulai, val, c.genset!.jamSelesai);
                                  const biaya = hitungBiayaGenset(jam, c.genset!.tarifFlat, c.genset!.tarifPerJam);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, genset: { ...x.genset!, tglSelesai: val, totalJam: jam, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Jam Selesai</label>
                              <input type="time"
                                value={c.genset.jamSelesai}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const jam = hitungTotalJam(c.genset!.tglMulai, c.genset!.jamMulai, c.genset!.tglSelesai, val);
                                  const biaya = hitungBiayaGenset(jam, c.genset!.tarifFlat, c.genset!.tarifPerJam);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, genset: { ...x.genset!, jamSelesai: val, totalJam: jam, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                          </div>

                          {/* Ringkasan Kalkulasi Genset */}
                          {c.genset.totalJam > 0 && (
                            <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2 text-xs font-semibold">
                              <div className="flex justify-between text-slate-500">
                                <span>Total Durasi</span>
                                <span className="font-mono font-black text-slate-850">{formatJam(c.genset.totalJam)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Tarif 6 Jam Pertama</span>
                                <span className="font-mono">Rp {IDR(c.genset.tarifFlat)}</span>
                              </div>
                              {c.genset.totalJam > 6 && (
                                <div className="flex justify-between text-slate-500">
                                  <span>Jam Tambahan ({Math.ceil(c.genset.totalJam - 6)} jam × Rp {IDR(c.genset.tarifPerJam)})</span>
                                  <span className="font-mono">Rp {IDR(Math.ceil(c.genset.totalJam - 6) * c.genset.tarifPerJam)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-black text-blue-800 border-t border-blue-100 pt-2 font-mono">
                                <span className="font-sans font-black text-[10px] text-blue-900 uppercase">TOTAL BIAYA GENSET</span>
                                <span>Rp {IDR(c.genset.totalBiaya)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── TITIPAN SECTION ── */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            🏭 Titipan di Depo
                          </span>
                          {c.titipan?.isActive && c.titipan.totalBiaya > 0 && (
                            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded font-black">
                              Rp {IDR(c.titipan.totalBiaya)}
                            </span>
                          )}
                        </div>
                        {/* Toggle aktif/nonaktif */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox"
                            checked={c.titipan?.isActive || false}
                            onChange={e => {
                              const isActive = e.target.checked;
                              const lo  = getTtpLO(job.customerId, customerRates || {});
                              const li  = getTtpLI(job.customerId, customerRates || {});
                              const adm = getTtpADM(job.customerId, customerRates || {});
                              const tarifPerHari = getTtpPerHari(job.customerId, customerRates || {});
                              const updated: Container = {
                                ...c,
                                titipan: isActive
                                  ? { isActive: true, tglMasuk: TODAY, tglKeluar: TODAY, jumlahHari: 1, tarifPerHari, lo, li, adm, totalBiaya: tarifPerHari + lo + li + adm }
                                  : null
                              };
                              if (onUpdateJob) {
                                onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id ? updated : x) });
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500 animate-none" />
                        </label>
                      </div>

                      {/* Form titipan — muncul jika isActive */}
                      {c.titipan?.isActive && (
                        <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-4 space-y-3">

                          {/* Tanggal Masuk & Keluar */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tanggal Masuk Depo</label>
                              <input type="date"
                                value={c.titipan.tglMasuk}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const hari  = hitungHariTitipan(val, c.titipan!.tglKeluar);
                                  const biaya = hitungBiayaTitipan(hari, c.titipan!.tarifPerHari, c.titipan!.lo, c.titipan!.li, c.titipan!.adm);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, titipan: { ...x.titipan!, tglMasuk: val, jumlahHari: hari, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tanggal Keluar Depo</label>
                              <input type="date"
                                value={c.titipan.tglKeluar}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val = e.target.value;
                                  const hari  = hitungHariTitipan(c.titipan!.tglMasuk, val);
                                  const biaya = hitungBiayaTitipan(hari, c.titipan!.tarifPerHari, c.titipan!.lo, c.titipan!.li, c.titipan!.adm);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, titipan: { ...x.titipan!, tglKeluar: val, jumlahHari: hari, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                          </div>

                          {/* Tarif Per Hari */}
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                              Tarif Per Hari (IDR) *
                              {c.titipan.tarifPerHari === 0 && (
                                <span className="text-orange-500 ml-1">— belum diisi!</span>
                              )}
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                              <input type="number" step={1000}
                                value={c.titipan.tarifPerHari || ''}
                                placeholder="Isi tarif per hari..."
                                className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs font-mono font-bold"
                                onChange={e => {
                                  const val   = Number(e.target.value);
                                  const biaya = hitungBiayaTitipan(c.titipan!.jumlahHari, val, c.titipan!.lo, c.titipan!.li, c.titipan!.adm);
                                  if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                    ? { ...x, titipan: { ...x.titipan!, tarifPerHari: val, totalBiaya: biaya } }
                                    : x) });
                                }}
                              />
                            </div>
                          </div>

                          {/* Komponen LO, LI, ADM */}
                          <div className="grid grid-cols-3 gap-3">
                            {(['lo', 'li', 'adm'] as const).map(key => (
                              <div key={key}>
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-mono">
                                  {key.toUpperCase()}
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-black">Rp</span>
                                  <input type="number" step={1000}
                                    value={c.titipan[key] || ''}
                                    className="w-full border border-slate-200 rounded-lg pl-7 pr-1 py-1.5 text-xs font-mono font-bold"
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      const updated = { ...c.titipan!, [key]: val };
                                      const biaya = hitungBiayaTitipan(updated.jumlahHari, updated.tarifPerHari, updated.lo, updated.li, updated.adm);
                                      if (onUpdateJob) onUpdateJob({ ...job, containers: job.containers.map(x => x.id === c.id
                                        ? { ...x, titipan: { ...updated, totalBiaya: biaya } }
                                        : x) });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Ringkasan Kalkulasi Titipan */}
                          {c.titipan.jumlahHari > 0 && (
                            <div className="bg-white border border-orange-200 rounded-xl p-3 space-y-2 text-xs font-semibold">
                              <div className="flex justify-between text-slate-500">
                                <span>Jumlah Hari (inklusif)</span>
                                <span className="font-mono font-black text-slate-805">{c.titipan.jumlahHari} hari</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>{c.titipan.jumlahHari} hari × Rp {IDR(c.titipan.tarifPerHari)}</span>
                                <span className="font-mono">Rp {IDR(c.titipan.jumlahHari * c.titipan.tarifPerHari)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>LO + LI + ADM</span>
                                <span className="font-mono">Rp {IDR(c.titipan.lo + c.titipan.li + c.titipan.adm)}</span>
                              </div>
                              <div className="flex justify-between font-black text-orange-850 border-t border-orange-100 pt-2 font-mono">
                                <span className="font-sans font-black text-[10px] text-orange-900 uppercase">TOTAL BIAYA TITIPAN</span>
                                <span>Rp {IDR(c.titipan.totalBiaya)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* PETTY CASH EXPENSES SECTION */}
        {tab === 'pengeluaran' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Uang Jalan Dialokasikan" val={`Rp ${IDR(job.pettyCash.allocated)}`} col="blue" />
              <Stat label="Selesai Dipertanggungjawabkan" val={`Rp ${IDR(totalExp)}`} col="orange" />
              <Stat 
                label="Sisa Dana Tunai Lapangan" 
                val={`Rp ${IDR(job.pettyCash.allocated - totalExp)}`} 
                col={job.pettyCash.allocated - totalExp >= 0 ? 'green' : 'red'} 
              />
            </div>

            <Card 
              title="Daftar Realisasi Bukti Lapangan" 
              action={<Btn v="primary" icon={Plus} sm onClick={addExpenseRow}>Tambah Bukti Operasional</Btn>}
            >
              <Tbl 
                cols={[
                  { l: '#', fn: (_, idx) => <span className="text-gray-400 font-bold font-mono">{idx + 1}</span> },
                  { l: 'Keterangan Transaksi', fn: (r) => <span className="font-bold text-slate-800">{r.ket}</span> },
                  { l: 'Dok. Referensi', fn: (r) => <span className="font-mono text-[10px] font-extrabold text-blue-600 bg-blue-50/50 border border-blue-100 rounded px-1">{r.noRef || 'Fasilitas Bebas Ref'}</span> },
                  { l: 'Hari Transaksi', fn: (r) => <span className="font-mono text-slate-650">{FD(r.tgl)}</span> },
                  { l: 'Jumlah Tunai', r: true, fn: (r) => <span className="font-black text-slate-900">Rp {IDR(r.amount)}</span> },
                  { l: 'Fisik Dokumen', fn: (r) => r.dok ? <Bdg v="green" xs>Terlampir</Bdg> : <Bdg v="red" xs>Hilang</Bdg> },
                  { 
                    l: 'Aksi', 
                    fn: (r: PettyExpense) => (
                      <div className="flex gap-1.5">
                        <Btn v="secondary" sm onClick={() => {
                          setEditingExpenseId(r.id);
                          setEditExpenseForm({ ket: r.ket, amount: r.amount, noRef: r.noRef || '', tgl: r.tgl || TODAY, dok: !!r.dok });
                        }}>Edit</Btn>
                        <Btn v="danger" sm onClick={() => {
                          if (!onUpdateJob) return;
                          onUpdateJob({
                            ...job,
                            pettyCash: {
                              ...job.pettyCash,
                              expenses: job.pettyCash.expenses.filter(e => e.id !== r.id)
                            }
                          });
                        }}>Hapus</Btn>
                      </div>
                    )
                  },
                ]} 
                rows={job.pettyCash.expenses} 
                compact 
              />
              <div className="px-5 py-4 border-t bg-slate-50 flex justify-between font-extrabold text-sm text-slate-850 select-none">
                <span>TOTAL REKONSILIASI KAS OPERASIONAL</span>
                <span className="text-orange-600 font-black">Rp {IDR(totalExp)}</span>
              </div>
            </Card>

            <Card title="Ringkasan Uang Jalan Supir per Container">
              <div className="p-4 space-y-2">
                {job.containers.map(c => {
                  const driver = drivers.find(d => d.id === c.driverId);
                  return (
                    <div key={c.id}
                      className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">
                          {c.no || `Container ${c.ukuran}`}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          Supir: {driver?.nama || 'Belum Ditugaskan'} · {c.tujuan}
                        </p>
                      </div>
                      <span className="font-black font-mono text-slate-900">
                        {c.uangJalan
                          ? `Rp ${IDR(c.uangJalan)}`
                          : <span className="text-slate-300">—</span>
                        }
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-3 font-black text-xs text-slate-850 border-t">
                  <span>TOTAL UANG JALAN SUPIR</span>
                  <span className="font-mono text-blue-700">
                    Rp {IDR(
                      job.containers.reduce(
                        (s, c) => s + (c.uangJalan || 0), 0
                      )
                    )}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* INVOICE SECTION */}
        {tab === 'invoice' && (
          <div className="space-y-4">
            {!canInvoice && (
              <div className="bg-yellow-50/60 border border-yellow-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed animate-fade-in">
                <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5 stroke-[2.3]" />
                <div className="text-yellow-900 space-y-1">
                  <p className="font-black">Otorisasi Invoice Ditangguhkan</p>
                  <p className="font-semibold text-slate-650">Klaim tagihan belum dapat dirilis. Klien logistik mensyaratkan checklist penyelesaian operasional, dispatching supir, & verifikasi orisinalitas kelengkapan data-dokumen (Customs clear) dalam status Hijau.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['INK', 'TRK', 'RMB'].map((type) => {
                const inv = related.find((i) => i.type === type);
                return (
                  <div 
                    key={type} 
                    className={cx(
                      'p-5 rounded-2xl border-2 transition', 
                      inv 
                        ? 'border-blue-200 bg-blue-50/20' 
                        : 'border-dashed border-gray-300 bg-gray-50/40 opacity-90'
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <TInv t={type} />
                      {inv ? <SInv s={inv.status} /> : <Bdg xs>Belum Dirilis</Bdg>}
                    </div>

                    {inv ? (
                      <div className="mt-4 space-y-4 bg-white p-3.5 rounded-xl border border-blue-50">
                        <p className="font-mono text-xs font-black text-blue-700">{inv.noInvoice}</p>
                        <p className="text-lg font-black text-slate-900 mt-1">Rp {IDR(inv.totalBayar)}</p>
                        <p className="text-[10px] text-slate-400 font-bold block">{FD(inv.tanggal)}</p>
                        <Btn v="secondary" sm cls="w-full mt-2" onClick={() => nav('inv-detail', inv.id, inv.noInvoice, inv)}>
                          Tampilkan Invoice →
                        </Btn>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold text-slate-400 leading-normal">Belum dibuat oleh Operator Penagihan.</p>
                        <Btn 
                          v="primary" 
                          sm 
                          icon={Plus} 
                          disabled={!canInvoice} 
                          full 
                          onClick={() => {
                            if (!canCreateInvoice) {
                              alert(`Akses Ditolak: Peran Anda (${currentUser?.role}) tidak diizinkan merilis invoice.`);
                              return;
                            }
                            onGenerateInvoice?.(job, type as any);
                          }}
                        >
                          Rilis Tagihan {type}
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* JALUR SELECTION MODAL */}
      {isJalurModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <span className="text-xl">🚦</span>
              <h3 className="font-black text-slate-850 text-sm">Penetapan Jalur Kepabeanan Bea Cukai</h3>
            </div>
            
            <p className="text-xs text-slate-505 font-medium leading-relaxed">
              Kondisi status impor memerlukan sinkronisasi terhadap tahapan milestone **Behandle Fisik**. Tekan pilihan jalur untuk menyinkronkan daftar periksa.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button 
                onClick={() => setChosenJalur('HIJAU')}
                className={cx(
                  "p-4 border rounded-2xl flex flex-col items-center gap-1.5 transition cursor-pointer text-center",
                  chosenJalur === 'HIJAU' 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800" 
                    : "border-slate-200 hover:bg-slate-50 text-slate-500"
                )}
              >
                <span className="text-xl">🟢</span>
                <span className="font-extrabold text-xs">Jalur HIJAU</span>
                <span className="text-[9px] font-medium leading-none">(Milik Behandle Bypass N/A)</span>
              </button>

              <button 
                onClick={() => setChosenJalur('MERAH')}
                className={cx(
                  "p-4 border rounded-2xl flex flex-col items-center gap-1.5 transition cursor-pointer text-center",
                  chosenJalur === 'MERAH' 
                    ? "border-red-500 bg-red-50/70 text-red-800" 
                    : "border-slate-200 hover:bg-slate-50 text-slate-500"
                )}
              >
                <span className="text-xl">🔴</span>
                <span className="font-extrabold text-xs">Jalur MERAH</span>
                <span className="text-[9px] font-medium leading-none">(Membutuhkan Behandle fisik)</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
              <Btn v="secondary" sm onClick={() => setIsJalurModalOpen(false)}>Batal</Btn>
              <Btn v="primary" sm onClick={handleSaveJalurPathway}>Simpan Penetapan</Btn>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER ASSIGNMENT MODAL */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border shadow-xl space-y-4">
            
            <div className="flex items-center space-x-2.5 pb-2.5 border-b">
              <Truck className="text-blue-600 w-5 h-5 shrink-0 stroke-[2.3]" />
              <div>
                <h3 className="font-black text-slate-850 text-sm">Penugasan Pengemudi & Titipan Uang Jalan</h3>
                <p className="text-[10px] text-slate-400 font-bold block mt-0.5">Container {selectedContainer.no || 'Baru'} — Ukuran {selectedContainer.ukuran}</p>
              </div>
            </div>

            {driverAssignError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 text-[11px] leading-relaxed text-rose-900 font-semibold animate-fade-in">
                <ShieldAlert className="text-rose-600 w-5 h-5 shrink-0" />
                <span>{driverAssignError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-semibold text-slate-655">
              
              {/* Driver Dropdown selection list */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1.5">Pilih Pengemudi (TERSEDIA)</label>
                {drivers.filter(d => d.status === 'TERSEDIA' && !alreadyAssignedInThisJob.includes(d.id)).length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl leading-relaxed text-[11px]">
                    ⚠️ <b>Sopir penuh / tidak tersedia</b>. Semua armada saat ini sedang bertugas dines or libur. Selesaikan perjalanan lama supir or ubah statusnya di Master Data terlebih dahulu.
                  </div>
                ) : (
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-slate-50 font-black text-slate-850"
                    value={driverSelectId}
                    onChange={e => {
                      setDriverSelectId(e.target.value);
                      const drv = drivers.find(d => d.id === e.target.value);
                      if (drv) {
                        // Autofill rate based on class
                        const def = selectedContainer.ukuran.includes('20') ? 350000 : 500000;
                        setUangJalanVal(def);
                        setDriverAssignError(null);
                      }
                    }}
                  >
                    <option value="" disabled>-- Pilih Sopir --</option>
                    {drivers.filter(d => d.status === 'TERSEDIA' && !alreadyAssignedInThisJob.includes(d.id)).map(d => (
                      <option key={d.id} value={d.id}>{d.nama} — {d.platNo} ({d.tipe})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Vehicle limit card indicator */}
              {driverSelectId && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-[11px] font-bold">
                  <div>
                    <span className="text-slate-400">Pengemudi:</span>
                    <p className="text-slate-800 font-black text-xs block mt-0.5">{drivers.find(d => d.id === driverSelectId)?.nama}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Tipe Armada:</span>
                    <p className="text-blue-700 font-black text-xs block mt-0.5">
                      {drivers.find(d => d.id === driverSelectId)?.tipe} · {selectedContainer?.ukuran}
                    </p>
                  </div>
                </div>
              )}

              {/* Uang Jalan Cash amount input */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Nominal Titipan Uang Jalan (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    step={1000}
                    className="w-full border border-slate-205 rounded-xl pl-9 pr-4 py-2 font-mono font-black text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                    value={uangJalanVal}
                    onChange={e => {
                      setUangJalanVal(Number(e.target.value));
                      setDriverAssignError(null);
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-bold">
                  <span>Preview: Rp {IDR(uangJalanVal)}</span>
                  <span>Uang kas lapangan tersedia: <b className="text-slate-700">Rp {IDR(job.pettyCash.allocated)}</b></span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
              <Btn v="secondary" sm onClick={() => setSelectedContainer(null)}>Batal</Btn>
              <Btn 
                v="primary" 
                sm 
                disabled={!driverSelectId || drivers.filter(d => d.status === 'TERSEDIA').length === 0} 
                onClick={handleExecuteDriverAssign}
              >
                Menugaskan Sopir & Berikan Dana Saku
              </Btn>
            </div>

          </div>
        </div>
      )}

      {editingExpenseId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 select-none">
          <div className="bg-white rounded-2xl border shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-800">
              {editingExpenseId === 'NEW'
                ? 'Tambah Pengeluaran Operasional'
                : 'Edit Pengeluaran'
              }
            </h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Keterangan</label>
              <select className="w-full border rounded-xl px-3 py-2 text-xs font-bold"
                value={editExpenseForm.ket}
                onChange={e => setEditExpenseForm(p => ({...p, ket: e.target.value}))}>
                {['STORAGE','BEHANDLE','D.O/ADM/THC','GATE PASS','LIFT ON','LIFT OFF','PNBP KARANTINA','DO','REPAIR','DEMURRAGE','JAMINAN','LAINNYA'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">No Referensi</label>
              <input type="text" className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase"
                value={editExpenseForm.noRef}
                onChange={e => setEditExpenseForm(p => ({...p, noRef: e.target.value.toUpperCase()}))} />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nominal (IDR)</label>
              <input type="number" step={1000} className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                value={editExpenseForm.amount}
                onChange={e => setEditExpenseForm(p => ({...p, amount: Number(e.target.value)}))} />
              <p className="text-[10px] text-slate-400 mt-1">Preview: Rp {IDR(editExpenseForm.amount)}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tanggal</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-xs text-slate-705"
                value={editExpenseForm.tgl}
                onChange={e => setEditExpenseForm(p => ({...p, tgl: e.target.value}))} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="dok-edit" checked={editExpenseForm.dok}
                onChange={e => setEditExpenseForm(p => ({...p, dok: e.target.checked}))} />
              <label htmlFor="dok-edit" className="text-xs font-bold text-slate-600 cursor-pointer">Dokumen sudah diupload</label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Btn v="secondary" sm onClick={() => setEditingExpenseId(null)}>Batal</Btn>
              <Btn v="primary" sm onClick={() => {
                if (!onUpdateJob) return;
                if (editingExpenseId === 'NEW') {
                  const newExp: PettyExpense = {
                    id: 'E' + Date.now().toString().slice(-6),
                    ...editExpenseForm
                  };
                  onUpdateJob({
                    ...job,
                    pettyCash: {
                      ...job.pettyCash,
                      expenses: [...job.pettyCash.expenses, newExp]
                    }
                  });
                } else {
                  onUpdateJob({
                    ...job,
                    pettyCash: {
                      ...job.pettyCash,
                      expenses: job.pettyCash.expenses.map(e =>
                        e.id === editingExpenseId
                          ? { ...e, ...editExpenseForm }
                          : e
                      )
                    }
                  });
                }
                setEditingExpenseId(null);
                alert('Pengeluaran berhasil disimpan.');
              }}>Simpan Perubahan</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Job Order */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-red-100 flex items-center space-x-3 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="font-extrabold text-red-800 text-xs">Hapus Job Order</span>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-sm font-black text-slate-800">Apakah Anda yakin ingin menghapus Job Order ini?</p>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Job Order <span className="font-mono font-black text-slate-800">{job.id}</span> ({job.noBL}) akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
              </p>
              {(job.invoiceIds || []).length > 0 && (
                <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  Peringatan: Job Order ini memiliki {job.invoiceIds.length} invoice terkait. Invoice tersebut tidak akan ikut terhapus.
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteJob?.(job.id);
                }}
                className="px-4 py-2 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-700 cursor-pointer"
              >
                Ya, Hapus Job Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
