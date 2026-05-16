# Management Reports Cross-Function Fix

## Masalah yang diperbaiki

1. Tab Reports tidak benar-benar berubah karena script lama membaca elemen `[data-report-active]` pertama, walaupun tab itu sudah tidak aktif.
2. Monthly/Quarterly/Team/Investor report masih terlalu statis dan tidak cukup menarik data lintas module.
3. Period selector bulan/quarter belum auto re-render.
4. Notes di report tidak tersimpan per report/period.

## Perbaikan

- `management/js/reports.js` diganti dengan generator report baru.
- Semua tab sekarang baca tab aktif dari `.active`, bukan attribute kosong.
- Ganti bulan/quarter langsung recalculate.
- Tombol Generate memaksa recalculate dari localStorage real.
- Report Monthly baca:
  - Operational: `otokita.leads`, `otokita.deals`
  - Financial: `otokita.journal`, `otokita.coa`
  - Marketing: `otokita.mkt_*`
  - Management: `otokita.okrs`, `otokita.krs`, `otokita.tasks`, `otokita.employees`
- Report Quarterly baca OKR/KR real + computed progress.
- Report Team baca employee + tasks + task completions + commissions + wages + OKR ownership.
- Investor Summary baca cash, receivable, total assets, revenue, net income, lead/deal, marketing spend, OKR completion.
- Notes tersimpan di `otokita.management_report_notes`.

## Formula penting

- Cash = akun 11000 + 11100 + 11200 saja.
- Revenue = akun 4xxxx credit - debit.
- Expense = akun 5xxxx debit - credit.
- Net Income = Revenue - Expense.
- Receivable = akun 12100/12200/12300/12400/12500.
- Marketing spend = poster batch spend + campaign spend.
- Team metrics = assigned tasks + completions + commission + wages.
