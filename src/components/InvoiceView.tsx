import React, { useState, useMemo } from "react";
import { Plus, Download, Search, Printer, Edit2, CheckCircle, FileText, Wallet, AlertCircle } from "lucide-react";
import { Invoice } from "../types/erp";
import { Card, Tbl, Bdg, Btn, Stat } from "./Shared";
import { IDR, FD } from "../utils/format";
import { CUSTOMERS } from "../data/mockData";
import { SInv, TInv } from "./DashboardView";

interface InvListProps {
  invs: Invoice[];
  nav: (p: string, tid: string, label: string, d?: any) => void;
  onAddInvoice?: () => void;
}

export const InvList: React.FC<InvListProps> = ({ invs, nav, onAddInvoice }) => {
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('ALL');
  const [ft, setFt] = useState('ALL');

  const filtered = useMemo(() => {
    return invs.filter((i) => {
      const ms = !q ||
        i.noInvoice.toLowerCase().includes(q.toLowerCase()) ||
        i.customerId.toLowerCase().includes(q.toLowerCase()) ||
        i.noBL.toLowerCase().includes(q.toLowerCase());
      return ms && (fs === 'ALL' || i.status === fs) && (ft === 'ALL' || i.type === ft);
    });
  }, [invs, q, fs, ft]);

  const piutang = useMemo(() => {
    return filtered
      .filter((i) => i.status === 'BELUM_LUNAS')
      .reduce((s, i) => s + (i.totalBayar || 0), 0);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Financial stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Cetak Invoice" val={filtered.length} col="blue" />
        <Stat label="Belum Lunas" val={filtered.filter((i) => i.status === 'BELUM_LUNAS').length} col="red" />
        <Stat label="Sudah Lunas" val={filtered.filter((i) => i.status === 'LUNAS').length} col="green" />
        <Stat label="Total Piutang Outstanding" val={`Rp ${IDR(piutang)}`} col="orange" sub="Hanya belum lunas" />
      </div>

      <div className="flex flex-wrap gap-2.5 items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
        <Btn v="primary" icon={Plus} onClick={onAddInvoice}>Invoice Baru</Btn>
        <Btn v="secondary" icon={Download}>Export CSV</Btn>
        <div className="flex-1" />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.3]" />
          <input 
            className="pl-9 pr-4 py-2 text-xs border border-gray-200 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 w-52 font-semibold text-slate-800" 
            placeholder="Cari no. invoice, BL, customer..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
        </div>

        <select 
          className="text-xs border border-gray-200 bg-gray-50 font-bold text-slate-650 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/15" 
          value={ft} 
          onChange={(e) => setFt(e.target.value)}
        >
          <option value="ALL">Semua Tipe</option>
          <option value="INK">Inklaring</option>
          <option value="TRK">Trucking</option>
          <option value="RMB">Reimbursement</option>
          <option value="REPAIR">Repair</option>
        </select>

        <select 
          className="text-xs border border-gray-200 bg-gray-50 font-bold text-slate-650 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/15" 
          value={fs} 
          onChange={(e) => setFs(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="BELUM_LUNAS">Belum Lunas</option>
          <option value="LUNAS">Lunas</option>
        </select>
      </div>

      <Card>
        <Tbl 
          cols={[
            { l: 'Nomor Invoice', fn: (r) => <span className="font-mono text-xs font-black text-blue-700">{r.noInvoice}</span> },
            { l: 'Status Pajak', fn: (r) => <span className="text-[10px] bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded font-black text-slate-400 font-mono">{r.jenisPajak}</span> },
            { l: 'No BL / No Aju', fn: (r) => <div className="py-0.5"><p className="font-mono text-xs font-bold text-slate-700">{r.noBL}</p><p className="text-[10px] text-slate-400 mt-0.5">Aju: {r.noAju}</p></div> },
            { 
              l: 'Klien Pelanggan', 
              fn: (r) => (
                <div>
                  <p className="text-xs font-bold text-slate-850">{CUSTOMERS.find((c) => c.code === r.customerId)?.name || r.customerId}</p>
                </div>
              ) 
            },
            { l: 'Kategori', fn: (r) => <TInv t={r.type} /> },
            { l: 'Tanggal Cetak', fn: (r) => <span className="font-mono font-semibold text-slate-600">{FD(r.tanggal)}</span> },
            { l: 'Term', k: 'term' },
            { l: 'Total Bayar', r: true, fn: (r) => <span className="font-black text-slate-900">Rp {IDR(r.totalBayar)}</span> },
            { l: 'Tarif PPN', r: true, fn: (r) => <span className="font-mono text-slate-450">{r.ppnRate}%</span> },
            { l: 'Status', fn: (r) => <SInv s={r.status} /> },
            { l: 'Faktur Pajak', fn: (r) => <span className="font-mono text-xs font-extrabold text-slate-700">{r.noFP || <span className="text-gray-300 font-normal">—</span>}</span> },
          ]} 
          rows={filtered} 
          onRow={(r) => nav('inv-detail', r.id, r.noInvoice, r)} 
          compact 
        />
        <div className="px-5 py-4 border-t text-xs font-extrabold text-slate-400 flex justify-between bg-slate-50/20 select-none">
          <span>MENAMPILKAN {filtered.length} FAKTUR TAGIHAN</span>
          <span>PIUTANG TERTANGGUH: <b className="text-red-650 font-black">Rp {IDR(piutang)}</b></span>
        </div>
      </Card>
    </div>
  );
};

interface InvDetailProps {
  inv: Invoice;
  onUpdateInvoice?: (updated: Invoice) => void;
  currentUser?: { username: string; role: string; name: string } | null;
  jobs?: any[];
}

export const InvDetail: React.FC<InvDetailProps> = ({ inv, onUpdateInvoice, currentUser, jobs = [] }) => {
  const [isLunasOpen, setIsLunasOpen] = useState(false);
  const [isFPOpen, setIsFPOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState("2026-06-08");
  const [taxInvoiceNum, setTaxInvoiceNum] = useState(inv.noFP || "");
  const [isLoading, setIsLoading] = useState(false);

  if (!inv) return <div className="p-12 text-center text-slate-400 font-bold">Data Invoice tidak ditemukan</div>;
  const cust = CUSTOMERS.find((c) => c.code === inv.customerId);
  const isRMB = inv.type === 'RMB';

  // Find containers connected to this invoice
  const relatedJob = jobs.find(j => j.id === inv.jobOrderId);
  const containerNumbersStr = relatedJob?.containers
    ?.map((c: any) => c.no)
    .filter(Boolean)
    .join(", ") || "—";

  // Role permissions checks based on our spec
  const canMarkAsPaid = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'FINANCE';
  const canInputFP = currentUser?.role === 'DIREKTUR' || currentUser?.role === 'ADMIN_INVOICE';

  const handleMarkAsPaidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateInvoice) return;
    setIsLoading(true);
    setTimeout(() => {
      onUpdateInvoice({
        ...inv,
        status: 'LUNAS',
        tglBayar: paymentDate,
      });
      setIsLoading(false);
      setIsLunasOpen(false);
    }, 500);
  };

  const handleFPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateInvoice) return;
    setIsLoading(true);
    setTimeout(() => {
      onUpdateInvoice({
        ...inv,
        noFP: taxInvoiceNum || null,
      });
      setIsLoading(false);
      setIsFPOpen(false);
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* CSS overrides for flawless page printing */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          /* Hide global outer layout nodes */
          #workplace-wrapper, #main-sidebar, header, #workplace-header, #workplace-subtabs, .workspace-tab-bar, aside {
            display: none !important;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Control Actions - Hidden during direct window print */}
      <div className="flex gap-2 mb-4 flex-wrap print:hidden select-none">
        <Btn v="primary" icon={Printer} onClick={() => window.print()}>Cetak Invoice</Btn>
        
        {inv.status === 'BELUM_LUNAS' && (
          <button
            onClick={() => {
              if (canMarkAsPaid) {
                setIsLunasOpen(true);
              } else {
                alert("Akses terbatas: Hanya FINANCE atau DIREKTUR yang berhak menandai lunas.");
              }
            }}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Tandai Lunas / Terbayar</span>
          </button>
        )}

        {inv.type !== 'RMB' && (
          <button
            onClick={() => {
              if (canInputFP) {
                setTaxInvoiceNum(inv.noFP || "");
                setIsFPOpen(true);
              } else {
                alert("Akses terbatas: Hanya ADMIN INVOICE atau DIREKTUR yang berhak menginput nomor e-Faktur.");
              }
            }}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Input No. Faktur Pajak</span>
          </button>
        )}
      </div>

      {/* RENDER CURRENT IN-APP DISPLAY SHEET (print:hidden) */}
      <div className="bg-white border border-slate-205 rounded-2xl shadow-md overflow-hidden print:hidden">
        {/* Header Ribbon */}
        <div style={{ background: '#1B2B5E' }} className="text-white p-6 md:p-8 flex justify-between items-start">
          <div>
            <div className="text-3xl font-black tracking-wider leading-none">SSL</div>
            <div className="text-[10px] font-black text-blue-200/80 tracking-widest block mt-2 font-mono uppercase">PT. SUMBER SELAMAT LOGISTIK</div>
          </div>
          <div className="text-right select-none">
            <div className="text-2xl md:text-3xl font-black tracking-widest leading-none">{isRMB ? 'REIMBURSEMENT' : 'TAX INVOICE'}</div>
            <div className="mt-2.5"><TInv t={inv.type} /></div>
          </div>
        </div>

        {/* Invoice metadata columns */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 bg-slate-50/10">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Kepada Yth. Klien</p>
            <p className="font-extrabold text-sm text-slate-850 leading-tight">{cust?.name}</p>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 max-w-md">{cust?.alamat}</p>
            <p className="text-[10.5px] font-mono text-slate-400 font-bold mt-2">NPWP: {cust?.npwp ? cust.npwp.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, "$1.$2.$3.$4-$5.$6") : '-'}</p>
          </div>

          <div className="space-y-2 font-semibold text-xs text-slate-700">
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No Invoice</span>
              <span className="font-mono font-black text-blue-800 text-sm">{inv.noInvoice}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tgl Faktur</span>
              <span className="font-mono">{FD(inv.tanggal)}</span>
            </div>
            {inv.status === 'LUNAS' && inv.tglBayar && (
              <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tgl Bayar</span>
                <span className="font-mono text-emerald-600 font-extrabold">{FD(inv.tglBayar)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Term of Payment</span>
              <span className="font-bold text-amber-600">{inv.term}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status Pembayaran</span>
              <span><SInv s={inv.status} /></span>
            </div>
            {inv.noFP && (
              <div className="flex justify-between gap-3 border-b border-slate-50 pb-1.5 bg-yellow-50/20 p-1 rounded">
                <span className="text-amber-700 font-extrabold uppercase text-[9.5px] tracking-wider">No. e-Faktur Pajak</span>
                <span className="font-mono font-bold text-slate-800">{inv.noFP}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reference logistics grid */}
        <div className="px-6 md:px-8 py-4 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            {([
              ['Kanal Jalur', <Bdg v={inv.jalur === 'MERAH' ? 'red' : 'green'}>{inv.jalur}</Bdg>],
              ['No PO Klien', inv.noPO || '—'],
              ...(inv.tglSPPB ? [['Selesai SPPB', FD(inv.tglSPPB)]] : []),
              ['Hari Sandar (ETA/ETD)', FD(inv.tglETA)],
              ['Volume Party', inv.party],
              ['Komoditas Barang', inv.barang],
              ['Bill of Lading Ref', <span className="font-mono text-slate-800">{inv.noBL}</span>],
              ['Pabean No Aju', <span className="font-mono text-slate-800">{inv.noAju}</span>],
              ...(inv.vessel && inv.vessel !== '-' ? [['Vessel / Voyage', <span className="font-mono text-slate-800">{inv.vessel}</span>]] : []),
              ...(inv.pol ? [['POL (Loading)', <span className="font-mono text-slate-800">{inv.pol}</span>]] : []),
              ...(inv.pod ? [['POD (Discharge)', <span className="font-mono text-slate-800">{inv.pod}</span>]] : []),
              ['No. Containers', <span className="font-mono text-slate-800">{containerNumbersStr}</span>],
            ] as [string, any][]).map(([k, v]) => (
              <div key={k as string}>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">{k as string}</p>
                <p className="font-bold text-slate-755 leading-tight">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services calculation table */}
        <div className="p-6 md:p-8">
          <table className="w-full text-xs font-bold text-slate-700 border-b-2 border-slate-880 table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-850 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 text-left font-extrabold w-[45%]">Keterangan Item Layanan</th>
                {isRMB ? (
                  <>
                    <th className="py-2.5 text-left font-extrabold">No Dokumen Penyelaras</th>
                    <th className="py-2.5 text-right font-extrabold w-[25%]">Nominal Biaya</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 text-center font-extrabold">Qty</th>
                    <th className="py-2.5 text-right font-extrabold">Harga Satuan</th>
                    <th className="py-2.5 text-right font-extrabold w-[20%]">Subtotal</th>
                    <th className="py-2.5 text-center font-extrabold w-[10%]">PPN</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inv.items.map((item, i) => (
                <tr key={i} className="border-none hover:bg-slate-50/10">
                  <td className="py-3 pr-2 font-bold text-slate-800 text-xs">
                    {i + 1}. {item.nama}
                  </td>
                  {isRMB ? (
                    <>
                      <td className="py-3 font-mono text-[10.5px] text-slate-450 font-semibold">{item.noRef || '—'}</td>
                      <td className="py-3 text-right font-extrabold text-xs text-slate-900">
                        Rp {IDR(item.total)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 text-center font-mono font-bold">{item.qty}</td>
                      <td className="py-3 text-right font-mono font-bold">Rp {IDR(item.harga || 0)}</td>
                      <td className="py-3 text-right font-black font-mono text-slate-800">Rp {IDR(item.total)}</td>
                      <td className="py-3 text-center font-mono font-bold text-slate-400">{inv.ppnRate}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Money totals layout */}
          <div className="flex justify-end mt-5 select-none">
            <div className="w-64 space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Subtotal DPP</span>
                <span className="text-slate-800 font-bold">Rp {IDR(inv.subtotal)}</span>
              </div>
              {inv.dppNilaiLain && (
                <div className="flex justify-between text-slate-450 text-[10.5px] font-bold italic">
                  <span>DPP Nilai Lain (Asumsi)</span>
                  <span>Rp {IDR(inv.dppNilaiLain)}</span>
                </div>
              )}
              {inv.ppnRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">PPN {inv.ppnRate}%</span>
                  <span className="text-slate-800 font-bold">Rp {IDR(inv.ppnAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2.5 border-t-2 border-slate-200 font-black">
                <span className="text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">Total Tagihan</span>
                <span className="text-blue-800 font-black text-sm font-mono">Rp {IDR(inv.totalBayar)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes and Account bank transfers */}
        <div className="px-6 md:px-8 py-6 bg-slate-50/50 border-t border-slate-100 text-[11px] leading-relaxed text-slate-500 font-semibold grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider mb-2">Keterangan Dokumen :</p>
            {(inv.ket || '').split('\n').map((l, i) => (
              <p key={i} className="font-medium text-slate-450">{l}</p>
            ))}
            <div className="pt-3 border-t border-slate-100 space-y-1 bg-white p-3 rounded-xl border">
              <p className="font-extrabold text-slate-700">Akun Transfer Rekening Utama :</p>
              <p className="font-mono font-bold text-blue-700 text-xs">BCA KCP Mall Kelapa Gading III — 8705 217 188</p>
              <p className="font-black text-xs text-slate-800">A/N: PT. SUMBER SELAMAT LOGISTIK</p>
            </div>
          </div>

          <div className="text-right flex flex-col justify-between items-end h-full pt-4 md:pt-0">
            <p className="font-bold text-slate-400 font-mono">Bekasi, {FD(inv.tanggal)}</p>
            <p className="font-bold text-slate-400 mt-1">Staf Pengurus Otorisasi Pajak</p>
            <div className="mt-14 border-t border-slate-400/60 pt-1.5 min-w-[155px] text-center">
              <p className="font-extrabold text-slate-700 text-xs leading-none">Yenny Yosephine</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Direktur Keuangan</p>
            </div>
          </div>
        </div>

        {/* Office details */}
        <div className="px-6 md:px-8 py-4 border-t border-slate-100 bg-slate-50 text-right text-[10px] text-slate-400 font-bold leading-normal select-none">
          <p className="font-black text-slate-500 uppercase tracking-wider">SSL ERP CORPORATE OFFICE</p>
          <p className="font-medium text-slate-400 mt-1">Kp. Kebon Kelapa No.128 RT.002/001 | Jl. Marunda Makmur, Kel. Segara Makmur, Kec. Taruma Jaya, Kab. Bekasi</p>
        </div>
      </div>

      {/* RENDER DEDICATED PHYSICAL PRINT PAPER SHEET (hidden print:blocks) */}
      <div className="hidden print:block print-sheet bg-white text-black p-6 font-sans text-xs">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">PT. SUMBER SELAMAT LOGISTIK</h1>
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">SSL PORT SERVICES & INTEGRATED LOGISTIC</p>
            <p className="text-[8px] text-slate-450 mt-1 max-w-md leading-normal">
              Kp. Kebon Kelapa No.128 RT.002/001, Jl. Marunda Makmur, Kel. Segara Makmur,<br />
              Kec. Taruma Jaya, Kab. Bekasi, Jawa Barat
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black tracking-widest">{isRMB ? 'REIMBURSEMENT' : 'INVOICE'}</h2>
            <p className="text-xs font-mono font-bold mt-1 text-slate-700">Ref No: {inv.noInvoice}</p>
          </div>
        </div>

        {/* Customer Info & Invoice Meta */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-300">
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Kepada Yth:</p>
            <p className="font-black text-sm mt-0.5 text-slate-900">{cust?.name}</p>
            <p className="text-[10px] text-slate-650 mt-1 leading-relaxed">{cust?.alamat}</p>
            <p className="text-[9.5px] font-mono text-slate-750 font-bold mt-1.5">NPWP: {cust?.npwp || '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-800 font-bold justify-items-end">
            <span className="text-slate-400 font-medium">Nomor Invoice :</span>
            <span className="font-mono">{inv.noInvoice}</span>
            <span className="text-slate-400 font-medium font-sans">Tanggal Terbit :</span>
            <span className="font-mono">{FD(inv.tanggal)}</span>
            <span className="text-slate-400 font-medium">Term of Payment :</span>
            <span className="text-amber-800 font-extrabold">{inv.term}</span>
            <span className="text-slate-400 font-medium">Status Faktur :</span>
            <span>{inv.status}</span>
            {inv.status === 'LUNAS' && inv.tglBayar && (
              <>
                <span className="text-slate-400 font-medium">Hari Terlunasi :</span>
                <span className="font-mono text-emerald-700">{FD(inv.tglBayar)}</span>
              </>
            )}
            {inv.noFP && (
              <>
                <span className="text-amber-700 font-bold text-[8px] uppercase tracking-wider">No. e-Faktur Pajak :</span>
                <span className="font-mono font-bold text-slate-900 text-[9px] bg-slate-50 border px-1 rounded">{inv.noFP}</span>
              </>
            )}
          </div>
        </div>

        {/* Reference logistics detail grid */}
        <div className="grid grid-cols-4 gap-y-2 gap-x-4 py-3 bg-slate-50 px-3 rounded-lg border border-slate-205 mt-3 text-[9.5px]">
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">Filing No Aju</p>
            <p className="font-bold text-slate-800">{inv.noAju || '—'}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">Bill of Lading</p>
            <p className="font-bold text-slate-800 font-mono">{inv.noBL}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">Jalur Kanal</p>
            <p className="font-black text-slate-900">{inv.jalur}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">Volume Party</p>
            <p className="font-bold text-slate-800">{inv.party}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase font-sans">Uraian Komoditas</p>
            <p className="font-bold text-slate-800">{inv.barang}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">ETA Sandar</p>
            <p className="font-bold text-slate-800">{FD(inv.tglETA)}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase font-sans">Nomor Kontainer</p>
            <p className="font-semibold text-slate-900 font-mono break-all leading-tight">
              {containerNumbersStr}
            </p>
          </div>
          <div>
            <p className="text-[8px] text-slate-400 font-black uppercase">No PO Klien</p>
            <p className="font-bold text-slate-800">{inv.noPO || '—'}</p>
          </div>
        </div>

        {/* Services Detail Table */}
        <table className="w-full mt-5 text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-black bg-slate-100 text-slate-600 uppercase text-[8px] font-black">
              <th className="py-2 text-center border px-2 w-[5%]">No</th>
              <th className="py-2 text-left border px-2 w-[50%]">Uraian Keterangan Item Pekerjaan / Jasa</th>
              {isRMB ? (
                <>
                  <th className="py-2 text-left border px-2 w-[20%]">Penyelarasan Ref</th>
                  <th className="py-2 text-right border px-2 w-[25%]">Nominal Biaya</th>
                </>
              ) : (
                <>
                  <th className="py-2 text-center border px-2 w-[10%]">Qty</th>
                  <th className="py-2 text-right border px-2 w-[15%]">Harga Satuan</th>
                  <th className="py-2 text-right border px-2 w-[20%]">Total Harga</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {inv.items.map((item, i) => (
              <tr key={i} className="border">
                <td className="py-2 px-2 text-slate-500 text-center font-bold">{i + 1}</td>
                <td className="py-2 px-2 font-black text-slate-900">{item.nama}</td>
                {isRMB ? (
                  <>
                    <td className="py-2 px-2 font-mono text-slate-500">{item.noRef || '—'}</td>
                    <td className="py-2 px-2 text-right font-black font-mono">Rp {IDR(item.total)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2 text-center font-mono font-bold">{item.qty || 1}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">Rp {IDR(item.harga || item.total)}</td>
                    <td className="py-2 px-2 text-right font-black font-mono text-slate-900">Rp {IDR(item.total)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-start mt-5">
          <div className="text-[8.5px] text-slate-500 max-w-sm space-y-1">
            <p className="font-extrabold text-slate-800 uppercase tracking-wide">Keterangan Khusus & Pajak:</p>
            <p>- {inv.jenisPajak}</p>
            {inv.ket && (inv.ket || '').split('\n').map((l, idx) => (
              <p key={idx} className="italic text-slate-450">- {l}</p>
            ))}
            
            <div className="mt-4 p-2.5 border border-slate-300 rounded bg-slate-50 text-[8px] leading-relaxed">
              <p className="font-extrabold text-slate-800">SISTEM TRANSFER AKTIF REKENING REKANAN :</p>
              <p className="font-mono font-black text-blue-900 text-[9.5px]">BCA KCP Mall Kelapa Gading III — 8705 217 188</p>
              <p className="font-extrabold text-slate-800">A/N: PT. SUMBER SELAMAT LOGISTIK</p>
            </div>
          </div>
          
          <div className="w-64 text-[10px] font-bold space-y-1 text-right mt-1 shrink-0">
            <div className="flex justify-between text-slate-500">
              <span className="font-medium">Subtotal DPP :</span>
              <span className="font-mono font-black text-slate-900">Rp {IDR(inv.subtotal)}</span>
            </div>
            {inv.dppNilaiLain && (
              <div className="flex justify-between text-slate-450 italic">
                <span className="font-medium">DPP Nilai Lain :</span>
                <span className="font-mono">Rp {IDR(inv.dppNilaiLain)}</span>
              </div>
            )}
            {inv.ppnRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span className="font-medium">PPN {inv.ppnRate}% :</span>
                <span className="font-mono font-black text-slate-900">Rp {IDR(inv.ppnAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-2 text-[11px] font-black">
              <span className="text-slate-900 font-extrabold">TOTAL YANG WAJIB BAYAR :</span>
              <span className="text-black font-mono font-bold">Rp {IDR(inv.totalBayar)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Signatures block */}
        <div className="flex justify-between items-end mt-12 text-[10px]">
          <div className="text-slate-400">
            <p>Penerima Barang / Dokumen,</p>
            <div className="w-24 h-11 border-b border-dashed border-slate-300"></div>
            <p className="mt-1 text-[8px] uppercase tracking-wider font-bold">Tanda tangan & Stempel Perusahaan</p>
          </div>
          <div className="text-center font-bold">
            <p className="text-slate-500 font-mono">Bekasi, {FD(inv.tanggal)}</p>
            <p className="font-black text-slate-800 mt-1 uppercase tracking-wide">Hormat Kami,</p>
            <div className="h-12"></div>
            <p className="font-black text-slate-950 border-t border-black pt-1 min-w-[150px]">Yenny Yosephine</p>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest leading-none mt-1">Direktur Keuangan</p>
          </div>
        </div>
      </div>

      {/* CUSTOM DIA-MODAL 1: MARK AS PAID (LUNAS) */}
      {isLunasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-3xs animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 text-xs tracking-tight flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Konfirmasi Pembayaran Lunas</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsLunasOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleMarkAsPaidSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <p className="text-slate-600 leading-relaxed">
                Anda akan menandai Invoice <span className="font-mono font-black text-blue-700">{inv.noInvoice}</span> sebesar <span className="font-black font-mono text-slate-900">Rp {IDR(inv.totalBayar)}</span> sebagai <span className="text-emerald-700 font-extrabold uppercase">Lunas Terbayar</span>.
              </p>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-black uppercase tracking-wider block">Tanggal Diterima Pembayaran</label>
                <input 
                  type="date"
                  required
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setIsLunasOpen(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  {isLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin pr-1"></span>}
                  <span>Konfirmasi Lunas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DIA-MODAL 2: INPUT NO FAKTUR PAJAK */}
      {isFPOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-3xs animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 text-xs tracking-tight flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Alokasi e-Faktur Pajak</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsFPOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleFPSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <p className="text-slate-600 leading-relaxed">
                Gunakan format standard DJP Indonesia untuk ID registrasi Faktur Pajak Invoice <span className="font-mono font-bold">{inv.noInvoice}</span>.
              </p>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-black uppercase tracking-wider block">ID Nomor Faktur Pajak</label>
                <input 
                  type="text"
                  required
                  placeholder="010.001.26.00000001"
                  className="w-full border border-slate-205 rounded-xl px-3 py-2 font-mono text-slate-800 uppercase focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
                  value={taxInvoiceNum}
                  onChange={e => setTaxInvoiceNum(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setIsFPOpen(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  {isLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin pr-1"></span>}
                  <span>Simpan e-Faktur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
