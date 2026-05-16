# OTOKITA Financial — Correct Accounting Formula

## Investor Report Position Formula

Formula benar untuk ringkasan posisi keuangan:

- **Kas Tersedia** = 11000 Kas & Bank + 11100 Kas Kecil + 11200 Bank BCA
- **Modal Deployed / Piutang** = 12100 Piutang JS + 12200 Piutang Cicilan + 12300 Piutang Bridging + 12400/12500 Piutang Karyawan
- **Beban Dibayar Dimuka** = 11500 Sewa Dibayar Dimuka
- **Inventory Motor Sitaan** = 14000 + 14100
- **Aset Tetap Bersih** = 15100 Peralatan + 15200 Kendaraan + 15400 Renovasi Ruko - 15300 Akumulasi Penyusutan
- **Total Aset** = semua asset di atas

## Important Fix

Sebelumnya `Kas Tersedia` menarik semua akun `11xxx`, sehingga `11500 Sewa Dibayar Dimuka` ikut masuk cash. Itu salah. Sekarang cash hanya akun kas/bank real: 11000, 11100, 11200.

## Buku Besar vs Investor Report

Kalau semua transaksi kas masuk ke 11000 saja, maka:

`Investor Report Kas Tersedia = Buku Besar 11000 Saldo Akhir`

Kalau nanti dipakai 11100 Kas Kecil atau 11200 Bank BCA, maka Investor Report Cash = 11000 + 11100 + 11200.

## Cash Flow Statement

Cash Flow Statement hanya membaca jurnal yang menyentuh akun cash real:

- 11000
- 11100
- 11200

Prepaid expense, piutang, aset tetap, dan inventory sitaan tidak dihitung sebagai kas.
