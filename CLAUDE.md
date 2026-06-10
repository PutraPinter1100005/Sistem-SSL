# CLAUDE.md — FreightOps ERP (PT. Sumber Selamat Logistik)

Dokumen referensi kode untuk Claude Code. Baca ini sebelum mengerjakan fitur apapun.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework UI | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Ikon | lucide-react |
| Animasi | motion (framer-motion) |
| Backend/Auth | Firebase (Firestore + Auth) — saat ini masih mock data |
| Bahasa UI | Indonesia |

---

## Struktur Folder

```
sistem-ssl/
├── src/
│   ├── App.tsx                  # Root: state global, routing, layout utama
│   ├── main.tsx                 # Entry point React
│   ├── index.css                # Global styles Tailwind
│   ├── types.ts                 # Tipe UI: WorkspaceTab, MenuItem, SystemStatus
│   ├── types/
│   │   └── erp.ts               # Semua domain types: JobOrder, Invoice, Repair, dst
│   ├── data/
│   │   └── mockData.ts          # Data awal: JOBS_INIT, INVS_INIT, REPS_INIT, CUSTOMERS, DRIVERS, tarif
│   ├── utils/
│   │   └── format.ts            # Helper: IDR(), FD(), cx(), hitungBiayaGenset(), dst
│   ├── context/
│   │   └── FirebaseContext.tsx  # Firebase auth context
│   └── components/
│       ├── Shared.tsx           # Komponen dasar: Bdg, Btn, Tbl, Stat, Card, MStep
│       ├── LoginScreen.tsx      # Halaman login + USERS_REGISTRY
│       ├── DashboardView.tsx    # Dashboard + badge helpers: SJob, SInv, TInv
│       ├── JobOrderView.tsx     # JobList + JobDetail (komponen utama)
│       ├── JobOrderForm.tsx     # Form tambah/edit Job Order
│       ├── InvoiceView.tsx      # InvList + InvDetail
│       ├── InvoiceForm.tsx      # Form rilis invoice (INK/TRK/RMB)
│       ├── RepairView.tsx       # RepairList + RepairDetail
│       ├── TruckingView.tsx     # Manajemen armada dan supir
│       ├── FinanceView.tsx      # Laporan keuangan ringkas
│       ├── MasterDataView.tsx   # Master: customer, driver, tarif
│       ├── ReportsView.tsx      # Laporan buku
│       ├── SettingsView.tsx     # Pengaturan role user + audit log
│       ├── WorkplaceLayout.tsx  # Wrapper layout workspace
│       ├── Sidebar.tsx          # Komponen sidebar
│       ├── ModuleContent.tsx    # Routing konten per modul
│       ├── TaxSettings.tsx      # Pengaturan parameter pajak
│       └── ...                  # View lain (VendorView, CustomerView, dst)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── firebase.json
├── firestore.rules
└── package.json
```

---

## Modul / Halaman yang Sudah Ada

| ID Modul | Label Menu | Komponen Utama | Deskripsi |
|---|---|---|---|
| `dashboard` | Dashboard | `DashboardView` | KPI ringkas, alert aktif, shortcut ke data |
| `jobs` | Job Order | `JobList`, `JobDetail`, `JobOrderForm` | Manajemen PPJK import/export/domestik |
| `invs` | Invoice Pajak | `InvList`, `InvDetail`, `InvoiceForm` | Tagihan INK/TRK/RMB, faktur pajak |
| `reps` | Waive Repair | `RepairList`, `RepairDetail` | Klaim kerusakan container ke pelayaran |
| `trucking` | Trucking & Supir | `TruckingView` | Monitoring armada dan penugasan driver |
| `finance` | Sirkulasi Finansial | `FinanceView` | Piutang, arus kas, rekap invoice |
| `master-customers` | Master Registry | `MasterDataPage` | Data customer, driver, rate card |
| `reports` | Laporan Buku | `Reports` | Laporan operasional dan keuangan |
| `settings` | Pengaturan | `SettingsView` | Manajemen role user + audit log |

