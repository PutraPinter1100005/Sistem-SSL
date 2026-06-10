import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Save, Sparkles, HelpCircle, AlertCircle, Bookmark } from "lucide-react";
import { JobOrder, Invoice, InvoiceItem } from "../types/erp";
import { Card, Btn, Bdg } from "./Shared";
import { CUSTOMERS, SVC_INK, SVC_TRK } from "../data/mockData";
import { IDR, TODAY, formatJam } from "../utils/format";

interface InvoiceFormProps {
  job: JobOrder; // The linked Job Order
  type: 'INK' | 'TRK' | 'RMB' | 'RMB-A';
  customerRates: Record<string, Record<string, number>>; // custom rate cards
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  repairData?: { id: string; noContainer: string; totalBiaya: number } | null; // For RMB-A repair invoice
}

const BULAN = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGS','SEP','OKT','NOV','DES'];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  job, 
  type, 
  customerRates, 
  onSave, 
  onCancel,
  repairData = null
}) => {
  const cust = CUSTOMERS.find(c => c.code === job.customerId);
  const [items, setItems] = useState<Array<{ code: string; nama: string; qty: number; harga: number; total: number; noRef: string }>>([]);
  const [tanggal, setTanggal] = useState(TODAY);
  const [term, setTerm] = useState(cust?.term || 'net 15');
  const [ket, setKet] = useState('');

  // Auto-calculated fields
  const [subtotal, setSubtotal] = useState(0);
  const [dppNilaiLain, setDppNilaiLain] = useState<number | null>(null);
  const [ppnAmount, setPpnAmount] = useState(0);
  const [totalBayar, setTotalBayar] = useState(0);

  // Helper: lookup price with Customer Rate Card support
  const getServicePrice = (serviceCode: string, defaultPrice: number) => {
    if (customerRates && customerRates[job.customerId] && customerRates[job.customerId][serviceCode] !== undefined) {
      const customVal = customerRates[job.customerId][serviceCode];
      return customVal > 0 ? customVal : defaultPrice;
    }
    return defaultPrice;
  };

  // Run initialization when mount
  useEffect(() => {
    let initialItems: Array<{ code: string; nama: string; qty: number; harga: number; total: number; noRef: string }> = [];

    if (type === 'INK') {
      setKet('Penagihan jasa inklaring PPJK sesuai ketetapan rate card operasional.');
      
      // Default items for Inklaring
      const ediDefault = SVC_INK.find(s => s.code === 'EDI')?.harga || 150000;
      const hdlDefault = SVC_INK.find(s => s.code === 'HDL')?.harga || 300000;

      const ediPrice = getServicePrice('EDI', ediDefault);
      const hdlPrice = getServicePrice('HDL', hdlDefault);

      initialItems.push({ code: 'EDI', nama: 'EDI PPJK', qty: 1, harga: ediPrice, total: ediPrice, noRef: '' });
      initialItems.push({ code: 'HDL', nama: 'JASA HANDLING', qty: 1, harga: hdlPrice, total: hdlPrice, noRef: '' });

      // Principal Inklaring based on containers
      const sizeStr = job.party.includes('40') ? '40"' : '20"';
      const sizeKey = job.party.includes('40') ? '40HP' : '20HP';
      const rateCode = `INK${sizeKey}`;
      const defaultInkPrice = SVC_INK.find(s => s.code === rateCode)?.harga || 300000;
      const inkPrice = getServicePrice(rateCode, defaultInkPrice);

      initialItems.push({ 
        code: rateCode, 
        nama: `INKLARING JKT ${sizeStr} UTAMA`, 
        qty: 1, 
        harga: inkPrice, 
        total: inkPrice, 
        noRef: '' 
      });

      const count = job.containers.length;
      if (count > 1) {
        const nextSizeKey = job.party.includes('40') ? '40HB' : '20HB';
        const nextRateCode = `INK${nextSizeKey}`;
        const defaultNextPrice = SVC_INK.find(s => s.code === nextRateCode)?.harga || 250000;
        const nextPrice = getServicePrice(nextRateCode, defaultNextPrice);

        initialItems.push({ 
          code: nextRateCode, 
          nama: `INKLARING JKT ${sizeStr} BERIKUTNYA`, 
          qty: count - 1, 
          harga: nextPrice, 
          total: nextPrice * (count - 1), 
          noRef: '' 
        });
      }

      // If Merah jalur, auto-suggest behandle as well
      if (job.jalur === 'MERAH') {
        const defaultBehandle = SVC_INK.find(s => s.code === 'BEHANDEL')?.harga || 1500000;
        const behandlePrice = getServicePrice('BEHANDEL', defaultBehandle);
        initialItems.push({
          code: 'BEHANDEL',
          nama: 'BEHANDEL JALUR MERAH',
          qty: 1,
          harga: behandlePrice,
          total: behandlePrice,
          noRef: ''
        });
      }

      // ── AUTO-ADD GENSET per container aktif ──
      job.containers.forEach(c => {
        if (c.genset?.isActive && c.genset.totalBiaya > 0) {
          const noKont = c.no || `Cont-${c.ukuran}`;
          initialItems.push({
            code: 'GNST',
            nama: `GENSET/REEFER - ${noKont} (${formatJam(c.genset.totalJam)})`,
            qty: 1,
            harga: c.genset.totalBiaya,
            total: c.genset.totalBiaya,
            noRef: ''
          });
        }
      });

      // ── AUTO-ADD TITIPAN per container aktif ──
      job.containers.forEach(c => {
        if (c.titipan?.isActive && c.titipan.totalBiaya > 0 && c.titipan.tarifPerHari > 0) {
          const noKont = c.no || `Cont-${c.ukuran}`;
          initialItems.push({
            code: 'TTP',
            nama: `TITIPAN CONTAINER - ${noKont} (${c.titipan.jumlahHari} hari @ Rp ${IDR(c.titipan.tarifPerHari)})`,
            qty: 1,
            harga: c.titipan.totalBiaya,
            total: c.titipan.totalBiaya,
            noRef: ''
          });
        }
      });

    } else if (type === 'TRK') {
      setKet('Penagihan jasa angkutan darat trucking EMK.');

      // Auto-suggest container destinations
      // Rule: kode = 'TR' + ukuran.replace('"','') + tujuan.toUpperCase().replace(' ','')
      job.containers.forEach((c) => {
        const pureSize = c.ukuran.replace('"', '');
        const pureDestination = c.tujuan.toUpperCase().replace(/\s+/g, '');
        const rateCode = `TR${pureSize}${pureDestination}`;

        const defaultOption = SVC_TRK.find(s => s.code === rateCode);
        const defaultTrkPrice = defaultOption?.harga || 1800000;
        const trkPrice = getServicePrice(rateCode, defaultTrkPrice);
        const nameLabel = defaultOption?.name || `TRUCKING ${c.ukuran} ${c.tujuan.toUpperCase()}`;

        initialItems.push({
          code: rateCode,
          nama: nameLabel,
          qty: 1,
          harga: trkPrice,
          total: trkPrice,
          noRef: ''
        });

        // If there's an active cash-inap from driver assignments, append it
        if (c.inap > 0) {
          initialItems.push({
            code: 'INP',
            nama: `BIAYA INAP KONTAINER ${c.no || ''}`,
            qty: 1,
            harga: c.inap,
            total: c.inap,
            noRef: ''
          });
        }
      });

    } else if (type === 'RMB') {
      setKet('Penagihan pengembalian dana pinjaman (Reimbursement) sesuai bukti kuitansi terlampir.');

      // Auto-populate from Job Order pettyCash expenses
      initialItems = job.pettyCash.expenses
        // Exclude uang jalan supir dari invoice RMB
        .filter(e => !e.ket.toUpperCase().includes('UANG JALAN SUPIR'))
        .map(e => {
          return {
            code: e.ket.toUpperCase().replace(/\s+/g, ''),
            nama: e.ket,
            qty: 1,
            harga: e.amount,
            total: e.amount,
            noRef: e.noRef
          };
        });

    } else if (type === 'RMB-A') {
      setKet(`Penagihan susulan (Reimbursement Repair) atas container ${repairData ? repairData.noContainer : ''}.`);
      if (repairData) {
        initialItems.push({
          code: 'REPAIR',
          nama: `REIMBURSEMENT BIAYA REPARASI / PERINTAH KERJA KLIEN: ${repairData.noContainer}`,
          qty: 1,
          harga: repairData.totalBiaya,
          total: repairData.totalBiaya,
          noRef: repairData.id
        });
      }
    }

    setItems(initialItems);
  }, [job, type, repairData]);

  // Recalculate billing values whenever items array is updated
  useEffect(() => {
    const sub = items.reduce((s, it) => s + (it.harga * it.qty), 0);
    setSubtotal(sub);

    if (type === 'INK') {
      // DPP Nilai Lain = Subtotal × (11/12)
      const dpp = Math.round(sub * 11 / 12);
      // PPN = DPP × 12%
      const ppn = Math.round(dpp * 0.12);
      setDppNilaiLain(dpp);
      setPpnAmount(ppn);
      setTotalBayar(sub + ppn);
    } else if (type === 'TRK') {
      // PPN Besaran Tertentu = Subtotal × 1.1%
      const ppn = Math.round(sub * 0.011);
      setDppNilaiLain(null);
      setPpnAmount(ppn);
      setTotalBayar(sub + ppn);
    } else {
      // RMB and RMB-A: No PPN
      setDppNilaiLain(null);
      setPpnAmount(0);
      setTotalBayar(sub);
    }
  }, [items, type]);

  const handleAddItem = () => {
    if (type === 'INK') {
      // Dropdown standard SVC_INK default
      const defaultItem = SVC_INK[0];
      setItems(prev => [...prev, {
        code: defaultItem.code,
        nama: defaultItem.name,
        qty: 1,
        harga: getServicePrice(defaultItem.code, defaultItem.harga),
        total: getServicePrice(defaultItem.code, defaultItem.harga),
        noRef: ''
      }]);
    } else if (type === 'TRK') {
      // Dropdown standard SVC_TRK default
      const defaultItem = SVC_TRK[0];
      setItems(prev => [...prev, {
        code: defaultItem.code,
        nama: defaultItem.name,
        qty: 1,
        harga: getServicePrice(defaultItem.code, defaultItem.harga),
        total: getServicePrice(defaultItem.code, defaultItem.harga),
        noRef: ''
      }]);
    } else {
      // Custom text entry
      setItems(prev => [...prev, {
        code: 'LAINNYA',
        nama: 'BIAYA OPERASIONAL TAMBAHAN',
        qty: 1,
        harga: 50000,
        total: 50000,
        noRef: ''
      }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, key: 'nama' | 'qty' | 'harga' | 'noRef' | 'code', value: any) => {
    setItems(prev => prev.map((it, i) => {
      if (i === index) {
        const updated = { ...it, [key]: value };
        
        // If code changed, let's map name & price automatically!
        if (key === 'code') {
          const list = type === 'INK' ? SVC_INK : SVC_TRK;
          const found = list.find(s => s.code === value);
          if (found) {
            updated.nama = found.name;
            updated.harga = getServicePrice(value, found.harga);
          }
        }

        updated.total = updated.harga * updated.qty;
        return updated;
      }
      return it;
    }));
  };

  const saveInvoice = () => {
    if (items.length === 0) {
      alert("Faktur tagihan harus menyertakan minimal 1 baris item jasa logistik!");
      return;
    }

    // Generate Invoice Number sekuensial (e.g. SKD-482/INK/JUN/26)
    // SUSULAN: kosong untuk invoice utama, 'A' untuk RMB-A susulan
    const isSusulan = type === 'RMB-A';
    const cleanType = isSusulan ? 'RMB' : type;
    const susulanSuffix = isSusulan ? 'A' : '';

    const d = new Date(tanggal);
    const blnStr = BULAN[d.getMonth()];
    const thnStr = String(d.getFullYear()).slice(-2);

    // Dynamic generation
    const noInvoice = `${job.customerId}-${job.noUrut}${susulanSuffix}/${cleanType}/${blnStr}/${thnStr}`;

    const newInvoice: Invoice = {
      id: `INV-${cleanType}-${Date.now().toString().slice(-4)}`,
      noInvoice,
      jobOrderId: type === 'RMB-A' ? '' : job.id, // RMB-A susulan is linked specifically or blank JO
      customerId: job.customerId,
      type: cleanType,
      tanggal,
      term,
      noAju: job.noAju,
      noBL: job.noBL,
      party: job.party,
      barang: job.barang,
      jalur: job.jalur,
      noPO: job.noPO,
      vessel: job.vessel,
      pol: job.pol,
      pod: job.pod,
      tglETA: job.tglETA,
      tglSPPB: job.tglSPPB,
      items: items.map(it => ({
        nama: it.nama,
        qty: it.qty,
        harga: it.harga,
        total: it.total,
        noRef: it.noRef || undefined
      })),
      subtotal,
      dppNilaiLain,
      ppnRate: type === 'INK' ? 12 : (type === 'TRK' ? 1.1 : 0),
      ppnAmount,
      totalBayar,
      status: 'BELUM_LUNAS',
      noFP: null,
      jenisPajak: type === 'INK' ? 'DPP_NILAI_LAIN_12' : (type === 'TRK' ? 'BESARAN_TERTENTU_1_1' : 'NO_PPN'),
      ket: ket
    };

    onSave(newInvoice);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md">
      {/* Header Panel */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 select-none">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-900 cursor-pointer"
            title="Batal"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                DRAFT {type} INVOICE
              </span>
              <Bdg v={job.jalur === 'MERAH' ? 'red' : 'green'} xs>{job.jalur}</Bdg>
            </div>
            <h2 className="text-md font-black text-slate-850 mt-1 leading-none">Rilis Faktur Penagihan Logistik</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn v="secondary" sm onClick={onCancel}>Batal</Btn>
          <Btn v="success" sm icon={Save} onClick={saveInvoice}>Rilis Invoice Resmi</Btn>
        </div>
      </div>

      {/* Target Job Info Ribbon */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-650">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Referensi Job Order</p>
          <p className="font-bold text-slate-900 font-mono text-xs">{job.noBL} (JO-#{job.noUrut})</p>
          <p className="text-slate-500 font-medium leading-none">Customer: <b className="text-slate-700">{cust?.name}</b></p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-left">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Party Volume</p>
            <p className="font-bold text-slate-800">{job.party}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Pajak PPN</p>
            <span className="font-extrabold text-blue-700 font-mono">
              {type === 'INK' ? 'PPN 12% DPP Nilai Lain' : (type === 'TRK' ? '1.1% Ritase' : 'Bebas Pajak')}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Specific controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          
          {/* Main Item Table Repeater */}
          <Card 
            title="Daftar Layanan Logistik Diklaim" 
            action={type !== 'RMB-A' && <Btn v="secondary" sm icon={Plus} onClick={handleAddItem}>Tambah Item</Btn>}
          >
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                    <th className="px-3 py-2.5">Keterangan Jasa / Kode</th>
                    <th className="px-3 py-2.5 w-16 text-center">Qty</th>
                    <th className="px-3 py-2.5 w-32 text-right">Harga Satuan (IDR)</th>
                    {type === 'RMB' && <th className="px-3 py-2.5 w-36">No Ref Reimburs</th>}
                    <th className="px-3 py-2.5 w-32 text-right">Total</th>
                    {type !== 'RMB-A' && <th className="px-3 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-slate-705">
                  {items.map((it, idx) => {
                    const isManaged = ['DO', 'REPAIR', 'DEMURRAGE', 'STORAGE'].includes(it.nama?.toUpperCase()) || 
                                      ['DO', 'REPAIR', 'DEMURRAGE', 'STORAGE'].includes(it.code?.toUpperCase());
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        
                        {/* Keterangan */}
                        <td className="px-3 py-2">
                          {type === 'INK' ? (
                            <select 
                              className="w-full border border-slate-205 rounded-lg px-2 py-1 bg-white text-xs font-bold text-slate-800 shrink-0"
                              value={it.code}
                              onChange={e => handleUpdateItem(idx, 'code', e.target.value)}
                            >
                              {SVC_INK.map(s => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                              ))}
                            </select>
                          ) : type === 'TRK' ? (
                            <select 
                              className="w-full border border-slate-205 rounded-lg px-2 py-1 bg-white text-xs font-bold text-slate-800 shrink-0"
                              value={it.code}
                              onChange={e => handleUpdateItem(idx, 'code', e.target.value)}
                            >
                              {SVC_TRK.map(s => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {isManaged && <span className="text-amber-500 shrink-0" title="Managed Petty Cash Charge">🛡️</span>}
                              <input 
                                type="text"
                                className="w-full border border-slate-205 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                                value={it.nama}
                                onChange={e => handleUpdateItem(idx, 'nama', e.target.value)}
                              />
                            </div>
                          )}
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-2">
                          <input 
                            type="number"
                            min="1"
                            disabled={type === 'RMB-A'}
                            className="w-full border border-slate-205 rounded-lg p-1 text-xs text-center font-mono font-bold"
                            value={it.qty}
                            onChange={e => handleUpdateItem(idx, 'qty', Math.max(1, Number(e.target.value)))}
                          />
                        </td>

                        {/* Harga Satuan */}
                        <td className="px-3 py-2 text-right">
                          <div className="relative">
                            <input 
                              type="number"
                              disabled={type === 'RMB-A'}
                              className="w-full border border-slate-205 rounded-lg p-1 text-xs text-right font-mono font-bold"
                              value={it.harga}
                              onChange={e => handleUpdateItem(idx, 'harga', Number(e.target.value))}
                            />
                            {/* Short preview below the box */}
                            <p className="text-[9px] text-slate-400 mt-0.5 text-right font-semibold">Rp {IDR(it.harga)}</p>
                          </div>
                        </td>

                        {/* No Ref Reimbursement */}
                        {type === 'RMB' && (
                          <td className="px-3 py-2">
                            <input 
                              type="text"
                              className="w-full border border-slate-205 rounded-lg p-1 text-xs font-mono"
                              placeholder="DEL2111..."
                              value={it.noRef}
                              onChange={e => handleUpdateItem(idx, 'noRef', e.target.value)}
                            />
                          </td>
                        )}

                        {/* Total */}
                        <td className="px-3 py-2 text-right font-mono font-black text-slate-850">
                          Rp {IDR(it.harga * it.qty)}
                        </td>

                        {/* Delete action */}
                        {type !== 'RMB-A' && (
                          <td className="px-3 py-2 text-center">
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-350 hover:text-red-500 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold select-none leading-none">
                  Faktur kosong. Hubungkan dengan "+ Tambah Item" baru.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Settings and Summary Sidebar layout */}
        <div className="space-y-4">
          <Card title="Konfigurasi Faktur">
            <div className="p-4 space-y-4 text-xs font-semibold text-slate-650">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Tanggal Cetak Invoice</label>
                <input 
                  type="date"
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">TOP Term of Payment</label>
                <input 
                  type="text"
                  placeholder="e.g. net 15"
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 font-bold text-slate-800"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Catatan / Deskripsi Keterangan</label>
                <textarea 
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 text-slate-850"
                  rows={3}
                  value={ket}
                  onChange={e => setKet(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card title="Ikhtisar Kuitansi">
            <div className="p-4 bg-slate-50/50 rounded-2xl border divide-y divide-slate-100 text-xs font-semibold text-slate-650">
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider shrink-0">Subtotal</span>
                <span className="font-bold text-slate-800 text-right">Rp {IDR(subtotal)}</span>
              </div>

              {type === 'INK' && dppNilaiLain !== null && (
                <div className="flex justify-between py-2">
                  <div>
                    <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider shrink-0">DPP Nilai Lain (PPN 12%)</span>
                    <p className="text-[9px] text-slate-400 font-medium">subtotal × 11/12</p>
                  </div>
                  <span className="font-bold text-blue-700 text-right">Rp {IDR(dppNilaiLain)}</span>
                </div>
              )}

              <div className="flex justify-between py-2">
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider shrink-0">
                    PPN {type === 'INK' ? '12%' : (type === 'TRK' ? '1.1%' : '0%')}
                  </span>
                  <p className="text-[9px] text-slate-400 font-medium">Auto-rounding standard</p>
                </div>
                <span className="font-bold text-slate-800 text-right">Rp {IDR(ppnAmount)}</span>
              </div>

              <div className="flex justify-between py-3.5 text-slate-900 border-t-2 border-dashed border-slate-300">
                <span className="font-bold uppercase tracking-widest text-[11px] text-slate-500">TOTAL BILLING</span>
                <span className="font-black text-sm text-emerald-700">Rp {IDR(totalBayar)}</span>
              </div>
            </div>
          </Card>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-950 flex gap-2.5 text-[11px] leading-relaxed">
            <Sparkles className="text-emerald-600 w-5 h-5 shrink-0" />
            <div>
              <p className="font-black">Auto-suggest & Rate Cards</p>
              <p className="font-medium mt-1">Sistem draf otomatis menarik nilai dasar dari **Rate Card Custom Customer Kode {job.customerId}**. Segala perubahan qty & tarif langsung menyinkronkan total nilai jual.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Button footer actions */}
      <div className="pt-4 border-t flex justify-end space-x-2 select-none">
        <Btn v="secondary" onClick={onCancel}>Batal</Btn>
        <Btn v="success" icon={Save} onClick={saveInvoice}>Rilis Invoice Resmi</Btn>
      </div>
    </div>
  );
};
