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
  User,
  Smartphone,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

export default function DriverView() {
  const { 
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
    nama_supir: '',
    no_ktp: '',
    no_hp: '',
    status_karyawan: 'Aktif', // Aktif, Cuti/Izin, Resign
  });

  // Simple Notification Trigger
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      nama_supir: '',
      no_ktp: '',
      no_hp: '',
      status_karyawan: 'Aktif',
    });
    setEditingId(null);
  };

  // Input Change with KTP/Phone filtering
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'no_ktp') {
      // Limiting only digits and max 16 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      setForm(prev => ({ ...prev, [name]: cleaned }));
    } else if (name === 'no_hp') {
      const cleaned = value.replace(/[^\d+]/g, '');
      setForm(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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
      nama_supir: item.nama_supir || '',
      no_ktp: item.no_ktp || '',
      no_hp: item.no_hp || '',
      status_karyawan: item.status_karyawan || item.status_ketersediaan || 'Aktif', // backward compatibility
    });
    setIsOpenModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nama_supir.trim() || !form.no_ktp.trim() || !form.no_hp.trim() || !form.status_karyawan) {
      alert("Harap lengkapi semua field bertanda bintang (*)");
      return;
    }

    if (form.no_ktp.length < 16) {
      alert("Nomor KTP harus tepat 16 digit.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update Action
        await updateEntity('master_drivers', editingId, {
          ...form,
          updatedAt: new Date().toISOString()
        });
        triggerNotification(`Supir "${form.nama_supir}" berhasil diperbarui.`);
      } else {
        // Create Action
        const id = `DR-${Math.floor(1000 + Math.random() * 9000)}`;
        await addEntity('master_drivers', {
          id,
          ...form,
          createdAt: new Date().toISOString()
        });
        triggerNotification(`Supir baru "${form.nama_supir}" berhasil ditambahkan.`);
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
    const confirmation = window.confirm(`Apakah Anda yakin ingin menghapus data supir "${name}"?`);
    if (!confirmation) return;

    try {
      await deleteEntity('master_drivers', id);
      triggerNotification(`Supir "${name}" berhasil dihapus dari database.`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus data: " + (err?.message || String(err)));
    }
  };

  // Filtering data
  const filteredData = (master_drivers || []).filter(d => {
    const status_karyawan = d.status_karyawan || d.status_ketersediaan || 'Aktif';
    const matchesSearch = 
      (d.nama_supir || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.no_ktp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      status_karyawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    // Normalizing status for backwards compatibility
    const normalizedStatus = status === 'Available' || status === 'On-Duty' ? 'Aktif' : (status === 'Inactive' ? 'Cuti/Izin' : status);
    
    switch (normalizedStatus) {
      case 'Aktif':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>AKTIFF</span>
          </span>
        );
      case 'Cuti/Izin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>CUTI / IZIN</span>
          </span>
        );
      case 'Resign':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>RESIGN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-slate-50 text-slate-705 border border-slate-205">
            <span>{normalizedStatus}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="driver-view-container">
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
          id="btn-add-driver"
        >
          <Plus className="w-4 h-4 text-white font-extrabold" />
          <span>TAMBAH SUPIR</span>
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Supir, KTP, Status..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="driver-search-input"
          />
        </div>
      </div>

      {/* Database Master Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 tracking-wider uppercase">
                <th className="p-4 w-24">ID Supir</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">No. KTP</th>
                <th className="p-4">No. Handphone</th>
                <th className="p-4">Status Karyawan</th>
                <th className="p-4 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loadingData?.master_drivers ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="font-semibold text-slate-500">Sinkronisasi rosters supir ERP...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400 font-normal">
                    Belum ada data supir fleet terdaftar dalam database.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/55 transition-colors" id={`row-driver-${item.id}`}>
                    <td className="p-4 font-mono text-slate-500 text-[11px] font-bold">{item.id}</td>
                    <td className="p-4 font-extrabold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.nama_supir}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {item.no_ktp}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-650">
                      <div className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        {item.no_hp}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(item.status_karyawan || item.status_ketersediaan || 'Aktif')}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 rounded hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit Supir"
                          id={`btn-edit-${item.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.nama_supir)}
                          className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Hapus Supir"
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
        title={editingId ? 'EDIT ROSTER SUPIR FLEET' : 'TAMBAH ROSTER SUPIR FLEET'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" id="form-driver-master">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">
                Nama Lengkap Supir *
              </label>
              <input 
                type="text"
                name="nama_supir"
                value={form.nama_supir}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: Budi Setyawan"
                required
                id="input-driver-nama"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">
                Status Karyawan *
              </label>
              <select
                name="status_karyawan"
                value={form.status_karyawan}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-[9px] text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                required
                id="input-driver-status"
              >
                <option value="Aktif">Aktif (Aktif dalam roster fleet)</option>
                <option value="Cuti/Izin">Cuti/Izin (Sedang cuti cuti tahunan / sakit / izin)</option>
                <option value="Resign">Resign (Sudah keluar / nonaktif dari perusahaan)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">
                Nomor KTP (16 Digit) *
              </label>
              <input 
                type="text"
                name="no_ktp"
                value={form.no_ktp}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: 3275010903850003"
                required
                id="input-driver-ktp"
              />
              <p className="text-[9px] text-slate-450 font-normal">Harus berisi tepat 16 karakter numerik sesuai KTP.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">
                No. Handphone (Aktif WA) *
              </label>
              <input 
                type="text"
                name="no_hp"
                value={form.no_hp}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold font-mono focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: 081288981223"
                required
                id="input-driver-hp"
              />
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
              id="btn-save-driver"
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
