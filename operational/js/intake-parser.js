(function () {
  const monthMap = {
    januari: '01', january: '01', jan: '01',
    februari: '02', february: '02', feb: '02',
    maret: '03', march: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', june: '06', jun: '06',
    juli: '07', july: '07', jul: '07',
    agustus: '08', august: '08', aug: '08',
    september: '09', sep: '09',
    oktober: '10', october: '10', oct: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', december: '12', dec: '12', des: '12'
  };

  function cleanValue(value) {
    return String(value || '').replace(/\*/g, '').replace(/：/g, ':').trim();
  }
  function pick(raw, labels) {
    const lines = String(raw || '').split(/\n+/).map(cleanValue).filter(Boolean);
    for (const label of labels) {
      const normalized = label.toLowerCase();
      const found = lines.find((line) => line.toLowerCase().startsWith(normalized));
      if (found) {
        const idx = found.indexOf(':');
        return idx >= 0 ? cleanValue(found.slice(idx + 1)) : cleanValue(found.slice(label.length));
      }
    }
    return null;
  }
  function parseMoney(input) {
    if (!input) return null;
    let text = String(input).toLowerCase().replace(/rp/g, '').replace(/\s+/g, ' ').trim();
    const hasMillion = /(jt|juta)/.test(text);
    text = text.replace(/juta|jt/g, '').trim();
    if (hasMillion) {
      const decimal = text.replace(',', '.').replace(/[^0-9.]/g, '');
      const value = Number(decimal);
      return Number.isFinite(value) ? Math.round(value * 1000000) : null;
    }
    const digits = text.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : null;
  }
  function parseInt(input) {
    const digits = String(input || '').match(/\d+/);
    return digits ? Number(digits[0]) : null;
  }
  function parseBool(input) {
    if (!input) return null;
    const text = String(input).trim().toLowerCase();
    if (/^(ya|iya|ada|yes|true|ok)$/i.test(text)) return true;
    if (/^(tidak|nggak|ga|gak|no|false|belum)$/i.test(text)) return false;
    return null;
  }
  function parseDate(input) {
    if (!input) return null;
    const raw = cleanValue(input).toLowerCase();
    const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    const slash = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
    if (slash) {
      const year = slash[3].length === 2 ? '20' + slash[3] : slash[3];
      return `${year}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
    }
    const word = raw.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (word) {
      const month = monthMap[word[2].toLowerCase()];
      if (month) return `${word[3]}-${month}-${word[1].padStart(2, '0')}`;
    }
    return null;
  }
  function normalizeOwnership(input) {
    const text = String(input || '').toUpperCase();
    if (text.includes('LUNAS')) return 'LUNAS';
    if (text.includes('KREDIT') || text.includes('LEASING')) return 'KREDIT';
    if (text.includes('PEGADAIAN') || text.includes('GADAI')) return 'PEGADAIAN';
    return 'UNKNOWN';
  }
  function formatMoneyPlain(value) {
    return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(Number(value || 0));
  }
  function buildWarnings(data) {
    const settings = window.storage ? window.storage.getSettings() : { hjs_konservatif_ratio:.65, fee_js_30:.15 };
    const warnings = ['Harga pasar motor belum diisi, plafon final belum bisa dihitung.'];
    if (data.ownership_status === 'LUNAS' && data.has_original_bpkb === false) warnings.push('Status LUNAS tapi BPKB asli tidak ada, butuh review manual (red flag).');
    if (data.has_original_stnk === false) warnings.push('STNK asli tidak ada, red flag.');
    if (data.has_own_name_sim === false) warnings.push('SIM atas nama sendiri tidak ada, yellow warning.');
    const year = Number(data.motorcycle_year);
    const age = year ? new Date().getFullYear() - year : null;
    if (age !== null && age >= 8 && age <= 9) warnings.push(`Motor tahun ${year} masuk kategori 8–9 tahun, gunakan rasio HJS ${Math.round(settings.hjs_konservatif_ratio * 100)}%.`);
    if (age !== null && age > 10) warnings.push(`Motor tahun ${year} sudah >10 tahun, reject otomatis.`);
    if (data.requested_fund && data.planned_redeem_days === 30) {
      const total = Math.round(data.requested_fund * (1 + settings.fee_js_30));
      warnings.push(`Request ${formatMoneyPlain(data.requested_fund)} dengan rencana tebus 30 hari, estimasi total tebus JS 30H = ${formatMoneyPlain(total)} sebelum biaya lain.`);
    }
    return warnings;
  }
  function parseIntake(rawText) {
    if (!rawText || !String(rawText).trim()) return { data: {}, warnings: ['Form kosong. Paste data intake dulu.'] };
    const data = {
      customer_name: pick(rawText, ['Nama lengkap', 'Nama']),
      phone_number: pick(rawText, ['Nomor HP aktif', 'No HP', 'Nomor HP']),
      occupation: pick(rawText, ['Pekerjaan']),
      monthly_income: parseMoney(pick(rawText, ['Penghasilan per bulan', 'Penghasilan bulanan', 'Gaji bulanan'])),
      motorcycle_type: pick(rawText, ['Merk/tipe', 'Merk / tipe', 'Motor', 'Tipe motor']),
      motorcycle_year: parseInt(pick(rawText, ['Tahun pembuatan', 'Tahun motor', 'Tahun'])),
      bpkb_name: pick(rawText, ['Atas nama BPKB', 'Nama BPKB']),
      tax_valid_until_raw: pick(rawText, ['Pajak berlaku s/d', 'Pajak berlaku sampai', 'Pajak sampai']),
      tax_valid_until: null,
      ownership_status: normalizeOwnership(pick(rawText, ['Status'])),
      leasing_name: pick(rawText, ['Nama leasing', 'Leasing', 'Pegadaian']),
      remaining_credit_principal: parseMoney(pick(rawText, ['Sisa pokok kredit', 'Sisa kredit', 'Sisa pokok leasing', 'Nilai leasing'])),
      remaining_tenor_months: parseInt(pick(rawText, ['Sisa tenor', 'Tenor tersisa'])),
      monthly_installment: parseMoney(pick(rawText, ['Cicilan per bulan', 'Cicilan bulanan', 'Angsuran bulanan'])),
      last_installment_payment_date: parseDate(pick(rawText, ['Tanggal bayar cicilan terakhir', 'Bayar cicilan terakhir'])),
      has_original_bpkb: parseBool(pick(rawText, ['BPKB asli ada?', 'BPKB asli ada'])),
      has_original_stnk: parseBool(pick(rawText, ['STNK asli ada?', 'STNK asli ada'])),
      has_own_name_sim: parseBool(pick(rawText, ['SIM atas nama sendiri?', 'SIM atas nama sendiri'])),
      requested_fund: parseMoney(pick(rawText, ['Estimasi dana yang dibutuhkan (Rp)', 'Dana yang dibutuhkan', 'Kebutuhan dana'])),
      fund_purpose: pick(rawText, ['Tujuan penggunaan dana', 'Tujuan dana']),
      planned_redeem_days: parseInt(pick(rawText, ['Rencana tebus dalam', 'Rencana tebus'])),
      redeem_source: pick(rawText, ['Sumber dana untuk tebus', 'Sumber tebus'])
    };
    data.tax_valid_until = parseDate(data.tax_valid_until_raw);
    return { data, warnings: buildWarnings(data) };
  }

  window.parseIntake = parseIntake;
  window.intakeParserUtils = { parseMoney, parseDate, parseBool };
})();
