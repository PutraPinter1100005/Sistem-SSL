import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  DollarSign,
  AlertCircle,
  Tag,
  Briefcase,
  Layers,
  Percent,
  X,
  CreditCard
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

export default function MasterTarifView() {
  const { 
    master_tarifs, 
    master_customers, 
    loadingData, 
    addEntity, 
    updateEntity, 
    deleteEntity 
  } = useFirebase();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Modal & Edit State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    pelanggan: 'UMUM / DEFAULT', // UMUM / DEFAULT or active Customer name
    rute: 'PRIOK - CIKARANG', // Default route or custom item name
    kategori: 'Trucking', // Trucking, Inklaring, Jasa EMKL
    harga_20ft: 0,
    harga_40ft: 0
  });

  // Simple Notification Trigger
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper formats
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(num || 0);
  };

  const formatThousandSeparator = (num: number) => {
    if (num === 0 || !num) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const parseFormattedNumber = (val: string) => {
    const cleanStr = val.replace(/\D/g, '');
    return cleanStr === '' ? 0 : Number(cleanStr);
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      pelanggan: 'UMUM / DEFAULT',
      rute: 'PRIOK - CIKARANG',
      kategori: 'Trucking',
      harga_20ft: 0,
      harga_40ft: 0
    });
    setEditingId(null);
  };

  // Open Add Dialog
  const handleAddClick = () => {
    resetForm();
    setIsOpenModal(true);
  };

  // Open Edit Dialog
  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setForm({
      pelanggan: item.pelanggan || 'UMUM / DEFAULT',
      rute: item.rute || item.nama_item || '',
      kategori: item.kategori || 'Trucking',
      harga_20ft: item.harga_20ft || 0,
      harga_40ft: item.harga_40ft || 0
    });
    setIsOpenModal(true);
  };

  // Delete Action
  const handleDeleteClick = async (id: string, name: string) => {
    const proceed = window.confirm(`Apakah Anda yakin ingin menghapus data tarif ini?`);
    if (!proceed) return;

    try {
      await deleteEntity('master_tarifs', id);
      triggerNotification(`Tarif berhasil dihapus.`);
    } catch (err: any) {
      console.error(err);
      alert("Hapus data gagal: " + (err.message || String(err)));
    }
  };

  // Handle standard fields change
  const handleSimpleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'rute') {
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.pelanggan) {
      alert("Harap pilih/isi Pelanggan!");
      return;
    }

    if (!form.rute.trim()) {
      alert("Harap isi/pilih rute!");
      return;
    }

    if (!form.kategori) {
      alert("Harap pilih Kategori!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        pelanggan: form.pelanggan,
        rute: form.rute.trim().toUpperCase(),
        nama_item: form.rute.trim().toUpperCase(), // synchronized for compatibility
        kategori: form.kategori,
        harga_20ft: Number(form.harga_20ft),
        harga_40ft: Number(form.harga_40ft),
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateEntity('master_tarifs', editingId, payload);
        triggerNotification(`Tarif sukses diperbarui.`);
      } else {
        const generatedId = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
        await addEntity('master_tarifs', {
          id: generatedId,
          ...payload,
          createdAt: new Date().toISOString()
        });
        triggerNotification(`Tarif sukses didaftarkan.`);
      }

      setIsOpenModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("Gagal memproses data: " + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch only active customers
  const activeCustomers = (master_customers || []).filter(c => c.status_aktif === true);

  // Filter lists based on Search & Category Pills
  const filteredTarifs = (master_tarifs || []).filter(t => {
    const q = searchQuery.toLowerCase();
    const nameMatch = searchQuery 
      ? ((t.nama_item || t.rute || '').toLowerCase().includes(q) || 
         (t.pelanggan || '').toLowerCase().includes(q))
      : true;
    const catMatch = selectedCategoryFilter === 'ALL' ? true : t.kategori === selectedCategoryFilter;
    return nameMatch && catMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="master-tarif-module-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[250] bg-neutral-900 border border-neutral-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 text-xs tracking-wide font-bold animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Header bento cards - MATCH CREXTIO GOLD SLATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="tarif-bento-grid">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-2xs flex items-center justify-between glow-yellow-corner">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Total Item Tarif</span>
            <div className="text-2xl font-black text-neutral-900 tracking-tight">{(master_tarifs || []).length} Item</div>
            <p className="text-[10px] text-slate-500 font-semibold">Tersimpan di Cloud Database</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-amber-400">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-2xs flex items-center justify-between glow-yellow-corner">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Tarif Trucking</span>
            <div className="text-2xl font-black text-[#fbc449] tracking-tight font-sans">
              {(master_tarifs || []).filter(t => t.kategori === 'Trucking').length} Ritem
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Khusus Sektor Transportasi</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-[#fbc449]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-2xs flex items-center justify-between glow-yellow-corner">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Jasa Inklaring</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {(master_tarifs || []).filter(t => t.kategori === 'Inklaring').length} Item
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Operasional Kepabeanan / Pajak</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-slate-300">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-2xs flex items-center justify-between glow-yellow-corner">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">Kontrak Eksklusif</span>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {(master_tarifs || []).filter(t => t.pelanggan !== 'UMUM / DEFAULT').length} Aturan
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Rincian Kontrak Spesifik</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main filter & table panel */}
      <div className="bg-white/70 backdrop-blur-md rounded-[32px] border border-white/60 shadow-2xs p-8 space-y-6 glow-yellow-corner" id="tariffs-main-panel">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-200/40 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase font-mono">Daftar Kontrak &amp; Aturan Tarif Jual</h3>
            <p className="text-xs text-slate-500 font-semibold">Definisikan harga standar penawaran bersirkulasi serta harga spesial berdasarkan kontrak eksklusif customer</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Category pills filtering */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 text-[10px] font-black uppercase text-slate-500">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${selectedCategoryFilter === 'ALL' ? 'bg-neutral-900 text-[#fbc449] shadow-xs' : 'hover:text-slate-900'}`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('Trucking')}
                className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${selectedCategoryFilter === 'Trucking' ? 'bg-neutral-900 text-[#fbc449] shadow-xs' : 'hover:text-slate-900'}`}
              >
                Trucking
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('Inklaring')}
                className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${selectedCategoryFilter === 'Inklaring' ? 'bg-neutral-900 text-[#fbc449] shadow-xs' : 'hover:text-slate-900'}`}
              >
                Inklaring
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari item tarif..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200/80 py-2.5 pl-9 pr-4 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/20 focus:border-[#fbc449] outline-none transition"
              />
            </div>

            {/* Create Trigger */}
            <button
              onClick={handleAddClick}
              className="bg-neutral-900 border border-neutral-850 hover:bg-black text-amber-400 text-xs font-black tracking-widest uppercase px-5 py-3.5 rounded-full inline-flex items-center space-x-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Tambah Tarif Baru</span>
            </button>
          </div>
        </div>

        {/* Dynamic Table displaying master tariffs lists */}
        {loadingData?.master_tarifs ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4" id="tariffs-loading">
            <div className="w-10 h-10 rounded-full border-4 border-[#fbc449] border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase font-mono">Loading Cloud Database Tariff Module...</p>
          </div>
        ) : filteredTarifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[24px] py-16 px-4 text-center space-y-4" id="tariffs-not-found">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-200/50">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">Tidak Ada Aturan Tarif</h4>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed font-semibold">
                Belum ada rincian tarif aktif. Silakan daftarkan rute pertama Anda dengan menekan tombol Tambah Tarif.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/60 rounded-[20px]" id="tariffs-table-wrapper">
            <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-200/60 text-[10px] font-black uppercase tracking-widest text-slate-455 font-mono">
                  <th className="py-4 px-5">Kode ID</th>
                  <th className="py-4 px-5">Spesifik Pelanggan</th>
                  <th className="py-4 px-5">Rute / Item Layanan</th>
                  <th className="py-4 px-5 text-center">Kategori</th>
                  <th className="py-4 px-5 text-right">Harga Jual 20ft</th>
                  <th className="py-4 px-5 text-right">Harga Jual 40ft</th>
                  <th className="py-4 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredTarifs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5 font-mono font-black text-slate-400 text-[10px]">{item.id}</td>
                    <td className="py-4 px-5 font-black">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        item.pelanggan === 'UMUM / DEFAULT'
                          ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          : 'bg-amber-400/10 text-[#997311] border border-amber-400/20'
                      }`}>
                        {item.pelanggan || 'UMUM / DEFAULT'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 tracking-tight uppercase">{item.rute || item.nama_item}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        item.kategori === 'Trucking' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {item.kategori || 'Trucking'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-black text-slate-900 font-mono">
                      {formatRupiah(item.harga_20ft)}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-slate-900 font-mono">
                      {formatRupiah(item.harga_40ft)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-3 py-1.5 text-[10px] font-black tracking-widest uppercase text-slate-700 bg-white border border-slate-200 hover:bg-neutral-50 hover:text-neutral-900 rounded-xl transition cursor-pointer flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3 text-amber-500" />
                          <span>Ubah</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.rute || item.nama_item)}
                          className="px-3 py-1.5 text-[10px] font-black tracking-widest uppercase text-red-500 bg-red-50/20 border border-red-100 hover:bg-red-50 hover:text-red-700 rounded-xl transition cursor-pointer flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Pop-up Modal Form */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => !submitting && setIsOpenModal(false)}
        title={editingId ? "Ubah Data Parameter Tarif Logistik" : "Tambah Model Parameter Tarif Baru"}
        className="max-w-xl w-full"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-left p-1" id="tarif-form">
          <p className="text-xs text-slate-500 leading-relaxed bg-[#fbc449]/5 p-4 rounded-2xl border border-[#fbc449]/20 font-semibold">
            <span className="text-neutral-900 font-extrabold uppercase tracking-wide block mb-1">Pedoman Sinergi Kontak Tarif:</span>
            Pastikan tarif diinput spesifik per rute kargo untuk menghindari kerancuan margin audit tagihan.
          </p>

          <div className="space-y-4">
            
            {/* Pelanggan Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                Pilih Akun Pelanggan <span className="text-red-500">*</span>
              </label>
              <select
                name="pelanggan"
                value={form.pelanggan}
                onChange={handleSimpleFieldChange}
                className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/30 focus:border-[#fbc449] outline-none cursor-pointer transition"
                required
              >
                <option value="UMUM / DEFAULT" className="font-extrabold text-[#997311] bg-amber-50">UMUM / DEFAULT (Spesifikasi Fallback Standar)</option>
                {activeCustomers.map(c => {
                  const name = c.nama_perusahaan || c.companyName || c.name || '';
                  return (
                    <option key={c.id} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Kategori */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                Kategori Operasional <span className="text-red-500">*</span>
              </label>
              <select
                name="kategori"
                value={form.kategori}
                onChange={handleSimpleFieldChange}
                className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#fbc449]/30 focus:border-[#fbc449] outline-none cursor-pointer transition"
                required
              >
                <option value="Trucking">Trucking</option>
                <option value="Inklaring">Inklaring</option>
                <option value="Jasa EMKL">Jasa EMKL</option>
              </select>
            </div>

            {/* Rute / Nama Item */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                Rute Pilihan / Sektor Cargo <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer transition flex-1"
                  onChange={(e) => {
                    if (e.target.value !== "CUSTOM") {
                      setForm(prev => ({ ...prev, rute: e.target.value.toUpperCase() }));
                    }
                  }}
                  defaultValue={["PRIOK - CIKARANG", "PRIOK - KARAWANG", "DOMESTIK DALAM KOTA", "PRIOK - BANDUNG", "PRIOK - SURABAYA"].includes(form.rute) ? form.rute : "CUSTOM"}
                >
                  <option value="PRIOK - CIKARANG">PRIOK - CIKARANG</option>
                  <option value="PRIOK - KARAWANG">PRIOK - KARAWANG</option>
                  <option value="DOMESTIK DALAM KOTA">DOMESTIK DALAM KOTA</option>
                  <option value="PRIOK - BANDUNG">PRIOK - BANDUNG</option>
                  <option value="PRIOK - SURABAYA">PRIOK - SURABAYA</option>
                  <option value="CUSTOM">-- KETIK RUTE MANUAL --</option>
                </select>

                <input
                  type="text"
                  name="rute"
                  placeholder="Ketik manual di sini..."
                  value={form.rute}
                  onChange={handleSimpleFieldChange}
                  className="bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#fbc449]/30 focus:border-[#fbc449] outline-none transition w-full sm:w-1/2"
                  required
                />
              </div>
            </div>

            {/* 2 Kolom Input Bersandingan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                  Harga Jual 20ft (IDR) <span className="text-red-500">*</span>
                </label>
                <div className="relative border-b-2 border-slate-200 py-1">
                  <span className="absolute left-1 top-2.5 text-xs font-black text-[#997311] font-mono">Rp</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatThousandSeparator(form.harga_20ft)}
                    onChange={(e) => {
                      const rawVal = parseFormattedNumber(e.target.value);
                      setForm(prev => ({ ...prev, harga_20ft: rawVal }));
                    }}
                    className="w-full bg-transparent border-0 pl-7 pr-2 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-0 outline-none transition font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                  Harga Jual 40ft (IDR) <span className="text-red-500">*</span>
                </label>
                <div className="relative border-b-2 border-slate-200 py-1">
                  <span className="absolute left-1 top-2.5 text-xs font-black text-[#997311] font-mono">Rp</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatThousandSeparator(form.harga_40ft)}
                    onChange={(e) => {
                      const rawVal = parseFormattedNumber(e.target.value);
                      setForm(prev => ({ ...prev, harga_40ft: rawVal }));
                    }}
                    className="w-full bg-transparent border-0 pl-7 pr-2 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-0 outline-none transition font-mono"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Form action bar */}
          <div className="flex items-center justify-end space-x-2 pt-6 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-full transition"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-[#fbc449] hover:bg-[#ebaf26] text-neutral-900 rounded-full transition shadow-xs flex items-center space-x-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
