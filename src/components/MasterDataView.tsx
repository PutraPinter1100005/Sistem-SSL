import React, { useState } from "react";
import { Plus, Edit2, ChevronLeft, Save, Sparkles, CheckCircle, HelpCircle } from "lucide-react";
import { Customer, Driver, ServiceItem } from "../types/erp";
import { Card, Tbl, Bdg, Btn } from "./Shared";
import { IDR } from "../utils/format";
import { CUSTOMERS, DRIVERS, SVC_INK, SVC_TRK } from "../data/mockData";

// DEFAULT VALUES (jika tidak ada rate card):
const DEFAULT_GNST_FLAT    = 3100000;
const DEFAULT_GNST_PER_JAM = 350000;
const DEFAULT_TTP_LO       = 150000;
const DEFAULT_TTP_LI       = 150000;
const DEFAULT_TTP_ADM      = 50000;

interface MasterDataPageProps {
  customerRates: Record<string, Record<string, number>>;
  onUpdateCustomerRates: (customerId: string, rates: Record<string, number>) => void;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
}

export const MasterDataPage: React.FC<MasterDataPageProps> = ({ customerRates, onUpdateCustomerRates, drivers, setDrivers }) => {
  const [tab, setTab] = useState<'customer' | 'jasa_ink' | 'jasa_trk' | 'driver' | 'rates'>('customer');
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string | null>(null);
  const [tempRates, setTempRates] = useState<Record<string, number>>({});
  
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingDriverForm, setEditingDriverForm] = useState<{
    nama: string;
    noHP: string;
    platNo: string;
    tipe: 'TRAILER' | 'FUSO' | 'TRONTON';
    status: 'TERSEDIA' | 'JALAN' | 'LIBUR';
  }>({
    nama: '',
    noHP: '',
    platNo: '',
    tipe: 'TRAILER',
    status: 'TERSEDIA'
  });

  // Helper: Get custom rate count for a client code
  const getCustomRateCount = (code: string) => {
    const custRates = customerRates[code];
    if (!custRates) return 0;
    return Object.values(custRates).filter(v => typeof v === 'number' && v > 0).length;
  };

  // Open Manage panel
  const handleManageRates = (cust: Customer) => {
    setSelectedCustomerCode(cust.code);
    const existing = customerRates[cust.code] || {};
    setTempRates(existing);
  };

  const handleUpdateTempRate = (itemCode: string, value: number) => {
    setTempRates(prev => ({
      ...prev,
      [itemCode]: value
    }));
  };

  const handleSaveRates = () => {
    if (!selectedCustomerCode) return;
    onUpdateCustomerRates(selectedCustomerCode, tempRates);
    setSelectedCustomerCode(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub tabs selectors */}
      <div className="flex gap-2 flex-wrap bg-white p-3 rounded-2xl border border-slate-205 shadow-3xs select-none">
        {(
          [
            ['customer', 'Klien Customer'],
            ['jasa_ink', 'Tarif Default Inklaring'],
            ['jasa_trk', 'Tarif Default Trucking'],
            ['driver', 'Pengemudi Driver'],
            ['rates', 'Sistem Rate Card'],
          ] as const
        ).map(([id, label]) => (
          <button 
            key={id} 
            onClick={() => {
              setTab(id);
              setSelectedCustomerCode(null); // Reset sub view
            }} 
            className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
              tab === id && !selectedCustomerCode
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'customer' && !selectedCustomerCode && (
        <Card title="Daftar Klien Customer Tergabung" action={<Btn v="primary" sm icon={Plus}>Registrasi Customer</Btn>}>
          <Tbl 
            cols={[
              { l: 'Kode', fn: (r) => <span className="font-mono font-black text-blue-700">{r.code}</span> },
              { l: 'Nama Klien', fn: (r) => <span className="font-extrabold text-slate-800 text-xs">{r.name}</span> },
              { l: 'Pendaftaran NPWP', fn: (r) => <span className="font-mono text-xs">{r.npwp}</span> },
              { l: 'Domisili Kantor', fn: (r) => <span className="text-slate-500 font-medium max-w-sm block truncate" title={r.alamat}>{r.alamat}</span> },
              { l: 'TOP Term', k: 'term' },
              { l: 'Custom Rates', fn: (r) => <span className="font-bold text-slate-700">{getCustomRateCount(r.code)} item khusus</span> },
              { l: 'Edit', fn: () => <Btn v="ghost" sm icon={Edit2} /> },
            ]} 
            rows={CUSTOMERS} 
            compact 
          />
        </Card>
      )}

      {tab === 'jasa_ink' && !selectedCustomerCode && (
        <Card title="Tarif Default Jasa Inklaring PPJK" action={<Btn v="primary" sm icon={Plus}>Layanan Baru</Btn>}>
          <Tbl 
            cols={[
              { l: 'Kode Layanan', fn: (r) => <span className="font-mono font-black text-blue-700">{r.code}</span> },
              { l: 'Nama Layanan Inklaring', k: 'name' },
              { l: 'Tarif Default', r: true, fn: (r) => r.harga > 0 ? `Rp ${IDR(r.harga)}` : <Bdg xs>Custom Rate</Bdg> },
              { l: 'Asosiasi PPN', fn: (r) => `${r.ppn}%` },
              { l: 'Edit', fn: () => <Btn v="ghost" sm icon={Edit2} /> },
            ]} 
            rows={SVC_INK} 
            compact 
          />
        </Card>
      )}

      {tab === 'jasa_trk' && !selectedCustomerCode && (
        <Card title="Tarif Default Jasa Trucking EMK" action={<Btn v="primary" sm icon={Plus}>Rute Baru</Btn>}>
          <Tbl 
            cols={[
              { l: 'Kode Rutase', fn: (r) => <span className="font-mono font-black text-blue-700">{r.code}</span> },
              { l: 'Uraian Rute Jasa', k: 'name' },
              { l: 'Tarif Default', r: true, fn: (r) => r.harga > 0 ? `Rp ${IDR(r.harga)}` : <Bdg xs>Custom</Bdg> },
              { l: 'Asosiasi PPN', fn: (r) => `${r.ppn}%` },
              { l: 'Edit', fn: () => <Btn v="ghost" sm icon={Edit2} /> },
            ]} 
            rows={SVC_TRK} 
            compact 
          />
        </Card>
      )}

      {tab === 'driver' && !selectedCustomerCode && (
        <Card title="Daftar Pengemudi Internal & Mitra" action={<Btn v="primary" sm icon={Plus}>Sopir Baru</Btn>}>
          <div className="space-y-4">
            <Tbl 
              cols={[
                { l: 'ID', fn: (r) => <span className="font-mono font-bold text-xs">{r.id}</span> },
                { l: 'Nama Pengemudi', fn: (r) => <span className="font-extrabold text-slate-800 text-xs">{r.nama}</span> },
                { l: 'No Whatsapp', k: 'noHP' },
                { l: 'Plat Nomor', fn: (r) => <span className="font-mono text-blue-700 font-extrabold">{r.platNo}</span> },
                { l: 'Tipe', fn: (r) => <Bdg v="blue">{r.tipe}</Bdg> },
                { 
                  l: 'Status Dinas', 
                  fn: (r) => {
                    const colors = { TERSEDIA: 'green', JALAN: 'orange', LIBUR: 'gray' };
                    return <Bdg v={colors[r.status as keyof typeof colors] as any || 'gray'}>{r.status}</Bdg>;
                  } 
                },
                { 
                  l: 'Aksi', 
                  fn: (r) => (
                    <Btn 
                      v="ghost" 
                      sm 
                      icon={Edit2} 
                      onClick={() => {
                        setEditingDriver(r);
                        setEditingDriverForm({
                          nama: r.nama,
                          noHP: r.noHP,
                          platNo: r.platNo,
                          tipe: r.tipe,
                          status: r.status
                        });
                      }} 
                    />
                  ) 
                },
              ]} 
              rows={drivers} 
              compact 
            />

            {/* Custom Edit Driver Modal */}
            {editingDriver && (
              <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-3xs z-[1000] flex justify-center items-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Ubah Data Pengemudi ({editingDriver.id})</h4>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wider font-mono">Manajemen Logistik</p>
                    </div>
                    <button 
                      onClick={() => setEditingDriver(null)}
                      className="text-slate-400 hover:text-slate-800 font-black text-md leading-none"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider font-mono">Nama Pengemudi</label>
                      <input 
                        type="text" 
                        value={editingDriverForm.nama}
                        onChange={e => setEditingDriverForm(prev => ({ ...prev, nama: e.target.value }))}
                        className="w-full border border-slate-205 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider font-mono">No Whatsapp</label>
                      <input 
                        type="text" 
                        value={editingDriverForm.noHP}
                        onChange={e => setEditingDriverForm(prev => ({ ...prev, noHP: e.target.value }))}
                        className="w-full border border-slate-205 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider font-mono">Plat Nomor</label>
                      <input 
                        type="text" 
                        value={editingDriverForm.platNo}
                        onChange={e => setEditingDriverForm(prev => ({ ...prev, platNo: e.target.value }))}
                        className="w-full border border-slate-205 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/10 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider font-mono">Tipe Driver</label>
                        <select 
                          value={editingDriverForm.tipe}
                          onChange={e => setEditingDriverForm(prev => ({ ...prev, tipe: e.target.value as any }))}
                          className="w-full border border-slate-205 px-2.5 py-2 rounded-xl text-xs font-semibold"
                        >
                          <option value="TRAILER">TRAILER</option>
                          <option value="FUSO">FUSO</option>
                          <option value="TRONTON">TRONTON</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider font-mono">Status Dinas</label>
                        <select 
                          value={editingDriverForm.status}
                          onChange={e => setEditingDriverForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full border border-slate-205 px-2.5 py-2 rounded-xl text-xs font-semibold"
                        >
                          <option value="TERSEDIA">TERSEDIA</option>
                          <option value="JALAN">JALAN</option>
                          <option value="LIBUR">LIBUR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t select-none">
                    <Btn v="secondary" sm onClick={() => setEditingDriver(null)}>Batal</Btn>
                    <Btn 
                      v="primary" 
                      sm 
                      icon={Save}
                      onClick={() => {
                        setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...d, ...editingDriverForm } : d));
                        setEditingDriver(null);
                      }}
                    >
                      Simpan Data Supir
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'rates' && !selectedCustomerCode && (
        <Card title="Pengelolaan Rate Card per Klien">
          <div className="p-4 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed text-xs text-slate-505 font-medium">
              Sistem Rate Card memungkinkan penetapan **tarif eksklusif** per customer. Saat membuat tagihan otomatis (auto-invoice), sistem akan secara otomatis mengabaikan tarif dasar dan menarik nilai khusus di bawah jika didefinisikan.
            </div>

            <Tbl 
              cols={[
                { l: 'Kode', fn: (r) => <span className="font-mono font-black text-blue-750">{r.code}</span> },
                { l: 'Nama Customer Logistik', fn: (r) => <span className="font-extrabold text-slate-800 text-xs">{r.name}</span> },
                { 
                  l: 'Kustomisasi Tarif', 
                  fn: (r) => {
                    const count = getCustomRateCount(r.code);
                    return count > 0 
                      ? <Bdg v="green" xs>{count} Item Disetujui</Bdg> 
                      : <span className="text-slate-400 text-xs font-semibold">Menggunakan Tarif Default</span>;
                  } 
                },
                { 
                  l: 'Aksi Tarif', 
                  fn: (r) => (
                    <button 
                      onClick={() => handleManageRates(r)}
                      className="px-3 py-1 font-extrabold text-[10.5px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer text-center"
                    >
                      Kelola Rate Card →
                    </button>
                  ) 
                }
              ]}
              rows={CUSTOMERS}
              compact
            />
          </div>
        </Card>
      )}

      {/* RENDER CUSTOMER RATES SUB PANEL */}
      {selectedCustomerCode && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6 animate-fade-in">
          
          {/* Header Panel */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 select-none">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSelectedCustomerCode(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Selesaikan"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block font-mono">
                  CUSTOMER RATE CARD PANEL
                </span>
                <h3 className="text-md font-black text-slate-850">
                  {CUSTOMERS.find(c => c.code === selectedCustomerCode)?.name} ({selectedCustomerCode})
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              <Btn v="secondary" sm onClick={() => setSelectedCustomerCode(null)}>Batal</Btn>
              <Btn v="primary" sm icon={Save} onClick={handleSaveRates}>Simpan Perubahan</Btn>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-950 flex gap-2.5 text-xs font-semibold leading-relaxed">
            <Sparkles className="text-emerald-600 w-5 h-5 shrink-0" />
            <div>
              Atur nilai khusus untuk customer. Jika kolom diisi angka, sistem akan menggunakan nilai tersebut saat auto-invoice. **Kosongkan** atau isi **0** untuk kembali menggunakan tarif dasar.
            </div>
          </div>

          {/* Side-by-Side Column list rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INKLARING RATES EDITOR */}
            <Card title="Modulasi Harga Jasa Inklaring PPJK">
              <div className="p-1 divide-y divide-slate-100 text-xs font-semibold text-slate-650 max-h-[440px] overflow-y-auto">
                {SVC_INK.map(item => {
                  const val = tempRates[item.code] || 0;
                  return (
                    <div key={item.code} className="flex flex-col sm:flex-row justify-between sm:items-center py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-mono text-blue-700 font-extrabold text-[11px] bg-blue-50 border border-blue-100 rounded px-1.5 py-0.2">{item.code}</span>
                          <span className="text-slate-800 font-bold block truncate max-w-sm" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Default: Rp {IDR(item.harga)} (PPN {item.ppn}%)</span>
                      </div>

                      <div className="w-40 shrink-0">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                          <input 
                            type="number"
                            step={1000}
                            className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs text-right font-black text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                            placeholder="default"
                            value={val || ''}
                            onChange={e => handleUpdateTempRate(item.code, Number(e.target.value))}
                          />
                        </div>
                        {val > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-600 block mt-1 text-right">Rp {IDR(val)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* TRUCKING RATES EDITOR */}
            <Card title="Modulasi Tarif Jalur Trucking EMK">
              <div className="p-1 divide-y divide-slate-100 text-xs font-semibold text-slate-650 max-h-[440px] overflow-y-auto">
                {SVC_TRK.map(item => {
                  const val = tempRates[item.code] || 0;
                  return (
                    <div key={item.code} className="flex flex-col sm:flex-row justify-between sm:items-center py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-mono text-orange-700 font-extrabold text-[11px] bg-orange-50 border border-orange-100 rounded px-1.5 py-0.2">{item.code}</span>
                          <span className="text-slate-800 font-bold block truncate max-w-sm" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Default: Rp {IDR(item.harga)}</span>
                      </div>

                      <div className="w-40 shrink-0">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                          <input 
                            type="number"
                            step={1000}
                            className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs text-right font-black text-slate-800 focus:ring-2 focus:ring-blue-500/10"
                            placeholder="default"
                            value={val || ''}
                            onChange={e => handleUpdateTempRate(item.code, Number(e.target.value))}
                          />
                        </div>
                        {val > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-600 block mt-1 text-right">Rp {IDR(val)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>

          {/* RATE CARD: GENSET & TITIPAN */}
          <Card title="Tarif Khusus Genset & Titipan">
            <div className="p-4 space-y-5 text-xs font-semibold">

              {/* GENSET */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">
                  Genset / Reefer Container
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tarif Flat 6 Jam */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">
                      Tarif 6 Jam Pertama (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder={String(DEFAULT_GNST_FLAT)}
                        value={tempRates['GNST_FLAT'] || ''}
                        onChange={e => handleUpdateTempRate('GNST_FLAT', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Default: Rp {IDR(DEFAULT_GNST_FLAT)}
                    </p>
                  </div>

                  {/* Tarif Per Jam Tambahan */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">
                      Tarif Per Jam Tambahan ({'>'} 6 jam)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder={String(DEFAULT_GNST_PER_JAM)}
                        value={tempRates['GNST_PER_JAM'] || ''}
                        onChange={e => handleUpdateTempRate('GNST_PER_JAM', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Default: Rp {IDR(DEFAULT_GNST_PER_JAM)}/jam
                    </p>
                  </div>
                </div>
              </div>

              {/* TITIPAN */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">
                  Titipan Container di Depo
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tarif Per Hari */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">
                      Tarif Per Hari (IDR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder="Isi tarif/hari"
                        value={tempRates['TTP_PER_HARI'] || ''}
                        onChange={e => handleUpdateTempRate('TTP_PER_HARI', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-orange-500 mt-1">
                      ⚠ Wajib diisi — tidak ada default
                    </p>
                  </div>

                  {/* LO */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Lift Off (LO)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder={String(DEFAULT_TTP_LO)}
                        value={tempRates['TTP_LO'] || ''}
                        onChange={e => handleUpdateTempRate('TTP_LO', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Default: Rp {IDR(DEFAULT_TTP_LO)}</p>
                  </div>

                  {/* LI */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Lift In (LI)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder={String(DEFAULT_TTP_LI)}
                        value={tempRates['TTP_LI'] || ''}
                        onChange={e => handleUpdateTempRate('TTP_LI', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Default: Rp {IDR(DEFAULT_TTP_LI)}</p>
                  </div>

                  {/* ADM */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Administrasi (ADM)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">Rp</span>
                      <input type="number" step={1000}
                        className="w-full border border-slate-205 rounded-lg pl-8 pr-2 py-1 font-mono text-xs font-black"
                        placeholder={String(DEFAULT_TTP_ADM)}
                        value={tempRates['TTP_ADM'] || ''}
                        onChange={e => handleUpdateTempRate('TTP_ADM', Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Default: Rp {IDR(DEFAULT_TTP_ADM)}</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>


          {/* Lower footer actions */}
          <div className="pt-4 border-t flex justify-end space-x-2 select-none">
            <Btn v="secondary" onClick={() => setSelectedCustomerCode(null)}>Batal</Btn>
            <Btn v="primary" icon={Save} onClick={handleSaveRates}>Simpan Rate Card Customer</Btn>
          </div>

        </div>
      )}

    </div>
  );
};
