export interface GensetData {
  isActive: boolean;
  tglMulai: string;    // format: 'YYYY-MM-DD'
  jamMulai: string;    // format: 'HH:MM'
  tglSelesai: string;  // format: 'YYYY-MM-DD'
  jamSelesai: string;  // format: 'HH:MM'
  totalJam: number;    // dihitung otomatis
  tarifFlat: number;   // dari rate card atau default
  tarifPerJam: number; // dari rate card atau default
  totalBiaya: number;  // dihitung otomatis
}

export interface TitipanData {
  isActive: boolean;
  tglMasuk: string;    // format: 'YYYY-MM-DD'
  tglKeluar: string;   // format: 'YYYY-MM-DD'
  jumlahHari: number;  // dihitung otomatis (inklusif)
  tarifPerHari: number; // dari rate card atau input user
  lo: number;          // Lift Off
  li: number;          // Lift In
  adm: number;         // Administrasi
  totalBiaya: number;  // dihitung otomatis
}

export interface Container {
  id: string;
  no: string | null;
  ukuran: string;
  tujuan: string;
  driverId: string | null;
  uangJalan: number | null;
  inap: number;
  status: 'BALIK_DEPO' | 'JALAN' | 'DALAM_PROSES';
  genset?: GensetData | null;    // BARU
  titipan?: TitipanData | null;  // BARU
}

export interface PettyExpense {
  id: string;
  ket: string;
  amount: number;
  noRef: string;
  tgl: string;
  dok: boolean;
}

export interface PettyCash {
  allocated: number;
  expenses: PettyExpense[];
}

export interface Milestone {
  done: boolean;
  tgl?: string;
  na?: boolean;
}

// Item milestone yang dapat disusun/diedit per Job Order (urutan = posisi di array)
export interface MilestoneItem {
  id: string;       // key unik milestone (cth: 'inputBL', atau 'ms-167...' utk custom)
  label: string;    // keterangan milestone (dapat diedit)
  done: boolean;
  tgl?: string;
  na?: boolean;     // jika true: dilewati / tidak berlaku
}

export interface JobOrder {
  id: string;
  type: 'IMPORT' | 'EXPORT' | 'DOMESTIK';
  customerId: string;
  noUrut: number;
  noAju: string;
  noBL: string;
  barang: string;
  noPO: string;
  vessel: string;
  pol?: string;   // Port of Loading (EXPORT)
  pod?: string;   // Port of Discharge (EXPORT)
  jalur: 'HIJAU' | 'MERAH';
  tglETA: string;
  tglSPPB: string | null;
  party: string;
  containers: Container[];
  status: 'READY_INVOICE' | 'IN_PROGRESS' | 'INVOICED' | 'CLOSED' | 'OPEN';
  milestones: Record<string, Milestone>;
  milestoneList?: MilestoneItem[];  // urutan & keterangan milestone yang dapat disesuaikan
  checklist: Record<string, boolean>;
  pettyCash: PettyCash;
  invoiceIds: string[];
  tglCreated: string;
  jenisTruckingDomestik?: string;
}

export interface InvoiceItem {
  nama: string;
  qty?: number;
  harga?: number;
  total: number;
  noRef?: string;
}

export interface Invoice {
  id: string;
  noInvoice: string;
  jobOrderId: string;
  customerId: string;
  type: 'INK' | 'TRK' | 'RMB' | 'REPAIR';
  tanggal: string;
  term: string;
  noAju: string;
  noBL: string;
  party: string;
  barang: string;
  jalur: string;
  noPO: string;
  vessel?: string;  // Vessel/Voyage (EXPORT)
  pol?: string;     // Port of Loading (EXPORT)
  pod?: string;     // Port of Discharge (EXPORT)
  tglETA: string;
  tglSPPB: string | null;
  items: InvoiceItem[];
  subtotal: number;
  dppNilaiLain: number | null;
  ppnRate: number;
  ppnAmount: number;
  totalBayar: number;
  status: 'BELUM_LUNAS' | 'LUNAS' | 'SEBAGIAN';
  noFP: string | null;
  jenisPajak: string;
  ket: string;
  tglBayar?: string;
}

export interface Repair {
  id: string;
  cardId: string;
  noAju: string;
  noBL: string;
  noContainer: string;
  pelayaran: string;
  depo: string;
  status: 'PENGAJUAN' | 'KONFIRMASI' | 'DI_TOLAK' | 'DI_BEBASKAN' | 'TERIMA_INV';
  biayaRepair: number;
  biayaAdm: number;
  ppn: number;
  totalBiaya: number;
  hasil: 'DI_TOLAK' | 'REFUND_SEBAGIAN' | 'REFUND_FULL' | null;
  nominalRefund: number | null;
  pengurus: string | null;
  tglKeDepo: string;
  tglDanaMasuk: string | null;
  statusTagih: 'PENDING' | 'DITAGIHKAN' | null;
  nominalDitagihkan: number | null;
  noInvoice: string | null;
  tglInput: string;
}

export interface Customer {
  code: string;
  name: string;
  npwp: string;
  alamat: string;
  term: string;
}

export interface Driver {
  id: string;
  nama: string;
  noHP: string;
  platNo: string;
  tipe: 'TRAILER' | 'FUSO' | 'TRONTON';
  status: 'TERSEDIA' | 'JALAN' | 'LIBUR';
}

export interface ServiceItem {
  code: string;
  name: string;
  harga: number;
  ppn: number;
  custom?: boolean;
}
