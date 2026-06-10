import React, { useState } from "react";
import { Shield, Users, Clock, Database, UserCheck, Search, Activity } from "lucide-react";
import { Card, Tbl, Bdg, Btn } from "./Shared";

interface SettingsViewProps {
  users: Array<{ username: string; role: string; name: string }>;
  onUpdateUserRole: (username: string, newRole: string) => void;
  auditLogs: Array<{ id: string; user: string; action: string; timestamp: string; details?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ users, onUpdateUserRole, auditLogs = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const ROLES_LIST = ["DIREKTUR", "CS", "OPERASIONAL", "MGR_TRUCKING", "ADMIN_INVOICE", "FINANCE"];

  const filteredUsers = users.filter((u) => {
    const text = (u.username + " " + u.name + " " + u.role).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* Overview Card */}
      <div className="bg-white border rounded-2xl p-5 shadow-3xs flex gap-3 text-slate-800 leading-relaxed">
        <Shield className="text-amber-500 w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase">Sektor Pengaturan Otorisasi & Log Sistem</h2>
          <p className="text-[10.5px] text-slate-500 mt-1">
            Grup administrator dan direksi dapat merubah role pengguna sistem di PT. Sumber Selamat Logistik. Seluruh perubahan hak akses tersinkronisasi instan terhadap menu visual di aplikasi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Users authority list editor */}
        <div className="lg:col-span-2">
          <Card 
            title="Daftar Operator Unit & Otorisasi Hak Akses" 
            action={
              <div className="relative w-44">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  placeholder="Cari Staf..."
                  className="w-full border rounded-xl pl-7 pr-2 py-1 text-[11px] font-semibold bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            <Tbl
              cols={[
                { l: "Nama Staf", fn: (r) => <span className="font-extrabold text-slate-800 text-xs">{r.name}</span> },
                { l: "Username", fn: (r) => <span className="font-mono text-slate-550 font-bold">{r.username}</span> },
                { 
                  l: "Otorisasi Saat Ini", 
                  fn: (r) => {
                    let col: "red" | "blue" | "green" | "orange" | "purple" | "gray" = "gray";
                    if (r.role === "DIREKTUR") col = "red";
                    else if (r.role === "CS") col = "blue";
                    else if (r.role === "OPERASIONAL") col = "orange";
                    else if (r.role === "MGR_TRUCKING") col = "purple";
                    else if (r.role === "ADMIN_INVOICE" || r.role === "FINANCE") col = "green";

                    return <Bdg v={col}>{r.role}</Bdg>;
                  }
                },
                {
                  l: "Ubah Perizinan Instan",
                  fn: (r) => (
                    <select
                      value={r.role}
                      onChange={(e) => onUpdateUserRole(r.username, e.target.value)}
                      className="border border-slate-205 rounded-lg px-2 py-1 text-[10.5px] font-bold text-slate-700 bg-white focus:outline-none"
                    >
                      {ROLES_LIST.map((role) => (
                        <option key={role} value={role}>
                          Set ke {role}
                        </option>
                      ))}
                    </select>
                  ),
                },
              ]}
              rows={filteredUsers}
              compact
            />
          </Card>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <Card title="Aturan Otoritas Role-Based">
            <div className="p-1 text-[10.5px] text-slate-500 leading-relaxed font-semibold space-y-2.5">
              <p>Perubahan role akan berdampak pada hal berikut:</p>
              <div className="space-y-1 bg-slate-50 p-2.5 border rounded-xl">
                <p className="text-rose-700 font-extrabold uppercase text-[8.5px] tracking-wider">DIREKTUR</p>
                <p className="text-slate-600 font-medium">Akses penuh sirkulasi modul keuangan, rilis, and override data.</p>
              </div>
              <div className="space-y-1 bg-slate-50 p-2.5 border rounded-xl">
                <p className="text-blue-700 font-extrabold uppercase text-[8.5px] tracking-wider">CS</p>
                <p className="text-slate-600 font-medium">Daftar JO baru, melihat detail, tidak dapat memutakhirkan milestone.</p>
              </div>
              <div className="space-y-1 bg-slate-50 p-2.5 border rounded-xl">
                <p className="text-orange-700 font-extrabold uppercase text-[8.5px] tracking-wider">OPERASIONAL & LAPANGAN</p>
                <p className="text-slate-600 font-medium">Update milestone lapangan & input kas bon pengeluaran kas.</p>
              </div>
              <div className="space-y-1 bg-slate-50 p-2.5 border rounded-xl">
                <p className="text-green-700 font-extrabold uppercase text-[8.5px] tracking-wider">FINANCE & INVOICING</p>
                <p className="text-slate-600 font-medium">Approval petty cash, update faktur pajak, dan pelunasan piutang.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* AUDIT TRAIL SYSTEM */}
      <Card title="Sistem Buku Log Audit Sirkulasi Aksi Penting (Audit Trail Ledger)">
        <div className="p-1 space-y-3">
          
          <div className="bg-slate-50 p-3 border rounded-xl text-slate-500 flex gap-2 items-center text-[10px] font-bold">
            <Activity className="text-blue-600 w-4 h-4 shrink-0" />
            <span>Mencatat seluruh aksi kritikal transaksi secara time-series dengan penunjuk pengguna aktif otomatis.</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y border rounded-xl overflow-hidden bg-white">
            {auditLogs.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-semibold">Belum tersedia data audit log transaksi.</p>
            ) : (
              auditLogs.slice().reverse().map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start gap-2 text-xs font-semibold">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-slate-800 bg-slate-100 border px-1.5 py-0.2 rounded">{log.user}</span>
                      <span className="font-extrabold text-blue-800">{log.action}</span>
                    </div>
                    {log.details && (
                      <p className="text-[10.5px] text-slate-450 leading-normal bg-slate-50/50 p-1 rounded border-l-2 border-slate-300">
                        {log.details}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono shrink-0">
                    <Clock size={11} />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

    </div>
  );
};
export default SettingsView;
