# Audit Kas Investor Report vs Buku Besar

## Temuan utama
Investor Report sebelumnya menghitung `Kas Tersedia` dengan semua akun yang prefix-nya `11xxx`.

Itu salah untuk standar penyajian laporan posisi keuangan, karena `11500 Sewa Dibayar Dimuka` ikut masuk sebagai kas padahal secara akuntansi itu aset lancar non-kas / beban dibayar dimuka.

## Patch formula
- Cash/Kas sekarang hanya akun kas dan bank:
  - 11000 Kas & Bank
  - 11100 Kas Kecil
  - 11200 Bank BCA
- 11500 Sewa Dibayar Dimuka dipisah sebagai `Beban Dibayar Dimuka`.
- Investor Report total aset tetap tidak berubah, hanya klasifikasinya yang benar.
- Cash Flow Statement sekarang hanya membaca cash movement dari akun 11000/11100/11200, bukan semua 11xxx.
- Dashboard `Cash on Hand` ikut formula kas baru.
- Buku Besar `Saldo Awal` sekarang menunjukkan saldo awal periode, bukan opening balance akun master.

## Dampak
Kalau Buku Besar 11000 menunjukkan Rp46.069.458, Investor Report `Kas Tersedia` sekarang akan cocok dengan kas/bank yang sama, bukan tercampur prepaid rent.

## SAK Indonesia / SAK EMKM alignment
Mengikuti penyajian pos laporan posisi keuangan: kas dan setara kas, piutang, persediaan, aset tetap, liabilitas, ekuitas. Prepaid expense disajikan sebagai aset lancar non-kas, bukan kas.
