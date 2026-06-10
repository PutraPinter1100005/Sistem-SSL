export const TODAY = '2026-06-08';

export const IDR = (n: number | string | undefined | null) => {
  return new Intl.NumberFormat('id-ID').format(Math.round(Number(n || 0)));
};

export const FD = (s: string | undefined | null) => {
  if (!s) return '-';
  const parts = s.split('-');
  if (parts.length < 3) return s;
  const [y, m, dy] = parts;
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthIdx = parseInt(m) - 1;
  return `${parseInt(dy)} ${mo[monthIdx] || ''} ${y}`;
};

export const cx = (...a: any[]) => a.filter(Boolean).join(' ');

// ============ KALKULASI GENSET ============

export const hitungTotalJam = (
  tglMulai: string, jamMulai: string,
  tglSelesai: string, jamSelesai: string
): number => {
  if (!tglMulai || !jamMulai || !tglSelesai || !jamSelesai) return 0;
  const start = new Date(`${tglMulai}T${jamMulai}:00`);
  const end   = new Date(`${tglSelesai}T${jamSelesai}:00`);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60); // dalam jam (desimal)
};

export const hitungBiayaGenset = (
  totalJam: number,
  tarifFlat: number,
  tarifPerJam: number
): number => {
  if (totalJam <= 0) return 0;
  if (totalJam <= 6) return tarifFlat;
  const jamTambahan = Math.ceil(totalJam - 6);
  return tarifFlat + (jamTambahan * tarifPerJam);
};

export const formatJam = (totalJam: number): string => {
  const jam  = Math.floor(totalJam);
  const mnt  = Math.round((totalJam - jam) * 60);
  return `${jam} jam ${mnt > 0 ? mnt + ' menit' : ''}`.trim();
};

// ============ KALKULASI TITIPAN ============

export const hitungHariTitipan = (tglMasuk: string, tglKeluar: string): number => {
  if (!tglMasuk || !tglKeluar) return 0;
  const masuk  = new Date(tglMasuk);
  const keluar = new Date(tglKeluar);
  const diffMs = keluar.getTime() - masuk.getTime();
  if (diffMs < 0) return 0;
  const diffHari = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffHari + 1; // inklusif
};

export const hitungBiayaTitipan = (
  hari: number,
  tarifPerHari: number,
  lo: number, li: number, adm: number
): number => {
  if (hari <= 0) return 0;
  return (hari * tarifPerHari) + lo + li + adm;
};
