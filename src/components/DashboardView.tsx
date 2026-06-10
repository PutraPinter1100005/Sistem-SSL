import React from "react";
import { Package, Truck, FileText, Wrench, Wallet, AlertCircle } from "lucide-react";
import { JobOrder, Invoice, Repair } from "../types/erp";
import { Stat, Card, Tbl, Bdg, Btn } from "./Shared";
import { IDR, FD } from "../utils/format";
import { CUSTOMERS } from "../data/mockData";

// Badge Helpers
export const SJob: React.FC<{ s: string }> = ({ s }) => {
  const m = { 
    IN_PROGRESS: ['Proses', 'blue'], 
    READY_INVOICE: ['Siap Invoice', 'green'], 
    INVOICED: ['Ditagihkan', 'purple'], 
    CLOSED: ['Selesai', 'gray'], 
    OPEN: ['Baru', 'yellow'] 
  };
  const [l, v] = m[s as keyof typeof m] || [s, 'gray'];
  return <Bdg v={v as any} xs>{l}</Bdg>;
};

export const SInv: React.FC<{ s: string }> = ({ s }) => {
  const m = { 
    BELUM_LUNAS: ['Belum Lunas', 'red'], 
    LUNAS: ['Lunas', 'green'], 
    SEBAGIAN: ['Sebagian', 'orange'] 
  };
  const [l, v] = m[s as keyof typeof m] || [s, 'gray'];
  return <Bdg v={v as any} xs>{l}</Bdg>;
};

export const TInv: React.FC<{ t: string }> = ({ t }) => {
  const m = { 
    INK: ['INKLARING', 'blue'], 
    TRK: ['TRUCKING', 'orange'], 
    RMB: ['REIMBURSE', 'purple'], 
    REPAIR: ['REPAIR', 'red'] 
  };
  const [l, v] = m[t as keyof typeof m] || [t, 'gray'];
  return <Bdg v={v as any} xs>{l}</Bdg>;
};

