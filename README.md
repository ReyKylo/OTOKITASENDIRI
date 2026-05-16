# OTOKITA Integrated Local System

Local-first super-folder untuk 4 module OTOKITA: Operational, Financial, Marketing, Management, plus mock login, homepage, shared storage/i18n/ui/auth/nav, dan Per-Employee KPI.

## Cara test lokal

1. Extract ZIP.
2. Buka `login.html` dengan double-click.
3. Login pakai salah satu mock user.
4. Masuk ke homepage `index.html`, lalu pilih module.

## Mock user credentials

| Role | Username | Password | Akses |
|---|---|---|---|
Tidak ada credential default. Buka `login.html`, lalu buat admin pertama. Setelah itu user lain dibuat dari panel **User Access** di homepage.

## Struktur folder

```text
otokita-suite-integrated/
├── login.html
├── index.html
├── 403.html
├── shared/
├── operational/
├── financial/
├── marketing/
└── management/
```

## Shared files

- `shared/js/storage.js` = superset storage API untuk semua module.
- `shared/js/auth.js` = mock auth + session 8 jam / 30 hari remember me.
- `shared/js/role-permissions.js` = permission matrix.
- `shared/js/nav.js` = unified top nav.
- `shared/js/employee-kpi-engine.js` = Per-Employee KPI engine.
- `shared/js/i18n.js` = bilingual fallback ID/中文.
- `shared/css/*.css` = tokens, reset, components, layout.

## Per-Employee KPI

KPI lama yang tidak punya `assigned_to_employee_id` dianggap global KPI.

KPI employee punya field:

```js
assigned_to_employee_id
kpi_scope
visibility
min_target
max_target
target_period
target_period_anchor
```

Seed contoh:

```text
Pencairan Bulanan Humam
Min Rp50.000.000
Max Rp100.000.000
Metric: total_principal_disbursed_by_employee
```

Operational Dashboard membaca KPI ini secara read-only lewat `EmployeeKPIEngine.getVisibleKPIs()`.

## Cara add KPI baru per employee

1. Login `admin` atau `aydin`.
2. Buka `management/kpi.html`.
3. Klik tab `Per-Employee KPI`.
4. Klik `+ Assign New KPI to Employee`.
5. Pilih employee.
6. Pilih metric employee.
7. Isi min target dan max target.
8. Save.
9. Login sebagai employee terkait.
10. Buka homepage atau Operational dashboard untuk lihat KPI pribadi.

## Backup / restore

Semua module masih pakai localStorage. Pakai tombol Export JSON / Import JSON di module masing-masing, atau backup browser localStorage.

## Troubleshooting

- Kalau klik module langsung tanpa login, akan redirect ke `login.html`.
- Kalau role tidak punya akses, masuk `403.html`.
- Kalau bahasa tidak berubah, refresh sekali setelah toggle.
- Kalau chart/PDF/calendar tidak jalan, cek koneksi internet karena CDN Chart.js/jsPDF/FullCalendar butuh internet.

## Roadmap ke Supabase

1. Mapping localStorage tables ke Postgres.
2. Ganti mock auth ke Supabase Auth.
3. Tambah RLS: employee hanya lihat KPI sendiri.
4. Upload JSON export sebagai migration seed.
5. Deploy frontend ke Vercel/Netlify.
6. Tambah Edge Functions untuk import/export, PDF, reminder, WA bot.

## Financial Restore Note
Financial module is intentionally kept with its local accounting JS helpers (`financial/js/storage.js`, `financial/js/ui.js`, `financial/js/i18n.js`) because the accounting module has specialized functions not present in the generic shared helpers. Do not delete these three files during shared asset cleanup unless the shared API fully implements all Financial helper functions.

## Strict Local Login Patch

Versi ini tidak memakai mock login default lagi.

Cara pertama kali:
1. Buka `login.html`.
2. Buat admin pertama di mode **Setup Admin Pertama**.
3. Login memakai username/password yang dibuat.
4. Setelah login sebagai admin, buka homepage `index.html` dan gunakan panel **User Access** untuk membuat user lain.

Auth storage:
- `otokita.auth_users` menyimpan user lokal.
- Password disimpan sebagai hash + salt, bukan plaintext.
- `otokita.session` menyimpan session aktif dengan expiry.

Catatan: ini strict local auth untuk double-click HTML. Untuk production online, pindahkan auth ke backend seperti Supabase Auth/Firebase/custom backend.