---

## Sistem Navigasi (Tab Workspace)

App menggunakan sistem tab berlapis mirip software Accurate:

- **Level 1 (Modul Tab)** — bar tab atas, satu per modul yang sudah dibuka
- **Level 2 (Sub Tab)** — bar tab kedua di bawah header, untuk detail di dalam modul

ID tab menggunakan pola `<tipe>:<id>`, contoh:
- `job-detail:JO-001` — detail Job Order JO-001
- `inv-detail:INV-INK-001` — detail Invoice
- `add-job:new` — form buat JO baru
- `add-job:edit-JO-001` — form edit JO

Semua navigasi melalui fungsi `handleNav(tabId, payloadId, label, data?)` di `App.tsx`.

---

## Tipe-Tipe Domain Penting (`src/types/erp.ts`)

### JobOrder
```ts
type: 'IMPORT' | 'EXPORT' | 'DOMESTIK'
jalur: 'HIJAU' | 'MERAH'
status: 'IN_PROGRESS' | 'READY_INVOICE' | 'INVOICED' | 'CLOSED' | 'OPEN'
checklist: { operasional: boolean; trucking: boolean; adminDok: boolean }
milestones: Record<string, { done: boolean; tgl?: string; na?: boolean }>
```

### Invoice
```ts
type: 'INK' | 'TRK' | 'RMB' | 'REPAIR'
jenisPajak: 'DPP_NILAI_LAIN_12' | 'BESARAN_TERTENTU_1_1' | 'NO_PPN'
status: 'BELUM_LUNAS' | 'LUNAS' | 'SEBAGIAN'
```

### Container
```ts
status: 'DALAM_PROSES' | 'JALAN' | 'BALIK_DEPO'
genset?: GensetData | null   // biaya genset/reefer per container
titipan?: TitipanData | null // biaya titipan depo per container
```

### Driver
```ts
tipe: 'TRAILER' | 'FUSO' | 'TRONTON'
status: 'TERSEDIA' | 'JALAN' | 'LIBUR'
```

---

## Aturan Bisnis Penting

### Tipe Invoice

| Kode | Nama | Pajak | Jenis Faktur | Keterangan |
|---|---|---|---|---|
| **INK** | Inklaring (PPJK) | PPN 12% DPP Nilai Lain | Faktur 04 | Jasa kepabeanan, handling, karantina |
| **TRK** | Trucking | PPN 1.1% Besaran Tertentu | Faktur 05 | Biaya angkut kontainer per ritase |
| **RMB** | Reimbursement | Tidak ada PPN | — | Penggantian biaya lapangan sesuai bukti |

**Kalkulasi PPN INK (DPP Nilai Lain):**
```
DPP Nilai Lain = subtotal × (11/12)
PPN = DPP Nilai Lain × 12%
Total = subtotal + PPN
```

**Kalkulasi PPN TRK (Besaran Tertentu):**
```
PPN = subtotal × 1.1%
Total = subtotal + PPN
```

### Format Nomor Invoice
```
{KODE_CUSTOMER}-{noUrut}/{TIPE}/{BULAN}/{TAHUN_2DIGIT}
Contoh: SKD-482/INK/JUN/26
        KMG-203/TRK/NOV/25
        SKD-482/RMB/JUN/26
```

### Alur Status Job Order
```
IN_PROGRESS
  → READY_INVOICE  (ketika checklist.operasional && trucking && adminDok semua true)
  → INVOICED       (ketika sudah ada 3 invoice: INK + TRK + RMB)
  → CLOSED         (diselesaikan manual)
```

### Jalur Kepabeanan
- **HIJAU** — milestone `behandle` di-set `na: true` (dilewati/bypass)
- **MERAH** — milestone `behandle` wajib dilalui, tidak bisa di-NA