interface DashboardViewProps {
  jobs: JobOrder[];
  invs: Invoice[];
  reps: Repair[];
  nav: (p: string, tid: string, label: string, d?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ jobs, invs, reps, nav }) => {
  const piutang = invs
    .filter((i) => i.status === 'BELUM_LUNAS')
    .reduce((s, i) => s + (i.totalBayar || 0), 0);
  
  const belumInv = jobs.filter(
    (j) => ['IN_PROGRESS', 'READY_INVOICE'].includes(j.status) && !j.invoiceIds?.length
  ).length;

  const alerts = [
    ...jobs
      .filter((j) => j.status === 'READY_INVOICE')
      .map((j) => ({
        ico: '🟢',
        msg: `Invoice siap dibuat`,
        sub: `${j.noBL} · ${CUSTOMERS.find((c) => c.code === j.customerId)?.name || j.customerId}`,
        fn: () => nav('job-detail', j.id, 'JO ' + j.noBL.slice(-8), j),
      })),
    ...reps
      .filter((r) => r.status === 'PENGAJUAN')
      .map((r) => ({
        ico: '🟡',
        msg: `Repair menunggu waive`,
        sub: `${r.noContainer} · ${r.pelayaran} · Rp ${IDR(r.totalBiaya)}`,
        fn: () => nav('repair-detail', r.id, 'Repair ' + r.noContainer, r),
      })),
    ...reps
      .filter((r) => r.statusTagih === 'PENDING')
      .map((r) => ({
        ico: '🔴',
        msg: `Repair perlu ditagihkan`,
        sub: `${r.noContainer} · ${(r.hasil || '').replace('_', ' ')} · Rp ${IDR(r.nominalDitagihkan || 0)}`,
        fn: () => nav('repair-detail', r.id, 'Repair ' + r.noContainer, r),
      })),
  ];

  return (
    <div className="space-y-6">
      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Job Order Aktif" val={jobs.filter((j) => j.status === 'IN_PROGRESS').length} I={Package} col="blue" />
        <Stat label="Siap Invoice" val={jobs.filter((j) => j.status === 'READY_INVOICE').length} I={FileText} col="green" />
        <Stat label="Total Piutang" val={`Rp ${IDR(piutang)}`} I={Wallet} col="orange" sub="Belum lunas" />
        <Stat label="Belum Ditagih" val={belumInv} I={AlertCircle} col="red" sub="Job order aktif" />
        <Stat label="Repair Pending" val={reps.filter((r) => ['PENGAJUAN', 'KONFIRMASI'].includes(r.status)).length} I={Wrench} col="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items List */}
        <Card title={<span className="flex items-center gap-2">🔔 Perlu Tindakan <Bdg v="red" xs>{alerts.length}</Bdg></span>}>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {alerts.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-10 font-medium">Semua urusan selesai ✓</p>
            )}
            {alerts.map((a, i) => (
              <div 
                key={i} 
                onClick={a.fn} 
                className="flex items-start gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-colors duration-100"
              >
                <span className="text-sm mt-0.5 shrink-0">{a.ico}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{a.msg}</p>
                  <p className="text-[10.5px] text-slate-400 mt-1 font-bold leading-normal">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Job Orders */}
        <div className="lg:col-span-2">
          <Card 
            title="Job Order Terkini" 
            action={<Btn v="ghost" sm onClick={() => nav('job-orders', 'jobs', 'Job Order')}>Lihat Semua →</Btn>}
          >
            <Tbl 
              cols={[
                {
                  l: 'No BL / Customer',
                  fn: (r: JobOrder) => (
                    <div className="py-0.5">
                      <p className="font-mono text-xs font-black text-blue-700">{r.noBL}</p>
                      <p className="text-[10px] text-slate-400 font-extrabold block mt-0.5">
                        {CUSTOMERS.find((c) => c.code === r.customerId)?.name || r.customerId}
                      </p>
                    </div>
                  ),
                },
                {
                  l: 'Tipe',
                  fn: (r: JobOrder) => (
                    <div className="flex gap-1 flex-wrap">
                      <Bdg v={r.type === 'IMPORT' ? 'blue' : 'orange'} xs>{r.type}</Bdg>
                      <Bdg v={r.jalur === 'MERAH' ? 'red' : 'green'} xs>{r.jalur}</Bdg>
                    </div>
                  ),
                },
                { l: 'Party', fn: (r: JobOrder) => <span className="text-xs font-bold font-mono">{r.party}</span> },
                { l: 'Status', fn: (r: JobOrder) => <SJob s={r.status} /> },
              ]} 
              rows={jobs.slice(0, 5)} 
              onRow={(r: JobOrder) => nav('job-detail', r.id, 'JO ' + r.noBL.slice(-8), r)} 
              compact 
            />
          </Card>
        </div>
      </div>

      {/* Recents Invoice list */}
      <Card 
        title="Invoice Terkini" 
        action={<Btn v="ghost" sm onClick={() => nav('invoices', 'invs', 'Invoice')}>Lihat Semua →</Btn>}
      >
        <Tbl 
          cols={[
            { l: 'No. Invoice', fn: (r: Invoice) => <span className="font-mono text-xs font-black text-blue-700">{r.noInvoice}</span> },
            { l: 'Tipe', fn: (r: Invoice) => <TInv t={r.type} /> },
            { l: 'Customer', fn: (r: Invoice) => <span className="font-bold">{CUSTOMERS.find((c) => c.code === r.customerId)?.name || r.customerId}</span> },
            { l: 'Tanggal', fn: (r: Invoice) => <span className="font-mono">{FD(r.tanggal)}</span> },
            { l: 'Total', r: true, fn: (r: Invoice) => <span className="font-black text-slate-900">Rp {IDR(r.totalBayar)}</span> },
            { l: 'Status', fn: (r: Invoice) => <SInv s={r.status} /> },
          ]} 
          rows={invs.slice(0, 5)} 
          onRow={(r: Invoice) => nav('inv-detail', r.id, r.noInvoice, r)} 
          compact 
        />
      </Card>
    </div>
  );
};
