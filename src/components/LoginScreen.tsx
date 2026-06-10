import React, { useState } from "react";
import { Lock, User, ShieldAlert, FileText, CheckCircle } from "lucide-react";

export const USERS_REGISTRY = [
  { username: 'admin', password: 'admin123', role: 'DIREKTUR', name: 'Pak Putra' },
  { username: 'cs1', password: 'cs123', role: 'CS', name: 'Sarah (CS)' },
  { username: 'ops1', password: 'ops123', role: 'OPERASIONAL', name: 'Budi (Lapangan)' },
  { username: 'mgr_trk', password: 'trk123', role: 'MGR_TRUCKING', name: 'Agus (Manajer Trucking)' },
  { username: 'adm_inv', password: 'inv123', role: 'ADMIN_INVOICE', name: 'Yenny (Invoice)' },
  { username: 'finance1', password: 'fin123', role: 'FINANCE', name: 'Rina (Finance)' },
];

interface LoginScreenProps {
  onLogin: (user: { username: string; role: string; name: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate standard security delay
    setTimeout(() => {
      const match = USERS_REGISTRY.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      if (match) {
        onLogin({
          username: match.username,
          role: match.role,
          name: match.name,
        });
      } else {
        setError("Kombinasi sandi / akun salah. Harap periksa e-mail korporat.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4 select-none font-sans relative overflow-hidden">
      {/* Background ambient decorative shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-605/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-810 rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-fade-in p-8 space-y-6">
        
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl font-black tracking-widest text-lg mb-1">
            SSL
          </div>
          <h2 className="text-lg font-black tracking-tight text-white uppercase sm:text-xl">
            Sistem Integrasi Logistik
          </h2>
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest leading-none font-sans">
            PT. SUMBER SELAMAT LOGISTIK — PORTAL ERP
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex gap-2.5 items-start text-xs font-semibold leading-relaxed text-rose-300">
            <ShieldAlert size={16} className="text-rose-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest block">
              Alamat Pengenal (Username)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <User size={15} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="admin / cs1 / finance1"
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest block">
              Sandi Masuk (Password)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={15} />
              </span>
              <input
                type="password"
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs transition duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin pr-1"></span>
            ) : (
              <span>Autentikasi Akses Aman</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Reference Table */}
        <div className="border-t border-slate-810/50 pt-4 space-y-3">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert size={13} className="text-amber-500" />
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
              Akun Demonstrasi Aktif
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 bg-slate-900/50 border border-slate-810/30 p-3 rounded-2xl leading-none">
            <div>
              <p className="font-extrabold text-slate-400">admin / admin123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: DIREKTUR</p>
            </div>
            <div>
              <p className="font-extrabold text-slate-400">cs1 / cs123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: CS (Customer Serv.)</p>
            </div>
            <div>
              <p className="font-extrabold text-slate-400">ops1 / ops123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: OPERASIONAL</p>
            </div>
            <div>
              <p className="font-extrabold text-slate-400">mgr_trk / trk123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: MGR_TRUCKING</p>
            </div>
            <div>
              <p className="font-extrabold text-slate-400">adm_inv / inv123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: ADMIN_INVOICE</p>
            </div>
            <div>
              <p className="font-extrabold text-slate-400">finance1 / fin123</p>
              <p className="text-[8.5px] text-slate-500 mt-1">Role: FINANCE</p>
            </div>
          </div>
        </div>

      </div>

      <p className="text-[9.5px] text-slate-500 mt-6 select-none font-mono">
        SSL ERP &bull; ENTERPRISE SYSTEM DATA SECURED BY SECURE-LAYER COGNITO
      </p>
    </div>
  );
};
