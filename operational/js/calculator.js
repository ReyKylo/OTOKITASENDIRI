(function () {
  let lastResult = null;

  function ageFromYear(year) { return year ? new Date().getFullYear() - Number(year) : null; }
  function productDays(product) {
    if (product === 'JS Lunas 15H') return 15;
    if (product === 'JS Lunas 30H') return 30;
    if (product === 'Cicilan 3 Bulan') return 90;
    return 30;
  }
  function isCreditOwnership(status) {
    const value = String(status || '').toUpperCase();
    return value === 'KREDIT' || value === 'PEGADAIAN';
  }
  function boolLabel(value) { return value ? 'Ada / Ya' : 'Tidak'; }

  function calculate(data) {
    const settings = window.storage.getSettings();
    const warnings = [];
    const reasons = [];
    const marketPrice = Number(data.market_price || data.harga_pasar_motor || 0);
    const year = Number(data.motorcycle_year || 0);
    const age = ageFromYear(year);
    const product = data.product_type || 'JS Lunas 30H';
    const ownershipStatus = String(data.ownership_status || 'UNKNOWN').toUpperCase();
    const remainingCredit = Number(data.remaining_credit_principal || 0);

    if (!marketPrice) {
      return { ok:false, recommendation:'REJECT', reasons:['Harga pasar kosong, hitung diblok.'], warnings:['Harga pasar kosong → block hitung.'] };
    }
    if (!year) warnings.push('Tahun motor kosong, umur motor belum valid.');

    let ratio = settings.hjs_normal_ratio;
    if (age !== null && age >= 8 && age <= 9) {
      ratio = settings.hjs_konservatif_ratio;
      warnings.push('Motor 8–9 tahun → pakai rasio konservatif.');
    }
    if (age !== null && age > 10) {
      reasons.push('Motor >10 tahun, reject otomatis.');
      warnings.push('Motor >10 tahun → reject.');
    }
    if (ownershipStatus === 'LUNAS' && !data.has_original_bpkb) {
      warnings.push('LUNAS tapi BPKB asli tidak ada → red flag.');
      reasons.push('BPKB asli tidak ada untuk motor lunas.');
    }
    if (!data.has_original_stnk) {
      warnings.push('STNK tidak ada → red flag.');
      reasons.push('STNK asli tidak ada.');
    }
    if (!data.has_own_name_sim) warnings.push('SIM tidak ada → yellow warning.');

    const hjsGross = Math.round(marketPrice * ratio);
    let creditDeduction = 0;
    let principal = hjsGross;

    if (product !== 'Transaksi Jembatan' && isCreditOwnership(ownershipStatus)) {
      creditDeduction = remainingCredit;
      principal = hjsGross - creditDeduction;
      warnings.push(`Motor ${ownershipStatus}: sisa kredit dipotong dari plafon HJS.`);
      if (!remainingCredit) {
        warnings.push('Status kredit/pegadaian tapi sisa pokok kredit kosong → butuh review manual.');
        reasons.push('Sisa pokok kredit belum diisi.');
      }
      if (principal <= 0) {
        reasons.push('Sisa kredit lebih besar atau sama dengan HJS bruto, tidak ada plafon bersih untuk dicairkan.');
      }
    }

    let totalTebus = 0;
    let dueDate = window.ui.addDaysISO(productDays(product));
    let paymentSchedule = [];

    if (product === 'JS Lunas 15H') {
      totalTebus = Math.round(Math.max(principal, 0) * (1 + settings.fee_js_15));
      paymentSchedule = [{ date: dueDate, amount: totalTebus, status: 'Belum Bayar' }];
    } else if (product === 'JS Lunas 30H') {
      totalTebus = Math.round(Math.max(principal, 0) * (1 + settings.fee_js_30));
      paymentSchedule = [{ date: dueDate, amount: totalTebus, status: 'Belum Bayar' }];
    } else if (product === 'Cicilan 3 Bulan') {
      totalTebus = Math.round(Math.max(principal, 0) * (1 + settings.fee_cicilan));
      const monthly = Math.round(totalTebus / 3);
      paymentSchedule = [1, 2, 3].map((n) => ({ date: window.ui.addDaysISO(n * 30), amount: monthly, status: 'Belum Bayar' }));
      dueDate = paymentSchedule[2].date;
    } else if (product === 'Transaksi Jembatan') {
      creditDeduction = 0;
      principal = remainingCredit;
      if (!principal) reasons.push('Transaksi Jembatan butuh sisa pokok leasing.');
      totalTebus = Math.round(Math.max(principal, 0) * (1 + settings.margin_jembatan));
      paymentSchedule = [{ date: dueDate, amount: totalTebus, status: 'Belum Bayar' }];
    }

    if (Number(data.requested_fund || 0) > principal && product !== 'Transaksi Jembatan') {
      warnings.push('Dana diminta lebih besar dari plafon bersih yang bisa dicairkan.');
      reasons.push('Request customer melebihi plafon bersih.');
    }
    if (principal <= 0) reasons.push('Plafon/pokok bersih tidak valid.');

    let recommendation = 'APPROVE';
    if (age !== null && age > 10) recommendation = 'REJECT';
    else if (principal <= 0) recommendation = 'REJECT';
    else if (reasons.length || warnings.some((w) => w.includes('red flag'))) recommendation = 'REVIEW MANUAL';

    return {
      ok: true,
      recommendation,
      reasons: reasons.length ? [...new Set(reasons)] : ['Data utama cukup untuk lanjut proses.'],
      warnings: [...new Set(warnings)],
      market_price: marketPrice,
      motorcycle_age: age,
      ownership_status: ownershipStatus,
      remaining_credit_principal: remainingCredit,
      hjs_ratio_used: product === 'Transaksi Jembatan' ? null : ratio,
      hjs_gross: product === 'Transaksi Jembatan' ? null : hjsGross,
      credit_deduction: product === 'Transaksi Jembatan' ? 0 : creditDeduction,
      principal: Math.max(principal, 0),
      total_tebus: totalTebus,
      due_date: dueDate,
      payment_schedule: paymentSchedule,
      product_type: product
    };
  }

  function renderCustomerPrintSummary(data, result) {
    return `
      <section class="print-summary">
        <h3>Data Customer & Motor</h3>
        <div class="result-metric"><span>Nama Customer</span><strong>${window.ui.escapeHtml(data.customer_name || '-')}</strong></div>
        <div class="result-metric"><span>No HP</span><strong>${window.ui.escapeHtml(data.phone_number || '-')}</strong></div>
        <div class="result-metric"><span>Pekerjaan / Penghasilan</span><strong>${window.ui.escapeHtml(data.occupation || '-')} / ${window.ui.money(data.monthly_income || 0)}</strong></div>
        <div class="result-metric"><span>Motor</span><strong>${window.ui.escapeHtml(data.motorcycle_type || '-')} ${window.ui.escapeHtml(data.motorcycle_year || '')}</strong></div>
        <div class="result-metric"><span>Harga Pasar Motor</span><strong>${window.ui.money(result.market_price)}</strong></div>
        <div class="result-metric"><span>Status Kepemilikan</span><strong>${window.ui.escapeHtml(data.ownership_status || '-')}</strong></div>
        <div class="result-metric"><span>Leasing/Pegadaian</span><strong>${window.ui.escapeHtml(data.leasing_name || '-')}</strong></div>
        <div class="result-metric"><span>Sisa Pokok Kredit</span><strong>${window.ui.money(data.remaining_credit_principal || 0)}</strong></div>
        <div class="result-metric"><span>Sisa Tenor / Cicilan Bulanan</span><strong>${window.ui.escapeHtml(data.remaining_tenor_months || '-')} bulan / ${window.ui.money(data.monthly_installment || 0)}</strong></div>
        <div class="result-metric"><span>Dokumen</span><strong>BPKB: ${boolLabel(data.has_original_bpkb)} · STNK: ${boolLabel(data.has_original_stnk)} · SIM: ${boolLabel(data.has_own_name_sim)}</strong></div>
        <div class="result-metric"><span>Tujuan / Sumber Tebus</span><strong>${window.ui.escapeHtml(data.fund_purpose || '-')} / ${window.ui.escapeHtml(data.redeem_source || '-')}</strong></div>
      </section>`;
  }

  function renderResult(result) {
    const root = document.getElementById('resultCard');
    if (!root) return;
    if (!result.ok) {
      root.className = 'warning-list';
      root.innerHTML = result.warnings.map((w) => `<div class="warning-item red">${window.ui.escapeHtml(w)}</div>`).join('');
      return;
    }
    const data = collectCalculatorData();
    const recClass = result.recommendation === 'APPROVE' ? 'approve' : result.recommendation === 'REJECT' ? 'reject' : 'review';
    root.className = '';
    root.innerHTML = `
      <div class="print-report-title">
        <h3>Report Hitungan OTOKITA</h3>
        <small>Dicetak: ${window.ui.date(new Date().toISOString())}</small>
      </div>
      ${renderCustomerPrintSummary(data, result)}
      <h3>Hasil Perhitungan</h3>
      <div class="result-metric"><span>Produk</span><strong>${window.ui.escapeHtml(result.product_type)}</strong></div>
      <div class="result-metric"><span>Umur motor</span><strong>${result.motorcycle_age ?? '-'} tahun</strong></div>
      <div class="result-metric"><span>Rasio HJS</span><strong>${result.hjs_ratio_used === null ? '-' : Math.round(result.hjs_ratio_used * 100) + '%'}</strong></div>
      ${result.hjs_gross !== null ? `<div class="result-metric"><span>HJS Bruto</span><strong>${window.ui.money(result.hjs_gross)}</strong></div>` : ''}
      ${result.credit_deduction ? `<div class="result-metric danger-line"><span>Potong Sisa Kredit</span><strong>- ${window.ui.money(result.credit_deduction)}</strong></div>` : ''}
      <div class="result-metric"><span>Plafon Bersih / Pokok Cair</span><strong>${window.ui.money(result.principal)}</strong></div>
      <div class="result-metric"><span>Total Tebus</span><strong>${window.ui.money(result.total_tebus)}</strong></div>
      <div class="result-metric"><span>Due Date</span><strong>${window.ui.date(result.due_date)}</strong></div>
      <div class="recommendation ${recClass}">${result.recommendation}<br><small>${result.reasons.map(window.ui.escapeHtml).join(' · ')}</small></div>
      ${result.warnings.length ? `<div class="warning-list">${result.warnings.map(w => `<div class="warning-item ${w.includes('red flag') || w.includes('STNK') ? 'red' : ''}">${window.ui.escapeHtml(w)}</div>`).join('')}</div>` : ''}
      <h3>Jadwal Pembayaran</h3>
      <div>${result.payment_schedule.map(p => `<div class="result-metric"><span>${window.ui.date(p.date)}</span><strong>${window.ui.money(p.amount)}</strong></div>`).join('')}</div>`;
  }

  function collectCalculatorData() {
    const form = document.getElementById('calculatorForm');
    return window.ui.getFormData(form);
  }
  function leadFromForm() {
    const data = collectCalculatorData();
    return {
      customer_name: data.customer_name,
      phone_number: data.phone_number,
      occupation: data.occupation,
      monthly_income: data.monthly_income,
      motorcycle_type: data.motorcycle_type,
      motorcycle_year: data.motorcycle_year,
      bpkb_name: data.bpkb_name,
      tax_valid_until: data.tax_valid_until,
      ownership_status: data.ownership_status || 'UNKNOWN',
      leasing_info: data.leasing_name || null,
      leasing_name: data.leasing_name || null,
      remaining_credit_principal: data.remaining_credit_principal,
      remaining_tenor_months: data.remaining_tenor_months,
      monthly_installment: data.monthly_installment,
      last_installment_payment_date: data.last_installment_payment_date,
      has_original_bpkb: Boolean(data.has_original_bpkb),
      has_original_stnk: Boolean(data.has_original_stnk),
      has_own_name_sim: Boolean(data.has_own_name_sim),
      requested_fund: data.requested_fund,
      fund_purpose: data.fund_purpose,
      planned_redeem_days: data.planned_redeem_days,
      redeem_source: data.redeem_source,
      status: 'Baru',
      temperature: 'Warm',
      pic: 'Humam',
      notes: '',
      follow_up_date: window.storage.todayISO(),
      raw_intake: document.getElementById('rawIntake')?.value || '',
      sales_pic_id: data.sales_pic_id || null
    };
  }
  function dealFromResult(leadId = null) {
    const data = collectCalculatorData();
    if (!lastResult || !lastResult.ok) throw new Error('Hitung dulu sebelum save inventory.');
    return {
      lead_id: leadId,
      customer_name: data.customer_name,
      motorcycle_info: `${data.motorcycle_type || '-'} ${data.motorcycle_year || ''}`.trim(),
      product_type: lastResult.product_type,
      market_price: lastResult.market_price,
      hjs_ratio_used: lastResult.hjs_ratio_used,
      principal: lastResult.principal,
      total_tebus: lastResult.total_tebus,
      due_date: lastResult.due_date,
      payment_schedule: lastResult.payment_schedule,
      status: 'Aktif',
      documents_checklist: { bpkb: Boolean(data.has_original_bpkb), stnk: Boolean(data.has_original_stnk), sim: Boolean(data.has_own_name_sim) },
      payment_history: [],
      notes: [
        `Harga pasar: ${window.ui.money(lastResult.market_price)}`,
        lastResult.hjs_gross !== null ? `HJS bruto: ${window.ui.money(lastResult.hjs_gross)}` : null,
        lastResult.credit_deduction ? `Potong sisa kredit: ${window.ui.money(lastResult.credit_deduction)}` : null,
        ...lastResult.reasons
      ].filter(Boolean).join(' · '),
      approval_status: 'approved',
      approved_by: window.storage.getSettings().role,
      calculation_snapshot: lastResult,
      customer_snapshot: data,
      sales_pic_id: data.sales_pic_id || null,
      commission_calculated: false,
      commission_amount_snapshot: null,
      motor_sitaan_id: null
    };
  }
  function saveLead(showToast = true) {
    const payload = leadFromForm();
    if (!payload.customer_name) return window.ui.toast('Nama customer wajib diisi.');
    const id = window.storage.add('leads', payload);
    if (showToast) window.ui.toast('Lead tersimpan.');
    return id;
  }
  function saveInventory() {
    if (!lastResult) return window.ui.toast('Hitung dulu sebelum save inventory.');
    if (lastResult.recommendation === 'REJECT') return window.ui.toast('REJECT tidak bisa masuk Inventory.');
    const role = window.storage.getSettings().role;
    const payload = dealFromResult(null);
    if (!payload.sales_pic_id) return window.ui.toast('Sales PIC wajib diisi sebelum save ke Active Deal.');
    if (lastResult.recommendation === 'REVIEW MANUAL' && role !== 'Admin') {
      payload.approval_status = 'pending';
      window.storage.add('approvals', payload);
      window.ui.toast('Masuk Pending Approval. Admin perlu approve dulu.');
      return;
    }
    window.storage.add('deals', payload);
    window.ui.toast('Deal tersimpan ke Inventory.');
  }
  function showParseWarnings(warnings) {
    const root = document.getElementById('parseWarnings');
    if (!root) return;
    root.innerHTML = (warnings || []).map((w) => `<div class="warning-item ${w.includes('red flag') || w.includes('reject') ? 'red' : ''}">${window.ui.escapeHtml(w)}</div>`).join('');
  }
  function initSettingsPanel() {
    const s = window.storage.getSettings();
    const map = {
      settingLanguage: 'language', settingRole: 'role', settingHjsNormal: 'hjs_normal_ratio', settingHjsKonservatif: 'hjs_konservatif_ratio', settingFee15: 'fee_js_15', settingFee30: 'fee_js_30', settingFeeCicilan: 'fee_cicilan', settingMarginJembatan: 'margin_jembatan'
    };
    Object.entries(map).forEach(([id, key]) => { const el = document.getElementById(id); if (el) el.value = s[key]; });
    const role = s.role;
    const ratioInputs = ['settingHjsNormal','settingHjsKonservatif','settingFee15','settingFee30','settingFeeCicilan','settingMarginJembatan'];
    ratioInputs.forEach((id) => { const el = document.getElementById(id); if (el) el.disabled = role !== 'Admin'; });
    document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
      const changes = {};
      Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        changes[key] = el.type === 'number' ? Number(el.value) : el.value;
      });
      window.storage.saveSettings(changes);
      await window.i18n.setLanguage(changes.language);
      window.appRefreshShell?.();
      initSettingsPanel();
      window.ui.toast('Settings tersimpan.');
      if (changes.role === 'Marketing') window.appApplyRoleGate?.();
    });
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => window.ui.download(`otokita-backup-${Date.now()}.json`, window.storage.exportAll()));
    document.getElementById('importJsonInput')?.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const text = await file.text();
      try { window.storage.importAll(text); window.ui.toast('Import sukses. Reload data...'); location.reload(); }
      catch (err) { window.ui.toast(err.message); }
    });
    document.getElementById('resetAllBtn')?.addEventListener('click', () => {
      if (!confirm('Reset semua data localStorage?')) return;
      if (!confirm('Yakin banget? Export JSON dulu kalau perlu backup.')) return;
      window.storage.clearAll();
      window.ui.toast('Data direset ke seed awal.');
      location.reload();
    });
  }
  function initCalculatorPage() {
    const role = window.storage.getSettings().role;
    if (role === 'Marketing') {
      document.getElementById('calculatorLocked')?.classList.remove('hidden');
      document.getElementById('calculatorContent')?.classList.add('hidden');
      return;
    }
    initSettingsPanel();
    window.ui.populateSalesPicSelects();
    const form = document.getElementById('calculatorForm');
    document.getElementById('parseBtn')?.addEventListener('click', () => {
      try {
        const raw = document.getElementById('rawIntake').value;
        const result = window.parseIntake(raw);
        window.ui.setFormData(form, result.data);
        showParseWarnings(result.warnings);
        window.ui.toast('Parse selesai. Form sudah diisi otomatis.');
      } catch (err) {
        showParseWarnings(['Parse gagal: ' + err.message]);
      }
    });
    document.getElementById('calculateBtn')?.addEventListener('click', () => {
      lastResult = calculate(collectCalculatorData());
      renderResult(lastResult);
      const saveBtn = document.getElementById('saveInventoryBtn');
      if (saveBtn) saveBtn.disabled = lastResult.recommendation === 'REJECT';
    });
    document.getElementById('saveLeadBtn')?.addEventListener('click', () => saveLead(true));
    document.getElementById('saveLeadPrintBtn')?.addEventListener('click', () => {
      lastResult = calculate(collectCalculatorData());
      renderResult(lastResult);
      saveLead(true);
      setTimeout(() => window.print(), 120);
    });
    document.getElementById('saveInventoryBtn')?.addEventListener('click', saveInventory);
    document.getElementById('clearCalcForm')?.addEventListener('click', () => { form.reset(); lastResult = null; document.getElementById('resultCard').innerHTML = window.i18n.t('result_empty'); });
    document.getElementById('manualLeadTop')?.addEventListener('click', () => { form.scrollIntoView({ behavior:'smooth' }); document.querySelector('[data-field="customer_name"]')?.focus(); });
  }

  window.calculator = { calculate, renderResult, collectCalculatorData, leadFromForm, dealFromResult };
  window.pageInit = initCalculatorPage;
})();
