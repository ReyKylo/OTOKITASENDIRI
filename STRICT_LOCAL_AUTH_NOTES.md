# OTOKITA Strict Local Auth

Patch ini menghapus mock login hardcoded.

## Cara pakai pertama kali
1. Buka `login.html`.
2. Karena belum ada user, halaman masuk mode **Setup Admin Pertama**.
3. Buat username + password admin.
4. Setelah admin dibuat, semua akses module wajib login.

## Storage auth
- User disimpan di `otokita.auth_users`.
- Password tidak disimpan plaintext.
- Password disimpan sebagai hash PBKDF2-SHA256 + salt kalau browser mendukung WebCrypto.
- Kalau browser memblok WebCrypto di `file://`, dipakai fallback hash lokal supaya tetap bisa jalan offline.

## Buat user lain
Login sebagai admin/co_owner, buka homepage root `index.html`, lalu gunakan section **User Access** untuk buat user baru.

## Catatan security
Ini sudah bukan mock login, tapi tetap local-first/static HTML. Untuk production online yang benar, auth harus dipindah ke backend seperti Supabase Auth/Firebase/Auth server custom.
