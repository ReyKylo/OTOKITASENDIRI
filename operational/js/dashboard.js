(function () {
  function thisMonth(dateStr) {
    if (!dateStr) return false;
    const now = new Date();
    return String(dateStr).startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
  function countBy(arr, key) {
    return arr.reduce((acc, item) => { const k = item[key] || '-'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  }
  function sum(arr, fn) { return arr.reduce((acc, item) => acc + Number(fn(item) || 0), 0); }
  function renderKpis() {
    const leads = window.storage.list('leads');
    const deals = window.storage.list('deals');
    const activeDeals = deals.filter((d) => d.status === 'Aktif');
    const red = activeDeals.filter((d) => window.ui.alertLevel(d.due_date, d.status) === 'red').length;
    const yellow = activeDeals.filter((d) => window.ui.alertLevel(d.due_date, d.status) === 'yellow').length;
    const totalTebusMonth = sum(activeDeals.filter((d) => thisMonth(d.due_date)), (d) => d.total_tebus);
    const cards = [
      [window.i18n?.t?.('suite_dashboard.total_leads','Total Leads') || 'Total Leads', leads.filter((l) => thisMonth(l.created_at)).length],
      [window.i18n?.t?.('suite_dashboard.active_deals','Deals Aktif') || 'Deals Aktif', activeDeals.length],
      [window.i18n?.t?.('suite_dashboard.revenue','Tebus Bulan Ini') || 'Tebus Bulan Ini', window.ui.money(totalTebusMonth)],
      [window.i18n?.t?.('suite_dashboard.due_alerts','Alert Merah') || 'Alert Merah', red],
      ['Yellow Alert', yellow]
    ];
    document.getElementById('kpiGrid').innerHTML = cards.map(([label, value]) => `<div class="kpi-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
  }
  function renderCharts() {
    if (!window.Chart) return;
    const leadCounts = countBy(window.storage.list('leads'), 'status');
    const dealCounts = countBy(window.storage.list('deals').filter((d) => d.status === 'Aktif'), 'product_type');
    const leadCtx = document.getElementById('leadsStatusChart');
    const dealCtx = document.getElementById('dealsProductChart');
    if (leadCtx) new Chart(leadCtx, { type:'doughnut', data:{ labels:Object.keys(leadCounts), datasets:[{ data:Object.values(leadCounts) }] }, options:{ plugins:{ legend:{ position:'bottom' } } } });
    if (dealCtx) new Chart(dealCtx, { type:'bar', data:{ labels:Object.keys(dealCounts), datasets:[{ label:'Deals', data:Object.values(dealCounts) }] }, options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
  }

  function dealRedeemedDate(deal) {
    const paid = (deal.payment_history || []).find((p) => String(p.note || '').toLowerCase().includes('ditebus') || String(p.note || '').toLowerCase().includes('redeem'));
    return paid?.date || deal.redeemed_at || deal.due_date || deal.created_at;
  }
  function renderTopSales() {
    const root = document.getElementById('topSalesMonth');
    if (!root) return;
    const rows = Object.values(window.storage.list('deals').filter((d) => d.status === 'Ditebus' && thisMonth(dealRedeemedDate(d))).reduce((acc, deal) => {
      const id = deal.sales_pic_id || 'unknown';
      if (!acc[id]) acc[id] = { id, name: window.ui.employeeName(id), count: 0, fee: 0 };
      acc[id].count += 1;
      acc[id].fee += Math.max(Number(deal.total_tebus || 0) - Number(deal.principal || 0), 0);
      return acc;
    }, {})).sort((a,b) => b.count - a.count || b.fee - a.fee).slice(0, 3);
    root.innerHTML = rows.length ? rows.map((row, idx) => `<a class="list-item" href="inventory.html?sales_pic_id=${encodeURIComponent(row.id)}"><strong>#${idx + 1} ${window.ui.escapeHtml(row.name)}</strong><small>${row.count} deal ditebus · Fee ${window.ui.money(row.fee)}</small></a>`).join('') : window.ui.empty(window.i18n?.t?.('suite_dashboard.empty','Belum ada deal ditebus bulan ini.') || 'Belum ada deal ditebus bulan ini.');
  }


  function renderEmployeeKPISection() {
    const root = document.getElementById('salesKpiCards');
    if (!root || !window.EmployeeKPIEngine) return;
    const session = window.auth?.getSession?.() || { role: 'admin' };
    const kpis = window.EmployeeKPIEngine.getVisibleKPIs(session).filter((k) => k.kpi_scope === 'employee' || k.assigned_to_employee_id);
    root.innerHTML = kpis.length ? kpis.map((kpi) => {
      const ach = window.EmployeeKPIEngine.computeAchievement(kpi);
      const empName = window.ui.employeeName(kpi.assigned_to_employee_id);
      const deals = window.storage.list('deals').filter((d) => d.sales_pic_id === kpi.assigned_to_employee_id);
      const avg = deals.length ? deals.reduce((a,d)=>a+Number(d.principal||0),0)/deals.length : 0;
      const leads = window.storage.list('leads').filter((l) => l.sales_pic_id === kpi.assigned_to_employee_id).length;
      const conv = leads ? deals.length / leads * 100 : 0;
      return `<article class="card kpi-card"><div class="card-head"><div><h2>${window.ui.escapeHtml(empName)}</h2><small>${window.ui.escapeHtml(window.ui.titleFor(kpi))}</small></div>${window.ui.pill(ach.status, ach.color)}</div><strong class="big-metric">${window.ui.fmt(ach.achieved_value,kpi.unit)}</strong><p>${window.i18n?.t?.('shared.min','Min') || 'Min'} ${window.ui.fmt(ach.min_target,kpi.unit)} - ${window.i18n?.t?.('shared.max','Max') || 'Max'} ${window.ui.fmt(ach.max_target,kpi.unit)}</p>${window.ui.gauge(ach.achieved_value,ach.min_target,ach.max_target)}<div class="list-item"><small>${window.i18n?.t?.('kpi_employee.total_deal','Total Deal') || 'Total Deal'}: ${deals.length} · ${window.i18n?.t?.('kpi_employee.avg_deal_size','Avg') || 'Avg'}: ${window.ui.money(avg)} · ${window.i18n?.t?.('kpi_employee.conversion_rate','Conversion') || 'Conversion'}: ${window.ui.pct(conv)}</small></div><a class="btn small" href="../management/kpi.html#employee-kpi">View Detail</a></article>`;
    }).join('') : window.ui.empty(window.i18n?.t?.('suite_dashboard.empty','Belum ada KPI sales yang visible.') || 'Belum ada KPI sales yang visible.');
  }

  function renderFollowup() {
    const today = window.storage.todayISO();
    const rows = window.storage.list('leads', (l) => l.follow_up_date === today);
    const root = document.getElementById('followupToday');
    root.innerHTML = rows.length ? rows.map((l) => `<div class="list-item"><strong>${window.ui.escapeHtml(l.customer_name)}</strong><small>${window.ui.escapeHtml(l.phone_number || '-')} · ${window.ui.escapeHtml(l.motorcycle_type || '-')} · ${window.ui.statusPill(l.temperature)}</small></div>`).join('') : window.ui.empty(window.i18n?.t?.('suite_dashboard.empty','Belum ada follow-up hari ini.') || 'Belum ada follow-up hari ini.');
  }
  function renderPending() {
    const root = document.getElementById('pendingApprovals');
    if (!root) return;
    const settings = window.storage.getSettings();
    if (settings.role !== 'Admin') { root.closest('.card')?.classList.add('hidden'); return; }
    const rows = window.storage.list('approvals');
    root.innerHTML = rows.length ? rows.map((d) => `<div class="list-item"><strong>${window.ui.escapeHtml(d.customer_name)}</strong><small>${window.ui.escapeHtml(d.product_type)} · ${window.ui.money(d.principal)} · ${window.ui.escapeHtml(d.notes || '')}</small><div class="action-row"><button class="btn primary small" data-approve="${d.id}">Approve</button><button class="btn danger small" data-reject="${d.id}">Reject</button></div></div>`).join('') : window.ui.empty(window.i18n?.t?.('suite_dashboard.empty','Tidak ada pending approval.') || 'Tidak ada pending approval.');
    root.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => {
      const item = window.storage.get('approvals', btn.dataset.approve);
      if (!item) return;
      item.approval_status = 'approved';
      item.approved_by = 'Admin';
      window.storage.add('deals', item);
      window.storage.remove('approvals', item.id);
      window.ui.toast('Approval disetujui, masuk Inventory.');
      initDashboardPage();
    }));
    root.querySelectorAll('[data-reject]').forEach((btn) => btn.addEventListener('click', () => {
      if (!confirm('Reject pending deal ini?')) return;
      window.storage.remove('approvals', btn.dataset.reject);
      window.ui.toast('Pending deal ditolak.');
      initDashboardPage();
    }));
  }
  function renderAlerts() {
    const rows = window.storage.list('deals').filter((d) => d.status === 'Aktif' && window.ui.daysUntil(d.due_date) <= 7).sort((a,b) => String(a.due_date).localeCompare(String(b.due_date)));
    const root = document.getElementById('alertDeals');
    root.innerHTML = rows.length ? rows.map((d) => {
      const level = window.ui.alertLevel(d.due_date, d.status);
      return `<div class="list-item"><strong>${window.ui.escapeHtml(d.customer_name)} ${window.ui.alertPill(level)}</strong><small>${window.ui.escapeHtml(d.motorcycle_info)} · Due ${window.ui.date(d.due_date)} · ${window.ui.money(d.total_tebus)}</small></div>`;
    }).join('') : window.ui.empty(window.i18n?.t?.('suite_dashboard.empty','Belum ada deal jatuh tempo ≤7 hari.') || 'Belum ada deal jatuh tempo ≤7 hari.');
  }
  function initDashboardPage() { renderKpis(); renderEmployeeKPISection(); renderTopSales(); renderFollowup(); renderPending(); renderAlerts(); renderCharts(); }
  window.pageInit = initDashboardPage;
})();
