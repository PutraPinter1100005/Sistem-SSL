import React, { useState, useRef } from "react";
import { Plus, Trash2, ArrowLeft, Save, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { JobOrder, Container, MilestoneItem, Milestone } from "../types/erp";
import { Card, Btn, Bdg } from "./Shared";
import { CUSTOMERS, SVC_TRK, makeMilestoneTemplate, buildMilestoneList } from "../data/mockData";
import { IDR, TODAY } from "../utils/format";

interface JobOrderFormProps {
  onSave: (job: JobOrder) => void;
  onCancel: () => void;
  jobsCount: number;
  existingJobs: JobOrder[];
  isEdit?: boolean;
  jobData?: JobOrder;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const JobOrderForm: React.FC<JobOrderFormProps> = ({ onSave, onCancel, jobsCount, existingJobs, isEdit, jobData, onDirtyChange }) => {
  const dirtyRef = useRef(false);
  const markDirty = () => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      onDirtyChange?.(true);
    }
  };

  const [type, setType] = useState<'IMPORT' | 'EXPORT' | 'DOMESTIK'>(jobData?.type as any || 'IMPORT');
  const [customerId, setCustomerId] = useState(jobData?.customerId || 'SKD');
  const [noBL, setNoBL] = useState(jobData?.noBL || '');
  const [noAju, setNoAju] = useState(jobData?.noAju || '');
  const [barang, setBarang] = useState(jobData?.barang || '');
  const [noPO, setNoPO] = useState(jobData?.noPO || '');
  const [vessel, setVessel] = useState(jobData?.vessel || '');
  const [pol, setPol] = useState(jobData?.pol || '');
  const [pod, setPod] = useState(jobData?.pod || '');
  const [tglETA, setTglETA] = useState(jobData?.tglETA || TODAY);
  const [allocatedCash, setAllocatedCash] = useState<number>(jobData?.pettyCash?.allocated ?? 20000000);
  const [jenisTruckingDomestik, setJenisTruckingDomestik] = useState<string>(jobData?.jenisTruckingDomestik || 'CITY_DELIVERY');

  // Editor milestone (dapat ditambah/diubah/dihapus/disusun ulang)
  const [msList, setMsList] = useState<MilestoneItem[]>(
    isEdit && jobData ? buildMilestoneList(jobData) : makeMilestoneTemplate('IMPORT')
  );

  // Containers repeater state
  const [containers, setContainers] = useState<Array<{ id: string; no: string; ukuran: string; tujuan: string }>>(
    jobData?.containers?.map(c => ({ id: c.id, no: c.no || '', ukuran: c.ukuran, tujuan: c.tujuan })) || [
      { id: 'cnt-1', no: '', ukuran: '40"', tujuan: 'CIBITUNG' }
    ]
  );

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get unique list of destinations from default rates to use in dropdown
  const destinations = Array.from(new Set(SVC_TRK.map(s => s.code.replace('TR20', '').replace('TR40', '').replace('REV', '').replace('REVKOS', '').replace('INP', '').replace('TSLA', '')).filter(Boolean)));
  const listTujuan = destinations.length > 0 ? destinations : ['CIBITUNG', 'MARUNDA', 'CAKUNG', 'CILEGON', 'KARAWANG', 'JATAKE', 'DAAN MOGOT'];

  const addContainerRow = () => {
    markDirty();
    const newId = `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setContainers(prev => [...prev, { id: newId, no: '', ukuran: '40"', tujuan: 'CIBITUNG' }]);
  };

  const removeContainerRow = (id: string) => {
    // Container boleh dikosongkan: ada JO yang hanya mengurus ocean freight (tanpa trucking)
    markDirty();
    setContainers(prev => prev.filter(c => c.id !== id));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.containers;
      return copy;
    });
  };

  const updateContainer = (id: string, key: 'no' | 'ukuran' | 'tujuan', value: string) => {
    markDirty();
    setContainers(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, [key]: value };
      }
      return c;
    }));
  };

  // ===== Editor Milestone =====
  const handleTypeChange = (next: 'IMPORT' | 'EXPORT' | 'DOMESTIK') => {
    markDirty();
    setType(next);
    // JO baru: reset milestone ke template tipe terpilih. Saat edit: pertahankan susunan custom.
    if (!isEdit) {
      setMsList(makeMilestoneTemplate(next));
    }
  };

  const addMilestone = () => {
    markDirty();
    setMsList(prev => [...prev, {
      id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: 'Milestone Baru',
      done: false,
      na: false,
    }]);
  };

  const updateMilestoneLabel = (id: string, label: string) => {
    markDirty();
    setMsList(prev => prev.map(m => m.id === id ? { ...m, label } : m));
  };

  const removeMilestone = (id: string) => {
    markDirty();
    setMsList(prev => prev.filter(m => m.id !== id));
  };

  const moveMilestone = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= msList.length) return;
    markDirty();
    setMsList(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const resetMilestones = () => {
    markDirty();
    setMsList(makeMilestoneTemplate(type));
  };

  const isDomestik = type === 'DOMESTIK';

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!customerId) newErrors.customerId = 'Customer wajib dipilih!';
    // Domestik: tidak butuh No BL/Booking & komoditas wajib (cukup tujuan kontainer)
    if (!isDomestik) {
      if (!noBL.trim()) newErrors.noBL = type === 'IMPORT' ? 'Nomor BL wajib diisi!' : 'Nomor Booking wajib diisi!';
      if (!barang.trim()) newErrors.barang = 'Nama komoditas barang wajib diisi!';
    }
    if (allocatedCash < 0) newErrors.allocatedCash = 'Alokasi Petty Cash tidak boleh bernilai negatif!';

    // Container boleh kosong (ocean freight only). Jika ada, ukuran & tujuan harus lengkap.
    const invalidContainers = containers.some(c => !c.ukuran || !c.tujuan);
    if (invalidContainers) {
      newErrors.containers = 'Setiap kontainer harus memiliki ukuran dan rute tujuan!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to top/error bounds
      return;
    }

    // Generate dynamic or preserve values
    const joId = isEdit && jobData ? jobData.id : `JO-${String(jobsCount + 101).padStart(3, '0')}`;

    // Get number of existing JOs for this customer to determine noUrut
    const nextUrut = isEdit && jobData ? jobData.noUrut : (() => {
      const customerJOs = existingJobs.filter(j => j.customerId === customerId);
      let maxUrutForCustomer = 0;
      if (customerJOs.length > 0) {
        maxUrutForCustomer = Math.max(...customerJOs.map(j => j.noUrut || 0));
      }
      return maxUrutForCustomer + 1;
    })();

    // Party Volume string calculation e.g., "1X40", "2X40 + 1X20" etc.
    const counts: Record<string, number> = {};
    containers.forEach(c => {
      const sizeKey = c.ukuran.replace('"', '');
      counts[sizeKey] = (counts[sizeKey] || 0) + 1;
    });
    const partyString = containers.length === 0
      ? 'OCEAN FREIGHT'  // JO tanpa trucking (hanya pengurusan ocean freight)
      : Object.entries(counts).map(([size, qty]) => `${qty}X${size}`).join(' + ');

    // Map container rows to real domain schema
    const domainContainers: Container[] = containers.map((c, i) => {
      const existingContainer = isEdit && jobData ? jobData.containers.find(ec => ec.no === c.no || ec.id === c.id) : null;
      let defaultAllowance = c.ukuran === '20"' ? 350000 : 500000;
      return {
        id: existingContainer?.id || `C-${joId}-${i + 1}-${Date.now().toString().slice(-3)}`,
        no: c.no.trim() ? c.no.toUpperCase() : null,
        ukuran: c.ukuran,
        tujuan: c.tujuan,
        driverId: existingContainer?.driverId || null,
        uangJalan: existingContainer?.uangJalan || defaultAllowance,
        inap: existingContainer?.inap || 0,
        status: existingContainer?.status || 'DALAM_PROSES'
      };
    });

    // Susun milestone dari editor (urutan = posisi di array). Buang label kosong.
    const cleanMsList: MilestoneItem[] = msList
      .filter(m => m.label.trim() !== '')
      .map(m => ({ ...m, label: m.label.trim() }));

    // Derive Record `milestones` (backward-compat) dari milestoneList
    const milestonesRecord: Record<string, Milestone> = {};
    cleanMsList.forEach(m => {
      milestonesRecord[m.id] = { done: m.done, tgl: m.tgl, na: m.na };
    });

    const editedJobOrder: JobOrder = {
      id: joId,
      type: type as any,
      customerId,
      noUrut: nextUrut,
      noAju: noAju.trim() || '-',
      noBL: noBL.trim().toUpperCase() || (isDomestik ? `DOM-${Date.now().toString().slice(-6)}` : '-'),
      barang: barang.trim().toUpperCase() || (isDomestik ? 'MUATAN DOMESTIK' : 'GENERAL CARGO'),
      noPO: noPO.trim() || (isEdit && jobData ? jobData.noPO : `PO-${Math.floor(Math.random() * 90000) + 10002}`),
      vessel: type === 'EXPORT' ? (vessel.trim() || '-') : (isEdit && jobData ? jobData.vessel : '-'),
      pol: type === 'EXPORT' ? (pol.trim().toUpperCase() || undefined) : (isEdit && jobData ? jobData.pol : undefined),
      pod: type === 'EXPORT' ? (pod.trim().toUpperCase() || undefined) : (isEdit && jobData ? jobData.pod : undefined),
      jalur: isEdit && jobData ? jobData.jalur : 'HIJAU', // jalur resmi ditentukan saat milestone jalurDitentukan
      tglETA,
      tglSPPB: isEdit && jobData ? jobData.tglSPPB : null, // input SPPB dihapus sementara dari form
      party: partyString,
      containers: domainContainers,
      status: isEdit && jobData ? jobData.status : 'IN_PROGRESS',
      milestones: milestonesRecord,
      milestoneList: cleanMsList,
      checklist: isEdit && jobData ? jobData.checklist : { operasional: false, trucking: false, adminDok: false },
      pettyCash: isEdit && jobData ? {
        ...jobData.pettyCash,
        allocated: allocatedCash
      } : {
        allocated: allocatedCash,
        expenses: []
      },
      invoiceIds: isEdit && jobData ? jobData.invoiceIds : [],
      tglCreated: isEdit && jobData ? jobData.tglCreated : TODAY,
      ...(type === 'DOMESTIK' ? { jenisTruckingDomestik } : {})
    };

    onSave(editedJobOrder);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 select-none">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-900 cursor-pointer"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-850 leading-tight">
              {isEdit ? `Edit Job Order — ${jobData?.id}` : 'Buat Job Order Baru'}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold block mt-0.5">Pendataan sirkulasi logistik PT. SSL</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn v="secondary" sm onClick={onCancel}>Batal</Btn>
          <Btn v="primary" sm icon={Save} onClick={validateAndSubmit}>
            {isEdit ? 'Simpan Perubahan' : 'Simpan Job Order'}
          </Btn>
        </div>
      </div>

      {/* Main Core Form Elements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Metadata */}
        <div className="md:col-span-2 space-y-5">
          <Card title="Informasi Dokumen Order">
            <div className="p-4 space-y-4 text-xs font-semibold text-slate-650">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">Tipe Order (Kategori)</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-800">
                      <input 
                        type="radio" 
                        name="orderType" 
                        value="IMPORT" 
                        checked={type === 'IMPORT'}
                        onChange={() => handleTypeChange('IMPORT')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>IMPORT</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="orderType"
                        value="EXPORT"
                        checked={type === 'EXPORT'}
                        onChange={() => handleTypeChange('EXPORT')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>EXPORT</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="orderType"
                        value="DOMESTIK"
                        checked={type === 'DOMESTIK'}
                        onChange={() => handleTypeChange('DOMESTIK')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>DOMESTIK</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">Customer Klien</label>
                  <select 
                    className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                    value={customerId}
                    onChange={e => { markDirty(); setCustomerId(e.target.value); }}
                  >
                    {CUSTOMERS.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-red-500 text-[10px] mt-1">{errors.customerId}</p>}
                </div>
              </div>

              {type === 'DOMESTIK' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">Jenis Trucking Domestik</label>
                    <select
                      className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                      value={jenisTruckingDomestik}
                      onChange={e => { markDirty(); setJenisTruckingDomestik(e.target.value); }}
                    >
                      <option value="CITY_DELIVERY">CITY DELIVERY</option>
                      <option value="PORT_TO_DOOR">PORT TO DOOR</option>
                      <option value="INTER_CITY">INTER CITY</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center">
                    Sistem akan menetapkan rute dan tarif internal untuk pengiriman dalam negeri (domestik) sesuai tipe rute yang dipilih.
                  </div>
                </div>
              )}

              {/* DOMESTIK: cukup tentukan tujuan di bagian Unit Container di bawah */}
              {isDomestik && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-blue-900 leading-relaxed text-[11px] font-semibold">
                  Untuk order <b>Domestik</b>, tidak diperlukan dokumen kepabeanan (BL/Aju/PEB). Cukup tentukan <b>rute tujuan</b> pengiriman pada bagian <b>Unit Container</b> di bawah — tujuan inilah yang akan ditampilkan pada invoice.
                </div>
              )}

              {/* IMPORT & EXPORT: dokumen order */}
              {!isDomestik && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">No Aju PPJK</label>
                      <input
                        type="text"
                        className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300"
                        placeholder="e.g. 029600"
                        value={noAju}
                        onChange={e => { markDirty(); setNoAju(e.target.value); }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{type === 'IMPORT' ? 'No Bill of Lading (BL)' : 'No Booking Reference'}</label>
                      <input
                        type="text"
                        className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300 uppercase"
                        placeholder={type === 'IMPORT' ? 'e.g. YMJAI240448123' : 'e.g. BKGCOS912384'}
                        value={noBL}
                        onChange={e => { markDirty(); setNoBL(e.target.value); }}
                      />
                      {errors.noBL && <p className="text-red-500 text-[10px] mt-1">{errors.noBL}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">No PO / No Dokumen</label>
                      <input
                        type="text"
                        className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300"
                        placeholder="e.g. PDA-26189"
                        value={noPO}
                        onChange={e => { markDirty(); setNoPO(e.target.value); }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Komoditas Cargo / Barang</label>
                      <input
                        type="text"
                        className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300"
                        placeholder="e.g. MIXED VEGETABLES SEED"
                        value={barang}
                        onChange={e => { markDirty(); setBarang(e.target.value); }}
                      />
                      {errors.barang && <p className="text-red-500 text-[10px] mt-1">{errors.barang}</p>}
                    </div>
                  </div>

                  {/* EXPORT: Vessel/Voyage + POL + POD */}
                  {type === 'EXPORT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Vessel / Voyage</label>
                        <input
                          type="text"
                          className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300 uppercase"
                          placeholder="e.g. COSCO STAR 026E"
                          value={vessel}
                          onChange={e => { markDirty(); setVessel(e.target.value); }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">POL (Port of Loading)</label>
                        <input
                          type="text"
                          className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300 uppercase"
                          placeholder="e.g. TANJUNG PRIOK"
                          value={pol}
                          onChange={e => { markDirty(); setPol(e.target.value); }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">POD (Port of Discharge)</label>
                        <input
                          type="text"
                          className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-300 uppercase"
                          placeholder="e.g. SINGAPORE"
                          value={pod}
                          onChange={e => { markDirty(); setPod(e.target.value); }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{type === 'IMPORT' ? 'Tanggal ETA Pelabuhan' : 'Tanggal ETD Pelabuhan'}</label>
                      <input
                        type="date"
                        className="w-full border border-slate-205 rounded-xl px-3 py-2 outline-none font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                        value={tglETA}
                        onChange={e => { markDirty(); setTglETA(e.target.value); }}
                      />
                    </div>
                  </div>
                </>
              )}

            </div>
          </Card>

          {/* Dynamic Repeater Section */}
          <Card
            title={`Spesifikasi Unit Container (${containers.length} Unit)`}
            action={<Btn v="secondary" sm icon={Plus} onClick={addContainerRow}>Tambah Container</Btn>}
          >
            <div className="p-4 space-y-3">
              {errors.containers && (
                <p className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl mb-2">{errors.containers}</p>
              )}

              {containers.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-900 text-[11px] font-semibold leading-relaxed">
                  Tidak ada container terdaftar. Job Order ini akan diperlakukan sebagai <b>pengurusan ocean freight saja</b> (tanpa trucking). Tambahkan container bila diperlukan layanan angkutan darat.
                </div>
              )}

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {containers.map((c, i) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 p-4 border border-slate-200 rounded-2xl bg-slate-50/20 relative group animate-fade-in">
                    <div className="absolute -top-2 left-4 text-[9px] font-black bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                      Container #{i + 1}
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">No Container (Opsional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MSKU9817263"
                        className="w-full border border-slate-205 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold uppercase text-slate-800"
                        value={c.no}
                        onChange={e => updateContainer(c.id, 'no', e.target.value)}
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">Ukuran</label>
                      <select 
                        className="w-full border border-slate-205 rounded-xl px-2 py-1.5 text-xs font-bold bg-white text-slate-800"
                        value={c.ukuran}
                        onChange={e => updateContainer(c.id, 'ukuran', e.target.value)}
                      >
                        <option value="40&quot;">40&quot; Large</option>
                        <option value="20&quot;">20&quot; Small</option>
                      </select>
                    </div>

                    <div className="w-40">
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">Rute / Tujuan</label>
                      <select 
                        className="w-full border border-slate-205 rounded-xl px-2 py-1.5 text-xs font-bold bg-white text-slate-800"
                        value={c.tujuan}
                        onChange={e => updateContainer(c.id, 'tujuan', e.target.value)}
                      >
                        {listTujuan.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-4 shrink-0">
                      <button 
                        onClick={() => removeContainerRow(c.id)}
                        className="p-2 border border-rose-100 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Financial Allocation */}
        <div className="space-y-5">
          <Card title="Alokasi Keuangan Awal">
            <div className="p-4 space-y-4 text-xs font-semibold text-slate-650">
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-900 leading-relaxed text-[11px] font-semibold">
                Sistem logistik mensyaratkan dana cadangan tunai (Petty Cash) guna membiayai operasional lapangan PPJK, treatmen beacukai, dan kuitansi depot.
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Nominal Kas Terencana (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">Rp</span>
                  <input 
                    type="number" 
                    step={1000}
                    className="w-full border border-slate-205 rounded-xl pl-9 pr-4 py-2 font-mono font-black text-slate-800/90 text-sm focus:ring-2 focus:ring-blue-500/10 bg-slate-50/50"
                    value={allocatedCash}
                    onChange={e => { markDirty(); setAllocatedCash(Number(e.target.value)); }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                  Preview: <b className="text-slate-700">Rp {IDR(allocatedCash)}</b>
                </p>
                {errors.allocatedCash && <p className="text-red-500 text-[10px] mt-1">{errors.allocatedCash}</p>}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center text-[11px] text-slate-400 leading-relaxed font-bold">
                  <span>Urutan JO Customer</span>
                  <span className="font-mono text-slate-700">Auto-calculated</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium block mt-1.5 leading-relaxed">
                  No Urut untuk customer terpilih akan dikalibrasi secara otomatis saat data disimpan agar sekuensial dengan history.
                </div>
              </div>
            </div>
          </Card>

          <Card
            title={`Susunan Milestone (${msList.length})`}
            action={
              <div className="flex gap-1.5">
                <Btn v="ghost" sm icon={RotateCcw} onClick={resetMilestones}>Reset</Btn>
                <Btn v="secondary" sm icon={Plus} onClick={addMilestone}>Tambah</Btn>
              </div>
            }
          >
            <div className="p-4 text-xs font-semibold text-slate-505 space-y-3 leading-relaxed">
              <p className="text-[11px] text-slate-400 font-medium">
                Susun proses milestone sesuai kebutuhan job order. Anda dapat <b>menambah</b>, <b>mengubah keterangan</b>, <b>menghapus</b>, dan <b>memindahkan urutan</b> tiap milestone.
              </p>

              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {msList.length === 0 && (
                  <div className="p-4 text-center text-slate-400 font-bold text-[11px] border border-dashed border-slate-200 rounded-xl">
                    Belum ada milestone. Klik "Tambah" atau "Reset" untuk memuat template.
                  </div>
                )}
                {msList.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-1.5 p-2 border border-slate-150 rounded-xl bg-slate-50/30 group">
                    {/* Reorder controls */}
                    <div className="flex flex-col shrink-0">
                      <button
                        type="button"
                        onClick={() => moveMilestone(i, -1)}
                        disabled={i === 0}
                        className="text-slate-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                        title="Naikkan"
                      >
                        <ChevronUp size={14} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMilestone(i, 1)}
                        disabled={i === msList.length - 1}
                        className="text-slate-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                        title="Turunkan"
                      >
                        <ChevronDown size={14} className="stroke-[2.5]" />
                      </button>
                    </div>

                    <span className="text-[9px] font-black text-slate-300 font-mono w-4 text-center shrink-0">{i + 1}</span>

                    {/* Editable label */}
                    <input
                      type="text"
                      value={m.label}
                      onChange={e => updateMilestoneLabel(m.id, e.target.value)}
                      className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/10 outline-none"
                      placeholder="Keterangan milestone…"
                    />

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                      title="Hapus milestone"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Button footer actions */}
      <div className="pt-4 border-t flex justify-end space-x-2 select-none">
        <Btn v="secondary" onClick={onCancel}>Batal</Btn>
        <Btn v="primary" icon={Save} onClick={validateAndSubmit}>
          {isEdit ? 'Simpan Perubahan' : 'Mendaftarkan Job Order'}
        </Btn>
      </div>

    </div>
  );
};
