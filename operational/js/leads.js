(function () {
  let state = { sortKey: 'created_at', sortDir: 'desc' };
  function filteredLeads() {
    const q = document.getElementById('leadSearch')?.value.toLowerCase() || '';
    const status = document.getElementById('leadStatusFilter')?.value || '';
    const temp = document.getElementById('leadTempFilter')?.value || '';
    const from = document.getElementById('leadDateFrom')?.value || '';
    const to = document.getElementById('leadDateTo')?.value || '';
    const salesPic = document.getElementById('leadSalesPicFilter')?.value || '';
    return window.storage.list('leads').filter((l) => {
      const text = `${l.customer_name || ''} ${l.phone_number || ''}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (status && l.status !== status) return false;
      if (temp && l.temperature !== temp) return false;
      if (salesPic && l.sales_pic_id !== salesPic) return false;
      if (from && String(l.created_at) < from) return false;
      if (to && String(l.created_at) > to) return false;
      return true;
    }).sort((a,b) => {
      const av = a[state.sortKey] ?? '';
      const bv = b[state.sortKey] ?? '';
      return state.sortDir === 'asc' ? String(av).localeCompare(String(bv), undefined, {numeric:true}) : String(bv).localeCompare(String(av), undefined, {numeric:true});
    });
  }
  function render() {
    const tbody = document.querySelector('#leadsTable tbody');
    const rows = filteredLeads();
    tbody.innerHTML = rows.length ? rows.map((l) => `
      <tr data-id="${l.id}">
        <td><input class="lead-check" type="checkbox" value="${l.id}" /></td>
        <td>${window.ui.date(l.created_at)}</td>
        <td><strong>${window.ui.escapeHtml(l.customer_name)}</strong></td>
        <td>${window.ui.escapeHtml(l.phone_number || '-')}</td>
        <td>${window.ui.escapeHtml(l.motorcycle_type || '-')} ${window.ui.escapeHtml(l.motorcycle_year || '')}</td>
        <td>${window.ui.money(l.requested_fund)}</td>
        <td>${window.ui.statusPill(l.status)}</td>
        <td>${window.ui.statusPill(l.temperature)}</td>
        <td>${window.ui.escapeHtml(l.pic || '-')}</td>
        <td>${window.ui.escapeHtml(window.ui.employeeName(l.sales_pic_id))}</td>
        <td>${window.ui.date(l.follow_up_date)}</td>
        <td><div class="table-actions"><button class="icon-btn row-edit" data-edit="${l.id}">Edit</button><button class="icon-btn row-delete" data-delete="${l.id}">🗑</button></div></td>
      </tr>`).join('') : `<tr><td colspan="12">${window.ui.empty('Belum ada lead.')}</td></tr>`;
    window.ui.bindRowClicks(tbody, openLeadModal);
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openLeadModal(btn.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteLead(btn.dataset.delete)));
  }
  function leadForm(lead = {}) {
    return `<form id="leadModalForm" class="form-grid">
      ${window.ui.field('Nama Customer','customer_name',lead.customer_name)}
      ${window.ui.field('No HP','phone_number',lead.phone_number)}
      ${window.ui.field('Pekerjaan','occupation',lead.occupation)}
      ${window.ui.field('Penghasilan Bulanan','monthly_income',lead.monthly_income,'number')}
      ${window.ui.field('Motor','motorcycle_type',lead.motorcycle_type)}
      ${window.ui.field('Tahun Motor','motorcycle_year',lead.motorcycle_year,'number')}
      ${window.ui.field('Dana Diminta','requested_fund',lead.requested_fund,'number')}
      ${window.ui.field('Status','status',lead.status || 'Baru','select',['Baru','Follow-up','Deal','Tidak Jadi'])}
      ${window.ui.field('Temperature','temperature',lead.temperature || 'Warm','select',['Hot','Warm','Cold'])}
      ${window.ui.field('PIC','pic',lead.pic || 'Humam')}
      ${window.ui.salesPicField('Sales PIC / 销售负责人', lead.sales_pic_id, false)}
      ${window.ui.field('Follow-up Date','follow_up_date',lead.follow_up_date,'date')}
      ${window.ui.field('Ownership','ownership_status',lead.ownership_status || 'UNKNOWN','select',['LUNAS','KREDIT','PEGADAIAN','UNKNOWN'])}
      ${window.ui.field('BPKB asli','has_original_bpkb',lead.has_original_bpkb,'checkbox')}
      ${window.ui.field('STNK asli','has_original_stnk',lead.has_original_stnk,'checkbox')}
      ${window.ui.field('SIM sendiri','has_own_name_sim',lead.has_own_name_sim,'checkbox')}
      ${window.ui.textareaField('Catatan','notes',lead.notes)}
    </form>`;
  }
  function openLeadModal(id) {
    const readonly = window.storage.getSettings().role === 'Marketing';
    const lead = id ? window.storage.get('leads', id) : {};
    const title = id ? `Detail Lead — ${lead.customer_name}` : 'Tambah Lead';
    const footer = readonly ? '<button class="btn primary" data-close="1">Close</button>' : `<button class="btn" data-close="1">Cancel</button><button class="btn primary" id="saveLeadModal">Save</button>${lead.status === 'Deal' ? '<button class="btn accent" id="convertLeadModal">Convert to Inventory</button>' : ''}`;
    const modal = window.ui.modal({ title, body: leadForm(lead), footer });
    if (readonly) modal.node.querySelectorAll('input,select,textarea').forEach((el) => el.disabled = true);
    modal.node.querySelector('#saveLeadModal')?.addEventListener('click', () => {
      const data = window.ui.getFormData(modal.node.querySelector('#leadModalForm'));
      if (!data.customer_name) return window.ui.toast('Nama customer wajib diisi.');
      if (id) window.storage.update('leads', id, data); else window.storage.add('leads', data);
      modal.close(); render(); window.ui.toast('Lead tersimpan.');
    });
    modal.node.querySelector('#convertLeadModal')?.addEventListener('click', () => convertToInventory(lead.id, modal));
  }
  function deleteLead(id) {
    if (!window.ui.confirmDelete('Yakin hapus lead ini?')) return;
    window.storage.remove('leads', id); render(); window.ui.toast('Lead dihapus.');
  }
  function convertToInventory(leadId, modal) {
    const lead = window.storage.get('leads', leadId);
    if (!lead) return;
    if (!lead.sales_pic_id) return window.ui.toast('Sales PIC wajib diisi sebelum Convert to Inventory.');
    const principal = Number(lead.requested_fund || 0);
    const product = Number(lead.planned_redeem_days || 30) <= 15 ? 'JS Lunas 15H' : 'JS Lunas 30H';
    const fee = product === 'JS Lunas 15H' ? window.storage.getSettings().fee_js_15 : window.storage.getSettings().fee_js_30;
    const total = Math.round(principal * (1 + fee));
    const dueDays = product === 'JS Lunas 15H' ? 15 : 30;
    window.storage.add('deals', {
      lead_id: lead.id,
      customer_name: lead.customer_name,
      motorcycle_info: `${lead.motorcycle_type || '-'} ${lead.motorcycle_year || ''}`.trim(),
      product_type: product,
      market_price: null,
      hjs_ratio_used: null,
      principal,
      total_tebus: total,
      due_date: window.ui.addDaysISO(dueDays),
      payment_schedule: [{ date: window.ui.addDaysISO(dueDays), amount: total, status:'Belum Bayar' }],
      status: 'Aktif',
      documents_checklist: { bpkb: Boolean(lead.has_original_bpkb), stnk: Boolean(lead.has_original_stnk), sim: Boolean(lead.has_own_name_sim) },
      payment_history: [],
      notes: lead.notes || '',
      approval_status: 'approved',
      approved_by: window.storage.getSettings().role,
      sales_pic_id: lead.sales_pic_id || null,
      commission_calculated: false,
      commission_amount_snapshot: null,
      motor_sitaan_id: null
    });
    modal.close(); window.ui.toast('Lead sudah convert ke Inventory.');
  }
  function bindFilters() {
    ['leadSearch','leadStatusFilter','leadTempFilter','leadDateFrom','leadDateTo','leadSalesPicFilter'].forEach((id) => document.getElementById(id)?.addEventListener('input', render));
    document.getElementById('resetLeadFilters')?.addEventListener('click', () => { ['leadSearch','leadStatusFilter','leadTempFilter','leadDateFrom','leadDateTo','leadSalesPicFilter'].forEach((id) => document.getElementById(id).value = ''); render(); });
    document.querySelectorAll('#leadsTable th[data-sort]').forEach((th) => th.addEventListener('click', () => { const key = th.dataset.sort; state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc'; state.sortKey = key; render(); }));
    document.getElementById('selectAllLeads')?.addEventListener('change', (e) => document.querySelectorAll('.lead-check').forEach((c) => c.checked = e.target.checked));
    document.getElementById('bulkDeleteLeads')?.addEventListener('click', () => { const ids = window.ui.getCheckedIds('.lead-check'); if (!ids.length) return window.ui.toast('Pilih lead dulu.'); if (!confirm(`Hapus ${ids.length} lead?`)) return; const count = window.storage.bulkRemove('leads', ids); render(); window.ui.toast(`${count} lead dihapus.`); });
    document.getElementById('addLeadBtn')?.addEventListener('click', () => openLeadModal(null));
  }
  function initLeadsPage() { window.ui.populateSalesPicSelects(); bindFilters(); render(); }
  window.pageInit = initLeadsPage;
})();
