import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  User as UserIcon, 
  PlusCircle, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Trash2,
  FileText
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

// Model definitions for dynamic grid views and logging spk
interface ContainerRow {
  jo_id: string;
  jo_number: string;
  customer_id: string;
  customer_name: string;
  no_aju: string;
  no_bl: string;
  no_kontainer: string;
  ukuran: string;
  tipe: string;
  status_spk: string; // "Belum SPK" | "Sudah SPK"
  jo_status: string;
  pod: string; // Pelabuhan Tujuan
  rute_trucking: string;
}

export default function OperationalView() {
  const { 
    job_orders, 
    spks, 
    master_customers, 
    master_trucks, 
    master_drivers, 
    master_vendors, 
    loadingData, 
    addEntity, 
    updateEntity 
  } = useFirebase();

  // Search, tabs, and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // ALL, BELUM_SPK, SUDAH_SPK

  // Modal control & selected parameters
  const [isSpkModalOpen, setIsSpkModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<ContainerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // localCustomers state mapped via useEffect as per instructions to solve "Unassigned" customers bug
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);

  // TUGAS 1: Fetch and Sync Master Customers in a dedicated useEffect Hook
  useEffect(() => {
    if (master_customers && master_customers.length > 0) {
      setLocalCustomers(master_customers);
    }
  }, [master_customers]);

  // SECTION 1: PENUGASAN ARMADA & SUPIR Form Fields
  const [jenisArmada, setJenisArmada] = useState<'Milik Sendiri' | 'Vendor'>('Milik Sendiri');
  const [idTruk, setIdTruk] = useState('');
  const [idSupir, setIdSupir] = useState('');
  const [idVendorTrucking, setIdVendorTrucking] = useState('');
  const [nopolVendor, setNopolVendor] = useState('');
  const [namaSupirVendor, setNamaSupirVendor] = useState('');

  // SECTION 2: BIAYA TRUCKING (AP / AR TRUCKING)
  const [uangJalanSupir, setUangJalanSupir] = useState<number>(0);
  const [tarifSewaVendor, setTarifSewaVendor] = useState<number>(0);
  const [biayaTambahanTrucking, setBiayaTambahanTrucking] = useState<Array<{ jenis: string; nominal: number }>>([]);

  // SECTION 3: OPERASIONAL INKLARING (AP / AR INKLARING)
  const [feeOpsDasar, setFeeOpsDasar] = useState<number>(0);
  const [biayaTambahanInklaring, setBiayaTambahanInklaring] = useState<Array<{ jenis: string; id_vendor: string; nominal_pembayaran: number; fee_ops_tambahan: number }>>([]);

  // SECTION 4: REIMBURSEMENT (AP / AR REIMBURSE)
  const [biayaTalanganReimburse, setBiayaTalanganReimburse] = useState<Array<{ jenis: string; nominal: number }>>([]);

  // Toast message trigger helper
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper helper to resolve customer name from real-time customer cache
  const getCustomerName = (idCust: string) => {
    const cust = (localCustomers || []).find(c => c.id === idCust);
    if (!cust) return 'Unassigned';
    return cust.nama_perusahaan || cust.companyName || cust.name || 'Unassigned';
  };

  // Rupiah Currency Formatter
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  // Thousand format on input keystroke
  const formatThousandSeparator = (num: number) => {
    if (num === 0 || !num) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Parse structured formatted currency inputs to raw numbers
  const parseFormattedNumber = (val: string) => {
    const cleanStr = val.replace(/\D/g, '');
    return cleanStr === '' ? 0 : Number(cleanStr);
  };

  // Clean vehicle license plates formatter to Indonesian plate standard (e.g., A 1111 AA)
  const formatLicensePlate = (value: string) => {
    let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const lettersMatch = clean.match(/^([A-Z]{1,2})/);
    if (!lettersMatch) return clean;

    const p1 = lettersMatch[1];
    let rest = clean.substring(p1.length);
    
    const digitsMatch = rest.match(/^([0-9]{0,4})/);
    if (!digitsMatch) return p1;
    
    const p2 = digitsMatch[1];
    let rest2 = rest.substring(p2.length);
    
    const endLettersMatch = rest2.match(/^([A-Z]{0,3})/);
    const p3 = endLettersMatch ? endLettersMatch[1] : '';
    
    return `${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trim();
  };

  // Filter job orders with status_jo === "Siap Kirim" ONLY
  const readyJobOrders = (job_orders || []).filter(jo => jo.status_jo === 'Siap Kirim');

  // Map Job Order containers to readable rows
  const containerList: ContainerRow[] = [];
  readyJobOrders.forEach(jo => {
    const contArray = jo.containers || [];
    contArray.forEach((c: any) => {
      // Check check if we have matching SPK documents
      const hasSpkRecord = (spks || []).some(s => s.id_job_order === jo.id && s.no_kontainer === c.no_kontainer);
      const isSpkDone = c.status_spk === 'Sudah SPK' || hasSpkRecord;

      containerList.push({
        jo_id: jo.id,
        jo_number: jo.jo_number || '',
        customer_id: jo.id_customer || '',
        customer_name: getCustomerName(jo.id_customer),
        no_aju: jo.no_aju || '-',
        no_bl: jo.no_bl || '-',
        no_kontainer: c.no_kontainer || '',
        ukuran: c.ukuran || '20',
        tipe: c.tipe || 'Dry',
        status_spk: isSpkDone ? 'Sudah SPK' : 'Belum SPK',
        jo_status: jo.status_jo || '',
        pod: jo.pod || '-',
        rute_trucking: joinUnifyingRoute(jo.pol, jo.pod)
      });
    });
  });

  // Helper utility to draw clean standard trucking route
  function joinUnifyingRoute(pol: string, pod: string) {
    if (!pol && !pod) return '-';
    return `${pol || 'Asal'} ➔ ${pod || 'Tujuan'}`;
  }

  // Filter container list using search and tabs
  const filteredContainers = containerList.filter(row => {
    const q = searchQuery.toLowerCase();
    const matchQuery = !q ? true : (
      row.jo_number.toLowerCase().includes(q) ||
      row.customer_name.toLowerCase().includes(q) ||
      row.no_kontainer.toLowerCase().includes(q) ||
      row.no_aju.toLowerCase().includes(q) ||
      row.no_bl.toLowerCase().includes(q) ||
      row.ukuran.toLowerCase().includes(q) ||
      row.tipe.toLowerCase().includes(q) ||
      row.pod.toLowerCase().includes(q)
    );

    const matchStatus = selectedStatusFilter === 'ALL' ? true : (
      selectedStatusFilter === 'BELUM_SPK' ? row.status_spk === 'Belum SPK' : row.status_spk === 'Sudah SPK'
    );

    return matchQuery && matchStatus;
  });

  // Safe SPK Serial Auto generation (SPK-YYYYMMDD-XXXX)
  const getNextSpkNumber = (existingSpks: any[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const todaySpks = (existingSpks || []).filter(s => s.spk_number && s.spk_number.startsWith(`SPK-${dateStr}-`));
    const nextNum = todaySpks.length + 1;
    const seqStr = String(nextNum).padStart(4, '0');
    return `SPK-${dateStr}-${seqStr}`;
  };

  // Open the Modal View with state initializations
  const handleOpenSpkModal = (row: ContainerRow) => {
    setSelectedContainer(row);
    setJenisArmada('Milik Sendiri');
    setIdTruk('');
    setIdSupir('');
    setIdVendorTrucking('');
    setNopolVendor('');
    setNamaSupirVendor('');

    setUangJalanSupir(0);
    setTarifSewaVendor(0);
    setBiayaTambahanTrucking([]);

    setFeeOpsDasar(0);
    setBiayaTambahanInklaring([]);

    setBiayaTalanganReimburse([]);

    setIsSpkModalOpen(true);
  };

  // Safe Submission Handler with transactional consistency
  const handleSaveSpk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContainer) return;

    // Direct error validations
    if (jenisArmada === 'Milik Sendiri') {
      if (!idTruk) {
        alert('Ups! Harap tentukan plat nomor truk internal terlebih dahulu!');
        return;
      }
      if (!idSupir) {
        alert('Ups! Harap tentukan supir internal untuk perjalanan ini!');
        return;
      }
    } else {
      if (!idVendorTrucking) {
        alert('Ups! Harap tentukan vendor trucking kemitraan terlebih dahulu!');
        return;
      }
      if (!nopolVendor.trim()) {
        alert('Ups! Silakan ketik nopol armada vendor!');
        return;
      }
      if (!namaSupirVendor.trim()) {
        alert('Ups! Silakan ketik nama driver vendor!');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const uniqueSpkNo = getNextSpkNumber(spks);

      // Construct core dispatching SPK document
      const spkPayload = {
        spk_number: uniqueSpkNo,
        id_job_order: selectedContainer.jo_id,
        jo_number: selectedContainer.jo_number,
        no_kontainer: selectedContainer.no_kontainer,
        ukuran: selectedContainer.ukuran,
        tipe: selectedContainer.tipe,
        pod: selectedContainer.pod,
        customer_id: selectedContainer.customer_id,
        customer_name: selectedContainer.customer_name,
        jenis_armada: jenisArmada,

        // Penugasan Detail fields
        id_truk: jenisArmada === 'Milik Sendiri' ? idTruk : null,
        id_supir: jenisArmada === 'Milik Sendiri' ? idSupir : null,
        id_vendor_trucking: jenisArmada === 'Vendor' ? idVendorTrucking : null,
        nopol_vendor: jenisArmada === 'Vendor' ? nopolVendor : null,
        nama_supir_vendor: jenisArmada === 'Vendor' ? namaSupirVendor : null,

        // Financial costs values
        uang_jalan_supir: jenisArmada === 'Milik Sendiri' ? uangJalanSupir : 0,
        tarif_sewa_vendor: jenisArmada === 'Vendor' ? tarifSewaVendor : 0,
        biaya_tambahan_trucking: biayaTambahanTrucking,

        // Inklaring data limits
        fee_ops_dasar: feeOpsDasar,
        biaya_tambahan_inklaring: biayaTambahanInklaring,

        // Reimbursements
        biaya_talangan_reimburse: biayaTalanganReimburse,

        tanggal_spk: new Date().toISOString(),
        status_spk: 'Disetujui'
      };

      // Dual save to Firestore to respect schema bindings
      await addEntity('spks', spkPayload);
      await addEntity('surat_perintah_kerja', spkPayload);

      // TUGAS 4: Change clicked container state status inside raw Job Order to "Sudah SPK"
      const parentJo = (job_orders || []).find(j => j.id === selectedContainer.jo_id);
      if (parentJo) {
        const updatedContainers = (parentJo.containers || []).map((c: any) => {
          if (c.no_kontainer === selectedContainer.no_kontainer) {
            return {
              ...c,
              status_spk: 'Sudah SPK'
            };
          }
          return c;
        });

        await updateEntity('job_orders', selectedContainer.jo_id, {
          containers: updatedContainers
        });
      }

      // TUGAS 4: Set Used Internal Truck availability state to "On-Duty"
      if (jenisArmada === 'Milik Sendiri' && idTruk) {
        await updateEntity('master_trucks', idTruk, {
          status: 'On-Duty'
        });
      }

      triggerNotification(`Sukses: SPK ${uniqueSpkNo} diterbitkan & armada internal disinkronkan!`);
      setIsSpkModalOpen(false);
    } catch (err: any) {
      console.error('Error saving SPK workflow dispatch:', err);
      alert('Gagal mendispatch SPK: ' + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Auto Calculations
  const subTotalBiayaTambahanTrucking = biayaTambahanTrucking.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const totalTruckingCost = jenisArmada === 'Milik Sendiri' 
    ? uangJalanSupir + subTotalBiayaTambahanTrucking 
    : tarifSewaVendor + subTotalBiayaTambahanTrucking;

  const totalInklaringCost = feeOpsDasar + biayaTambahanInklaring.reduce((acc, curr) => acc + (curr.nominal_pembayaran || 0) + (curr.fee_ops_tambahan || 0), 0);
  const totalReimbursementCost = biayaTalanganReimburse.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const grandTotalCost = totalTruckingCost + totalInklaringCost + totalReimbursementCost;

  // Filter trucks list based on "Available" state as explicitly required on Sect 1
  const availableTrucksOnDuty = (master_trucks || []).filter(t => 
    t.kepemilikan === 'Milik Sendiri' && 
    (!t.status || t.status === 'Available' || t.status === 'Tersedia')
  );

  return (
    <div className="space-y-6" id="operational-view-container">
      {/* Toast Popups notifier */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-905 bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs tracking-wide animate-in slide-in-from-bottom duration-300" id="toast-wrapper">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>{notification}</span>
        </div>
      )}

      {/* Statistics Header Grid Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300" id="stats-dashboard-grid">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between" id="card-total-containers">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Rencana Kirim</span>
            <div className="text-xl font-black text-slate-800 tracking-tight">{containerList.length} Kontainer</div>
            <p className="text-[10px] text-slate-500 font-semibold">Ber-status "Siap Kirim"</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between" id="card-unassigned-spks">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Menunggu SPK</span>
            <div className="text-xl font-black text-amber-600 tracking-tight">
              {containerList.filter(c => c.status_spk === 'Belum SPK').length} Unit
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Butuh Plotting Armada</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between" id="card-assigned-spks">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ditugaskan (SPK)</span>
            <div className="text-xl font-black text-emerald-600 tracking-tight">
              {containerList.filter(c => c.status_spk === 'Sudah SPK').length} Unit
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">SPK Berhasil Diterbitkan</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between" id="card-total-spks-log">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Log SPK</span>
            <div className="text-xl font-black text-indigo-700 tracking-tight">{(spks || []).length} Disimpan</div>
            <p className="text-[10px] text-slate-500 font-semibold font-mono font-bold">Log Record Database</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-indigo-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Filter and Layout Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-3xs space-y-4 p-5" id="main-data-table-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Daftar Kontainer Logistik Siap Kirim</h3>
            <p className="text-xs text-slate-400 font-semibold">Menampilkan baris kontainer dari Job Order aktif berstatus "Siap Kirim"</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Real-time filters and filter tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold uppercase text-slate-500">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${selectedStatusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-700'}`}
                id="tab-filter-all"
              >
                Semua ({containerList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('BELUM_SPK')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${selectedStatusFilter === 'BELUM_SPK' ? 'bg-white text-amber-700 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-700'}`}
                id="tab-filter-belum"
              >
                Belum SPK ({containerList.filter(c => c.status_spk === 'Belum SPK').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('SUDAH_SPK')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition ${selectedStatusFilter === 'SUDAH_SPK' ? 'bg-white text-emerald-700 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-700'}`}
                id="tab-filter-sudah"
              >
                Sudah SPK ({containerList.filter(c => c.status_spk === 'Sudah SPK').length})
              </button>
            </div>

            {/* Quick search panel field */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari No. JO, Kontainer, Customer, Aju, BL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-9 pr-4 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                id="container-search-field"
              />
            </div>
          </div>
        </div>

        {/* Dynamic containers Table wrapper */}
        {loadingData?.job_orders || loadingData?.spks ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3" id="operation-loading-spinner">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase font-sans">Menyelaraskan data real-time...</p>
          </div>
        ) : filteredContainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl py-12 px-4 text-center space-y-3" id="no-content-indicator">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-700 uppercase">Kontainer Tidak Ditemukan</h4>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                Tidak ada data kontainer logistik yang cocok dengan kriteria filter pencarian.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl animate-in fade-in duration-300" id="containers-operational-table-wrapper">
            <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 font-mono">No JO</th>
                  <th className="py-3.5 px-4 font-sans">Nama Customer</th>
                  <th className="py-3.5 px-4 font-mono">No Aju</th>
                  <th className="py-3.5 px-4 font-mono">No BL</th>
                  <th className="py-3.5 px-4 font-mono">No Kontainer</th>
                  <th className="py-3.5 px-4 font-sans">Ukuran/Tipe</th>
                  <th className="py-3.5 px-4 font-sans">Rute Trucking</th>
                  <th className="py-3.5 px-4 text-center">Status SPK</th>
                  <th className="py-3.5 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredContainers.map((row, idx) => {
                  const isAlreadySpk = row.status_spk === 'Sudah SPK';
                  return (
                    <tr key={`${row.jo_id}-${row.no_kontainer}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 font-mono text-[11px]">{row.jo_number}</td>
                      <td className="py-4 px-4 text-slate-800 font-extrabold max-w-[170px] truncate">{row.customer_name}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">{row.no_aju}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">{row.no_bl}</td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-700 tracking-wide whitespace-nowrap">{row.no_kontainer}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] uppercase font-bold whitespace-nowrap">
                          {row.ukuran}FT / {row.tipe}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 uppercase font-bold text-[10px] whitespace-nowrap">{row.rute_trucking}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isAlreadySpk
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAlreadySpk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{row.status_spk}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isAlreadySpk ? (
                          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Terbit SPK</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSpkModal(row)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg inline-flex items-center space-x-1.5 transition shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                            id={`btn-spk-trigger-${idx}`}
                          >
                            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Buat SPK</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historically Issued SPKs Ledger Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-3xs p-5 space-y-4" id="historical-spk-vault">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center space-x-2">
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Historis SPK &amp; Rekap Keuangan Logistik Keluar</span>
          </h3>
          <p className="text-xs text-slate-400 font-semibold">Jurnal lengkap data Surat Perintah Kerja (SPK) logistik multi-section yang tersimpan</p>
        </div>

        {(!spks || spks.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Belum ada SPK terdaftar yang tersimpan di database sistem.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl transition duration-300">
            <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 font-mono">No. SPK</th>
                  <th className="py-3 px-4">No. JO / Kontainer</th>
                  <th className="py-3 px-4">Tipe / Armada</th>
                  <th className="py-3 px-4">Supir &amp; Unit Detail</th>
                  <th className="py-3 px-4 text-right">Biaya Trucking</th>
                  <th className="py-3 px-4 text-right">Ops Inklaring</th>
                  <th className="py-3 px-4 text-right">Talangan Reimburse</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {spks.map((spk, idx) => {
                  const isMilikSendiri = spk.jenis_armada === 'Milik Sendiri';
                  const trukObj = isMilikSendiri ? (master_trucks || []).find(t => t.id === spk.id_truk) : null;
                  const supirObj = isMilikSendiri ? (master_drivers || []).find(d => d.id === spk.id_supir) : null;
                  const vendorObj = !isMilikSendiri ? (master_vendors || []).find(v => v.id === spk.id_vendor_trucking) : null;

                  // Historical dynamic sums
                  const baseTruckingCost = isMilikSendiri ? (spk.uang_jalan_supir || 0) : (spk.tarif_sewa_vendor || 0);
                  const additionalTruckingSum = (spk.biaya_tambahan_trucking || []).reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);
                  const spkTruckingTotal = baseTruckingCost + additionalTruckingSum;

                  const baseInklaring = spk.fee_ops_dasar || 0;
                  const additionalInklaringSum = (spk.biaya_tambahan_inklaring || []).reduce((acc: number, curr: any) => acc + (curr.nominal_pembayaran || 0) + (curr.fee_ops_tambahan || 0), 0);
                  const spkInklaringTotal = baseInklaring + additionalInklaringSum;

                  const spkReimbursementTotal = (spk.biaya_talangan_reimburse || []).reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);

                  return (
                    <tr key={`${spk.id || idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-blue-700 font-mono text-[11px]">{spk.spk_number || spk.id}</div>
                        <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                          {spk.tanggal_spk ? new Date(spk.tanggal_spk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 font-mono text-[11px]">{spk.jo_number || '-'}</div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold whitespace-nowrap">{spk.no_kontainer || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                          isMilikSendiri 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {spk.jenis_armada || 'Internal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isMilikSendiri ? (
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-extrabold text-xs flex items-center space-x-1 whitespace-nowrap">
                              <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{trukObj ? trukObj.nopol : 'Unit No-Plat'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1 whitespace-nowrap">
                              <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{supirObj ? supirObj.nama_supir : 'Supir Utama'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-extrabold text-xs whitespace-nowrap overflow-hidden max-w-[160px] truncate">
                              {vendorObj ? (vendorObj.companyName || vendorObj.name) : 'Vendor Keagenan'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 font-black uppercase whitespace-nowrap">
                              {spk.nopol_vendor || '-'} / {spk.nama_supir_vendor || '-'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-slate-900 font-black font-mono text-[11px]">{formatRupiah(spkTruckingTotal)}</div>
                        <div className="text-[9px] text-slate-400">
                          Tarif: {formatRupiah(baseTruckingCost)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-slate-900 font-black font-mono text-[11px]">{formatRupiah(spkInklaringTotal)}</div>
                        <div className="text-[9px] text-slate-400">
                          Add: {(spk.biaya_tambahan_inklaring || []).length} Item
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-slate-900 font-black font-mono text-[11px]">{formatRupiah(spkReimbursementTotal)}</div>
                        <div className="text-[9px] text-slate-400">
                          Reimb: {(spk.biaya_talangan_reimburse || []).length} Item
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                          {spk.status_spk || 'Disetujui'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enterprise-grade Multi-Section dynamic Modal for issuing SPKs */}
      <Modal
        isOpen={isSpkModalOpen}
        onClose={() => !isSubmitting && setIsSpkModalOpen(false)}
        title="BUAT SURAT PERINTAH KERJA (SPK) LOGISTIK ENTERPRISE"
        className="max-w-6xl w-full"
        contentClassName="p-0 overflow-y-auto max-h-[85vh] flex flex-col"
      >
        <form onSubmit={handleSaveSpk} className="flex flex-col h-full bg-slate-50" id="spk-modal-form">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* TUGAS 2: CORE INFO HEADER GRID (No JO, Customer, No Aju, No BL, No Kontainer, Ukuran/Tipe) */}
            {selectedContainer && (
              <div className="p-4 bg-blue-50 border border-blue-105 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-3xs" id="spk-modal-header-banner">
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="bg-blue-600 text-white rounded-xl p-2.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase">Input SPK Kontainer</h4>
                    <p className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold font-sans">
                      Formulir Multi-Section Terintegrasi
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-left text-xs bg-white p-4 rounded-xl border border-slate-200/90 flex-1 ml-0 xl:ml-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">No JO</span>
                    <span className="font-extrabold text-slate-900 font-mono text-[11.5px]">{selectedContainer.jo_number}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">Nama Customer</span>
                    <span className="font-black text-indigo-900 truncate block max-w-[140px]">{selectedContainer.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">No Aju</span>
                    <span className="font-bold text-slate-700 font-mono text-[11px]">{selectedContainer.no_aju}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">No BL</span>
                    <span className="font-bold text-slate-700 font-mono text-[11px]">{selectedContainer.no_bl}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">No Kontainer</span>
                    <span className="font-black text-slate-900 font-mono tracking-wide">{selectedContainer.no_kontainer}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none mb-1">Ukuran/Tipe</span>
                    <span className="font-black text-slate-800 uppercase tracking-dense text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block">
                      {selectedContainer.ukuran}FT / {selectedContainer.tipe}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form grid sections container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
              
              {/* TUGAS 3: SECTION 1 - PENUGASAN ARMADA & SUPIR */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4" id="section-penugasan-armada">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white w-5 h-5 rounded-full text-[10px] font-black font-mono">1</span>
                  <span>SECTION 1: PENUGASAN ARMADA</span>
                </h4>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      Tipe / Jenis Pengiriman
                    </label>
                    <select
                      value={jenisArmada}
                      onChange={(e) => {
                        setJenisArmada(e.target.value as 'Milik Sendiri' | 'Vendor');
                        if (e.target.value === 'Milik Sendiri') {
                          setIdVendorTrucking('');
                          setNopolVendor('');
                          setNamaSupirVendor('');
                          setTarifSewaVendor(0);
                        } else {
                          setIdTruk('');
                          setIdSupir('');
                          setUangJalanSupir(0);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer transition text-[11px]"
                      id="input-jenis-armada"
                    >
                      <option value="Milik Sendiri">Milik Sendiri (Armada Internal)</option>
                      <option value="Vendor">Vendor (Trucking Luar / Eksternal)</option>
                    </select>
                  </div>

                  {jenisArmada === 'Milik Sendiri' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                          Pilih Unit Truk (Internal - Available) *
                        </label>
                        <select
                          value={idTruk}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIdTruk(val);
                            const selectTruk = (master_trucks || []).find(t => t.id === val);
                            if (selectTruk && selectTruk.id_supir_utama) {
                              setIdSupir(selectTruk.id_supir_utama);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-850 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer transition text-[11px]"
                          id="input-id-truk"
                        >
                          <option value="">-- PILIH UNIT TRUK --</option>
                          {availableTrucksOnDuty.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.nopol} - {t.jenis_truk || 'Internal'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                          Pilih Supir / Driver *
                        </label>
                        <select
                          value={idSupir}
                          onChange={(e) => setIdSupir(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-850 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer transition text-[11px]"
                          id="input-id-supir"
                        >
                          <option value="">-- PILIH SUPIR --</option>
                          {(master_drivers || []).filter(d => (d.status_karyawan || d.status_ketersediaan || 'Aktif') === 'Aktif').map(d => (
                            <option key={d.id} value={d.id}>
                              {d.nama_supir} {d.no_hp ? `(${d.no_hp})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">
                          Partner Vendor Trucking *
                        </label>
                        <select
                          value={idVendorTrucking}
                          onChange={(e) => setIdVendorTrucking(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-850 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer transition text-[11px]"
                          id="input-vendor-trucking"
                        >
                          <option value="">-- PILIH MITRA VENDOR TRUCKING --</option>
                          {(master_vendors || []).filter(v => v.category === 'Trucking' || v.kategori === 'Trucking').map(v => (
                            <option key={v.id} value={v.id}>
                              {v.companyName || v.nama_vendor || v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                            Nopol Vendor *
                          </label>
                          <input
                            type="text"
                            placeholder="A 1111 AA"
                            value={nopolVendor}
                            onChange={(e) => setNopolVendor(formatLicensePlate(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition uppercase text-[11px]"
                            id="input-nopol-vendor"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                            Nama Supir Vendor *
                          </label>
                          <input
                            type="text"
                            placeholder="Type Driver Name"
                            value={namaSupirVendor}
                            onChange={(e) => setNamaSupirVendor(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition text-[11px]"
                            id="input-supir-vendor"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TUGAS 3: SECTION 2 - BIAYA TRUCKING (AP / AR TRUCKING) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4" id="section-biaya-trucking">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white w-5 h-5 rounded-full text-[10px] font-black font-mono">2</span>
                  <span>SECTION 2: BIAYA TRUCKING</span>
                </h4>

                <div className="space-y-4">
                  {jenisArmada === 'Milik Sendiri' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        Uang Jalan Supir Utama (IDR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          value={formatThousandSeparator(uangJalanSupir)}
                          onChange={(e) => setUangJalanSupir(parseFormattedNumber(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-8 pr-3 py-2 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                          id="input-uang-jalan-supir"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        Tarif Sewa Vendor Trucking (IDR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          value={formatThousandSeparator(tarifSewaVendor)}
                          onChange={(e) => setTarifSewaVendor(parseFormattedNumber(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-8 pr-3 py-2 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                          id="input-tarif-vendor"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Array Row - Tambah Biaya */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                        Tambahan Biaya Trucking (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => setBiayaTambahanTrucking([...biayaTambahanTrucking, { jenis: 'Inap', nominal: 0 }])}
                        className="text-[9px] font-black text-blue-700 hover:text-blue-800 flex items-center space-x-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                        id="btn-add-biaya-trucking"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>+ TAMBAH BIAYA TRUCKING</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {biayaTambahanTrucking.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                          <select
                            value={item.jenis}
                            onChange={(e) => {
                              const updated = [...biayaTambahanTrucking];
                              updated[index].jenis = e.target.value;
                              setBiayaTambahanTrucking(updated);
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none transition w-1/3 cursor-pointer"
                          >
                            <option value="Inap">Inap</option>
                            <option value="Tuslah">Tuslah</option>
                            <option value="Uang Bongkar">Uang Bongkar</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>

                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                            <input
                              type="text"
                              value={formatThousandSeparator(item.nominal)}
                              onChange={(e) => {
                                const updated = [...biayaTambahanTrucking];
                                updated[index].nominal = parseFormattedNumber(e.target.value);
                                setBiayaTambahanTrucking(updated);
                              }}
                              placeholder="0"
                              className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs font-semibold outline-none transition"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setBiayaTambahanTrucking(biayaTambahanTrucking.filter((_, idx) => idx !== index))}
                            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Hapus baris biaya"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {biayaTambahanTrucking.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada tambahan pengeluaran trucking yang dimasukkan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TUGAS 3: SECTION 3 - OPERASIONAL INKLARING */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4" id="section-operasional-inklaring">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white w-5 h-5 rounded-full text-[10px] font-black font-mono">3</span>
                  <span>SECTION 3: OPERASIONAL INKLARING</span>
                </h4>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      Fee Ops Dasar Pengurusan (IDR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={formatThousandSeparator(feeOpsDasar)}
                        onChange={(e) => setFeeOpsDasar(parseFormattedNumber(e.target.value))}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-8 pr-3 py-2 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                        id="input-fee-ops-dasar"
                      />
                    </div>
                  </div>

                  {/* Operasional Tambahan (Dynamic Array) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                        Biaya Tambahan Operasional Inklaring
                      </label>
                      <button
                        type="button"
                        onClick={() => setBiayaTambahanInklaring([...biayaTambahanInklaring, { jenis: 'Karantina', id_vendor: '', nominal_pembayaran: 0, fee_ops_tambahan: 0 }])}
                        className="text-[9px] font-black text-blue-700 hover:text-blue-800 flex items-center space-x-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                        id="btn-add-inklaring"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>+ TAMBAH OPERASIONAL INKLARING</span>
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {biayaTambahanInklaring.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={item.jenis}
                              onChange={(e) => {
                                const updated = [...biayaTambahanInklaring];
                                updated[index].jenis = e.target.value;
                                setBiayaTambahanInklaring(updated);
                              }}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 w-[42%] text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="Karantina">Karantina</option>
                              <option value="Behandle">Behandle</option>
                              <option value="Genset">Genset</option>
                              <option value="Titipan">Titipan</option>
                            </select>

                            <select
                              value={item.id_vendor || ''}
                              onChange={(e) => {
                                const updated = [...biayaTambahanInklaring];
                                updated[index].id_vendor = e.target.value;
                                setBiayaTambahanInklaring(updated);
                              }}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 w-[50%] text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="">-- VENDOR 3P (OPTIONAL) --</option>
                              {(master_vendors || []).map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.companyName || v.nama_vendor || v.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => setBiayaTambahanInklaring(biayaTambahanInklaring.filter((_, idx) => idx !== index))}
                              className="text-red-500 hover:text-red-650 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Pembayaran (IDR)</span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="text"
                                  value={formatThousandSeparator(item.nominal_pembayaran)}
                                  onChange={(e) => {
                                    const updated = [...biayaTambahanInklaring];
                                    updated[index].nominal_pembayaran = parseFormattedNumber(e.target.value);
                                    setBiayaTambahanInklaring(updated);
                                  }}
                                  placeholder="0"
                                  className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-1.5 py-1 text-xs font-semibold outline-none transition"
                                />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Fee OPS Tambah (IDR)</span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="text"
                                  value={formatThousandSeparator(item.fee_ops_tambahan)}
                                  onChange={(e) => {
                                    const updated = [...biayaTambahanInklaring];
                                    updated[index].fee_ops_tambahan = parseFormattedNumber(e.target.value);
                                    setBiayaTambahanInklaring(updated);
                                  }}
                                  placeholder="0"
                                  className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-1.5 py-1 text-xs font-semibold outline-none transition"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {biayaTambahanInklaring.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada tambahan operasional inklaring yang didaftarkan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TUGAS 3: SECTION 4 - REIMBURSEMENT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4" id="section-reimbursements">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white w-5 h-5 rounded-full text-[10px] font-black font-mono">4</span>
                  <span>SECTION 4: REIMBURSEMENT</span>
                </h4>

                <div className="space-y-4">
                  {/* Dynamic Array Row - Reimbursements */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                        Daftar Talangan Reimbursement (DO/Storage)
                      </label>
                      <button
                        type="button"
                        onClick={() => setBiayaTalanganReimburse([...biayaTalanganReimburse, { jenis: 'DO', nominal: 0 }])}
                        className="text-[9px] font-black text-blue-700 hover:text-blue-800 flex items-center space-x-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                        id="btn-add-talangan-reimburse"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>+ TAMBAH TALANGAN REIMBURSE</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                      {biayaTalanganReimburse.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                          <select
                            value={item.jenis}
                            onChange={(e) => {
                              const updated = [...biayaTalanganReimburse];
                              updated[index].jenis = e.target.value;
                              setBiayaTalanganReimburse(updated);
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none w-1/3 cursor-pointer"
                          >
                            <option value="DO">DO</option>
                            <option value="Storage">Storage</option>
                            <option value="Lift On">Lift On</option>
                            <option value="Lift Off">Lift Off</option>
                            <option value="Repair">Repair</option>
                          </select>

                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                            <input
                              type="text"
                              value={formatThousandSeparator(item.nominal)}
                              onChange={(e) => {
                                const updated = [...biayaTalanganReimburse];
                                updated[index].nominal = parseFormattedNumber(e.target.value);
                                setBiayaTalanganReimburse(updated);
                              }}
                              placeholder="0"
                              className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs font-semibold outline-none transition"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setBiayaTalanganReimburse(biayaTalanganReimburse.filter((_, idx) => idx !== index))}
                            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                      {biayaTalanganReimburse.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada tambahan dana talangan reimbursement.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Calculations Summary display plate */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-700 animate-in zoom-in-95 duration-200" id="live-calculator-board">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-450 bg-blue-500 animate-ping"></span>
                    <span>Live Auto Calculator</span>
                  </span>
                  <p className="text-xs text-slate-300">Estimasi keuangan SPK dihitung secara realtime berdasarkan parameter input di atas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 text-xs">
                  <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 uppercase block mb-0.5 font-bold">Trucking AP</span>
                    <span className="font-extrabold text-blue-300 font-mono text-[12.5px]">{formatRupiah(totalTruckingCost)}</span>
                  </div>
                  <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 uppercase block mb-0.5 font-bold">Inklaring AP/AR</span>
                    <span className="font-extrabold text-emerald-300 font-mono text-[12.5px]">{formatRupiah(totalInklaringCost)}</span>
                  </div>
                  <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 uppercase block mb-0.5 font-bold">Talangan</span>
                    <span className="font-extrabold text-indigo-300 font-mono text-[12.5px]">{formatRupiah(totalReimbursementCost)}</span>
                  </div>
                  <div className="bg-blue-600 px-5 py-3 rounded-xl border border-blue-500 flex items-center shadow-md">
                    <div>
                      <span className="text-[9px] text-blue-100 uppercase block font-black">Grand Total</span>
                      <span className="font-black text-sm font-mono text-white whitespace-nowrap">{formatRupiah(grandTotalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Actions form actions */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3 z-10" id="spk-modal-footer">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsSpkModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-lg transition disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              id="form-btn-cancel"
            >
              Batal / Tutup
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50 uppercase tracking-widest"
              id="form-btn-submit"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin shrink-0"></div>
                  <span>Menyimpan SPK...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>TERBITKAN SPK LOGISTIK</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
