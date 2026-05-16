# OTOKITA Cashflow OPS → Jurnal Umum

Source workbook: `OTOKITA_OPS_v4-2-3(1).xlsx`

Converted rows: 34
Journal entries created: 34
Total Debit: Rp150,730,642
Total Credit: Rp150,730,642
Ending Cash Balance from journal: Rp52,673,958

## Accounting Mapping

| OPS Category / Description | Journal Mapping |
|---|---|
| Modal Masuk | Dr 11000 Kas & Bank / Cr 31000 Modal Investor |
| Modal Deal | Dr 12100 Piutang Customer JS / Cr 11000 Kas & Bank |
| Pendapatan / Bunga gadai | Dr 11000 Kas & Bank / Cr 41100 Pendapatan Fee JS |
| Operasional rutin | Dr 51000 Biaya Operasional / Cr 11000 Kas & Bank |
| Marketing | Dr 52000 Biaya Marketing / Cr 11000 Kas & Bank |
| Sewa Ruko Setahun | Dr 11500 Sewa Dibayar Dimuka / Cr 11000 Kas & Bank |
| Furniture/peralatan | Dr 15100 Peralatan Kantor / Cr 11000 Kas & Bank |
| Renovasi/fixture ruko | Dr 15400 Renovasi Ruko / Cr 11000 Kas & Bank |

## Important

- Bunga/fee dicatat saat kas diterima di depan.
- Principal deal tetap dicatat sebagai piutang sebesar pokok cair, bukan total tebus.
- Sewa ruko tahunan tidak langsung jadi beban penuh; dicatat sebagai prepaid rent. Amortisasi bulanan bisa dipost manual.
- Audit trail detail ada di `data/cashflow-to-journal-audit.csv`.
