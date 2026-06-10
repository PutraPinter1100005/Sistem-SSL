import { JobOrder, Invoice, Repair, Customer, Driver, ServiceItem, MilestoneItem } from '../types/erp';

export const TODAY = '2026-06-08';

// ============ TEMPLATE MILESTONE DEFAULT PER TIPE ORDER ============
// Dipakai sebagai titik awal saat membuat JO baru; pengguna bebas
// menambah / mengubah / menghapus / memindahkan susunannya.
export const MILESTONE_TEMPLATES: Record<'IMPORT' | 'EXPORT' | 'DOMESTIK', { key: string; label: string; na?: boolean }[]> = {
  IMPORT: [
    { key: 'inputBL', label: 'Input BL & Data Order' },
    { key: 'pengurusanDO', label: 'Pengurusan Delivery Order (Cargo DO)' },
    { key: 'draftPIB', label: 'Draft PIB & Submit Customs (PIB)' },
    { key: 'pembayaranBC', label: 'Pembayaran Pajak Bea Cukai (Billing)' },
    { key: 'jalurDitentukan', label: 'Penentuan Jalur (Merah/Kuning/Hijau)' },
    { key: 'SPPBKeluar', label: 'Surat Persetujuan Pengeluaran Barang' },
    { key: 'behandle', label: 'Behandle fisik kontainer di pabean', na: true },
    { key: 'karantina', label: 'Pemeriksaan Rekon Karantina Organik' },
    { key: 'SPPBSelesai', label: 'SPPB Selesai & Dokumen lengkap diserahkan' },
    { key: 'assignTruck', label: 'Penugasan Armada Truk dan Supir Utama' },
    { key: 'truckJalan', label: 'Truk keluar gate dermaga (Delivery)' },
    { key: 'barangDiterima', label: 'Penerimaan cargo di gudang client (POD)' },
    { key: 'kontainerDepo', label: 'Kontainer kosong kembali diserahkan ke depo' },
  ],
  EXPORT: [
    { key: 'inputBooking', label: 'Input Booking Container' },
    { key: 'draftPEB', label: 'Penyusunan PEB & Pembayaran Ekspor' },
    { key: 'assignTruck', label: 'Penugasan Truk Pengangkut Container' },
    { key: 'ambilContainer', label: 'Ambil Depo Empty Container' },
    { key: 'stuffing', label: 'Stuffing loading cargo pabrik' },
    { key: 'truckJalan', label: 'Truk Delivery Kontainer Cargo Masuk Pelabuhan' },
    { key: 'containerMasuk', label: 'Container Masuk Terminal (CY)' },
    { key: 'karantinaFumigasi', label: 'Karantina & Fumigasi Sertifikasi', na: true },
    { key: 'customsClearance', label: 'Peluaran Nota Ekspor Customs' },
    { key: 'kapalBerangkat', label: 'Kapal Berangkat (ETD Selesai)' },
  ],
  DOMESTIK: [
    { key: 'inputBooking', label: 'Input Booking / Order' },
    { key: 'assignTruck', label: 'Penugasan Armada Truk' },
    { key: 'truckJalan', label: 'Truk Berangkat Pengantaran' },
    { key: 'barangDiterima', label: 'Barang Diterima (POD)' },
  ],
};

// Bangun template milestone untuk JO baru (item pertama otomatis selesai)
export const makeMilestoneTemplate = (type: 'IMPORT' | 'EXPORT' | 'DOMESTIK', firstDoneDate = TODAY): MilestoneItem[] => {
  const tmpl = MILESTONE_TEMPLATES[type] || MILESTONE_TEMPLATES.IMPORT;
  return tmpl.map((t, i) => ({
    id: t.key,
    label: t.label,
    done: i === 0,
    tgl: i === 0 ? firstDoneDate : undefined,
    na: t.na || false,
  }));
};

