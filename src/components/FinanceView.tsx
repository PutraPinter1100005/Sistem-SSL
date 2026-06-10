import React, { useMemo } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Invoice, JobOrder } from "../types/erp";
import { Card, Tbl, Bdg, Stat } from "./Shared";
import { IDR, FD } from "../utils/format";
import { CUSTOMERS } from "../data/mockData";
import { TInv, SInv } from "./DashboardView";

interface FinanceViewProps {
  invs: Invoice[];
  jobs: JobOrder[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ invs, jobs }) => {
  const piutang = useMemo(() => {
    return invs.filter((i) => i.status === 'BELUM_LUNAS').reduce((s, i) => s + (i.totalBayar || 0), 0);
  }, [invs]);

  const lunas = useMemo(() => {
    return invs.filter((i) => i.status === 'LUNAS').reduce((s, i) => s + (i.totalBayar || 0), 0);
  }, [invs]);

  const byCustomers = useMemo(() => {
    return CUSTOMERS.map((c) => {
      const pendingInvs = invs.filter((i) => i.customerId === c.code && i.status === 'BELUM_LUNAS');
      return {
        ...c,
        total: pendingInvs.reduce((s, i) => s + (i.totalBayar || 0), 0),
        jml: pendingInvs.length,
      };
    })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [invs]);

  return (
    <div className="space-y-6">
      {/* Metrics bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Piutang Outstanding" val={`Rp ${IDR(piutang)}`} col="red" sub="Faktur belum terbayar" />
        <Stat label="Sudah Terbayar" val={`Rp ${IDR(lunas)}`} col="green" sub="Kas bank kliring" />
        <Stat label="Tagihan Belum Lunas" val={invs.filter((i) => i.status === 'BELUM_LUNAS').length} col="orange" />
        <Stat label="Tagihan Lunas" val={invs.filter((i) => i.status === 'LUNAS').length} col="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables by customer */}
        <div className="lg:col-span-1">
          <Card title="Piutang per Customer">
            <Tbl 
              cols={[
                { l: 'Pelanggan', fn: (r) => <span className="font-extrabold text-slate-800 text-xs">{r.name}</span> },
                { l: 'Faktur', k: 'jml', r: true },
                { l: 'Total', r: true, fn: (r) => <span className="font-black text-rose-700">Rp {IDR(r.total)}</span> },
              ]} 
              rows={byCustomers} 
              compact 
            />
            <div className="p-4 border-t bg-slate-50 flex justify-between font-extrabold text-xs text-slate-850 select-none">
              <span>JUMLAH</span>
              <span className="text-rose-600 font-black">Rp {IDR(piutang)}</span>
            </div>
          </Card>
        </div>

        {/* All outstanding Invoices */}
        <div className="lg:col-span-2">
          <Card title="Daftar Tagihan Belum Terbayar">
            <Tbl 
              cols={[
                { l: 'Nomer Invoice', fn: (r) => <span className="font-mono text-xs font-black text-blue-700">{r.noInvoice}</span> },
                { l: 'Kanal', fn: (r) => <TInv t={r.type} /> },
                { l: 'Mitra', fn: (r) => <span className="font-bold">{CUSTOMERS.find(c => c.code === r.customerId)?.name || r.customerId}</span> },
                { l: 'Tanggal', fn: (r) => <span className="font-mono text-slate-450">{FD(r.tanggal)}</span> },
                { 
                  l: 'Jatuh Tempo', 
                  fn: (r) => {
                    const dt = new Date(r.tanggal);
                    const days = parseInt(r.term.replace(/\D/g, '')) || 15;
                    dt.setDate(dt.getDate() + days);
                    return <span className="font-mono text-slate-900 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">{dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
                  } 
                },
                { l: 'Total Bayar', r: true, fn: (r) => <span className="font-black text-rose-600">Rp {IDR(r.totalBayar)}</span> },
              ]} 
              rows={invs.filter((i) => i.status === 'BELUM_LUNAS')} 
              compact 
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
