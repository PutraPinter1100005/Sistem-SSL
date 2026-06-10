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
  Briefcase,
  Users,
  Trash,
  PlusCircle,
  HelpCircle,
  Globe,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import Modal from './Modal';

export default function CustomerView() {
  const { 
    master_customers, 
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [form, setForm] = useState({
    card_id: '',
    nama_perusahaan: '',
    alamat: '',
    no_telepon: '',
    npwp: '',
    is_potong_pph23: false,
    is_tampil_pph23: false,
    status_aktif: true, // Default Aktif (true)
    customer_group: '', // Sukanda Group, Mayora Group, DIT Group, SAG Group, ABB Group
    term_of_payment: 'Net 30', // Net 7, Net 14, Net 30
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
      card_id: '',
      nama_perusahaan: '',
      alamat: '',
      no_telepon: '',
      npwp: '',
      is_potong_pph23: false,
      is_tampil_pph23: false,
      status_aktif: true,
      customer_group: '',
      term_of_payment: 'Net 30',
      pics: []
    });
    setErrors({});
    setEditingId(null);
  };

  // Input Change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    if (name === 'npwp') {
      // Clean non-digits and limit to max 16 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      setForm(prev => ({ ...prev, [name]: cleaned }));
    } else if (name === 'card_id') {
      // Input ini WAJIB persis 3 huruf abjad (tidak boleh ada angka, karakter spesial, atau spasi).
      // WAJIB otomatis menjadi Uppercase (Auto-Capslock).
      // Jika user mencoba mengetik lebih dari 3 huruf atau mengetik angka, blokir inputannya (jangan dirender di form).
      const cleaned = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
      setForm(prev => ({ ...prev, card_id: cleaned }));
    } else if (name === 'nama_perusahaan') {
      // WAJIB diubah otomatis menjadi Uppercase (Auto-Capslock) saat user mengetik
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleChange = (name: 'is_potong_pph23' | 'is_tampil_pph23' | 'status_aktif', val: boolean) => {
    setForm(prev => {
      const updated = { ...prev, [name]: val };
      // Logical constraint: If is_potong_pph23 is turned off, automatically disable is_tampil_pph23
      if (name === 'is_potong_pph23' && !val) {
        updated.is_tampil_pph23 = false;
      }
      return updated;
    });
  };

  // PIC Management Helpers
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
      card_id: item.card_id || '',
      nama_perusahaan: item.nama_perusahaan || '',
      alamat: item.alamat || '',
      no_telepon: item.no_telepon || '',
      npwp: item.npwp || '',
      is_potong_pph23: item.is_potong_pph23 || false,
      is_tampil_pph23: item.is_tampil_pph23 || false,
      status_aktif: item.status_aktif !== undefined ? item.status_aktif : true,
      customer_group: item.customer_group || '',
      term_of_payment: item.term_of_payment || 'Net 30',
      pics: item.pics || []
    });
    setIsOpenModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Mandatory Column validation
    if (!form.nama_perusahaan.trim()) {
      newErrors.nama_perusahaan = "Nama Perusahaan wajib diisi!";
    }
    if (!form.alamat.trim()) {
      newErrors.alamat = "Alamat Lengkap Perusahaan wajib diisi!";
    }
    if (!form.no_telepon.trim()) {
      newErrors.no_telepon = "No. Telepon / PIC Kantor wajib diisi!";
    }

    if (!form.card_id.trim()) {
      newErrors.card_id = "Card ID wajib diisi!";
    } else if (form.card_id.length !== 3) {
      newErrors.card_id = "Card ID wajib persis 3 huruf abjad!";
    }

    if (!form.npwp.trim()) {
      newErrors.npwp = "Nomor NPWP wajib diisi!";
    } else if (form.npwp.length < 15) {
      newErrors.npwp = "NPWP wajib 15 digit!";
    }

    // Logic Anti-Duplikat: Berikan pengecekan dari master_customers yang ada
    const otherCustomers = (master_customers || []).filter(c => c.id !== editingId);

    if (form.card_id.trim()) {
      const dupCardId = otherCustomers.find(
        c => (c.card_id || '').toUpperCase() === form.card_id.toUpperCase()
      );
      if (dupCardId) {
        newErrors.card_id = "Card ID sudah terdaftar!";
      }
    }

    if (form.nama_perusahaan.trim()) {
      const dupNama = otherCustomers.find(
        c => (c.nama_perusahaan || '').toUpperCase() === form.nama_perusahaan.trim().toUpperCase()
      );
      if (dupNama) {
        newErrors.nama_perusahaan = "Nama Pelanggan sudah terdaftar!";
      }
    }

    if (form.npwp.trim()) {
      const dupNpwp = otherCustomers.find(
        c => (c.npwp || '') === form.npwp.trim()
      );
      if (dupNpwp) {
        newErrors.npwp = "Nomor NPWP sudah terdaftar!";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerNotification("Validasi gagal! Harap periksa kolom yang bermasalah.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update Action
        await updateEntity('master_customers', editingId, {
          ...form,
          updatedAt: new Date().toISOString()
        });
        triggerNotification(`Pelanggan "${form.nama_perusahaan}" berhasil diperbarui.`);
      } else {
        // Create Action
        const id = `CS-${Math.floor(1000 + Math.random() * 9000)}`;
        await addEntity('master_customers', {
          id,
          ...form,
          createdAt: new Date().toISOString()
        });
        triggerNotification(`Pelanggan baru "${form.nama_perusahaan}" berhasil ditambahkan.`);
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
    const confirmation = window.confirm(`Apakah Anda yakin ingin menghapus data customer "${name}"?`);
    if (!confirmation) return;

    try {
      await deleteEntity('master_customers', id);
      triggerNotification(`Customer "${name}" berhasil dihapus dari database.`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus data: " + (err?.message || String(err)));
    }
  };

  // Filtering data
  const filteredData = (master_customers || []).filter(c => {
    const matchesSearch = 
      (c.nama_perusahaan || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.card_id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.npwp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customer_group || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4" id="customer-view-container">
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
          id="btn-add-customer"
        >
          <Plus className="w-4 h-4 text-white font-extrabold" />
          <span>TAMBAH CUSTOMER</span>
        </button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Customer, Card ID, NPWP..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="customer-search-input"
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
                <th className="p-4 w-28">Card ID</th>
                <th className="p-4">Nama Perusahaan</th>
                <th className="p-4">Group / TOP</th>
                <th className="p-4">NPWP (Coretax)</th>
                <th className="p-4">Alamat & Kontak</th>
                <th className="p-4">Status</th>
                <th className="p-4">Status PPh 23</th>
                <th className="p-4 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loadingData?.master_customers ? (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="font-semibold text-slate-500">Sinkronisasi data master customer...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-slate-400 font-normal">
                    Belum ada data customer logistik terdaftar atau tidak ditemukan kecocokan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/55 transition-colors" id={`row-customer-${item.id}`}>
                    <td className="p-4 font-mono text-slate-400 text-[10px] font-bold">{item.id}</td>
                    <td className="p-4 font-mono text-slate-800 text-[11px] font-black">{item.card_id || '-'}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 flex flex-col">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.nama_perusahaan}
                        </span>
                        {item.pics && item.pics.length > 0 && (
                          <div className="text-[10px] text-slate-450 font-normal mt-1 bg-slate-50 px-2 py-1 rounded inline-flex items-center gap-1.5 w-fit">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{item.pics.length} PIC Terdaftar: {item.pics.map((p: any) => p.nama).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">{item.customer_group || <span className="text-slate-400 font-normal">(Non-Group)</span>}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                          {item.term_of_payment || 'Net 30'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600">{item.npwp || '-'}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-slate-500 font-normal text-[11px]">
                        <span className="font-semibold text-slate-700">{item.no_telepon}</span>
                        <span className="truncate max-w-xs block" title={item.alamat}>{item.alamat}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.status_aktif !== false ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-red-50 text-red-700 border border-red-200">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.is_potong_pph23 ? (
                        <div className="inline-flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-pink-50 text-pink-700 border border-pink-200">
                            PPh 23 (2%)
                          </span>
                          {item.is_tampil_pph23 && (
                            <span className="inline-flex items-center text-[8px] font-bold text-blue-500 tracking-wide">
                              Show on Invoice
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase bg-slate-100 text-slate-550 border border-slate-200">
                          Non-PPh 23
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 rounded hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit Customer"
                          id={`btn-edit-${item.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.nama_perusahaan)}
                          className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Hapus Customer"
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

      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingId ? 'EDIT CUSTOMER LOGISTIK' : 'TAMBAH CUSTOMER LOGISTIK'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2" id="form-customer-master">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Baris Pertama: Nama Perusahaan & Status Aktif */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Nama Perusahaan (Customer) *
              </label>
              <input 
                type="text"
                name="nama_perusahaan"
                value={form.nama_perusahaan}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition uppercase"
                placeholder="Contoh: PT INDOFOOD SUKSES MAKMUR TBK"
                required
                id="input-customer-nama-perusahaan"
              />
              {errors.nama_perusahaan ? (
                <p className="text-[11px] text-red-650 font-bold font-sans mt-0.5" id="err-nama-perusahaan">
                  {errors.nama_perusahaan}
                </p>
              ) : (
                <p className="text-[9px] text-slate-450 font-medium font-sans">Diubah otomatis menjadi Huruf Besar.</p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between h-[58px]">
              <div>
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide block">
                  Status Akun Customer
                </label>
                <span className="text-[9px] text-slate-450 block font-normal font-sans">Aktif dalam dropdown modul</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.status_aktif} 
                  onChange={(e) => handleToggleChange('status_aktif', e.target.checked)}
                  className="sr-only peer"
                  id="toggle-status-aktif"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Baris Kedua: Card ID & Customer Group */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Card ID *
              </label>
              <input 
                type="text"
                name="card_id"
                value={form.card_id}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-black focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition uppercase"
                placeholder="Contoh: INDO-SUKSES"
                required
                id="input-customer-card-id"
              />
              {errors.card_id ? (
                <p className="text-[11px] text-red-650 font-bold font-sans mt-0.5" id="err-card-id">
                  {errors.card_id}
                </p>
              ) : (
                <p className="text-[9px] text-slate-450 font-medium font-sans">Diubah otomatis menjadi Huruf Besar.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Customer Group (Opsional)
              </label>
              <select
                name="customer_group"
                value={form.customer_group}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-[9px] text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                id="input-customer-group"
              >
                <option value="">-- Tanpa Group --</option>
                <option value="Sukanda Group">Sukanda Group</option>
                <option value="Mayora Group">Mayora Group</option>
                <option value="DIT Group">DIT Group</option>
                <option value="SAG Group">SAG Group</option>
                <option value="ABB Group">ABB Group</option>
              </select>
            </div>

            {/* Baris Ketiga: TOP & NPWP */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Term of Payment *
              </label>
              <select
                name="term_of_payment"
                value={form.term_of_payment}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-[9px] text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition cursor-pointer"
                required
                id="input-customer-top"
              >
                <option value="Net 7">Net 7</option>
                <option value="Net 14">Net 14</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Nomor Pokok Wajib Pajak (NPWP Coretax 16 digit) *
              </label>
              <input 
                type="text"
                name="npwp"
                value={form.npwp}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold font-mono focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: 0130232450912000"
                required
                id="input-customer-npwp"
              />
              {errors.npwp ? (
                <p className="text-[11px] text-red-650 font-bold font-sans mt-0.5" id="err-npwp">
                  {errors.npwp}
                </p>
              ) : (
                <p className="text-[9px] text-slate-450 font-medium font-sans">NPWP Coretax memiliki persis 16 karakter numeris.</p>
              )}
            </div>

            {/* Baris Keempat: No. Telepon & PPh 23 Potong */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                No. Telepon / PIC Kantor *
              </label>
              <input 
                type="text"
                name="no_telepon"
                value={form.no_telepon}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                placeholder="Contoh: 021-88981232 atau 0812345678"
                required
                id="input-customer-telp"
              />
              {errors.no_telepon && (
                <p className="text-[11px] text-red-650 font-bold font-sans mt-0.5" id="err-no-telepon">
                  {errors.no_telepon}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-center h-[58px]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide block">
                    Potong PPh Pasal 23 (2%)
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.is_potong_pph23} 
                    onChange={(e) => handleToggleChange('is_potong_pph23', e.target.checked)}
                    className="sr-only peer"
                    id="toggle-is-potong-pph23"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {form.is_potong_pph23 && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/65 animate-in fade-in duration-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Tampilkan Potongan di Invoice</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.is_tampil_pph23} 
                      onChange={(e) => handleToggleChange('is_tampil_pph23', e.target.checked)}
                      className="sr-only peer"
                      id="toggle-is-tampil-pph23"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}
            </div>

            {/* Alamat (col-span-1 md:col-span-2) */}
            <div className="space-y-1 font-semibold col-span-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Alamat Lengkap Perusahaan *
              </label>
              <textarea 
                name="alamat"
                value={form.alamat}
                onChange={handleInputChange}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition resize-none"
                placeholder="Alamat penagihan & operasional..."
                required
                id="input-customer-alamat"
              />
              {errors.alamat && (
                <p className="text-[11px] text-red-650 font-bold font-sans mt-0.5" id="err-alamat">
                  {errors.alamat}
                </p>
              )}
            </div>

            {/* Multi-PIC Element (col-span-1 md:col-span-2) */}
            <div className="p-4 bg-slate-50 border border-slate-250 rounded-xl space-y-3 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 w-5 h-5 rounded-full text-[10px] font-bold">1</span>
                    <span>MANAJEMEN MULTI-PIC (Fungsional)</span>
                  </label>
                  <span className="text-[9px] text-slate-400 block font-sans">Daftarkan penanggung jawab operasional / invoicing perusahaan</span>
                </div>
                <button
                  type="button"
                  onClick={addPic}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
                  id="btn-add-pic-array"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>TAMBAH PIC</span>
                </button>
              </div>

              {form.pics.length === 0 ? (
                <div className="text-center p-4 bg-white border border-slate-200 rounded-lg text-slate-400 font-normal text-xs italic">
                  Belum ada PIC terdaftar untuk customer ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {form.pics.map((pic, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 relative" id={`pic-item-${idx}`}>
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
                            placeholder="Contoh: Manajer Operasional / Admin Invoice"
                            value={pic.jabatan}
                            onChange={(e) => handlePicChange(idx, 'jabatan', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="space-y-1 font-semibold">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap PIC</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Adi Wijaya"
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
                            placeholder="Contoh: pic@perusahaan.com"
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
                            placeholder="Contoh: 081299001122"
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
              className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-100 border border-slate-200 rounded-lg transition shrink-0 animate-pulse-hover"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition shadow-xs"
              id="btn-save-customer"
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