// Ambil milestoneList dari sebuah JO; jika belum ada (data lama), derive
// dari Record `milestones` + label template sesuai tipe.
export const buildMilestoneList = (job: { type: string; milestones?: Record<string, any>; milestoneList?: MilestoneItem[] }): MilestoneItem[] => {
  if (job.milestoneList && job.milestoneList.length > 0) return job.milestoneList;
  const tmpl = MILESTONE_TEMPLATES[(job.type as 'IMPORT' | 'EXPORT' | 'DOMESTIK')] || MILESTONE_TEMPLATES.IMPORT;
  const rec = job.milestones || {};
  // Mulai dari template, isi status dari record
  const list: MilestoneItem[] = tmpl.map(t => {
    const node = rec[t.key] || {};
    return {
      id: t.key,
      label: t.label,
      done: !!node.done,
      tgl: node.tgl,
      na: node.na !== undefined ? node.na : (t.na || false),
    };
  });
  // Sertakan key milestone dalam record yang tidak ada di template (custom lama)
  Object.keys(rec).forEach(k => {
    if (!list.some(m => m.id === k)) {
      const node = rec[k];
      list.push({ id: k, label: k, done: !!node.done, tgl: node.tgl, na: node.na || false });
    }
  });
  return list;
};

export const CUSTOMERS: Customer[] = [
  { code:'SKD', name:'PT. SUKANDA DJAYA', npwp:'0013682752092000', alamat:'JL. Pasir Putih Raya Kav. I, Pademangan Jakarta Utara 14430', term:'net 15' },
  { code:'TFJ', name:'PT. TIRTA FRESINDO JAYA', npwp:'1234567890123000', alamat:'Jl. Bintaro Permai No.1, Jakarta Selatan', term:'net 30' },
  { code:'CSS', name:'PT. CHAROEN SUKSES SEJAHTERA', npwp:'2345678901234000', alamat:'Jl. Daan Mogot KM 12, Tangerang', term:'net 15' },
  { code:'DSC', name:'PT. DESCO INDONESIA', npwp:'3456789012345000', alamat:'Jl. Industri No.5, Karawang', term:'net 30' },
  { code:'KMG', name:'PT. KENCANA MAKMUR GEMILANG', npwp:'4567890123456000', alamat:'Jl. Cikarang Baru No.10, Bekasi', term:'net 15' },
  { code:'TRB', name:'PT. TROPICANA BEVERAGES', npwp:'5678901234567000', alamat:'Jl. Raya Bogor KM 25, Cibinong', term:'net 30' },
];

export const DRIVERS: Driver[] = [
  { id:'D001', nama:'AHMAD SUPARDI', noHP:'08123456789', platNo:'B 1234 TRK', tipe:'TRAILER', status:'TERSEDIA' },
  { id:'D002', nama:'BUDI SANTOSO', noHP:'08234567890', platNo:'B 5678 TRK', tipe:'TRAILER', status:'JALAN' },
  { id:'D003', nama:'CANDRA WIJAYA', noHP:'08345678901', platNo:'B 9012 TRK', tipe:'FUSO', status:'TERSEDIA' },
  { id:'D004', nama:'DEDI KURNIAWAN', noHP:'08456789012', platNo:'B 3456 TRK', tipe:'FUSO', status:'TERSEDIA' },
  { id:'D005', nama:'EKO PRASETYO', noHP:'08567890123', platNo:'B 7890 TRK', tipe:'TRAILER', status:'LIBUR' },
  { id:'D006', nama:'FAHMI RIDWAN', noHP:'08678901234', platNo:'B 2345 TRK', tipe:'TRAILER', status:'JALAN' },
];

