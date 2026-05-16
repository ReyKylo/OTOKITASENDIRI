# Auth Crash Fix

Fix untuk login yang stuck di `Mengecek...`:

- Hash lama PBKDF2 diganti ke hash lokal cepat untuk mode file lokal.
- Login/create admin diberi timeout supaya tombol tidak pernah stuck.
- Jika ada user auth lama/invalid dari versi sebelumnya, sistem menganggap belum setup.
- Kalau format password lama terdeteksi, tampilkan instruksi reset auth.
- Semua protected pages tetap wajib session.

Cara bersih:
1. Buka `login.html`.
2. Klik `Reset Auth Users` kalau sebelumnya pernah stuck.
3. Buat admin pertama.
4. Login dengan admin yang baru dibuat.

Catatan: ini tetap local auth untuk HTML offline. Production online tetap butuh backend auth.
