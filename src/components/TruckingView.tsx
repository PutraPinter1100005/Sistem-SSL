import React, { useState } from "react";
import { Plus, Truck, Edit2, AlertCircle } from "lucide-react";
import { JobOrder, Driver } from "../types/erp";
import { Card, Tbl, Bdg, Btn, Stat } from "./Shared";
import { IDR } from "../utils/format";
import { CUSTOMERS, DRIVERS } from "../data/mockData";

interface TruckingViewProps {
  jobs: JobOrder[];
  onAddDriver?: () => void;
  onAssignSupir?: (job: JobOrder, containerId: string) => void;
}

export const TruckingView: React.FC<TruckingViewProps> = ({ jobs, onAddDriver, onAssignSupir }) => {
  const unassigned = jobs.filter((j) => 
    j.containers.some((c) => !c.driverId) && ['IN_PROGRESS', 'READY_INVOICE'].includes(j.status)
  );

  const totalUnassigned = unassigned.reduce((s, j) => s + j.containers.filter(c => !c.driverId).length, 0);

  return (
    <div className="space-y-6">
      {/* Driver analysis grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Supir Internal" val={DRIVERS.length} I={Truck} col="blue" />
        <Stat label="Siap Dinas Jaga (Tersedia)" val={DRIVERS.filter(d => d.status === 'TERSEDIA').length} col="green" />
        <Stat label="Sedang Dinas Jalan" val={DRIVERS.filter(d => d.status === 'JALAN').length} col="orange" />
        <Stat label="Container Perlu Mandat" val={totalUnassigned} col="red" sub="Belum ada assign supir" />
      </div>

      {unassigned.length > 0 && (
        <Card title={<span className="flex items-center gap-2 text-rose-700">⚠️ Penugasan Driver Tertunda <Bdg v="red" xs>{totalUnassigned}</Bdg></span>}>
          <div className="p-4 space-y-3">
            {unassigned.map((jo) => {
              const pendingC = jo.containers.filter((c) => !c.driverId);
              return (
                <div key={jo.id} className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-black text-rose-900">{jo.noBL}</p>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {CUSTOMERS.find(c => c.code === jo.customerId)?.name || jo.customerId} · Party: {jo.party}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1.5 animate-pulse">
                      {pendingC.map((c) => (
                        <span key={c.id} className="text-[10px] bg-rose-50 border border-rose-150 text-rose-750 font-black px-2.5 py-0.5 rounded-full">
                          {c.ukuran} → {c.tujuan}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Btn v="primary" sm icon={Truck} onClick={() => onAssignSupir?.(jo, pendingC[0].id)}>
                    Tugaskan Supir Sekarang
                  </Btn>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Driver Registrations list */}
      <Card title="Daftar Sopir Internal & Mitra" action={<Btn v="primary" sm icon={Plus} onClick={onAddDriver}>Tambah Sopir Utama</Btn>}>
        <Tbl 
          cols={[
            { l: 'Nama Pengemudi', fn: (r) => <span className="font-extrabold text-slate-800">{r.nama}</span> },
            { l: 'Nomer Whatsapp HP', k: 'noHP' },
            { l: 'Koleksi Plat Nomer Truk', fn: (r) => <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-105 rounded px-2 py-0.5">{r.platNo}</span> },
            { l: 'Kualifikasi Chassis', fn: (r) => <Bdg v="blue">{r.tipe}</Bdg> },
            { 
              l: 'Status Dinas', 
              fn: (r) => {
                const colors = { TERSEDIA: 'green', JALAN: 'orange', LIBUR: 'gray' };
                return <Bdg v={colors[r.status as keyof typeof colors] as any || 'gray'}>{r.status}</Bdg>;
              } 
            },
            { l: 'Penyuntingan', fn: () => <Btn v="ghost" sm icon={Edit2}>Ubah</Btn> },
          ]} 
          rows={DRIVERS} 
          compact 
        />
      </Card>
    </div>
  );
};