export const SVC_INK: ServiceItem[] = [
  { code:'EDI', name:'EDI PPJK', harga:150000, ppn:12 },
  { code:'HDL', name:'JASA HANDLING', harga:300000, ppn:12 },
  { code:'INK40HP', name:'INKLARING JKT 40" HIJAU PERTAMA', harga:350000, ppn:12 },
  { code:'INK40HB', name:'INKLARING JKT 40" HIJAU BERIKUTNYA', harga:300000, ppn:12 },
  { code:'INK20HP', name:'INKLARING JKT 20" HIJAU PERTAMA', harga:300000, ppn:12 },
  { code:'INK20HB', name:'INKLARING JKT 20" HIJAU BERIKUTNYA', harga:250000, ppn:12 },
  { code:'INK20DST', name:'JASA INKLARING CONT 2 DST', harga:500000, ppn:12 },
  { code:'INK20MP', name:'INKLARING JKT 20" MERAH PERTAMA', harga:850000, ppn:12 },
  { code:'KRNT', name:'KARANTINA', harga:650000, ppn:12 },
  { code:'BEHANDEL', name:'BEHANDEL JALUR MERAH', harga:1500000, ppn:12 },
  { code:'BHDLSTRP', name:'BEHANDLE & STRIPING', harga:1800000, ppn:12 },
  { code:'BCF', name:'PENGURUSAN BCF 1.5', harga:400000, ppn:12 },
  { code:'FUM', name:'PERCEPATAN FUMIGASI', harga:1000000, ppn:12 },
  { code:'SPJM', name:'SPJM', harga:1000000, ppn:12 },
  { code:'HICO', name:'KEPENGURUSAN HICO SCAN', harga:1000000, ppn:12 },
  { code:'ADM', name:'ADM', harga:100000, ppn:12 },
  { code:'GNST', name:'GENSET/REEFER', harga:0, ppn:12, custom:true },
  { code:'TTP', name:'TITIPAN CONTAINER', harga:0, ppn:12, custom:true },
];

export const SVC_TRK: ServiceItem[] = [
  { code:'TR20MARUNDA', name:'TRUCKING 20" MARUNDA', harga:1250000, ppn:1.1 },
  { code:'TR40MARUNDA', name:'TRUCKING 40" MARUNDA', harga:1550000, ppn:1.1 },
  { code:'TR20CIBITUNG', name:'TRUCKING 20" CIBITUNG', harga:1785000, ppn:1.1 },
  { code:'TR40CIBITUNG', name:'TRUCKING 40" CIBITUNG', harga:2000000, ppn:1.1 },
  { code:'TR20CAKUNG', name:'TRUCKING 20" CAKUNG', harga:1500000, ppn:1.1 },
  { code:'TR40CAKUNG', name:'TRUCKING 40" CAKUNG', harga:1600000, ppn:1.1 },
  { code:'TR20CILEGON', name:'TRUCKING 20" CILEGON', harga:3080000, ppn:1.1 },
  { code:'TR40CILEGON', name:'TRUCKING 40" CILEGON', harga:3370000, ppn:1.1 },
  { code:'TR20KARAWANG', name:'TRUCKING 20" KARAWANG', harga:2100000, ppn:1.1 },
  { code:'TR40KARAWANG', name:'TRUCKING 40" KARAWANG', harga:2200000, ppn:1.1 },
  { code:'TR20JATAKE', name:'TRUCKING 20" JATAKE', harga:1875000, ppn:1.1 },
  { code:'TR40JATAKE', name:'TRUCKING 40" JATAKE', harga:2000000, ppn:1.1 },
  { code:'TR20DAAN', name:'TRUCKING 20" DAAN MOGOT', harga:1690000, ppn:1.1 },
  { code:'TR40DAAN', name:'TRUCKING 40" DAAN MOGOT', harga:1840000, ppn:1.1 },
  { code:'TR40BALARAJA', name:'TRUCKING 40" BALARAJA', harga:2150000, ppn:1.1 },
  { code:'REV20', name:'TRUCKING REVO 20"', harga:495000, ppn:1.1 },
  { code:'REV40', name:'TRUCKING REVO 40"', harga:605000, ppn:1.1 },
  { code:'REVKOS', name:'TRUCKING REVO KOSONGAN', harga:300000, ppn:1.1 },
  { code:'INP', name:'INAP KONTAINER', harga:0, ppn:1.1 },
  { code:'TSLA', name:'TUSLAH/KAWALAN', harga:0, ppn:1.1 },
];

