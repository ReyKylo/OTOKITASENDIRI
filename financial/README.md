# OTOKITA Financial Module

Local-first Financial Module untuk OTOKITA. Buka langsung dari browser tanpa backend.

## Cara pakai
1. Extract folder `otokita-financial`.
2. Double-click `index.html`.
3. Data tersimpan di `localStorage` browser.
4. Pakai tombol `Export JSON` sebelum reset/delete massal.
5. Pakai `Import JSON` untuk restore atau pindah data ke laptop/browser lain.

## Pages
- `index.html` — Dashboard Finance, pending auto-journal dari Operational.
- `jurnal.html` — Jurnal Umum, COA, Settings, Import OPS JSON.
- `buku-besar.html` — Buku Besar per akun.
- `laporan.html` — Trial Balance, Income Statement, Balance Sheet, Cash Flow, Investor Report.

## Shared localStorage dengan Operational
Financial baca:
- `otokita.deals`
- `otokita.settings`

Financial tulis:
- `otokita.coa`
- `otokita.journal`
- `otokita.journal_links`
- `otokita.investor_notes`

## Role
- Admin / Finance: bisa akses.
- Sales / Marketing: akses ditolak.

Untuk test, set role di `jurnal.html → Settings`.

## Import OPS JSON
Format CSV/TSV:

```csv
Tanggal,Ref,Keterangan,Kategori,Debit,Kredit
2026-05-06,CF-030,Biaya Print + Materai,Operasional,,60000
2026-05-06,CF-031,Gadai motor,Modal Deal,,6000000
2026-05-06,CF-032,Bunga gadai,Pendapatan,900000,
```

Mapping default:
- Modal Masuk → 31000 Modal Investor
- Operasional → 51000 Biaya Operasional
- Marketing → 52000 Biaya Marketing
- Renovasi → 53000 Biaya Renovasi
- Modal Deal → 12100 Piutang Customer JS
- Pendapatan → 41100 Pendapatan Fee JS

## Catatan
Chart dan PDF export pakai CDN. Kalau offline total, data tetap jalan tapi chart/PDF bisa tidak muncul sampai internet aktif.

## Import OPS JSON dan bunga dibayar di depan

Tombol Import di Jurnal sekarang menerima JSON export dari Operational module. Sistem membaca `deals` / `inventory`, menyimpan ke `otokita.deals`, lalu membuat preview jurnal untuk pencairan, pelunasan, atau hangus.

Accounting treatment untuk bunga/fee: fee dianggap dibayar di depan. Jadi saat pencairan, jurnalnya:

- Dr Piutang Customer = pokok
- Cr Kas & Bank = pokok - fee upfront
- Cr Pendapatan Fee = fee upfront

Saat motor ditebus, jurnalnya hanya pokok:

- Dr Kas & Bank = pokok
- Cr Piutang Customer = pokok


## Repeat order identity

Import OPS JSON tidak merge deal berdasarkan nama customer atau nominal. Financial key dibuat dari nomor deal / ID inventory + tanggal masuk inventory. Jadi customer yang sama repeat order di tanggal berbeda tetap dihitung sebagai deal berbeda. Kalau deal yang sama berubah status Aktif ke Ditebus, pencairan lama tidak double-post; system hanya tambah event pelunasan atau bikin reversal/revisi kalau nominal berubah.

## Patch: Employee, Wage, Commission, Motor Sitaan

Patch ini menambahkan:
- Employee management di `jurnal.html` tab Employee.
- Wage section di `laporan.html#wage`.
- Auto-commission untuk deal Operational status `Ditebus`.
- Motor Sitaan page `motor-sitaan.html` untuk flow `Hangus → available → sold/scrap`.
- Storage baru: `otokita.employees`, `otokita.commissions`, `otokita.motor_sitaan`, `otokita.wages`.

Accounting logic:
- Komisi tidak langsung dijurnal saat deal ditebus. Status awal `pending`.
- Owner approve/pay komisi di Wage tab.
- Saat komisi dibayar: Dr 54100 Komisi Sales / Cr 11000 Kas & Bank.
- Saat gaji pokok dibayar: Dr 54000 Biaya Gaji / Cr 11000 Kas & Bank.
- Deal Hangus masuk Motor Sitaan, owner manual tandai terjual dan input sale price.
- Margin negatif tidak generate komisi; loss masuk 59000 Biaya Lain.

Repeat-order safety tetap mengikuti patch sebelumnya: deal identity dari nomor deal + tanggal masuk inventory.


## Cashflow OPS sudah dikonversi ke Jurnal Umum

Versi ini sudah memasukkan data CASHFLOW dari workbook OPS ke `data/mock-data.json` sebagai Jurnal Umum double-entry.

Ringkasan:
- 34 row cashflow dikonversi.
- Total Debit = Total Kredit.
- Ending Cash dari journal = Rp52.673.958, match dengan saldo cashflow OPS terakhir.
- Bunga/fee dicatat dibayar di depan: Dr Kas / Cr Pendapatan Fee JS.
- Pokok pencairan dicatat sebagai Piutang Customer JS, bukan total tebus.
- Sewa ruko tahunan dicatat sebagai Sewa Dibayar Dimuka.
- Detail mapping ada di `CASHFLOW_CONVERSION_NOTES.md` dan `data/cashflow-to-journal-audit.csv`.

Kalau browser sudah pernah menyimpan data lama di localStorage:
1. Export JSON dulu buat backup.
2. Reset data.
3. Import file `otokita-financial-cashflow-journal-import.json` yang disediakan terpisah.