### Milestone Import (urutan)
1. Input BL & Data Order
2. Pengurusan DO
3. Draft PIB & Submit Customs
4. Pembayaran Bea Cukai
5. Penentuan Jalur *(trigger Jalur Modal)*
6. SPPB Keluar
7. Behandle *(na jika jalur HIJAU)*
8. Karantina
9. SPPB Selesai
10. Penugasan Truk
11. Truk Jalan
12. Barang Diterima
13. Kontainer ke Depo

### Milestone Export (urutan)
1. Input Booking
2. Draft PEB
3. Assign Truk
4. Ambil Container Kosong
5. Stuffing
6. Truk Jalan
7. Container Masuk CY
8. Karantina & Fumigasi *(biasanya na)*
9. Customs Clearance
10. Kapal Berangkat

### Kalkulasi Genset/Reefer
```
6 jam pertama → tarif flat (default: Rp 3.100.000)
Setiap jam tambahan (dibulatkan ke atas) → × tarif per jam (default: Rp 350.000)
```

### Kalkulasi Titipan Depo
```
totalBiaya = (jumlahHari × tarifPerHari) + LO + LI + ADM
jumlahHari dihitung inklusif (tglMasuk sampai tglKeluar, termasuk kedua tanggal)
```

### Default Uang Jalan Supir
- Container 40" → Rp 500.000
- Container 20" → Rp 350.000

---

## Role-Based Access Control

| Role | Hak Akses |
|---|---|
| **DIREKTUR** | Semua fitur, semua menu |
| **CS** | Membuat Job Order baru |
| **OPERASIONAL** | Update milestone sisi bea cukai, checklist operasional, tambah pengeluaran kas |
| **MGR_TRUCKING** | Update milestone sisi trucking, assign driver, checklist trucking |
| **ADMIN_INVOICE** | Rilis invoice, update semua checklist, tambah pengeluaran kas |
| **FINANCE** | Akses Invoice, Finance, Master, Laporan (read + update status bayar) |

**Milestone yang bisa diubah per role:**
- `OPERASIONAL`: inputBL, pengurusanDO, draftPIB, pembayaranBC, jalurDitentukan, SPPBKeluar, behandle, karantina, SPPBSelesai, inputBooking, draftPEB, containerMasuk, karantinaFumigasi, customsClearance, kapalBerangkat
- `MGR_TRUCKING`: assignTruck, truckJalan, barangDiterima, kontainerDepo, ambilContainer, stuffing

**Menu yang bisa diakses per role:**
- `invs`, `finance`, `reports` → hanya ADMIN_INVOICE, FINANCE, DIREKTUR
- `reps` → ADMIN_INVOICE, FINANCE, OPERASIONAL, DIREKTUR
- `settings` → hanya DIREKTUR

---

## Akun Demonstrasi

| Username | Password | Role |
|---|---|---|
| admin | admin123 | DIREKTUR |
| cs1 | cs123 | CS |
| ops1 | ops123 | OPERASIONAL |
| mgr_trk | trk123 | MGR_TRUCKING |
| adm_inv | inv123 | ADMIN_INVOICE |
| finance1 | fin123 | FINANCE |

---

## Konvensi Kode

### Komponen Shared (`src/components/Shared.tsx`)
Selalu gunakan komponen ini, jangan buat ulang:

| Nama | Kegunaan | Props penting |
|---|---|---|
| `<Bdg>` | Badge/label berwarna | `v='blue\|green\|red\|orange\|gray\|purple\|yellow'`, `xs` |
| `<Btn>` | Tombol aksi | `v='primary\|secondary\|danger\|success\|ghost\|warning'`, `sm`, `icon`, `disabled` |
| `<Tbl>` | Tabel data | `cols=[{l,fn}]`, `rows`, `onRow`, `compact` |
| `<Stat>` | Kartu statistik | `label`, `val`, `sub`, `I` (icon), `col` |
| `<Card>` | Kontainer konten | `title`, `action`, `cls` |
| `<MStep>` | Item milestone | `label`, `done`, `tgl`, `na` |