export const JOBS_INIT: JobOrder[] = [
  {
    id:'JO-001', type:'IMPORT', customerId:'SKD', noUrut:482,
    noAju:'0296', noBL:'YMJAI240448631', barang:'MIXED VEGETABLES',
    noPO:'PDA26189', vessel:'EVER GOLDEN 026E', jalur:'HIJAU',
    tglETA:'2026-05-18', tglSPPB:'2026-05-25', party:'2X40',
    containers:[
      { id:'C001', no:'YMLU1234567', ukuran:'40"', tujuan:'CIBITUNG', driverId:'D002', uangJalan:500000, inap:0, status:'BALIK_DEPO' },
      { id:'C002', no:'YMLU7654321', ukuran:'40"', tujuan:'CIBITUNG', driverId:'D001', uangJalan:500000, inap:0, status:'BALIK_DEPO' },
    ],
    status:'READY_INVOICE',
    milestones:{
      inputBL:{done:true,tgl:'2026-05-15'}, pengurusanDO:{done:true,tgl:'2026-05-16'},
      draftPIB:{done:true,tgl:'2026-05-17'}, pembayaranBC:{done:true,tgl:'2026-05-18'},
      jalurDitentukan:{done:true,tgl:'2026-05-19'}, SPPBKeluar:{done:true,tgl:'2026-05-23'},
      behandle:{done:false,na:true}, karantina:{done:true,tgl:'2026-05-24'},
      SPPBSelesai:{done:true,tgl:'2026-05-25'}, assignTruck:{done:true,tgl:'2026-05-24'},
      truckJalan:{done:true,tgl:'2026-05-25'}, barangDiterima:{done:true,tgl:'2026-05-25'},
      kontainerDepo:{done:true,tgl:'2026-05-26'},
    },
    checklist:{ operasional:true, trucking:true, adminDok:true },
    pettyCash:{ allocated:60000000, expenses:[
      {id:'E001',ket:'STORAGE',amount:25743463,noRef:'DEL211102',tgl:'2026-05-25',dok:true},
      {id:'E002',ket:'BEHANDLE',amount:5253640,noRef:'BHD171446',tgl:'2026-05-25',dok:true},
      {id:'E003',ket:'D.O, ADM, THC DLL',amount:13500822,noRef:'JKT/CSRCT/2026/12003',tgl:'2026-05-26',dok:true},
      {id:'E004',ket:'GATE PASS TRUCK',amount:40000,noRef:'',tgl:'2026-05-26',dok:true},
      {id:'E005',ket:'LIFT OFF',amount:1487400,noRef:'K1-1197874',tgl:'2026-05-26',dok:true},
      {id:'E006',ket:'PNBP KARANTINA',amount:57000,noRef:'820260525874669',tgl:'2026-05-24',dok:true},
    ]},
    invoiceIds:['INV-INK-001','INV-TRK-001','INV-RMB-001'],
    tglCreated:'2026-05-15',
  },
  {
    id:'JO-002', type:'IMPORT', customerId:'TFJ', noUrut:101,
    noAju:'5277', noBL:'JJMNTJKYNC600144', barang:'RAW MATERIAL FOOD',
    noPO:'TFJ-2026-089', vessel:'TIEN WAI 023N', jalur:'HIJAU',
    tglETA:'2026-06-01', tglSPPB:'2026-06-05', party:'1X40',
    containers:[
      { id:'C003', no:'TWCU2200102', ukuran:'40"', tujuan:'CIBITUNG', driverId:null, uangJalan:null, inap:0, status:'DALAM_PROSES' },
    ],
    status:'IN_PROGRESS',
    milestones:{
      inputBL:{done:true,tgl:'2026-06-01'}, pengurusanDO:{done:true,tgl:'2026-06-02'},
      draftPIB:{done:true,tgl:'2026-06-03'}, pembayaranBC:{done:true,tgl:'2026-06-04'},
      jalurDitentukan:{done:true,tgl:'2026-06-04'}, SPPBKeluar:{done:true,tgl:'2026-06-05'},
      behandle:{done:false,na:true}, karantina:{done:false,na:false},
      SPPBSelesai:{done:false,na:false}, assignTruck:{done:false,na:false},
      truckJalan:{done:false,na:false}, barangDiterima:{done:false,na:false},
      kontainerDepo:{done:false,na:false},
    },
    checklist:{ operasional:false, trucking:false, adminDok:true },
    pettyCash:{ allocated:20000000, expenses:[
      {id:'E007',ket:'D.O, ADM, THC DLL',amount:8500000,noRef:'DO-2026-001',tgl:'2026-06-02',dok:true},
    ]},
    invoiceIds:[], tglCreated:'2026-06-01',
  },
  {
    id:'JO-003', type:'EXPORT', customerId:'CSS', noUrut:58,
    noAju:'0580', noBL:'COSCS2026001234', barang:'PROCESSED FOOD',
    noPO:'CSS-EXP-2026-015', vessel:'COSCO SHIPPING STAR', jalur:'HIJAU',
    tglETA:'2026-06-15', tglSPPB:null, party:'1X20',
    containers:[
      { id:'C004', no:null, ukuran:'20"', tujuan:'CILEGON', driverId:'D001', uangJalan:350000, inap:0, status:'JALAN' },
    ],
    status:'IN_PROGRESS',
    milestones:{
      inputBooking:{done:true,tgl:'2026-06-05'}, draftPEB:{done:true,tgl:'2026-06-06'},
      assignTruck:{done:true,tgl:'2026-06-07'}, ambilContainer:{done:true,tgl:'2026-06-07'},
      stuffing:{done:false,na:false}, truckJalan:{done:true,tgl:'2026-06-08'},
      containerMasuk:{done:false,na:false}, karantinaFumigasi:{done:false,na:true},
      customsClearance:{done:false,na:false}, kapalBerangkat:{done:false,na:false},
    },
    checklist:{ operasional:false, trucking:false, adminDok:false },
    pettyCash:{ allocated:5000000, expenses:[] },
    invoiceIds:[], tglCreated:'2026-06-05',
  },
  {
    id:'JO-004', type:'IMPORT', customerId:'KMG', noUrut:203,
    noAju:'0433', noBL:'HLCUAPP240600740', barang:'CHEMICAL MATERIALS',
    noPO:'KMG-2025-433', vessel:'HAPAG LLOYD EXPRESS', jalur:'MERAH',
    tglETA:'2025-11-10', tglSPPB:'2025-11-20', party:'2X20',
    containers:[
      { id:'C005', no:'UACU4058986', ukuran:'20"', tujuan:'KARAWANG', driverId:'D003', uangJalan:450000, inap:0, status:'BALIK_DEPO' },
      { id:'C006', no:'NIDU2375136', ukuran:'20"', tujuan:'KARAWANG', driverId:'D004', uangJalan:450000, inap:0, status:'BALIK_DEPO' },
    ],
    status:'INVOICED',
    milestones:{
      inputBL:{done:true,tgl:'2025-11-08'}, pengurusanDO:{done:true,tgl:'2025-11-09'},
      draftPIB:{done:true,tgl:'2025-11-10'}, pembayaranBC:{done:true,tgl:'2025-11-11'},
      jalurDitentukan:{done:true,tgl:'2025-11-12'}, SPPBKeluar:{done:true,tgl:'2025-11-15'},
      behandle:{done:true,tgl:'2025-11-16'}, karantina:{done:false,na:true},
      SPPBSelesai:{done:true,tgl:'2025-11-18'}, assignTruck:{done:true,tgl:'2025-11-19'},
      truckJalan:{done:true,tgl:'2025-11-20'}, barangDiterima:{done:true,tgl:'2025-11-20'},
      kontainerDepo:{done:true,tgl:'2025-11-21'},
    },
    checklist:{ operasional:true, trucking:true, adminDok:true },
    pettyCash:{ allocated:30000000, expenses:[
      {id:'E010',ket:'STORAGE',amount:12000000,noRef:'DEL100001',tgl:'2025-11-15',dok:true},
      {id:'E011',ket:'BEHANDLE',amount:3500000,noRef:'BHD100001',tgl:'2025-11-16',dok:true},
      {id:'E012',ket:'D.O, ADM, THC DLL',amount:9500000,noRef:'JKT/2025/001',tgl:'2025-11-09',dok:true},
    ]},
    invoiceIds:['INV-INK-002','INV-TRK-002','INV-RMB-002'],
    tglCreated:'2025-11-08',
  },
  {
    id:'JO-005', type:'IMPORT', customerId:'TRB', noUrut:75,
    noAju:'0712', noBL:'OOLU2025071234', barang:'FOOD INGREDIENTS',
    noPO:'TRB-2026-075', vessel:'OOCL GERMANY', jalur:'HIJAU',
    tglETA:'2026-06-03', tglSPPB:'2026-06-07', party:'3X40',
    containers:[
      { id:'C007', no:'OOLU9182736', ukuran:'40"', tujuan:'CIBITUNG', driverId:'D006', uangJalan:500000, inap:0, status:'BALIK_DEPO' },
      { id:'C008', no:'OOLU1827364', ukuran:'40"', tujuan:'CIBITUNG', driverId:'D002', uangJalan:500000, inap:0, status:'JALAN' },
      { id:'C009', no:'OOLU2736455', ukuran:'40"', tujuan:'CIBITUNG', driverId:null, uangJalan:null, inap:0, status:'DALAM_PROSES' },
    ],
    status:'IN_PROGRESS',
    milestones:{
      inputBL:{done:true,tgl:'2026-06-03'}, pengurusanDO:{done:true,tgl:'2026-06-04'},
      draftPIB:{done:true,tgl:'2026-06-05'}, pembayaranBC:{done:true,tgl:'2026-06-06'},
      jalurDitentukan:{done:true,tgl:'2026-06-06'}, SPPBKeluar:{done:true,tgl:'2026-06-07'},
      behandle:{done:false,na:true}, karantina:{done:true,tgl:'2026-06-07'},
      SPPBSelesai:{done:true,tgl:'2026-06-08'}, assignTruck:{done:true,tgl:'2026-06-07'},
      truckJalan:{done:true,tgl:'2026-06-08'}, barangDiterima:{done:false,na:false},
      kontainerDepo:{done:false,na:false},
    },
    checklist:{ operasional:false, trucking:false, adminDok:true },
    pettyCash:{ allocated:90000000, expenses:[
      {id:'E013',ket:'D.O, ADM, THC DLL',amount:18000000,noRef:'JKT/OOCL/2026/001',tgl:'2026-06-04',dok:true},
      {id:'E014',ket:'PNBP KARANTINA',amount:171000,noRef:'820260607001',tgl:'2026-06-07',dok:true},
    ]},
    invoiceIds:[], tglCreated:'2026-06-03',
  },
];

