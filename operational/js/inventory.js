(function () {
  let state = { sortKey: 'due_date', sortDir: 'asc' };
  function filteredDeals() {
    const q = document.getElementById('dealSearch')?.value.toLowerCase() || '';
    const status = document.getElementById('dealStatusFilter')?.value || '';
    const product = document.getElementById('dealProductFilter')?.value || '';
    const alert = document.getElementById('dealAlertFilter')?.value || '';
    const salesPic = document.getElementById('dealSalesPicFilter')?.value || '';
    return window.storage.list('deals').filter((d) => {
      if (q && !String(d.customer_name || '').toLowerCase().includes(q)) return false;
      if (status && d.status !== status) return false;
      if (product && d.product_type !== product) return false;
      if (alert && window.ui.alertLevel(d.due_date, d.status) !== alert) return false;
      if (salesPic && d.sales_pic_id !== salesPic) return false;
      return true;
    }).sort((a,b) => {
      const av = a[state.sortKey] ?? '';
      const bv = b[state.sortKey] ?? '';
      return state.sortDir === 'asc' ? String(av).localeCompare(String(bv), undefined, {numeric:true}) : String(bv).localeCompare(String(av), undefined, {numeric:true});
    });
  }
  function render() {
    const tbody = document.querySelector('#dealsTable tbody');
    const rows = filteredDeals();
    tbody.innerHTML = rows.length ? rows.map((d) => {
      const level = window.ui.alertLevel(d.due_date, d.status);
      return `<tr data-id="${d.id}">
        <td><input class="deal-check" type="checkbox" value="${d.id}" /></td>
        <td>${window.ui.date(d.created_at)}</td>
        <td><strong>${window.ui.escapeHtml(d.customer_name)}</strong></td>
        <td>${window.ui.escapeHtml(d.motorcycle_info || '-')}</td>
        <td>${window.ui.escapeHtml(d.product_type || '-')}</td>
        <td>${window.ui.money(d.principal)}</td>
        <td>${window.ui.money(d.total_tebus)}</td>
        <td>${window.ui.escapeHtml(window.ui.employeeName(d.sales_pic_id))}</td>
        <td>${window.ui.date(d.due_date)}</td>
        <td>${window.ui.statusPill(d.status)}</td>
        <td>${window.ui.alertPill(level)}</td>
        <td>${window.ui.commissionStatusBadge(d)}</td>
        <td><div class="table-actions"><button class="icon-btn row-edit" data-edit="${d.id}">Edit</button><button class="icon-btn row-delete" data-delete="${d.id}">🗑</button></div></td>
      </tr>`;
    }).join('') : `<tr><td colspan="13">${window.ui.empty('Belum ada deal.')}</td></tr>`;
    window.ui.bindRowClicks(tbody, openDealModal);
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openDealModal(btn.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteDeal(btn.dataset.delete)));
  }
  function scheduleHtml(schedule) {
    const list = Array.isArray(schedule) ? schedule : [];
    return list.length ? list.map((p, idx) => `<div class="result-metric"><span>Termin ${idx + 1} · ${window.ui.date(p.date)}</span><strong>${window.ui.money(p.amount)} · ${window.ui.escapeHtml(p.status || '-')}</strong></div>`).join('') : window.ui.empty('Belum ada jadwal pembayaran.');
  }
  function paymentHistoryHtml(history) {
    const list = Array.isArray(history) ? history : [];
    return list.length ? list.map((p) => `<div class="result-metric"><span>${window.ui.date(p.date)}</span><strong>${window.ui.money(p.amount)} · ${window.ui.escapeHtml(p.note || '')}</strong></div>`).join('') : window.ui.empty('Belum ada riwayat pembayaran.');
  }
  function dealForm(deal = {}) {
    return `<form id="dealModalForm" class="form-grid">
      ${window.ui.field('Nama Customer','customer_name',deal.customer_name)}
      ${window.ui.field('Motor','motorcycle_info',deal.motorcycle_info)}
      ${window.ui.field('Produk','product_type',deal.product_type || 'JS Lunas 30H','select',['JS Lunas 15H','JS Lunas 30H','Cicilan 3 Bulan','Transaksi Jembatan'])}
      ${window.ui.salesPicField('Sales PIC / 销售负责人', deal.sales_pic_id, true)}
      ${window.ui.field('Harga Pasar','market_price',deal.market_price,'number')}
      ${window.ui.field('Rasio HJS','hjs_ratio_used',deal.hjs_ratio_used,'number')}
      ${window.ui.field('Pokok','principal',deal.principal,'number')}
      ${window.ui.field('Total Tebus','total_tebus',deal.total_tebus,'number')}
      ${window.ui.field('Due Date','due_date',deal.due_date,'date')}
      ${window.ui.field('Status','status',deal.status || 'Aktif','select',['Aktif','Ditebus','Hangus','Ditolak'])}
      ${window.ui.field('BPKB asli','doc_bpkb',deal.documents_checklist?.bpkb,'checkbox')}
      ${window.ui.field('STNK asli','doc_stnk',deal.documents_checklist?.stnk,'checkbox')}
      ${window.ui.field('SIM sendiri','doc_sim',deal.documents_checklist?.sim,'checkbox')}
      ${window.ui.textareaField('Catatan','notes',deal.notes)}
    </form>
    <h3>Jadwal Pembayaran</h3><div>${scheduleHtml(deal.payment_schedule)}</div>
    <h3>Riwayat Pembayaran</h3><div>${paymentHistoryHtml(deal.payment_history)}</div>`;
  }
  function readModalData(modal) {
    const raw = window.ui.getFormData(modal.node.querySelector('#dealModalForm'));
    return {
      customer_name: raw.customer_name,
      motorcycle_info: raw.motorcycle_info,
      product_type: raw.product_type,
      market_price: raw.market_price,
      hjs_ratio_used: raw.hjs_ratio_used,
      principal: raw.principal,
      total_tebus: raw.total_tebus,
      due_date: raw.due_date,
      status: raw.status,
      sales_pic_id: raw.sales_pic_id || null,
      documents_checklist: { bpkb: Boolean(raw.doc_bpkb), stnk: Boolean(raw.doc_stnk), sim: Boolean(raw.doc_sim) },
      notes: raw.notes,
      payment_schedule: [{ date: raw.due_date, amount: raw.total_tebus, status: raw.status === 'Ditebus' ? 'Lunas' : 'Belum Bayar' }]
    };
  }
  function openDealModal(id) {
    const readonly = window.storage.getSettings().role === 'Marketing';
    const deal = id ? window.storage.get('deals', id) : { payment_schedule: [], payment_history: [], documents_checklist: {} };
    const title = id ? `Detail Deal — ${deal.customer_name}` : 'Tambah Deal';
    const actionButtons = id ? '<button class="btn" id="markDitebus">Mark Ditebus</button><button class="btn danger" id="markHangus">Mark Hangus</button><button class="btn" id="updateSchedule">Update Jadwal</button><button class="btn danger" id="deleteDealModal">Delete</button>' : '';
    const footer = readonly ? '<button class="btn primary" data-close="1">Close</button>' : `<button class="btn" data-close="1">Cancel</button>${actionButtons}<button class="btn primary" id="saveDealModal">Save</button>`;
    const modal = window.ui.modal({ title, body: dealForm(deal), footer });
    if (readonly) modal.node.querySelectorAll('input,select,textarea').forEach((el) => el.disabled = true);
    modal.node.querySelector('#saveDealModal')?.addEventListener('click', () => {
      const data = readModalData(modal);
      if (!data.customer_name) return window.ui.toast('Nama customer wajib diisi.');
      if (['Aktif','Ditebus','Hangus'].includes(data.status) && !data.sales_pic_id) return window.ui.toast('Sales PIC wajib diisi sebelum status Aktif/Ditebus/Hangus.');
      const oldStatus = deal.status;
      if (id && oldStatus !== data.status && ['Ditebus','Hangus'].includes(data.status)) {
        const msg = data.status === 'Ditebus'
          ? 'Pas Ditebus, komisi akan auto-generate di Financial module. Pastikan Sales PIC sudah benar.'
          : 'Status Hangus: motor akan masuk inventory sitaan di Financial. Komisi sales dihitung dari margin penjualan motor nanti. Lanjut?';
        if (!confirm(msg)) return;
      }
      const defaults = { lead_id:null, payment_history:[], approval_status:'approved', approved_by:window.storage.getSettings().role, commission_calculated:false, commission_amount_snapshot:null, motor_sitaan_id:null };
      if (id) window.storage.update('deals', id, data); else window.storage.add('deals', Object.assign(defaults, data));
      modal.close(); render(); window.ui.toast('Deal tersimpan.');
    });
    modal.node.querySelector('#markDitebus')?.addEventListener('click', () => { if (!deal.sales_pic_id) return window.ui.toast('Sales PIC wajib diisi sebelum mark as Ditebus.'); if (!confirm('Pas Ditebus, komisi akan auto-generate di Financial module. Pastikan Sales PIC sudah benar.')) return; window.storage.update('deals', id, { status:'Ditebus', payment_history:[...(deal.payment_history || []), { date:window.storage.todayISO(), amount:deal.total_tebus, note:'Marked ditebus' }] }); modal.close(); render(); });
    modal.node.querySelector('#markHangus')?.addEventListener('click', () => { if (!deal.sales_pic_id) return window.ui.toast('Sales PIC wajib diisi sebelum mark as Hangus.'); if (!confirm('Motor akan masuk inventory sitaan di Financial. Komisi sales akan dihitung dari margin penjualan motor nanti.')) return; window.storage.update('deals', id, { status:'Hangus' }); modal.close(); render(); });
    modal.node.querySelector('#updateSchedule')?.addEventListener('click', () => { const data = readModalData(modal); window.storage.update('deals', id, { due_date:data.due_date, payment_schedule:data.payment_schedule }); modal.close(); render(); window.ui.toast('Jadwal diupdate.'); });
    modal.node.querySelector('#deleteDealModal')?.addEventListener('click', () => { if (!confirm('Hapus deal ini?')) return; window.storage.remove('deals', id); modal.close(); render(); });
  }
  function deleteDeal(id) {
    if (!window.ui.confirmDelete('Yakin hapus deal ini?')) return;
    window.storage.remove('deals', id); render(); window.ui.toast('Deal dihapus.');
  }
  function bindFilters() {
    ['dealSearch','dealStatusFilter','dealProductFilter','dealAlertFilter','dealSalesPicFilter'].forEach((id) => document.getElementById(id)?.addEventListener('input', render));
    document.getElementById('resetDealFilters')?.addEventListener('click', () => { ['dealSearch','dealStatusFilter','dealProductFilter','dealAlertFilter','dealSalesPicFilter'].forEach((id) => document.getElementById(id).value = ''); render(); });
    document.querySelectorAll('#dealsTable th[data-sort]').forEach((th) => th.addEventListener('click', () => { const key = th.dataset.sort; state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc'; state.sortKey = key; render(); }));
    document.getElementById('selectAllDeals')?.addEventListener('change', (e) => document.querySelectorAll('.deal-check').forEach((c) => c.checked = e.target.checked));
    document.getElementById('bulkDeleteDeals')?.addEventListener('click', () => { const ids = window.ui.getCheckedIds('.deal-check'); if (!ids.length) return window.ui.toast('Pilih deal dulu.'); if (!confirm(`Hapus ${ids.length} deal?`)) return; const count = window.storage.bulkRemove('deals', ids); render(); window.ui.toast(`${count} deal dihapus.`); });
    document.getElementById('addDealBtn')?.addEventListener('click', () => openDealModal(null));
  }
  function initInventoryPage() { window.ui.populateSalesPicSelects(); const params = new URLSearchParams(location.search); const sales = params.get('sales_pic_id'); if (sales && document.getElementById('dealSalesPicFilter')) document.getElementById('dealSalesPicFilter').value = sales; bindFilters(); render(); }
  window.pageInit = initInventoryPage;
})();
