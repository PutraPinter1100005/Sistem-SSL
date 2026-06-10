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
  Truck,
  Users
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

// Auto-format plate number (Nopol) logic
const formatNopol = (val: string) => {
  // Clear any existing non-alphanumeric characters and make uppercase
  const raw = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Match prefix letters (1-2), numbers (1-4), suffix letters (1-4)
  const match = raw.match(/^([A-Z]{1,2})([0-9]{0,4})([A-Z]{0,4})/);
  if (match) {
    const [, p1, p2, p3] = match;
    let res = p1;
    if (p2) res += ' ' + p2;
    if (p3) res += ' ' + p3;
    return res;
  }
  return raw;
};

export default function TruckView() {
  const { 
    master_trucks, 
    master_vendors, 
    master_drivers,
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
    nopol: '',
    jenis_truk: 'CDD', // Head Tractor, Engkel, CDD, CDE, Wingbox, Blind Van. Default CDD
    id_supir_utama: '', // references master_drivers
  });

  // Simple Notification Trigger
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      nopol: '',
      jenis_truk: 'CDD',
      id_supir_utama: '',
    });
    setEditingId(null);
  };

  // Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setForm(prev => {
      let updatedValue = value;
      if (name === 'nopol') {
        updatedValue = formatNopol(value);
      }
      return { ...prev, [name]: updatedValue };
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
      nopol: item.nopol || '',
      jenis_truk: item.jenis_truk || 'CDD',
      id_supir_utama: item.id_supir_utama || '',
    });
    setIsOpenModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nopol.trim() || !form.jenis_truk.trim()) {
      alert("Harap lengkapi semua field bertanda bintang (*)");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update Action
        await updateEntity('master_trucks', editingId, {
          ...form,
          kepemilikan: 'Milik Sendiri',
          id_vendor: '',
          updatedAt: new Date().toISOString()
        });
        triggerNotification(`Armada "${form.nopol}" berhasil diperbarui.`);
      } else {
        // Create Action
        const id = `TR-${Math.floor(1000 + Math.random() * 9000)}`;
        await addEntity('master_trucks', {
          id,
          ...form,
          kepemilikan: 'Milik Sendiri',
          id_vendor: '',
          createdAt: new Date().toISOString()
        });
        triggerNotification(`Armada baru "${form.nopol}" berhasil didaftarkan.`);
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
    const confirmation = window.confirm(`Apakah Anda yakin ingin menghapus armada "${name}"?`);
    if (!confirmation) return;

    try {
      await deleteEntity('master_trucks', id);
      triggerNotification(`Armada "${name}" berhasil dihapus dari database.`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus data: " + (err?.message || String(err)));
    }
  };

  // Filtering data in table
  const filteredData = (master_trucks || []).filter(t => {
    const matchesSearch = 
      (t.nopol || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.jenis_truk || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getDriverName = (driverId: string) => {
    const driver = (master_drivers || []).find(d => d.id === driverId);
    return driver ? driver.nama_supir : <span className="text-slate-400 font-normal">Belum Ditunjuk</span>;
  };

  return (
    <div className="space-y-4" id="truck-view-container">
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
          id="btn-add-truck"
        >
          <Plus className="w-4 h-4 text-white font-extrabold" />
          <span>DAFTARKAN TRUK</span>
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Truk, Jenis, ID..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="truck-search-input"
          />
        </div>
      </div>

      {/* Database Master Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 tracking-wider uppercase">
                <th className="p-4 w-24">ID Truk</th>
                <th className="p-4">Nopol (No. Kendaraan)</th>
                <th className="p-4">Tipe Armada</th>
                <th className="p-4">Supir Utama</th>
                <th className="p-4 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loadingData?.master_trucks ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="font-semibold text-slate-500">Sinkronisasi armada truk logistik...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-slate-400 font-normal">
                    Belum ada data unit truk armada terdaftar dalam database.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/55 transition-colors" id={`row-truck-${item.id}`}>
                    <td className="p-4 font-mono text-slate-500 text-[11px] font-bold">{item.id}</td>
                    <td className="p-4">
                      <div className="inline-block px-2.5 py-1 bg-slate-900 text-yellow-450 border border-slate-750 font-black font-mono text-[11px] rounded tracking-wider shadow-sm uppercase">
                        {item.nopol}
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.jenis_truk}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getDriverName(item.id_supir_utama)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 rounded hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit Armada"
                          id={`btn-edit-${item.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.nopol)}
                          className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Hapus Armada"
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
        title={editingId ? 'EDIT KENDARAAN ARMADA' : 'TAMBAH KENDARAAN ARMADA'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" id="form-truck-master">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Nomor Polisi (Nopol Plat) *
              </label>
              <input 
                type="text"
                name="nopol"
                value={form.nopol}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-black placeholder:font-sans placeholder:font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition uppercase"
                placeholder="Contoh: B 1234 CD"
                required
                id="input-truck-nopol"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Tipe / Ukuran Truk *
              </label>
              <select
                name="jenis_truk"
                value={form.jenis_truk}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-[9px] text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                required
                id="input-truck-jenis"
              >
                <option value="Head Tractor">Head Tractor</option>
                <option value="Engkel">Engkel</option>
                <option value="CDD">CDD</option>
                <option value="CDE">CDE</option>
                <option value="Wingbox">Wingbox</option>
                <option value="Blind Van">Blind Van</option>
              </select>
            </div>

            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Supir Utama Kendaraan
              </label>
              <select
                name="id_supir_utama"
                value={form.id_supir_utama}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                id="input-truck-supir-utama"
              >
                <option value="">-- Letakkan Supir (Kosong jika cadangan) --</option>
                {(master_drivers || []).map(d => {
                  const status_karyawan = d.status_karyawan || d.status_ketersediaan || 'Aktif';
                  return (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.nama_supir} ({status_karyawan})
                    </option>
                  );
                })}
              </select>
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
              id="btn-save-truck"
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
