import React, { useState, useMemo } from "react";
import { Plus, Search, ChevronRight, Upload, Edit2, AlertCircle, CheckCircle, XCircle, FileText, Check } from "lucide-react";
import { Repair } from "../types/erp";
import { Card, Tbl, Bdg, Btn, Stat } from "./Shared";
import { IDR, FD, cx } from "../utils/format";
import { CUSTOMERS } from "../data/mockData";

interface RepairListProps {
  reps: Repair[];
  nav: (p: string, tid: string, label: string, d?: any) => void;
  onAddRepair?: () => void;
}

export const RepairList: React.FC<RepairListProps> = ({ reps, nav, onAddRepair }) => {
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('ALL');

  const filtered = useMemo(() => {
    return reps.filter((r) => {
      const ms = !q ||
        r.noContainer.toLowerCase().includes(q.toLowerCase()) ||
        r.noBL.toLowerCase().includes(q.toLowerCase()) ||
        r.cardId.toLowerCase().includes(q.toLowerCase()) ||
        r.pelayaran.toLowerCase().includes(q.toLowerCase());
      return ms && (fs === 'ALL' || r.status === fs);
    });
  }, [reps, q, fs]);

  const sc = {
    PENGAJUAN: 'yellow',
    KONFIRMASI: 'blue',
    DI_TOLAK: 'red',
    DI_BEBASKAN: 'green',
    TERIMA_INV: 'purple'
  };
  const sh = {
    DI_TOLAK: 'red',
    REFUND_SEBAGIAN: 'orange',
    REFUND_FULL: 'green'
  };

  return (
    <div className="space-y-4">
      {/* Metrics bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Repair Diurus" val={reps.length} col="purple" />
        <Stat label="Menunggu Jawaban Pelayaran" val={reps.filter(r => r.status === 'PENGAJUAN').length} col="yellow" />
        <Stat label="Konfirmasi Disetujui" val={reps.filter(r => r.status === 'KONFIRMASI').length} col="blue" />
        <Stat label="Perlu Direimburse / Ditagih" val={reps.filter(r => r.statusTagih === 'PENDING').length} col="red" />
      </div>

      <div className="flex flex-wrap gap-2.5 items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
        <Btn v="primary" icon={Plus} onClick={onAddRepair}>Input Data Repair Baru</Btn>
        <div className="flex-1" />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.3]" />
          <input 
            className="pl-9 pr-4 py-2 text-xs border border-gray-200 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 w-52 font-semibold text-slate-800" 
            placeholder="Cari nopol, container, BL..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
        </div>

        <select 
          className="text-xs border border-gray-200 bg-gray-50 font-bold text-slate-650 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/15" 
          value={fs} 
          onChange={(e) => setFs(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="PENGAJUAN">Pengajuan</option>
          <option value="KONFIRMASI">Konfirmasi</option>
          <option value="DI_TOLAK">Di Tolak</option>
          <option value="DI_BEBASKAN">Di Bebaskan</option>
        </select>
      </div>

      <Card>
        <Tbl 
          cols={[
            { l: 'Nomor Container', fn: (r) => <span className="font-mono text-xs font-black text-slate-900 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded shadow-3xs">{r.noContainer}</span> },
            { l: 'Kaitan BL Ref', fn: (r) => <span className="font-mono text-xs font-semibold text-slate-650">{r.noBL}</span> },
            { l: 'Pelanggan', fn: (r) => <span className="font-bold text-xs">{r.cardId}</span> },
            { l: 'Pelayaran', k: 'pelayaran' },
            { l: 'Depo Pelepasan', k: 'depo' },
            { l: 'Akumulasi Biaya', r: true, fn: (r) => <span className="font-black text-slate-900">Rp {IDR(r.totalBiaya)}</span> },
            { l: 'Status Waive', fn: (r) => <Bdg v={sc[r.status as keyof typeof sc] as any || 'gray'}>{r.status.replace('_', ' ')}</Bdg> },
            { l: 'Hasil Evaluasi', fn: (r) => r.hasil ? <Bdg v={sh[r.hasil as keyof typeof sh] as any || 'gray'}>{r.hasil.replace('_', ' ')}</Bdg> : <span className="text-gray-300 font-normal">—</span> },
            { l: 'Status Claim Refund', fn: (r) => r.statusTagih ? <Bdg v={r.statusTagih === 'DITAGIHKAN' ? 'green' : r.statusTagih === 'PENDING' ? 'orange' : 'gray'}>{r.statusTagih}</Bdg> : <span className="text-gray-300 font-normal">—</span> },
            { l: 'Invoice Tagih', fn: (r) => <span className="font-mono text-xs text-blue-700 font-black">{r.noInvoice || '—'}</span> },
          ]} 
          rows={filtered} 
          onRow={(r) => nav('repair-detail', r.id, 'Repair ' + r.noContainer, r)} 
          compact 
        />
      </Card>
    </div>
  );
};

interface RepairDetailProps {
  rep: Repair;
  onUpdateRepair?: (updated: Repair) => void;
  onGenerateRepairInvoice?: (rep: Repair) => void;
}

export const RepairDetail: React.FC<RepairDetailProps> = ({ rep, onUpdateRepair, onGenerateRepairInvoice }) => {
  if (!rep) return <div className="p-12 text-center text-slate-400 font-bold">Data Repair tidak ditemukan</div>;
  const cust = CUSTOMERS.find((c) => c.code === rep.cardId);

  // Waive logistics Flow steps
  const flow = [
    { k: 'PENGAJUAN', l: 'Pendaftaran Waive', I: Upload },
    { k: 'KONFIRMASI', l: 'Konfirmasi Depo / Agen', I: CheckCircle },
    { k: 'DI_TOLAK', l: 'Ditolak (Beban Klien)', I: XCircle },
    { k: 'DI_BEBASKAN', l: 'Dibebaskan (Refund)', I: Check },
    { k: 'TERIMA_INV', l: 'Otorisasi Invoice Selesai', I: FileText }
  ];

  const si = flow.findIndex((f) => f.k === rep.status);

  const setStatus = (k: string) => {
    if (!onUpdateRepair) return;
    onUpdateRepair({
      ...rep,
      status: k as any,
    });
  };

  const markRejected = () => {
    if (!onUpdateRepair) return;
    onUpdateRepair({
      ...rep,
      status: 'DI_TOLAK',
      hasil: 'DI_TOLAK',
      statusTagih: 'PENDING',
      nominalDitagihkan: rep.totalBiaya,
    });
  };

  const markApproved = () => {
    if (!onUpdateRepair) return;
    const refAmtStr = prompt('Masukkan nominal Refund yang disetujui Pelayaran (Jika full wave, ketik totalBiaya):', rep.totalBiaya.toString());
    if (refAmtStr === null) return;
    const refAmt = parseInt(refAmtStr.replace(/\D/g, ''));
    if (isNaN(refAmt)) return;

    const ditagihkan = rep.totalBiaya - refAmt;
    onUpdateRepair({
      ...rep,
      status: 'DI_BEBASKAN',
      hasil: refAmt === rep.totalBiaya ? 'REFUND_FULL' : 'REFUND_SEBAGIAN',
      nominalRefund: refAmt,
      statusTagih: ditagihkan > 0 ? 'PENDING' : null,
      nominalDitagihkan: ditagihkan > 0 ? ditagihkan : null,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Profile */}
      <div className="flex justify-between items-start flex-wrap gap-4 bg-white p-5 rounded-2xl border border-slate-205 shadow-2xs">
        <div className="min-w-0">
          <h2 className="text-xl font-black font-mono text-slate-900 tracking-tight">{rep.noContainer}</h2>
          <p className="text-xs text-slate-450 font-bold block mt-1 font-mono">
            BL: {rep.noBL} · Agen: {rep.pelayaran} · Depo: {rep.depo}
          </p>
          <p className="text-xs font-black text-slate-700 mt-2 select-all">{cust?.name || rep.cardId}</p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-slate-850">Rp {IDR(rep.totalBiaya)}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Estimasi Reparasi Depo</p>
        </div>
      </div>

      {/* Interactive Waive Progress Steps Tracker */}
      <Card title="Status Tahapan Waive Reparasi">
        <div className="p-5 overflow-x-auto scrollbar-none select-none">
          <div className="flex items-center justify-between min-w-[700px] gap-0">
            {flow.map((f, i) => {
              const done = si >= i;
              const cur = si === i;
              const Icon = f.I;
              return (
                <div key={f.k} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-2 w-32 shrink-0">
                    <div 
                      className={cx(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition', 
                        done && cur 
                          ? 'bg-blue-600 border-blue-650 text-white shadow-sm' 
                          : done 
                            ? 'bg-emerald-500 border-emerald-555 text-white' 
                            : 'bg-white border-slate-200 text-slate-300'
                      )}
                    >
                      <Icon size={16} className="stroke-[2.5]" />
                    </div>
                    <span className={cx('text-[10.5px] font-bold text-center leading-tight', done ? 'text-slate-800' : 'text-slate-400')}>{f.l}</span>
                  </div>
                  {i < flow.length - 1 && (
                    <ChevronRight size={18} className={cx('shrink-0 mx-2 -mt-6', done && si > i ? 'text-emerald-500 stroke-[2.5]' : 'text-slate-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Split Details Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Rincian Kalkulasi Kerusakan">
          <div className="p-4 divide-y divide-slate-100">
            {[
              ['Biaya Kerusakan Las/Kondisi', `Rp ${IDR(rep.biayaRepair)}`],
              ['Biaya Administrasi Depo', `Rp ${IDR(rep.biayaAdm || 0)}`],
              ['Asosiasi Perekaman PPN', `Rp ${IDR(rep.ppn || 0)}`],
              ['Grand Total Penalti Depo', `Rp ${IDR(rep.totalBiaya)}`, 'font-black text-slate-850 text-sm border-t pt-1'],
              ['line', ''],
              ['Hasil Jawaban Pelayaran', (rep.hasil || 'Menunggu Keputusan').replace('_', ' '), rep.hasil ? 'font-black text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded' : 'text-slate-450'],
              ['Kompensasi Waive Refund', rep.nominalRefund ? `Rp ${IDR(rep.nominalRefund)}` : '—', 'font-black text-emerald-600'],
              ['Kekurangan Biaya Ditagih Klien', rep.nominalDitagihkan ? `Rp ${IDR(rep.nominalDitagihkan)}` : '—', 'font-black text-red-650'],
            ].map(([k, v, cls], idx) => 
              k === 'line' ? (
                <div key={idx} className="my-2 border-t border-dashed border-slate-200" />
              ) : (
                <div key={k as string} className="flex justify-between py-2 text-xs gap-3">
                  <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">{k as string}</span>
                  <span className={cx(cls)}>{v}</span>
                </div>
              )
            )}
          </div>
        </Card>

        <Card title="Informasi Administrasi">
          <div className="p-4 divide-y divide-slate-100">
            {[
              ['No Registrasi Aju', rep.noAju],
              ['No BL (Bill of Lading)', rep.noBL],
              ['Kode Registrasi Container', <span className="font-mono text-slate-750 font-bold">{rep.noContainer}</span>],
              ['Perusahaan Pelayaran / Liner', rep.pelayaran],
              ['Kav Depo Container', rep.depo],
              ['Staff PIC Pengurus Waive', rep.pengurus || '—'],
              ['Tanggal Kontainer Ke Depo', FD(rep.tglKeDepo)],
              ['Tanggal Pengembalian Dana', rep.tglDanaMasuk ? FD(rep.tglDanaMasuk) : '—'],
              ['Status Finansial Klaim', rep.statusTagih || 'Bersih / Selesai'],
              ['Nomer Faktur Penagihan', <span className="font-mono font-bold text-blue-700">{rep.noInvoice || '—'}</span>],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2.5 text-xs gap-4">
                <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wider shrink-0">{k as string}</span>
                <span className="text-slate-800 font-bold text-right">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Control Actions / Decision Buttons */}
      <Card title="Instruksi Otorisasi">
        <div className="p-5 space-y-4 animate-fade-in select-none bg-slate-50/50 rounded-2xl border border-slate-100">
          
          {/* PENGAJUAN FORM */}
          {rep.status === 'PENGAJUAN' && (
            <div className="p-4 bg-white rounded-xl border border-blue-150 space-y-3.5 shadow-3xs">
              <p className="font-black text-xs text-blue-900 flex items-center gap-1.5">
                <span>🔄</span> Update: Konfirmasi dari Perusahaan Pelayaran
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Hasil Evaluas Pelayaran</label>
                  <select 
                    id="hasil-select"
                    className="w-full border border-slate-205 rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-800"
                    onChange={(e) => {
                      const select = document.getElementById('hasil-select') as HTMLSelectElement;
                      const inputDiv = document.getElementById('refund-input-div') as HTMLDivElement;
                      if (select.value === 'REFUND_SEBAGIAN' || select.value === 'REFUND_FULL' || select.value === 'DI_BEBASKAN') {
                        inputDiv.style.display = 'block';
                      } else {
                        inputDiv.style.display = 'none';
                      }
                    }}
                  >
                    <option value="DI_TOLAK">DI TOLAK (Beban Klien Full)</option>
                    <option value="DI_BEBASKAN">DI BEBASKAN (Tanpa Refund / Bayar Adm)</option>
                    <option value="REFUND_SEBAGIAN">REFUND SEBAGIAN (Komersil Parsial)</option>
                    <option value="REFUND_FULL">REFUND FULL (Bebas Biaya)</option>
                  </select>
                </div>

                <div id="refund-input-div" style={{ display: 'none' }}>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Nominal Refund Disetujui (IDR)</label>
                  <input 
                    id="refund-amount-input"
                    type="number" 
                    step={1000}
                    placeholder="0"
                    className="w-full border border-slate-205 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Btn v="primary" sm onClick={() => {
                  if (!onUpdateRepair) return;
                  const select = document.getElementById('hasil-select') as HTMLSelectElement;
                  const refundInput = document.getElementById('refund-amount-input') as HTMLInputElement;

                  const selResult = select.value as 'DI_TOLAK' | 'DI_BEBASKAN' | 'REFUND_SEBAGIAN' | 'REFUND_FULL';
                  const nominalRefund = selResult === 'DI_TOLAK' ? 0 : (Number(refundInput?.value) || 0);

                  let nominalDitagihkan = 0;
                  let statusTagih: 'PENDING' | 'DITAGIHKAN' | 'TIDAK_DITAGIHKAN' | null = 'PENDING';

                  if (selResult === 'DI_TOLAK') {
                    nominalDitagihkan = rep.totalBiaya;
                    statusTagih = 'PENDING';
                  } else if (selResult === 'DI_BEBASKAN') {
                    nominalDitagihkan = rep.biayaAdm; // biayaAdm saja
                    statusTagih = rep.biayaAdm > 0 ? 'PENDING' : 'TIDAK_DITAGIHKAN';
                  } else if (selResult === 'REFUND_SEBAGIAN') {
                    nominalDitagihkan = rep.totalBiaya - nominalRefund;
                    statusTagih = nominalDitagihkan > 0 ? 'PENDING' : 'TIDAK_DITAGIHKAN';
                  } else if (selResult === 'REFUND_FULL') {
                    nominalDitagihkan = 0;
                    statusTagih = 'TIDAK_DITAGIHKAN';
                  }

                  onUpdateRepair({
                    ...rep,
                    status: 'KONFIRMASI',
                    hasil: selResult === 'DI_BEBASKAN' ? null : selResult,
                    nominalRefund: nominalRefund > 0 ? nominalRefund : null,
                    nominalDitagihkan: nominalDitagihkan,
                    statusTagih: statusTagih === 'TIDAK_DITAGIHKAN' ? null : statusTagih
                  });
                }}>
                  Simpan Hasil Konfirmasi Pelayaran
                </Btn>
              </div>
            </div>
          )}

          {/* KONFIRMASI FLOW */}
          {rep.status === 'KONFIRMASI' && (
            <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3 shadow-3xs">
              <p className="font-black text-xs text-indigo-900">
                📌 Evaluasi Keputusan Akhir Waive Reparasi
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Btn v="danger" icon={XCircle} onClick={() => {
                  if (!onUpdateRepair) return;
                  onUpdateRepair({
                    ...rep,
                    status: 'DI_TOLAK',
                    hasil: 'DI_TOLAK',
                    statusTagih: 'PENDING',
                    nominalDitagihkan: rep.totalBiaya,
                  });
                }}>
                  Hasil: Di Tolak (Beban Klien Full)
                </Btn>

                <Btn v="success" icon={CheckCircle} onClick={() => {
                  if (!onUpdateRepair) return;
                  const refAmtStr = prompt('Masukkan nominal refund jika di-bebaskan pelayaran (0 untuk tanpa refund / bayar ADM saja):', '0');
                  if (refAmtStr === null) return;
                  const refAmt = parseInt(refAmtStr.replace(/\D/g, '')) || 0;

                  const isFull = refAmt >= rep.totalBiaya;
                  const ditagihkan = refAmt === 0 ? rep.biayaAdm : (rep.totalBiaya - refAmt);

                  onUpdateRepair({
                    ...rep,
                    status: 'DI_BEBASKAN',
                    hasil: refAmt === 0 ? null : (isFull ? 'REFUND_FULL' : 'REFUND_SEBAGIAN'),
                    nominalRefund: refAmt > 0 ? refAmt : null,
                    nominalDitagihkan: ditagihkan,
                    statusTagih: ditagihkan > 0 ? 'PENDING' : null,
                  });
                }}>
                  Hasil: Di Bebaskan (Atur Kompensasi)
                </Btn>
              </div>
            </div>
          )}

          {/* INVOICE DISPATCH */}
          {rep.statusTagih === 'PENDING' && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs font-bold text-amber-900 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p>Klaim penggantian perbaikan senilai <b className="text-sm font-black text-slate-900">Rp {IDR(rep.nominalDitagihkan || rep.totalBiaya)}</b> dalam status tertangguh.</p>
                <p className="text-[10px] text-slate-500 font-medium">Anda dapat menerbitkan invoice susulan RMB-A kepada klien.</p>
              </div>
              <Btn v="warning" sm icon={FileText} onClick={() => onGenerateRepairInvoice?.(rep)}>
                Buat Invoice Susulan RMB-A
              </Btn>
            </div>
          )}

          <div className="pt-3 border-t flex flex-wrap gap-2 select-none">
            <Btn v="secondary" sm icon={Upload}>Upload Memo Bea Cukai / Estimasi Repair PDF</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};
