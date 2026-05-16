# OTOKITA Suite — No Login Mode

Login/auth/session/role gate sudah dimatikan sesuai request.

Cara buka:
1. Buka `index.html` langsung untuk homepage.
2. Atau buka module langsung:
   - `operational/index.html`
   - `financial/index.html`
   - `marketing/index.html`
   - `management/index.html`

Catatan:
- `login.html` hanya redirect ke homepage.
- `403.html` hanya redirect ke homepage.
- `shared/js/auth.js` sekarang permissive shim supaya script lama tidak error.
- `shared/js/role-permissions.js` memberi akses full ke semua module.
- Tombol logout di top nav dihapus.