### Utility Functions (`src/utils/format.ts`)

| Fungsi | Kegunaan | Contoh |
|---|---|---|
| `IDR(n)` | Format angka ke Rupiah tanpa simbol | `IDR(1500000)` → `1.500.000` |
| `FD(s)` | Format tanggal YYYY-MM-DD ke D Mon YYYY | `FD('2026-06-08')` → `8 Jun 2026` |
| `cx(...a)` | Gabung className kondisional | `cx('base', cond && 'extra')` |
| `hitungTotalJam(...)` | Hitung total jam genset | argumen: tglMulai, jamMulai, tglSelesai, jamSelesai |
| `hitungBiayaGenset(...)` | Hitung biaya genset | argumen: totalJam, tarifFlat, tarifPerJam |
| `hitungHariTitipan(...)` | Hitung hari titipan inklusif | argumen: tglMasuk, tglKeluar |
| `hitungBiayaTitipan(...)` | Hitung total biaya titipan | argumen: hari, tarifPerHari, lo, li, adm |
| `TODAY` | Tanggal hari ini (string) | konstanta: `'2026-06-08'` |

### Badge Status (dari `DashboardView.tsx`)

| Komponen | Kegunaan |
|---|---|
| `<SJob s={job.status} />` | Badge status Job Order |
| `<SInv s={inv.status} />` | Badge status Invoice |
| `<TInv t={inv.type} />` | Badge tipe Invoice |

### State Management
- Semua state global ada di `App.tsx` (useState)
- Tidak ada Redux/Zustand — state dioper via props
- `tabPayload` menyimpan data aktif per tab ID
- Perubahan data selalu lewat handler: `handleUpdateJob`, `handleUpdateInvoice`, `handleUpdateRepair`

### Gaya Penulisan
- Komponen: PascalCase (`JobDetail`, `InvoiceForm`)
- Fungsi/variabel: camelCase (`handleNav`, `tabPayload`)
- Konstanta data: SCREAMING_SNAKE (`JOBS_INIT`, `SVC_INK`)
- ID tab: kebab-case dengan titik dua sebagai separator (`job-detail:JO-001`)
- Semua teks UI dalam **Bahasa Indonesia**
- Nama field/kunci dalam kode menggunakan **bahasa Indonesia** (e.g., `noBL`, `tglETA`, `noAju`)
- Warna sidebar navy: `#1B2B5E`, header biru: `#1B4B8A`

### Tarif Layanan (`src/data/mockData.ts`)
- `SVC_INK` — daftar harga jasa inklaring (PPN 12%)
- `SVC_TRK` — daftar harga trucking per rute/ukuran (PPN 1.1%)
- `customerRates` — rate card khusus per customer, disimpan di state `App.tsx`

### Firebase
- Konfigurasi di `src/firebase.ts` dan `firebase-applet-config.json`
- Context provider di `src/context/FirebaseContext.tsx`
- Saat ini data masih dari `mockData.ts` (belum sync ke Firestore)
- Rules Firestore ada di `firestore.rules`

---

## Catatan Penting Pengembangan

- **Data bersifat in-memory** — refresh browser menghapus semua perubahan (belum ada persistensi ke Firebase)
- `TODAY` di `mockData.ts` hardcoded ke `'2026-06-08'` — ubah jika perlu testing tanggal
- Invoice dibuat lewat `InvoiceForm` (manual) atau `handleAutoInvoice` di `App.tsx` (otomatis dari detail JO)
- Setelah 3 invoice (INK+TRK+RMB) dibuat untuk satu JO, status JO otomatis berubah ke `INVOICED`
- `JobOrderView.tsx` mengekspor `default` sebagai placeholder kosong — komponen sesungguhnya diekspor sebagai named exports `JobList` dan `JobDetail`
- Dev server: `npm run dev` → berjalan di `http://localhost:3001` (port 3000 biasanya sudah terpakai)