export const INVS_INIT: Invoice[] = [
  {
    id:'INV-INK-001', noInvoice:'SKD-482/INK/JUN/26', jobOrderId:'JO-001',
    customerId:'SKD', type:'INK', tanggal:'2026-06-08', term:'net 15',
    noAju:'0296', noBL:'YMJAI240448631', party:'2X40', barang:'MIXED VEGETABLES',
    jalur:'HIJAU', noPO:'PDA26189', tglETA:'2026-05-18', tglSPPB:'2026-05-25',
    items:[
      {nama:'EDI PPJK',qty:1,harga:150000,total:150000},
      {nama:'JASA HANDLING',qty:1,harga:300000,total:300000},
      {nama:'JASA INKLARING CONT 2 DST',qty:1,harga:300000,total:300000},
      {nama:'KARANTINA',qty:1,harga:650000,total:650000},
    ],
    subtotal:1400000, dppNilaiLain:1283333, ppnRate:12, ppnAmount:154000, totalBayar:1554000,
    status:'BELUM_LUNAS', noFP:null, jenisPajak:'DPP_NILAI_LAIN_12',
    ket:'Pajak dengan perhitungan DPP Nilai Lain dengan tarif 12% dan faktur pajak 04.\n- Untuk revisi invoice dan Faktur Pajak paling lambat tgl 15 di bulan berikutnya.\n- Mohon dikoreksi jika ada kekeliruan.',
  },
  {
    id:'INV-TRK-001', noInvoice:'SKD-482/TRK/JUN/26', jobOrderId:'JO-001',
    customerId:'SKD', type:'TRK', tanggal:'2026-06-08', term:'net 15',
    noAju:'0296', noBL:'YMJAI240448631', party:'2X40', barang:'MIXED VEGETABLES',
    jalur:'HIJAU', noPO:'PDA26189', tglETA:'2026-05-18', tglSPPB:'2026-05-25',
    items:[{nama:'TRUCKING 40" CIBITUNG',qty:2,harga:2000000,total:4000000}],
    subtotal:4000000, dppNilaiLain:null, ppnRate:1.1, ppnAmount:44000, totalBayar:4044000,
    status:'BELUM_LUNAS', noFP:null, jenisPajak:'BESARAN_TERTENTU_1_1',
    ket:'Pajak dengan perhitungan Besaran tertentu dengan tarif 1.1% dan faktur pajak 05.\n- Untuk revisi invoice dan Faktur Pajak paling lambat tgl 15 di bulan berikutnya.\n- Mohon dikoreksi jika ada kekeliruan.',
  },
  {
    id:'INV-RMB-001', noInvoice:'SKD-482/RMB/JUN/26', jobOrderId:'JO-001',
    customerId:'SKD', type:'RMB', tanggal:'2026-06-08', term:'net 15',
    noAju:'0296', noBL:'YMJAI240448631', party:'2X40', barang:'MIXED VEGETABLES',
    jalur:'HIJAU', noPO:'PDA26189', tglETA:'2026-05-18', tglSPPB:'2026-05-25',
    items:[
      {nama:'STORAGE',noRef:'DEL211102',total:25743463},
      {nama:'BEHANDLE',noRef:'BHD171446',total:5253640},
      {nama:'D.O, ADM, THC DLL',noRef:'JKT/CSRCT/2026/12003',total:13500822},
      {nama:'GATE PASS TRUCK',noRef:'',total:40000},
      {nama:'LIFT OFF',noRef:'K1-1197874',total:1487400},
      {nama:'PNBP KARANTINA',noRef:'820260525874669',total:57000},
    ],
    subtotal:46082325, dppNilaiLain:null, ppnRate:0, ppnAmount:0, totalBayar:46082325,
    status:'BELUM_LUNAS', noFP:null, jenisPajak:'NO_PPN',
    ket:'Penagihan penggantian biaya (reimbursement) atas pengeluaran yang telah dibayarkan terlebih dahulu sesuai bukti transaksi dan tidak termasuk objek PPN.\n- Untuk revisi invoice dan Faktur Pajak paling lambat tgl 15 di bulan berikutnya.\n- Mohon dikoreksi jika ada kekeliruan.',
  },
  {
    id:'INV-INK-002', noInvoice:'KMG-203/INK/NOV/25', jobOrderId:'JO-004',
    customerId:'KMG', type:'INK', tanggal:'2025-11-25', term:'net 15',
    noAju:'0433', noBL:'HLCUAPP240600740', party:'2X20', barang:'CHEMICAL MATERIALS',
    jalur:'MERAH', noPO:'KMG-2025-433', tglETA:'2025-11-10', tglSPPB:'2025-11-20',
    items:[
      {nama:'EDI PPJK',qty:1,harga:150000,total:150000},
      {nama:'JASA HANDLING',qty:1,harga:300000,total:300000},
      {nama:'BEHANDEL JALUR MERAH',qty:2,harga:1500000,total:3000000},
      {nama:'JASA INKLARING CONT 2 DST',qty:1,harga:500000,total:500000},
    ],
    subtotal:3950000, dppNilaiLain:3620000, ppnRate:12, ppnAmount:434400, totalBayar:4384400,
    status:'LUNAS', noFP:'010.001.25.00000001', jenisPajak:'DPP_NILAI_LAIN_12',
    ket:'Pajak dengan perhitungan DPP Nilai Lain dengan tarif 12% dan faktur pajak 04.',
    tglBayar:'2025-12-10',
  },
  {
    id:'INV-TRK-002', noInvoice:'KMG-203/TRK/NOV/25', jobOrderId:'JO-004',
    customerId:'KMG', type:'TRK', tanggal:'2025-11-25', term:'net 15',
    noAju:'0433', noBL:'HLCUAPP240600740', party:'2X20', barang:'CHEMICAL MATERIALS',
    jalur:'MERAH', noPO:'KMG-2025-433', tglETA:'2025-11-10', tglSPPB:'2025-11-20',
    items:[{nama:'TRUCKING 20" KARAWANG',qty:2,harga:2100000,total:4200000}],
    subtotal:4200000, dppNilaiLain:null, ppnRate:1.1, ppnAmount:46200, totalBayar:4246200,
    status:'LUNAS', noFP:'050.001.25.00000001', jenisPajak:'BESARAN_TERTENTU_1_1',
    ket:'Pajak dengan perhitungan Besaran tertentu dengan tarif 1.1% dan faktur pajak 05.',
    tglBayar:'2025-12-10',
  },
  {
    id:'INV-RMB-002', noInvoice:'KMG-203/RMB/NOV/25', jobOrderId:'JO-004',
    customerId:'KMG', type:'RMB', tanggal:'2025-11-25', term:'net 15',
    noAju:'0433', noBL:'HLCUAPP240600740', party:'2X20', barang:'CHEMICAL MATERIALS',
    jalur:'MERAH', noPO:'KMG-2025-433', tglETA:'2025-11-10', tglSPPB:'2025-11-20',
    items:[
      {nama:'STORAGE',noRef:'DEL100001',total:12000000},
      {nama:'BEHANDLE',noRef:'BHD100001',total:3500000},
      {nama:'D.O, ADM, THC DLL',noRef:'JKT/2025/001',total:9500000},
    ],
    subtotal:25000000, dppNilaiLain:null, ppnRate:0, ppnAmount:0, totalBayar:25000000,
    status:'BELUM_LUNAS', noFP:null, jenisPajak:'NO_PPN',
    ket:'Penagihan penggantian biaya (reimbursement).',
  },
];

