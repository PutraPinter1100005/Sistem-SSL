import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Bell, 
  LogOut, 
  Truck, 
  LayoutGrid, 
  FileText, 
  Users, 
  CreditCard,
  Wrench,
  Wallet,
  ClipboardList,
  Menu,
  X,
  Plus,
  TrendingUp,
  AlertTriangle,
  XCircle,
  FolderClosed,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFirebase } from './context/FirebaseContext';
import { WorkspaceTab } from './types';
import { JobOrder, Invoice, Repair, Customer, Driver, ServiceItem, PettyExpense } from './types/erp';
import { TODAY, CUSTOMERS, DRIVERS, JOBS_INIT, INVS_INIT, REPS_INIT, SVC_INK, SVC_TRK } from './data/mockData';
import { IDR, FD, cx } from './utils/format';

// Reusable parts
import { Bdg } from './components/Shared';
import { DashboardView } from './components/DashboardView';
import { JobList, JobDetail } from './components/JobOrderView';
import { InvList, InvDetail } from './components/InvoiceView';
import { RepairList, RepairDetail } from './components/RepairView';
import { TruckingView } from './components/TruckingView';
import { FinanceView } from './components/FinanceView';
import { MasterDataPage } from './components/MasterDataView';
import { Reports } from './components/ReportsView';
import { JobOrderForm } from './components/JobOrderForm';
import { InvoiceForm } from './components/InvoiceForm';
import { LoginScreen, USERS_REGISTRY } from './components/LoginScreen';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const { user, loginGoogle, loginAnonymous, logout, loadingAuth, authError, clearAuthError } = useFirebase();

  // Active master states
  const [jobs, setJobs] = useState<JobOrder[]>(JOBS_INIT);
  const [invs, setInvs] = useState<Invoice[]>(INVS_INIT);
  const [reps, setReps] = useState<Repair[]>(REPS_INIT);
  const [drivers, setDrivers] = useState<Driver[]>(DRIVERS);
  const [customerRates, setCustomerRates] = useState<Record<string, Record<string, number>>>({});
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  // Phase 3 Authentication, Roles, & Audit Log States
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [systemUsers, setSystemUsers] = useState<any[]>(USERS_REGISTRY);
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: 'log-1', user: 'system', action: 'Inisialisasi Sistem ERP', timestamp: '2026-06-08 08:00:00', details: 'Sistem logistik PT. Sumber Selamat Logistik sukses diaktifkan.' },
  ]);

  const addAuditLog = (userStr: string, actionStr: string, detailsStr?: string) => {
    const freshLog = {
      id: 'log-' + Math.floor(Math.random() * 900000 + 100000),
      user: userStr,
      action: actionStr,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: detailsStr
    };
    setAuditLogs(prev => [...prev, freshLog]);
  };

  const handleUpdateCustomerRates = (customerId: string, rates: Record<string, number>) => {
    setCustomerRates(prev => ({
      ...prev,
      [customerId]: rates
    }));
  };

  const handleAssignDriver = (jobId: string, containerId: string, driverId: string, uangJalan: number) => {
    // 1. Update the master drivers status to JALAN
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'JALAN' as const } : d));

    // 2. Update job containers
    setJobs(prevJobs => prevJobs.map(j => {
      if (j.id === jobId) {
        const nextContainers = j.containers.map(c => 
          c.id === containerId ? { ...c, driverId, uangJalan, status: 'JALAN' as const } : c
        );

        const updated = {
          ...j,
          containers: nextContainers
        };

        // Sync tab payload 
        const key = `job-detail:${jobId}`;
        if (tabPayload[key]) {
          setTabPayload(prev => ({ ...prev, [key]: updated }));
        }

        return updated;
      }
      return j;
    }));

    showNotification(`Penugasan driver dan pengeluaran Kas Jalan berhasil dicatat.`);
  };

  // Dirty tab tracking for unsaved form warning
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const [closeTabWarning, setCloseTabWarning] = useState<{ tabId: string; type: 'new' | 'edit' } | null>(null);

  // Notification panel (floating below bell, auto-hide 5s)
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNotifPanel = () => {
    setShowNotifPanel(true);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setShowNotifPanel(false), 5000);
  };

  useEffect(() => {
    return () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); };
  }, []);

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isAddInvOpen, setIsAddInvOpen] = useState(false);
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [isParamOpen, setIsParamOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selected driver assign container state
  const [assignState, setAssignState] = useState<{ job: JobOrder; cId: string; } | null>(null);

  // New forms states
  const [newJob, setNewJob] = useState({
    customerId: 'SKD',
    type: 'IMPORT' as 'IMPORT' | 'EXPORT',
    noBL: '',
    noAju: '',
    barang: '',
    noPO: '',
    vessel: '',
    jalur: 'HIJAU' as 'HIJAU' | 'KUNING' | 'MERAH',
    party: '1X40',
    noContainer: '',
    tglETA: TODAY,
  });

  const [newInv, setNewInv] = useState({
    customerId: 'SKD',
    type: 'INK' as 'INK' | 'TRK' | 'RMB',
    noInvoice: '',
    jobOrderId: '',
    itemsText: '',
    subtotal: 0,
    jenisPajak: 'DPP_NILAI_LAIN_12' as any,
  });

  const [newRep, setNewRep] = useState({
    cardId: 'SKD',
    noAju: '',
    noBL: '',
    noContainer: '',
    pelayaran: 'YANGMING',
    depo: 'BSA',
    biayaRepair: 0,
    biayaAdm: 25000,
  });

  // Dynamic Workspace Tabs with Accurate-style sub-tab structure
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [moduleSubTabs, setModuleSubTabs] = useState<Record<string, {
    tabs: Array<{ id: string; title: string; payload?: any }>;
    active: string;
  }>>({
    dashboard: { tabs: [{ id: 'dashboard', title: 'Dashboard Utama' }], active: 'dashboard' },
    jobs:     { tabs: [{ id: 'jobs', title: 'Daftar Job Order' }], active: 'jobs' },
    invs:     { tabs: [{ id: 'invs', title: 'Daftar Invoice' }], active: 'invs' },
    reps:     { tabs: [{ id: 'reps', title: 'Daftar Repair' }], active: 'reps' },
    trucking: { tabs: [{ id: 'trucking', title: 'Trucking & Supir' }], active: 'trucking' },
    finance:  { tabs: [{ id: 'finance', title: 'Finance' }], active: 'finance' },
    master:   { tabs: [{ id: 'master-customers', title: 'Master Data' }], active: 'master-customers' },
    reports:  { tabs: [{ id: 'reports', title: 'Laporan Buku' }], active: 'reports' },
    settings: { tabs: [{ id: 'settings', title: 'Pengaturan' }], active: 'settings' },
  });
  const [tabPayload, setTabPayload] = useState<Record<string, any>>({});
  const [openedModules, setOpenedModules] = useState<string[]>(['dashboard']);

  useEffect(() => {
    if (!openedModules.includes(activeModule)) {
      setOpenedModules(prev => [...prev, activeModule]);
    }
  }, [activeModule]);

  const showNotification = (msg: string) => {
    setLastNotification(msg);
    setTimeout(() => setLastNotification(null), 4000);
  };

  const getModuleOfTabId = (tabId: string): string => {
    const cleanId = tabId.split(':')[0];
    if (cleanId === 'job-detail' || cleanId === 'add-job' || cleanId === 'jobs') return 'jobs';
    if (cleanId === 'inv-detail' || cleanId === 'add-invoice' || cleanId === 'invs') return 'invs';
    if (cleanId === 'repair-detail' || cleanId === 'reps') return 'reps';
    if (cleanId === 'trucking') return 'trucking';
    if (cleanId === 'finance') return 'finance';
    if (cleanId === 'master-customers') return 'master';
    if (cleanId === 'reports') return 'reports';
    if (cleanId === 'settings') return 'settings';
    return 'dashboard';
  };

  const activeTabId = moduleSubTabs[activeModule]?.active || 'dashboard';

  const setActiveTabId = (id: string) => {
    const targetModule = getModuleOfTabId(id);
    setActiveModule(targetModule);
    setModuleSubTabs(prev => {
      const currentMod = prev[targetModule] || { tabs: [], active: '' };
      const exists = currentMod.tabs.some(t => t.id === id);
      const newTabs = exists
        ? currentMod.tabs
        : [...currentMod.tabs, { id, title: id === targetModule ? currentMod.tabs[0]?.title || 'Main' : id }];
      return {
        ...prev,
        [targetModule]: {
          tabs: newTabs,
          active: id
        }
      };
    });
  };

  const tabs = moduleSubTabs[activeModule]?.tabs || [];

  const setTabs = (updatedTabsVal: any) => {
    // Virtual compatibility setter
  };

  // Helper navigate that maps directly into the Accurate-style sub-tab system
  const handleNav = (tabId: string, payloadId: string, label: string, data?: any) => {
    const combinedId = (payloadId === 'list' || !payloadId) ? tabId : `${tabId}:${payloadId}`;
    const targetModule = getModuleOfTabId(tabId);

    if (data) {
      setTabPayload(prev => ({ ...prev, [combinedId]: data }));
    }

    setModuleSubTabs(prev => {
      const currentMod = prev[targetModule] || { tabs: [], active: '' };
      const exists = currentMod.tabs.some(t => t.id === combinedId);
      const newTabs = exists
        ? currentMod.tabs
        : [...currentMod.tabs, { id: combinedId, title: label, payload: data }];
      
      return {
        ...prev,
        [targetModule]: {
          tabs: newTabs,
          active: combinedId
        }
      };
    });

    setActiveModule(targetModule);
    setIsMobileSidebarOpen(false);
  };

  const handleReplaceTab = (oldId: string, newId: string, newTitle: string, newData?: any) => {
    const targetModule = getModuleOfTabId(oldId);
    if (newData) {
      setTabPayload(prev => ({ ...prev, [newId]: newData }));
    }
    // Clear dirty tracking for the old tab
    setDirtyTabs(prev => { const next = new Set(prev); next.delete(oldId); return next; });
    setModuleSubTabs(prev => {
      const currentMod = prev[targetModule];
      if (!currentMod) return prev;
      const newTabs = currentMod.tabs.map(t =>
        t.id === oldId ? { ...t, id: newId, title: newTitle } : t
      );
      return {
        ...prev,
        [targetModule]: { tabs: newTabs, active: newId }
      };
    });
  };

  const handleDeleteJob = (jobId: string) => {
    const detailKey = `job-detail:${jobId}`;
    const editKey = `add-job:edit-${jobId}`;
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setTabPayload(prev => {
      const next = { ...prev };
      delete next[detailKey];
      delete next[editKey];
      return next;
    });
    setDirtyTabs(prev => { const next = new Set(prev); next.delete(editKey); return next; });
    setModuleSubTabs(prev => {
      const jobsMod = prev['jobs'];
      if (!jobsMod) return prev;
      const filtered = jobsMod.tabs.filter(t => t.id !== detailKey && t.id !== editKey);
      const wasActive = jobsMod.active === detailKey || jobsMod.active === editKey;
      const safeTabs = filtered.length > 0 ? filtered : [{ id: 'jobs', title: 'Daftar Job Order' }];
      return {
        ...prev,
        jobs: {
          tabs: safeTabs,
          active: wasActive ? 'jobs' : jobsMod.active
        }
      };
    });
    addAuditLog(currentUser?.name || 'Staf', 'Menghapus Job Order', `Job Order ${jobId} telah dihapus dari sistem.`);
    showNotification(`Job Order ${jobId} berhasil dihapus.`);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent | { stopPropagation: () => void }, force = false) => {
    e.stopPropagation();
    const targetModule = getModuleOfTabId(id);
    const isDefaultTab = ['dashboard', 'jobs', 'invs', 'reps', 'trucking', 'finance', 'master-customers', 'reports', 'settings'].includes(id);
    if (isDefaultTab) return;

    // Show warning if closing an unsaved add-job form tab
    if (!force && id.startsWith('add-job:') && dirtyTabs.has(id)) {
      const isEditTab = id.includes('edit-');
      setCloseTabWarning({ tabId: id, type: isEditTab ? 'edit' : 'new' });
      return;
    }

    // Clean dirty state
    setDirtyTabs(prev => { const next = new Set(prev); next.delete(id); return next; });

    setModuleSubTabs(prev => {
      const currentMod = prev[targetModule];
      if (!currentMod) return prev;

      const idx = currentMod.tabs.findIndex(t => t.id === id);
      const filtered = currentMod.tabs.filter(t => t.id !== id);
      let nextActive = currentMod.active;

      if (currentMod.active === id) {
        nextActive = currentMod.tabs[idx - 1]?.id || filtered[Math.min(idx, filtered.length - 1)]?.id || targetModule;
      }

      return {
        ...prev,
        [targetModule]: {
          tabs: filtered,
          active: nextActive
        }
      };
    });
  };

  // State Updates Handlers
  const handleUpdateJob = (updated: JobOrder) => {
    const oldJob = jobs.find(j => j.id === updated.id);
    if (oldJob) {
      const oldChecklist = oldJob.checklist;
      const newChecklist = updated.checklist;
      if (JSON.stringify(oldChecklist) !== JSON.stringify(newChecklist)) {
        addAuditLog(
          currentUser?.name || 'Staf SSL',
          'Mengupdate Checklist Dokumen',
          `Checklist baru untuk ${updated.noBL}: ${Object.entries(newChecklist).map(([k, v]) => `${k}=${v ? 'OK' : 'PENDING'}`).join(', ')}`
        );
      }
      if (JSON.stringify(oldJob.milestones) !== JSON.stringify(updated.milestones)) {
        addAuditLog(
          currentUser?.name || 'Staf SSL',
          'Mengupdate Milestones',
          `Mengubah progress milestones pada Job Order ${updated.id} (${updated.noBL}).`
        );
      }
    }

    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
    // Update active tab payload too
    const key = `job-detail:${updated.id}`;
    if (tabPayload[key]) {
      setTabPayload(prev => ({ ...prev, [key]: updated }));
    }
    showNotification(`Job Order ${updated.noBL.slice(-8)} berhasil diperbarui.`);
  };

  const handleUpdateInvoice = (updated: Invoice) => {
    const oldInv = invs.find(i => i.id === updated.id);
    if (oldInv) {
      if (oldInv.status !== 'LUNAS' && updated.status === 'LUNAS') {
        addAuditLog(
          currentUser?.name || 'Staf SSL',
          'Menandai Lunas Invoice',
          `Invoice ${updated.noInvoice} sebesar Rp ${IDR(updated.totalBayar)} berhasil ditandai LUNAS.`
        );
      }
      if (oldInv.noFP !== updated.noFP) {
        addAuditLog(
          currentUser?.name || 'Staf SSL',
          'Mengupdate Nomor Faktur Pajak',
          `Menginput Nomor Faktur Pajak (E-Faktur) ${updated.noFP || 'KOSONG'} pada Invoice ${updated.noInvoice}.`
        );
      }
    }

    setInvs(prev => prev.map(i => i.id === updated.id ? updated : i));
    const key = `inv-detail:${updated.id}`;
    if (tabPayload[key]) {
      setTabPayload(prev => ({ ...prev, [key]: updated }));
    }
    showNotification(`Invoice ${updated.noInvoice} berhasil diperbarui.`);
  };

  const handleUpdateRepair = (updated: Repair) => {
    setReps(prev => prev.map(r => r.id === updated.id ? updated : r));
    const key = `repair-detail:${updated.id}`;
    if (tabPayload[key]) {
      setTabPayload(prev => ({ ...prev, [key]: updated }));
    }
    showNotification(`Data Repair ${updated.noContainer} berhasil disinkronkan.`);
  };

  // Parse container volume based on party text
  const setupContainerUnits = (party: string, customNo?: string) => {
    const amt = parseInt(party.replace(/\D/g, '')) || 1;
    const size = party.toLowerCase().includes('20') ? '20"' : '40"';
    const list = [];
    for (let i = 0; i < amt; i++) {
      list.push({
        id: `C-${Math.floor(Math.random() * 1000000)}`,
        no: i === 0 && customNo ? customNo : '',
        ukuran: size as '20"' | '40"',
        tujuan: 'CIBITUNG',
        driverId: null,
        uangJalan: size === '20"' ? 350000 : 500000,
        inap: 0,
        status: 'DALAM_PROSES' as const
      });
    }
    return list;
  };

  // Create Job submit
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.noBL || !newJob.noAju) {
      alert('Isi No BL & No Aju terlebih dahulu!');
      return;
    }

    const nextId = `JO-0${jobs.length + 1}`;
    const nextUrut = Math.max(...jobs.map(j => j.noUrut)) + 1;

    const jobItem: JobOrder = {
      id: nextId,
      customerId: newJob.customerId,
      type: newJob.type,
      noUrut: nextUrut,
      noAju: newJob.noAju,
      noBL: newJob.noBL,
      barang: newJob.barang || 'GENERAL CARGO',
      noPO: newJob.noPO || `PO-${Math.floor(Math.random() * 90000) + 10000}`,
      vessel: newJob.vessel || 'GLOBAL VOYAGER 102E',
      jalur: newJob.jalur,
      party: newJob.party,
      tglETA: newJob.tglETA,
      tglSPPB: null,
      containers: setupContainerUnits(newJob.party, newJob.noContainer),
      status: 'IN_PROGRESS',
      milestones: newJob.type === 'IMPORT' ? {
        inputBL: { done: true, tgl: TODAY },
        pengurusanDO: { done: false },
        draftPIB: { done: false },
        pembayaranBC: { done: false },
        jalurDitentukan: { done: false },
        SPPBKeluar: { done: false },
        behandle: { done: false, na: newJob.jalur !== 'MERAH' },
        karantina: { done: false },
        SPPBSelesai: { done: false },
        assignTruck: { done: false },
        truckJalan: { done: false },
        barangDiterima: { done: false },
        kontainerDepo: { done: false },
      } : {
        inputBooking: { done: true, tgl: TODAY },
        draftPEB: { done: false },
        assignTruck: { done: false },
        ambilContainer: { done: false },
        stuffing: { done: false },
        truckJalan: { done: false },
        containerMasuk: { done: false },
        karantinaFumigasi: { done: false, na: true },
        customsClearance: { done: false },
        kapalBerangkat: { done: false },
      },
      checklist: { operasional: false, trucking: false, adminDok: false },
      pettyCash: { allocated: 20000000, expenses: [] },
      invoiceIds: [],
      tglCreated: TODAY
    };

    setJobs(prev => [jobItem, ...prev]);
    setIsAddJobOpen(false);
    addAuditLog(
      currentUser?.name || 'Staf CS',
      'Merilis Job Order Baru',
      `Job baru ${jobItem.id} berhasil diterbitkan untuk Bill of Lading: ${jobItem.noBL}`
    );
    showNotification(`Job Order ${newJob.noBL} sukses didaftarkan.`);
  };

  // Auto Generate Invoice matching Tax rules
  const handleAutoInvoice = (job: JobOrder, type: 'INK' | 'TRK' | 'RMB') => {
    const cust = CUSTOMERS.find(c => c.code === job.customerId);
    const invoicePrefix = `${job.id.replace('JO-', '')}/${type}/JUN/26`;
    const noInvoice = `${cust?.code}-${invoicePrefix}`;

    let items: Array<{ nama: string; qty?: number; harga?: number; total: number; noRef?: string }> = [];
    let subtotal = 0;
    let dppNilaiLain: number | null = null;
    let ppnRate = 12; // PPN 12% standard for PPJK
    let ppnAmount = 0;
    let jenisPajak: any = 'DPP_NILAI_LAIN_12';

    const count = job.containers.length;

    if (type === 'INK') {
      items = [
        { nama: 'EDI PPJK', qty: 1, harga: 150000, total: 150000 },
        { nama: 'JASA HANDLING', qty: 1, harga: 300000, total: 300000 }
      ];
      // Size check
      const is40 = job.party.includes('40');
      const rateCode = is40 ? 'INK40HP' : 'INK20HP';
      const defaultRate = SVC_INK.find(r => r.code === rateCode)?.harga || 300000;
      
      items.push({
        nama: `INKLARING JKT ${is40 ? '40"' : '20"'} UTAMA`,
        qty: 1,
        harga: defaultRate,
        total: defaultRate
      });

      if (count > 1) {
        const nextRate = is40 ? 'INK40HB' : 'INK20HB';
        const subRate = SVC_INK.find(r => r.code === nextRate)?.harga || 250000;
        items.push({
          nama: `INKLARING JKT ${is40 ? '40"' : '20"'} BERIKUTNYA`,
          qty: count - 1,
          harga: subRate,
          total: subRate * (count - 1)
        });
      }

      if (job.jalur === 'MERAH') {
        items.push({ nama: 'BEHANDEL JALUR MERAH', qty: 1, harga: 1500000, total: 1500000 });
      }

      subtotal = items.reduce((s, item) => s + item.total, 0);
      dppNilaiLain = Math.round(subtotal * 11 / 12);
      ppnAmount = Math.round(dppNilaiLain * 0.12);
      jenisPajak = 'DPP_NILAI_LAIN_12';

    } else if (type === 'TRK') {
      const is40 = job.party.includes('40');
      const trkDefault = SVC_TRK.find(r => r.code === (is40 ? 'TR40CIBITUNG' : 'TR20CIBITUNG'))?.harga || 1800000;
      
      items = [
        { nama: `TRUCKING ${is40 ? '40"' : '20"'} CIBITUNG`, qty: count, harga: trkDefault, total: trkDefault * count }
      ];
      subtotal = trkDefault * count;
      ppnRate = 1.1; // Besaran Tertentu
      ppnAmount = Math.round(subtotal * 0.011);
      jenisPajak = 'BESARAN_TERTENTU_1_1';

    } else {
      // RMB Reimbursement of pettycash expenses
      items = job.pettyCash.expenses.map(e => ({
        nama: e.ket,
        noRef: e.noRef,
        total: e.amount
      }));
      subtotal = items.reduce((s, item) => s + item.total, 0);
      ppnRate = 0;
      ppnAmount = 0;
      jenisPajak = 'NO_PPN';
    }

    const generated: Invoice = {
      id: `INV-${type}-${Date.now().toString().slice(-4)}`,
      noInvoice,
      jobOrderId: job.id,
      customerId: job.customerId,
      type,
      tanggal: TODAY,
      term: cust?.term || 'net 15',
      noAju: job.noAju,
      noBL: job.noBL,
      party: job.party,
      barang: job.barang,
      jalur: job.jalur,
      noPO: job.noPO,
      tglETA: job.tglETA,
      tglSPPB: job.tglSPPB,
      items,
      subtotal,
      dppNilaiLain,
      ppnRate,
      ppnAmount,
      totalBayar: subtotal + ppnAmount,
      status: 'BELUM_LUNAS',
      noFP: null,
      jenisPajak,
      ket: type === 'RMB' 
        ? 'Penagihan penggantian biaya (reimbursement) sesuai bukti terlampir.'
        : `Pajak dengan perhitungan yang berlaku tarif ${ppnRate}%.`
    };

    setInvs(prev => [generated, ...prev]);
    // Link invoice ID to job order record
    const updatedJob = {
      ...job,
      invoiceIds: [...(job.invoiceIds || []), generated.id],
      status: (job.invoiceIds || []).length + 1 === 3 ? 'INVOICED' as const : job.status
    };
    handleUpdateJob(updatedJob);

    showNotification(`Invoice ${noInvoice} berhasil di-generate secara otomatis.`);
    // Navigate automatically to detail
    handleNav('inv-detail', generated.id, generated.noInvoice, generated);
  };

  // Create manual Invoice submit
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.noInvoice || !newInv.jobOrderId) {
      alert('Isi No Invoice & Link Job Order!');
      return;
    }

    const linkedJob = jobs.find(j => j.id === newInv.jobOrderId);
    if (!linkedJob) return;

    const items = newInv.itemsText.split('\n').filter(Boolean).map((line, i) => {
      const parts = line.split(',');
      const nama = parts[0] || 'Layanan Tambahan';
      const tot = parseInt((parts[1] || '0').replace(/\D/g, '')) || 100000;
      return { nama, qty: 1, harga: tot, total: tot };
    });

    const sub = items.reduce((s, item) => s + item.total, 0);
    const rate = newInv.jenisPajak === 'BESARAN_TERTENTU_1_1' ? 1.1 : newInv.jenisPajak === 'NO_PPN' ? 0 : 12;
    const isLain = newInv.jenisPajak === 'DPP_NILAI_LAIN_12';
    const dpp = isLain ? Math.round(sub * 11 / 12) : null;
    const ppnAmt = isLain ? Math.round(dpp! * 0.12) : Math.round(sub * (rate / 100));

    const generated: Invoice = {
      id: `INV-MAN-${Date.now().toString().slice(-4)}`,
      noInvoice: newInv.noInvoice,
      jobOrderId: newInv.jobOrderId,
      customerId: newInv.customerId,
      type: newInv.type,
      tanggal: TODAY,
      term: 'net 15',
      noAju: linkedJob.noAju,
      noBL: linkedJob.noBL,
      party: linkedJob.party,
      barang: linkedJob.barang,
      jalur: linkedJob.jalur,
      noPO: linkedJob.noPO,
      tglETA: linkedJob.tglETA,
      tglSPPB: linkedJob.tglSPPB,
      items,
      subtotal: sub,
      dppNilaiLain: dpp,
      ppnRate: rate,
      ppnAmount: ppnAmt,
      totalBayar: sub + ppnAmt,
      status: 'BELUM_LUNAS',
      noFP: null,
      jenisPajak: newInv.jenisPajak,
      ket: 'Invoice manual dibuat oleh operator keuangan.'
    };

    setInvs(prev => [generated, ...prev]);
    setIsAddInvOpen(false);
    showNotification(`Invoice ${newInv.noInvoice} berhasil dibukukan.`);
  };

  // Create Repair submit
  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRep.noContainer || !newRep.noBL) {
      alert('Isi No Container & No BL!');
      return;
    }

    const biRepair = Number(newRep.biayaRepair) || 500000;
    const biAdm = Number(newRep.biayaAdm) || 25000;
    const ppn = Math.round(biRepair * 0.12);

    const generated: Repair = {
      id: `REP-${reps.length + 101}`,
      cardId: newRep.cardId,
      noAju: newRep.noAju || `AJU-${Math.floor(Math.random() * 9000) + 1000}`,
      noBL: newRep.noBL,
      noContainer: newRep.noContainer,
      pelayaran: newRep.pelayaran,
      depo: newRep.depo,
      status: 'PENGAJUAN',
      biayaRepair: biRepair,
      biayaAdm: biAdm,
      ppn,
      totalBiaya: biRepair + biAdm + ppn,
      hasil: null,
      nominalRefund: null,
      pengurus: 'OPERATOR',
      tglKeDepo: TODAY,
      tglDanaMasuk: null,
      statusTagih: null,
      nominalDitagihkan: null,
      noInvoice: null,
      tglInput: TODAY
    };

    setReps(prev => [generated, ...prev]);
    setIsAddRepOpen(false);
    showNotification(`Klaim repair container ${newRep.noContainer} dikirim ke pelayaran.`);
  };

  // Generate Reimbursement invoice from Rejected / Partially waived Repair
  const handleGenerateRepairInvoice = (rep: Repair) => {
    // Attempt lookup of the Job Order by the BL or container number
    const matchingJobOfBL = jobs.find(j => j.noBL === rep.noBL || j.containers.some(c => c.no === rep.noContainer));

    const dummyJob: JobOrder = matchingJobOfBL || {
      id: 'JO-DUMMY',
      type: 'IMPORT',
      customerId: rep.cardId,
      noUrut: 0,
      noAju: rep.noAju,
      noBL: rep.noBL,
      barang: 'CONTAINER DAMAGE REPAIR',
      noPO: '',
      vessel: rep.pelayaran,
      jalur: 'HIJAU',
      tglETA: TODAY,
      tglSPPB: null,
      party: '1X40',
      containers: [{ id: 'C-DUMMY', no: rep.noContainer, ukuran: '40"', tujuan: rep.depo, driverId: null, uangJalan: null, inap: 0, status: 'BALIK_DEPO' }],
      status: 'OPEN',
      milestones: {},
      checklist: {},
      pettyCash: { allocated: 0, expenses: [] },
      invoiceIds: [],
      tglCreated: TODAY
    };

    const repairPayload = {
      job: dummyJob,
      type: 'RMB-A' as const,
      repairData: { id: rep.id, noContainer: rep.noContainer, totalBiaya: rep.nominalDitagihkan || rep.totalBiaya }
    };

    handleNav('add-invoice', `rep-${rep.id}`, `Rilis RMB-A ${rep.noContainer}`, repairPayload);
  };

  // Assigning driver main logic
  const handleAssignSupir = (job: JobOrder, containerId: string) => {
    setAssignState({ job, cId: containerId });
  };

  const handleSelectDriverForAssignByForm = (driverId: string) => {
    if (!assignState) return;
    const { job, cId } = assignState;

    const updatedContainers = job.containers.map(c => {
      if (c.id === cId) {
        return {
          ...c,
          driverId,
          status: 'JALAN' as const
        };
      }
      return c;
    });

    const isAssignDone = updatedContainers.every(c => c.driverId);

    const updatedJob: JobOrder = {
      ...job,
      containers: updatedContainers,
      milestones: {
        ...job.milestones,
        assignTruck: { done: true, tgl: TODAY },
        truckJalan: { done: true, tgl: TODAY }
      },
      checklist: {
        ...job.checklist,
        trucking: isAssignDone ? true : job.checklist.trucking
      }
    };

    handleUpdateJob(updatedJob);
    setAssignState(null);
    showNotification(`Supir berhasil ditugaskan untuk container.`);
  };

  // Sync state if user exists (mock Cloud Run / Live UI integration hooks)
  useEffect(() => {
    if (user) {
      showNotification(`Sinkronisasi Database Firebase Berhasil untuk: ${user.email}`);
    }
  }, [user]);

  // Sidebar Menu categories
  const menuOperasional = [
    { label: 'Dashboard', id: 'dashboard', icon: LayoutGrid },
    { label: 'Job Order', id: 'jobs', icon: FileText },
    { label: 'Trucking & Supir', id: 'trucking', icon: Truck },
    { label: 'Invoice Pajak', id: 'invs', icon: CreditCard },
    { label: 'Waive Repair', id: 'reps', icon: Wrench },
    { label: 'Sirkulasi Finansial', id: 'finance', icon: Wallet },
    { label: 'Master Registry', id: 'master-customers', icon: Users },
    { label: 'Laporan Buku', id: 'reports', icon: ClipboardList },
    { label: 'Pengaturan', id: 'settings', icon: Settings }
  ];

  const allowedMenus = menuOperasional.filter(item => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'DIREKTUR') return true;
    if (item.id === 'dashboard') return true;
    if (item.id === 'jobs') return true;
    if (item.id === 'trucking') return true;
    if (item.id === 'invs') return ['ADMIN_INVOICE', 'FINANCE'].includes(role);
    if (item.id === 'reps') return ['ADMIN_INVOICE', 'FINANCE', 'OPERASIONAL'].includes(role);
    if (item.id === 'finance') return ['ADMIN_INVOICE', 'FINANCE'].includes(role);
    if (item.id === 'master-customers') return ['ADMIN_INVOICE', 'FINANCE', 'CS', 'OPERASIONAL', 'MGR_TRUCKING'].includes(role);
    if (item.id === 'reports') return ['ADMIN_INVOICE', 'FINANCE'].includes(role);
    if (item.id === 'settings') return role === 'DIREKTUR';
    return false;
  });

  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={(loggedUser) => {
          setCurrentUser(loggedUser);
          addAuditLog(loggedUser.name, 'Melakukan Login Ke ERP', `Menggunakan device/session terverifikasi dengan tingkat otoritas: ${loggedUser.role}`);
          showNotification(`Selamat datang kembali, ${loggedUser.name}!`);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden text-slate-800 font-sans antialiased bg-[#f6f8fb] flex relative selection:bg-slate-200 selection:text-slate-900 print:bg-white">
      
      {/* Toast Helper */}
      {lastNotification && (
        <div className="fixed bottom-6 right-6 z-[250] bg-slate-900 border border-slate-750 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR - Hidden when printing via custom css print modifier */}
      <aside className={cx(
        "hidden lg:flex flex-col justify-between p-4 select-none h-screen sticky top-0 shrink-0 shadow-md print:hidden bg-[#1B2B5E] text-white transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-[76px]" : "w-[260px]"
      )}>
        <div className="flex flex-col gap-5">
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 px-1 py-1 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-sm border border-white/20">
              <Truck className="w-5.5 h-5.5 stroke-[2.2] text-yellow-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-300">
                <h1 className="text-[17px] font-black tracking-tight text-white leading-none">FreightOps</h1>
                <p className="text-[9px] font-black uppercase text-yellow-400 tracking-wider mt-1 font-sans">Group Logistics Portal</p>
              </div>
            )}
          </div>

          <hr className="border-white/10" />

          {/* Menus sections */}
          <div>
            {!isSidebarCollapsed && (
              <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono transition-opacity duration-300">
                Sistem Logistik
              </div>
            )}
            <div className="space-y-1">
              {allowedMenus.map((item) => {
                const isActive = activeModule === getModuleOfTabId(item.id);
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    title={isSidebarCollapsed ? item.label : undefined}
                    onClick={() => {
                      setActiveModule(getModuleOfTabId(item.id));
                    }}
                    className={cx(
                       'w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer',
                      isSidebarCollapsed ? 'justify-center' : 'space-x-3',
                      isActive ? 'bg-white/15 text-white shadow-sm border-l-4 border-yellow-400 pl-2' : 'text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                    )}
                  >
                    <IconComp className={cx('w-4.5 h-4.5 shrink-0 transition-colors', isActive ? 'text-yellow-400 stroke-[2.3]' : 'text-slate-300')} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Session Profile & Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-3 overflow-hidden">
          {user && !isSidebarCollapsed && (
            <div className="flex items-center space-x-3 px-1 transition-opacity duration-300">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center text-xs font-black shrink-0">
                {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-black text-white truncate">
                  {user.displayName || (user.isAnonymous ? 'Operator Demo' : 'Staf SSL')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold truncate">
                  {user.email || 'operator@sssl.co.id'}
                </div>
              </div>
            </div>
          )}
          {user && isSidebarCollapsed && (
            <div className="flex justify-center" title={user.displayName || 'Staf SSL'}>
              <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 text-white flex items-center justify-center text-xs font-black shrink-0">
                {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              if (user) logout();
              setCurrentUser(null);
            }}
            className={cx(
              "w-full inline-flex items-center justify-center text-xs font-bold transition cursor-pointer border",
              isSidebarCollapsed
                ? "p-2 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                : "space-x-2 px-4 py-2 text-slate-300 bg-white/5 hover:bg-white/10 border-white/10 hover:text-white rounded-xl"
            )}
            title={isSidebarCollapsed ? 'Keluar Logistik ERP' : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            {!isSidebarCollapsed && <span>Keluar Sistem ERP</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR - Hidden when printing */}
      <div className="fixed inset-0 z-50 flex lg:hidden bg-transparent pointer-events-none print:hidden">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs pointer-events-auto" onClick={() => setIsMobileSidebarOpen(false)} />
        )}
        <aside 
          className={cx(
            'w-[260px] bg-[#1B2B5E] text-white h-full p-5 flex flex-col justify-between shadow-2xl transition duration-200 pointer-events-auto shrink-0 select-none z-50',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Truck size={16} className="text-yellow-400" />
                </div>
                <span className="font-black text-sm">FreightOps</span>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X size={16} className="text-white/60 hover:text-white" />
              </button>
            </div>
            <div className="space-y-1">
              {allowedMenus.map((item) => {
                const isActive = activeModule === getModuleOfTabId(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(getModuleOfTabId(item.id));
                      setIsMobileSidebarOpen(false);
                    }}
                    className={cx(
                      'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all h-10',
                      isActive ? 'bg-white/15 text-white shadow-3xs' : 'text-slate-350 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon size={16} className={isActive ? 'text-yellow-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* RIGHT DISPLAY WORKSPACE */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* TOP COMPONENT HEADER BAR - Hidden when printing */}
        <header className="h-[64px] bg-[#1B4B8A] text-white px-6 flex items-center justify-between z-35 sticky top-0 shrink-0 print:hidden select-none shadow-sm">
          <div className="flex items-center space-x-3.5">
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="font-black text-[12px] tracking-widest text-white font-mono leading-none">
                PT. SUMBER SELAMAT LOGISTIK — GRUP PORTAL INTEGRASI
              </span>
              <span className="bg-yellow-400 text-[#1B2B5E] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">BETA</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-white select-none">
                <div className="w-5 h-5 rounded-lg bg-emerald-400 text-slate-900 flex items-center justify-center font-black text-[10.5px] uppercase shadow-sm shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="hidden sm:block text-left leading-none">
                  <p className="text-[10.5px] font-extrabold text-white leading-none">{currentUser.name}</p>
                  <p className="text-[8px] font-black text-yellow-400 tracking-wider font-mono mt-0.5 uppercase leading-none">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            {/* Notification Bell in Header */}
            {(() => {
              // Hitung alert informatif
              const unassigned = jobs.filter(j => j.status !== 'CLOSED').flatMap(j => j.containers.map(c => ({ job: j, c }))).filter(x => !x.c.driverId);
              const readyInvoice = jobs.filter(j => j.status === 'READY_INVOICE');
              const inProgress = jobs.filter(j => j.status === 'IN_PROGRESS');
              const totalAlerts = unassigned.length + readyInvoice.length;

              return (
                <div className="relative">
                  <button
                    className="p-1.5 rounded-full hover:bg-white/10 transition text-white/90 hover:text-white cursor-pointer relative"
                    onClick={openNotifPanel}
                    title="Notifikasi & Alert"
                  >
                    <Bell size={18} className="stroke-[2.2]" />
                    {totalAlerts > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-red-500 text-white text-[8px] font-black rounded-full border border-[#1B4B8A] flex items-center justify-center leading-none">
                        {totalAlerts}
                      </span>
                    )}
                  </button>

                  {/* Floating notification panel below bell */}
                  {showNotifPanel && (
                    <>
                      <div className="fixed inset-0 z-[140]" onClick={() => setShowNotifPanel(false)} />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-[#1B4B8A]" />
                            <span className="font-black text-xs text-slate-800">Pusat Notifikasi</span>
                          </div>
                          <span className="text-[9px] font-black text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded uppercase tracking-wide">
                            {totalAlerts} Alert
                          </span>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                          {totalAlerts === 0 && (
                            <div className="px-4 py-8 text-center">
                              <p className="text-xs font-bold text-slate-400">Tidak ada alert penting.</p>
                              <p className="text-[10px] text-slate-300 font-semibold mt-1">Semua operasional berjalan normal.</p>
                            </div>
                          )}

                          {/* Kontainer belum ada supir */}
                          {unassigned.length > 0 && (
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <p className="text-[11px] font-black text-red-700">{unassigned.length} Kontainer belum ada supir</p>
                              </div>
                              <div className="space-y-1 pl-4">
                                {unassigned.slice(0, 4).map(({ job: j, c }) => (
                                  <button
                                    key={c.id}
                                    onClick={() => { setShowNotifPanel(false); handleNav('job-detail', j.id, j.noBL.slice(-8), j); }}
                                    className="w-full text-left text-[10px] font-bold text-slate-500 hover:text-blue-700 transition cursor-pointer truncate"
                                  >
                                    • {c.no || c.ukuran} — JO {j.noBL.slice(-8)} ({j.customerId})
                                  </button>
                                ))}
                                {unassigned.length > 4 && (
                                  <p className="text-[10px] font-bold text-slate-300">+{unassigned.length - 4} lainnya…</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* JO siap ditagih */}
                          {readyInvoice.length > 0 && (
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <p className="text-[11px] font-black text-emerald-700">{readyInvoice.length} Job Order siap ditagih</p>
                              </div>
                              <div className="space-y-1 pl-4">
                                {readyInvoice.slice(0, 4).map(j => (
                                  <button
                                    key={j.id}
                                    onClick={() => { setShowNotifPanel(false); handleNav('job-detail', j.id, j.noBL.slice(-8), j); }}
                                    className="w-full text-left text-[10px] font-bold text-slate-500 hover:text-blue-700 transition cursor-pointer truncate"
                                  >
                                    • JO {j.noBL.slice(-8)} ({j.customerId}) — checklist lengkap
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ringkasan in-progress */}
                          {inProgress.length > 0 && (
                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                <p className="text-[11px] font-bold text-slate-600">{inProgress.length} Job Order sedang berjalan</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                          <span className="text-[9px] font-bold text-slate-300">Otomatis tertutup dalam 5 detik</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <button 
              onClick={() => setIsParamOpen(true)}
              className="w-8.5 h-8.5 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer shadow-3xs hover:border-white/30"
              title="Parameter Sektor Perpajakan"
            >
              <Settings size={15} className="stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* WORKSPACE DYNAMIC WINDOW TAB-STRIP - Hidden when printing */}
        <div className="flex items-center space-x-1 px-6 pt-2 bg-[#1B4B8A] border-b border-white/10 overflow-x-auto scrollbar-none shrink-0 select-none print:hidden">
          {allowedMenus.filter(item => openedModules.includes(getModuleOfTabId(item.id))).map((item) => {
            const isCurrentModule = activeModule === getModuleOfTabId(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setActiveModule(getModuleOfTabId(item.id))}
                className={cx(
                  'px-4 py-2 text-xs font-bold transition inline-flex items-center shrink-0 cursor-pointer h-9 rounded-t-lg space-x-1',
                  isCurrentModule 
                    ? 'bg-[#f6f8fb] text-[#1B2B5E] shadow-sm font-semibold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon size={12.5} className="mr-1.5 shrink-0 opacity-80" />
                <span className="tracking-wide text-[11px] whitespace-nowrap">{item.label}</span>
                {item.id !== 'dashboard' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenedModules(prev => prev.filter(m => m !== getModuleOfTabId(item.id)));
                      if (isCurrentModule) {
                        const remaining = openedModules.filter(m => m !== getModuleOfTabId(item.id));
                        const nextMod = remaining[remaining.length - 1] || 'dashboard';
                        setActiveModule(nextMod);
                      }
                    }}
                    className={cx(
                      "rounded-full font-bold ml-1.5 text-[10px] inline-flex items-center justify-center w-3.5 h-3.5 transition-colors",
                      isCurrentModule ? "text-slate-400 hover:text-slate-800 hover:bg-slate-200" : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* SECONDARY MODULE-SPECIFIC SUB-TAB STRIP */}
        {activeModule !== 'dashboard' && moduleSubTabs[activeModule]?.tabs.length > 1 && (
          <div className="flex items-center space-x-1.5 px-6 py-2 bg-white border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0 select-none print:hidden">
            {moduleSubTabs[activeModule].tabs.map((tab) => {
              const isActive = moduleSubTabs[activeModule].active === tab.id;
              const isDefault = ['dashboard', 'jobs', 'invs', 'reps', 'trucking', 'finance', 'master-customers', 'reports', 'settings'].includes(tab.id);
              return (
                <div
                  key={tab.id}
                  onClick={() => setModuleSubTabs(prev => ({
                    ...prev,
                    [activeModule]: {
                      ...prev[activeModule],
                      active: tab.id
                    }
                  }))}
                  className={cx(
                    'px-3 py-1.5 text-[10.5px] font-bold rounded-lg border inline-flex items-center space-x-2 shrink-0 cursor-pointer transition-all',
                    isActive 
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-3xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-755'
                  )}
                >
                  <span>{tab.title}</span>
                  {!isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id, e);
                      }}
                      className={cx(
                        "rounded-full font-bold ml-1.5 text-[10px] inline-flex items-center justify-center w-3.5 h-3.5 transition-colors",
                        isActive ? "text-slate-400 hover:text-slate-800 hover:bg-slate-200" : "text-slate-400 hover:text-slate-750"
                      )}
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* INTERNAL VIEWPORT CONTAINER */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full flex flex-col bg-[#faebff]/5">
          <div className="w-full flex-1 flex flex-col">
            
            {/* View Switching Matrix Router */}
            {(() => {
              const [tabId, payloadId] = activeTabId.split(':');
              const data = tabPayload[activeTabId];

              switch (tabId) {
                case 'dashboard':
                  return <DashboardView jobs={jobs} invs={invs} reps={reps} nav={handleNav} />;
                case 'jobs':
                  return (
                    <JobList 
                      jobs={jobs} 
                      nav={handleNav} 
                      onAddJob={() => handleNav('add-job', 'new', 'Buat Job Order Baru')} 
                      currentUser={currentUser}
                    />
                  );
                case 'job-detail':
                  return (
                    <JobDetail
                      job={data}
                      invs={invs}
                      nav={handleNav}
                      onUpdateJob={handleUpdateJob}
                      onEditJob={(j) => {
                        // Replace detail tab with edit form tab (same position in tab strip)
                        handleReplaceTab(`job-detail:${j.id}`, `add-job:edit-${j.id}`, `Edit JO ${j.id}`, j);
                      }}
                      onDeleteJob={handleDeleteJob}
                      onGenerateInvoice={(j, t) => {
                        handleNav('add-invoice', `job-${j.id}-${t}`, `Rilis Invoice ${t}`, { job: j, type: t });
                      }}
                      drivers={drivers}
                      onAssignDriver={handleAssignDriver}
                      currentUser={currentUser}
                      customerRates={customerRates}
                    />
                  );
                case 'add-job': {
                  const isEdit = payloadId?.startsWith('edit-');
                  const jobToEdit = isEdit ? data : undefined;
                  const currentTabId = activeTabId;

                  return (
                    <JobOrderForm
                      isEdit={isEdit}
                      jobData={jobToEdit}
                      onSave={(savedJob) => {
                        // Clear dirty flag before closing/replacing
                        setDirtyTabs(prev => { const next = new Set(prev); next.delete(currentTabId); return next; });

                        if (isEdit) {
                          setJobs(prev => prev.map(j => j.id === savedJob.id ? savedJob : j));
                          const detailKey = `job-detail:${savedJob.id}`;
                          setTabPayload(prev => ({ ...prev, [detailKey]: savedJob }));
                          showNotification(`Job Order ${savedJob.noBL} berhasil diperbarui.`);
                          // Replace edit tab back with detail tab (same position)
                          handleReplaceTab(currentTabId, detailKey, savedJob.noBL || savedJob.id, savedJob);
                        } else {
                          setJobs(prev => [savedJob, ...prev]);
                          showNotification(`Job Order ${savedJob.noBL} berhasil didaftarkan.`);
                          handleCloseTab(currentTabId, { stopPropagation: () => {} }, true);
                          setActiveTabId('jobs');
                        }
                      }}
                      onCancel={() => {
                        // Clear dirty flag before navigating away
                        setDirtyTabs(prev => { const next = new Set(prev); next.delete(currentTabId); return next; });

                        if (isEdit) {
                          // Go back to the detail view in the same tab position
                          const jobId = payloadId?.replace('edit-', '');
                          const originalJob = jobs.find(j => j.id === jobId);
                          if (originalJob) {
                            const detailKey = `job-detail:${jobId}`;
                            handleReplaceTab(currentTabId, detailKey, originalJob.noBL || jobId!, originalJob);
                          } else {
                            handleCloseTab(currentTabId, { stopPropagation: () => {} }, true);
                          }
                        } else {
                          handleCloseTab(currentTabId, { stopPropagation: () => {} }, true);
                        }
                      }}
                      onDirtyChange={(isDirty) => {
                        setDirtyTabs(prev => {
                          const next = new Set(prev);
                          if (isDirty) next.add(currentTabId);
                          else next.delete(currentTabId);
                          return next;
                        });
                      }}
                      jobsCount={jobs.length}
                      existingJobs={jobs}
                    />
                  );
                }
                case 'add-invoice': {
                  const jobToInvoice = data?.job || data;
                  const typeToInvoice = data?.type || 'INK';
                  const repairDataToInvoice = data?.repairData || null;

                  return (
                    <InvoiceForm 
                      job={jobToInvoice}
                      type={typeToInvoice}
                      customerRates={customerRates}
                      repairData={repairDataToInvoice}
                      onSave={(savedInvoice) => {
                        setInvs(prev => [savedInvoice, ...prev]);
                        
                        // Link invoice ID to job order record
                        if (savedInvoice.jobOrderId && savedInvoice.jobOrderId !== 'JO-DUMMY') {
                          setJobs(prevJobs => prevJobs.map(j => {
                            if (j.id === savedInvoice.jobOrderId) {
                              const nextIds = [...(j.invoiceIds || []), savedInvoice.id];
                              return {
                                ...j,
                                invoiceIds: nextIds,
                                status: nextIds.length >= 3 ? 'INVOICED' as const : j.status
                              };
                            }
                            return j;
                          }));
                        }

                        // If this was a repair invoice, link it back to the repair record!
                        if (savedInvoice.type === 'RMB-A' && repairDataToInvoice) {
                          setReps(prevReps => prevReps.map(r => {
                            if (r.id === repairDataToInvoice.id) {
                              return {
                                ...r,
                                status: 'TERIMA_INV' as any,
                                statusTagih: 'DITAGIHKAN',
                                noInvoice: savedInvoice.noInvoice
                              };
                            }
                            return r;
                          }));
                        }

                        // Close current invoice form tab
                        handleCloseTab(activeTabId, { stopPropagation: () => {} } as any);
                        showNotification(`Invoice ${savedInvoice.noInvoice} berhasil dirilis.`);
                        handleNav('inv-detail', savedInvoice.id, savedInvoice.noInvoice, savedInvoice);
                      }}
                      onCancel={() => {
                        handleCloseTab(activeTabId, { stopPropagation: () => {} } as any);
                      }}
                    />
                  );
                }
                case 'invs':
                  return (
                    <InvList 
                      invs={invs} 
                      nav={handleNav} 
                      onAddInvoice={() => {
                        const firstJob = jobs[0];
                        if (firstJob) {
                          handleNav('add-invoice', `job-${firstJob.id}-INK`, 'Rilis Invoice INK', { job: firstJob, type: 'INK' });
                        } else {
                          alert('Daftarkan minimal satu Job Order terlebih dahulu!');
                        }
                      }} 
                    />
                  );
                case 'inv-detail':
                  return <InvDetail inv={data} onUpdateInvoice={handleUpdateInvoice} currentUser={currentUser} jobs={jobs} />;
                case 'reps':
                  return (
                    <RepairList 
                      reps={reps} 
                      nav={handleNav} 
                      onAddRepair={() => setIsAddRepOpen(true)} 
                    />
                  );
                case 'repair-detail':
                  return (
                    <RepairDetail 
                      rep={data} 
                      onUpdateRepair={handleUpdateRepair} 
                      onGenerateRepairInvoice={handleGenerateRepairInvoice} 
                    />
                  );
                case 'trucking':
                  return (
                    <TruckingView 
                      jobs={jobs} 
                      onAddDriver={() => alert('Sistem Mitra driver penambahan otomatis aktif di panel Master.')} 
                      onAssignSupir={handleAssignSupir} 
                    />
                  );
                case 'finance':
                  return <FinanceView invs={invs} jobs={jobs} />;
                case 'master-customers':
                  return (
                    <MasterDataPage 
                      customerRates={customerRates}
                      onUpdateCustomerRates={handleUpdateCustomerRates}
                      drivers={drivers}
                      setDrivers={setDrivers}
                    />
                  );
                case 'reports':
                  return <Reports invs={invs} jobs={jobs} reps={reps} nav={handleNav} />;
                case 'settings':
                  return (
                    <SettingsView 
                      users={systemUsers} 
                      onUpdateUserRole={(uname, newRole) => {
                        setSystemUsers(prev => prev.map(u => u.username === uname ? { ...u, role: newRole } : u));
                        if (currentUser.username === uname) {
                          setCurrentUser((prev: any) => ({ ...prev, role: newRole }));
                        }
                        addAuditLog(currentUser.name, 'Mengubah Hak Akses / Role', `Mengubah otorisasi user ${uname} menjadi ${newRole}`);
                        showNotification(`Hak otorisasi user ${uname} berhasil dirubah menjadi: ${newRole}`);
                      }} 
                      auditLogs={auditLogs}
                    />
                  );
                default:
                  return <DashboardView jobs={jobs} invs={invs} reps={reps} nav={handleNav} />;
              }
            })()}

          </div>
        </main>

        {/* FOOTER - ENTERPRISE STATUS BAR STYLE */}
        <footer className="w-full text-slate-300 font-medium py-2.5 px-6 shrink-0 border-t border-[#121E42] flex flex-col sm:flex-row items-center justify-between select-none print:hidden bg-[#1B2B5E] text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">FreightOps ERP</span>
            <span className="text-slate-400">&bull;</span>
            <span>PT. SUMBER SELAMAT LOGISTIK &bull; GRUP ERP PORTAL PERPAJAKAN</span>
          </div>
          <div className="flex items-center space-x-4 mt-1.5 sm:mt-0 font-mono text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-extrabold text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">STABLE</span>
            </div>
            <span>v1.0.0-Beta</span>
            <span className="text-slate-400">|</span>
            <span>8-Jun-2026</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              Alert: {jobs.flatMap(j => j.containers).filter(c => !c.driverId).length} Tindakan Tertunda
            </span>
          </div>
        </footer>

      </div>

      {/* Assign Driver Form Modal Drawer */}
      {assignState && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-[99] select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">Pilih Supir Pembawa Container</span>
              <button onClick={() => setAssignState(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {DRIVERS.filter(d => d.status === 'TERSEDIA').map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDriverForAssignByForm(d.id)}
                  className="w-full p-3.5 border border-slate-150 rounded-xl text-left hover:bg-blue-50/20 hover:border-blue-200 transition cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="font-black text-xs text-slate-850">{d.nama}</p>
                    <p className="text-[10px] text-slate-400 font-extrabold block mt-0.5">{d.platNo} ({d.tipe})</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-100/60 rounded px-1.5 py-0.5 text-emerald-700 font-extrabold">TERSEDIA</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal: Unsaved Changes */}
      {closeTabWarning && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className={`px-5 py-4 border-b flex items-center space-x-3 ${closeTabWarning.type === 'edit' ? 'bg-amber-50 border-amber-100' : 'bg-orange-50 border-orange-100'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 ${closeTabWarning.type === 'edit' ? 'text-amber-500' : 'text-orange-500'}`} />
              <span className="font-extrabold text-slate-800 text-xs">
                {closeTabWarning.type === 'edit' ? 'Perubahan Job Order Belum Disimpan' : 'Job Order Baru Belum Disimpan'}
              </span>
            </div>
            <div className="p-5 text-xs text-slate-600 font-semibold leading-relaxed">
              {closeTabWarning.type === 'edit'
                ? 'Anda sedang mengedit Job Order ini. Semua perubahan yang belum disimpan akan hilang jika tab ini ditutup. Yakin ingin menutup?'
                : 'Anda sedang membuat Job Order baru dan sudah mengisi beberapa data. Data yang belum disimpan akan hilang jika tab ini ditutup. Yakin ingin menutup?'
              }
            </div>
            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setCloseTabWarning(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Kembali ke Form
              </button>
              <button
                onClick={() => {
                  const { tabId } = closeTabWarning;
                  setCloseTabWarning(null);
                  handleCloseTab(tabId, { stopPropagation: () => {} }, true);
                }}
                className="px-4 py-2 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-700 cursor-pointer"
              >
                Tutup Tanpa Menyimpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Settings Modal Drawer */}
      {isParamOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-[99]" onClick={() => setIsParamOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 text-left" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">PENGATURAN GRUP PERPAJAKAN</span>
              <button onClick={() => setIsParamOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 font-semibold text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-[#1B2B5E]/5 border border-[#1B2B5E]/10 leading-relaxed text-slate-505">
                Rasio konstanta beacukai logistik terprogram guna auto-kalkulator tagihan rilis:
              </div>

              <div className="space-y-3">
                {[
                  ['Asosiasi PPN Standard', '12.0% (DPF Faktur 04)', 'Sektor PPJK & Handling Jasa'],
                  ['Asosiasi PPN Trucking', '1.1% (Besaran Tertentu Faktur 05)', 'Sektor Ritase Pengantaran'],
                  ['PPh 23 Kontraktor', '2.0% (Opsi Potong Klien)', 'Klaim Jasa Logistik'],
                  ['Uang Kas Jalan Minimum', 'Rp 500.000 / ritase', 'Beban jalan kontainer 40"'],
                ].map(([k, v, s], i) => (
                  <div key={i} className="flex justify-between items-start gap-4 py-2 border-b border-slate-50">
                    <div>
                      <p className="font-extrabold text-slate-800 text-xs leading-none">{k}</p>
                      <p className="text-[9.5px] text-slate-400 font-bold block mt-1">{s}</p>
                    </div>
                    <span className="font-mono font-black text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t bg-slate-50/70 text-right">
              <button onClick={() => setIsParamOpen(false)} className="px-4 py-2 bg-[#1B2B5E] text-white text-xs font-black rounded-lg cursor-pointer">
                Tutup Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT FORM: JO NEW MODAL */}
      {isAddJobOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-[99]" onClick={() => setIsAddJobOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden text-left" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs text-center">PENDAFTARAN JOB ORDER BARU</span>
              <button onClick={() => setIsAddJobOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4 font-semibold text-xs text-slate-650">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">CUSTOMER KLIEN</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50"
                    value={newJob.customerId}
                    onChange={e => setNewJob(prev => ({ ...prev, customerId: e.target.value }))}
                  >
                    {CUSTOMERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">TIPE CARGO</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50"
                    value={newJob.type}
                    onChange={e => setNewJob(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="IMPORT">IMPORT</option>
                    <option value="EXPORT">EXPORT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NOMOR BILL OF LADING (BL)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-black"
                  placeholder="YMJAI240448123"
                  value={newJob.noBL}
                  onChange={e => setNewJob(prev => ({ ...prev, noBL: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NO AJU PPJK</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="029600"
                    value={newJob.noAju}
                    onChange={e => setNewJob(prev => ({ ...prev, noAju: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">ESTIMASI PARTY VOLUME</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-black text-slate-800 bg-slate-50"
                    value={newJob.party}
                    onChange={e => setNewJob(prev => ({ ...prev, party: e.target.value }))}
                  >
                    <option value="1X40">1X40" Container</option>
                    <option value="2X40">2X40" Container</option>
                    <option value="3X40">3X40" Container</option>
                    <option value="1X20">1X20" Container</option>
                    <option value="2X20">2X20" Container</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">JALUR CUSTOMS</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50"
                    value={newJob.jalur}
                    onChange={e => setNewJob(prev => ({ ...prev, jalur: e.target.value as any }))}
                  >
                    <option value="HIJAU">HIJAU</option>
                    <option value="KUNING">KUNING</option>
                    <option value="MERAH">MERAH</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NO CONTAINER UTAMA (C#1)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="YMLU1234567"
                    value={newJob.noContainer}
                    onChange={e => setNewJob(prev => ({ ...prev, noContainer: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NAMA KAPAL (VESSEL)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none"
                    placeholder="EVER GREEN 12"
                    value={newJob.vessel}
                    onChange={e => setNewJob(prev => ({ ...prev, vessel: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">TANGGAL ETA HARI</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold"
                    value={newJob.tglETA}
                    onChange={e => setNewJob(prev => ({ ...prev, tglETA: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold block mb-1">DESKRIPSI BARANG COMITY</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none"
                  placeholder="MIXED VEGETABLES SEED"
                  value={newJob.barang}
                  onChange={e => setNewJob(prev => ({ ...prev, barang: e.target.value }))}
                />
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2 select-none">
                <button 
                  type="button" 
                  onClick={() => setIsAddJobOpen(false)} 
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer shadow-xs hover:bg-blue-700"
                >
                  Daftarkan Job Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INPUT FORM: MANUAL INVOICE MODAL */}
      {isAddInvOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-[99]" onClick={() => setIsAddInvOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden text-left" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">PELAPORAN INVOICE MANUAL BARU</span>
              <button onClick={() => setIsAddInvOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 font-semibold text-xs text-slate-650">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold block mb-1">KLIEN TUJUAN</label>
                <select 
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none bg-slate-50 font-bold"
                  value={newInv.customerId}
                  onChange={e => setNewInv(prev => ({ ...prev, customerId: e.target.value }))}
                >
                  {CUSTOMERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NOMOR INVOICE PENAGIHAN</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="SKD-001/TRK/06/26"
                    value={newInv.noInvoice}
                    onChange={e => setNewInv(prev => ({ ...prev, noInvoice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">LINK JOB ORDER REF</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold bg-slate-50"
                    value={newInv.jobOrderId}
                    onChange={e => setNewInv(prev => ({ ...prev, jobOrderId: e.target.value }))}
                  >
                    <option value="">-- Pilih Job Order --</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.noBL.slice(-8)} ({j.customerId})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">KATEGORI KLAIM</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50"
                    value={newInv.type}
                    onChange={e => setNewInv(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="INK">INKLARING</option>
                    <option value="TRK">TRUCKING</option>
                    <option value="RMB">REIMBURSEMENT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">KONFIGURASI PERPAJAKAN</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50"
                    value={newInv.jenisPajak}
                    onChange={e => setNewInv(prev => ({ ...prev, jenisPajak: e.target.value as any }))}
                  >
                    <option value="DPP_NILAI_LAIN_12">PPN 12% DPP NILAI LAIN (04)</option>
                    <option value="BESARAN_TERTENTU_1_1">PPN 1.1% BESARAN TERTENTU (05)</option>
                    <option value="NO_PPN">BEBAS PPN (REIMBURSE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold block mb-1">DAFTAR MANUAL ITEM UTK PENAGIHAN (Format: Nama Layan, Jumlah IDR)</label>
                <textarea 
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono text-[11px]"
                  placeholder="Jasa Porter, 125000&#10;Tambahan Inap, 300000"
                  rows={3}
                  value={newInv.itemsText}
                  onChange={e => setNewInv(prev => ({ ...prev, itemsText: e.target.value }))}
                />
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2 select-none">
                <button 
                  type="button" 
                  onClick={() => setIsAddInvOpen(false)} 
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer shadow-xs hover:bg-blue-700"
                >
                  Bukukan Invoice Manual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INPUT FORM: WAIVE REPAIR CONTAINER NEW MODAL */}
      {isAddRepOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-[99]" onClick={() => setIsAddRepOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden text-left" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">INPUT ESTIMASI REPAIR DEPONIR</span>
              <button onClick={() => setIsAddRepOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateRepair} className="p-6 space-y-4 font-semibold text-xs text-slate-650">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">KLIEN BEBAN REPAIR</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none bg-slate-50 font-bold"
                    value={newRep.cardId}
                    onChange={e => setNewRep(prev => ({ ...prev, cardId: e.target.value }))}
                  >
                    {CUSTOMERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">REG. NO AJU BEACUKAI</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="028114"
                    value={newRep.noAju}
                    onChange={e => setNewRep(prev => ({ ...prev, noAju: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">KODE CONTAINER (11 Digit)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="YMLU9182371"
                    value={newRep.noContainer}
                    onChange={e => setNewRep(prev => ({ ...prev, noContainer: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">NOMOR BL REF</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="COSCS382103"
                    value={newRep.noBL}
                    onChange={e => setNewRep(prev => ({ ...prev, noBL: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">LINE PELAYARAN</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none"
                    placeholder="YANGMING"
                    value={newRep.pelayaran}
                    onChange={e => setNewRep(prev => ({ ...prev, pelayaran: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">DEPO TRANSIT</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none"
                    placeholder="BSA / TMJ"
                    value={newRep.depo}
                    onChange={e => setNewRep(prev => ({ ...prev, depo: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">BIAYA ESTIMASI REPARASI (IDR)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold"
                    placeholder="1200000"
                    value={newRep.biayaRepair}
                    onChange={e => setNewRep(prev => ({ ...prev, biayaRepair: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold block mb-1">LIFT ON ADM DEPO (IDR)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold"
                    placeholder="40000"
                    value={newRep.biayaAdm}
                    onChange={e => setNewRep(prev => ({ ...prev, biayaAdm: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2 select-none">
                <button 
                  type="button" 
                  onClick={() => setIsAddRepOpen(false)} 
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer shadow-xs hover:bg-blue-700"
                >
                  Kirim Klaim Waive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
