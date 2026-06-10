/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  HardHat,
  Truck,
  Anchor,
  Layers,
  HelpCircle,
  PlusCircle,
  Users,
  Trash
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

export default function VendorView() {
  const { 
    master_vendors, 
    loadingData, 
    addEntity, 
    updateEntity, 
    deleteEntity 
  } = useFirebase();

  // Search and general state
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    nama_vendor: '',
    kategori: 'Trucking', // Trucking, Pelayaran, Depo, Lainnya
    kontak: '',
    keterangan: '',
    pics: [] as Array<{ jabatan: string; nama: string; email: string; no_hp: string }>
  });

  // Simple Notification Trigger
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      nama_vendor: '',
      kategori: 'Trucking',
      kontak: '',
      keterangan: '',
      pics: []
    });
    setEditingId(null);
  };

  // Input Change with uppercase verification for nama_vendor
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'nama_vendor') {
      // WAJIB Uppercase otomatis
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // PIC array mutators
  const addPic = () => {
    setForm(prev => ({
      ...prev,
      pics: [...prev.pics, { jabatan: '', nama: '', email: '', no_hp: '' }]
    }));
  };

  const removePic = (index: number) => {
    setForm(prev => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index)
    }));
  };

  const handlePicChange = (index: number, fld: 'jabatan' | 'nama' | 'email' | 'no_hp', val: string) => {
    setForm(prev => {
      const updatedPics = [...prev.pics];
      updatedPics[index] = { ...updatedPics[index], [fld]: val };
      return { ...prev, pics: updatedPics };
    });
  };

  // Open Form for Adding
  const handleAddClick = () => {
    resetForm();
    setIsOpenModal(true);
  };

  // Open Form for Editing
  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setForm({
      nama_vendor: item.nama_vendor || '',
      kategori: item.kategori || 'Trucking',
      kontak: item.kontak || '',
      keterangan: item.keterangan || '',
      pics: item.pics || []
    });
    setIsOpenModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nama_vendor.trim() || !form.kontak.trim()) {
      alert("Harap lengkapi semua field bertanda bintang (*)");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update Action
        await updateEntity('master_vendors', editingId, {
          ...form,
          updatedAt: new Date().toISOString()
        });
        triggerNotification(`Vendor "${form.nama_vendor}" berhasil diperbarui.`);
      } else {
        // Create Action
        const id = `VD-${Math.floor(1000 + Math.random() * 9000)}`;
        await addEntity('master_vendors', {
          id,
          ...form,
          createdAt: new Date().toISOString()
        });
        triggerNotification(`Vendor baru "${form.nama_vendor}" berhasil ditambahkan.`);
      }
      setIsOpenModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("Gagal memproses data: " + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler with mandatory Pop-up Fail-Safe Confirmation
  const handleDeleteClick = async (id: string, name: string) => {
    const confirmation = window.confirm(`Apakah Anda yakin ingin menghapus data vendor "${name}"?`);
    if (!confirmation) return;

    try {
      await deleteEntity('master_vendors', id);
      triggerNotification(`Vendor "${name}" berhasil dihapus dari database.`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus data: " + (err?.message || String(err)));
    }
  };

  // Filtering data
  const filteredData = (master_vendors || []).filter(v => {
    const matchesSearch = 
      (v.nama_vendor || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getKategoriIcon = (kategori: string) => {
    switch (kategori) {
      case 'Trucking':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'Pelayaran':
        return <Anchor className="w-4 h-4 text-blue-600" />;
      case 'Depo':
        return <Layers className="w-4 h-4 text-purple-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getKategoriBadgeColor = (kategori: string) => {
    switch (kategori) {
      case 'Trucking':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pelayaran':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Depo':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4" id="vendor-view-container">
      {/* Toast alert indicator */}
      {notification && (
        <div className="fixed bottom-16 right-6 z-[100] bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-in slide-in-from-bottom duration-250">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
          id="btn-add-vendor"
        >
          <Plus className="w-4 h-4 text-white font-extrabold" />
          <span>TAMBAH VENDOR</span>
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Vendor, Kategori..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="vendor-search-input"
          />
        </div>
      </div>

      {/* Database Master Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 tracking-wider uppercase">
                <th className="p-4 w-24">ID</th>
                <th className="p-4">Nama Vendor</th>
                <th className="p-4">Kategori Utama</th>
                <th className="p-4">Kontak / Telepon</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loadingData?.master_vendors ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="font-semibold text-slate-500">Sinkronisasi data master vendor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400 font-normal">
                    Belum ada data vendor pendukung logistik terdaftar.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/55 transition-colors" id={`row-vendor-${item.id}`}>
                    <td className="p-4 font-mono text-slate-500 text-[11px] font-bold">{item.id}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 flex flex-col">
                        <span className="flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          {item.nama_vendor}
                        </span>
                        {item.pics && item.pics.length > 0 && (
                          <div className="text-[10px] text-slate-450 font-normal mt-1 bg-slate-50 px-2 py-1 rounded inline-flex items-center gap-1.5 w-fit">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{item.pics.length} PIC Vendor: {item.pics.map((p: any) => p.nama).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase border ${getKategoriBadgeColor(item.kategori)}`}>
                        {getKategoriIcon(item.kategori)}
                        <span>{item.kategori}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{item.kontak}</td>
                    <td className="p-4 text-slate-500 font-normal max-w-sm truncate" title={item.keterangan}>
                      {item.keterangan || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 rounded hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit Vendor"
                          id={`btn-edit-${item.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.nama_vendor)}
                          className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Hapus Vendor"
                          id={`btn-delete-${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingId ? 'EDIT VENDOR LOGISTIK' : 'TAMBAH VENDOR LOGISTIK'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2" id="form-vendor-master">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Nama Lengkap Vendor *
              </label>
              <input 
                type="text"
                name="nama_vendor"
                value={form.nama_vendor}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition uppercase"
                placeholder="Contoh: CV BERKAH TRUCKING MANDIRI"
                required
                id="input-vendor-nama"
              />
              <p className="text-[9px] text-slate-450 font-medium">Diubah otomatis menjadi Huruf Besar.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Kategori Vendor *
              </label>
              <select
                name="kategori"
                value={form.kategori}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-[9px] text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                required
                id="input-vendor-kategori"
              >
                <option value="Trucking">Trucking (Sewa armada / truk)</option>
                <option value="Pelayaran">Pelayaran (Transit Container Ocean Line)</option>
                <option value="Depo">Depo (Penitipan kontainer / lift-on lift-off)</option>
                <option value="Lainnya">Lainnya (Perbengkelan, Solar partner, dll)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Kontak / Telepon PIC *
              </label>
              <input 
                type="text"
                name="kontak"
                value={form.kontak}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: +62 821-2234-9022"
                required
                id="input-vendor-kontak"
              />
            </div>

            {/* Empty block to align grid on medium displays */}
            <div className="hidden md:block"></div>

            <div className="space-y-1 font-semibold col-span-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Keterangan Opsional
              </label>
              <textarea 
                name="keterangan"
                value={form.keterangan}
                onChange={handleInputChange}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition resize-none"
                placeholder="Spesifikasi layanan vendor atau catatan tarif jalan khusus..."
                id="input-vendor-keterangan"
              />
            </div>

            {/* Tasks 3 Multi-PIC (Dynamic Array Form) Container for Vendors */}
            <div className="p-4 bg-slate-50 border border-slate-250 rounded-xl space-y-3 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 w-5 h-5 rounded-full text-[10px] font-bold">1</span>
                    <span>MANAJEMEN MULTI-PIC VENDOR</span>
                  </label>
                  <span className="text-[9px] text-slate-440 block">Daftarkan penanggung jawab dari pihak Vendor</span>
                </div>
                <button
                  type="button"
                  onClick={addPic}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
                  id="btn-add-vendor-pic-array"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>TAMBAH PIC</span>
                </button>
              </div>

              {form.pics.length === 0 ? (
                <div className="text-center p-4 bg-white border border-slate-200 rounded-lg text-slate-400 font-normal text-xs italic">
                  Belum ada PIC terdaftar untuk vendor ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {form.pics.map((pic, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 relative" id={`vendor-pic-item-${idx}`}>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Kontak PIC #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removePic(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Hapus PIC"
                        >
                          <Trash className="w-3 px-0 bg-transparent shrink-0" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Jabatan / Role</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Koordinator Driver / Finance Billing"
                            value={pic.jabatan}
                            onChange={(e) => handlePicChange(idx, 'jabatan', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap PIC</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Bambang Pamungkas"
                            value={pic.nama}
                            onChange={(e) => handlePicChange(idx, 'nama', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email</label>
                          <input 
                            type="email" 
                            placeholder="Contoh: ticketing@vendor.com"
                            value={pic.email}
                            onChange={(e) => handlePicChange(idx, 'email', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">No. HP Aktif / WhatsApp</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: 081377889900"
                            value={pic.no_hp}
                            onChange={(e) => handlePicChange(idx, 'no_hp', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition shadow-xs"
              id="btn-save-vendor"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>MENYIMPAN...</span>
                </>
              ) : (
                <span>SIMPAN PERUBAHAN</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