export const REPS_INIT: Repair[] = [
  { id:'REP-001', cardId:'SKD', noAju:'0200', noBL:'YMJAI240443166', noContainer:'YMLU5501483',
    pelayaran:'YANGMING', depo:'BSA', status:'PENGAJUAN',
    biayaRepair:2221487, biayaAdm:40000, ppn:4400, totalBiaya:2265887,
    hasil:null, nominalRefund:null, pengurus:'DIMAS',
    tglKeDepo:'2026-05-30', tglDanaMasuk:null, statusTagih:null, nominalDitagihkan:null, noInvoice:null, tglInput:'2026-06-01' },
  { id:'REP-002', cardId:'TFJ', noAju:'5077', noBL:'HLCULIV251002531', noContainer:'CAAU2321729',
    pelayaran:'HAPAG', depo:'TMJ', status:'KONFIRMASI',
    biayaRepair:352000, biayaAdm:25000, ppn:2750, totalBiaya:379750,
    hasil:'DI_TOLAK', nominalRefund:null, pengurus:null,
    tglKeDepo:'2026-04-15', tglDanaMasuk:null, statusTagih:'PENDING', nominalDitagihkan:379750, noInvoice:null, tglInput:'2026-04-20' },
  { id:'REP-003', cardId:'TFJ', noAju:'4992', noBL:'HDMUNKGZ14535300', noContainer:'CAIU616586',
    pelayaran:'HMM', depo:'TMJ', status:'DI_BEBASKAN',
    biayaRepair:1552836, biayaAdm:50000, ppn:176312, totalBiaya:1779148,
    hasil:'REFUND_SEBAGIAN', nominalRefund:555484, pengurus:'DIMAS',
    tglKeDepo:'2026-01-15', tglDanaMasuk:'2026-02-20', statusTagih:'DITAGIHKAN', nominalDitagihkan:1223664, noInvoice:'TFJ-001/REPAIR/JAN/26', tglInput:'2026-01-10' },
  { id:'REP-004', cardId:'SKD', noAju:'0894', noBL:'COSU6431163770', noContainer:'OERU4296820',
    pelayaran:'COSCO', depo:'GTM', status:'DI_TOLAK',
    biayaRepair:826000, biayaAdm:30000, ppn:94160, totalBiaya:950160,
    hasil:'DI_TOLAK', nominalRefund:null, pengurus:null,
    tglKeDepo:'2025-12-10', tglDanaMasuk:null, statusTagih:'DITAGIHKAN', nominalDitagihkan:950160, noInvoice:'SKD-001/REPAIR/JAN/26', tglInput:'2025-12-05' },
];
