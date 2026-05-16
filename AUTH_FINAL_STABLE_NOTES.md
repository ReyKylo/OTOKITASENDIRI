# OTOKITA Auth Final Stable

Fix terakhir untuk login lokal:

- Tidak pakai fetch users.json.
- Tidak pakai WebCrypto/PBKDF2.
- Tidak ada async password verify.
- Tidak ada mock/demo user hardcoded.
- First run wajib setup admin pertama.
- User/password disimpan lokal sebagai hash + salt sederhana.
- Semua protected pages tetap wajib session.

Cara pakai bersih:
1. Buka `login.html`.
2. Klik `Reset Auth Users` kalau pernah pakai versi lama.
3. Buat admin pertama dengan password minimal 8 karakter.
4. Login pakai admin tersebut.

Catatan security:
Ini strict local auth untuk file HTML offline. Untuk production online tetap perlu backend auth seperti Supabase Auth.
