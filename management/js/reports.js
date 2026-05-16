(function(){
  'use strict';

  const LS = {
    leads: 'otokita.leads', deals: 'otokita.deals', journal: 'otokita.journal', coa: 'otokita.coa',
    commissions: 'otokita.commissions', wages: 'otokita.wages', motorSitaan: 'otokita.motor_sitaan',
    videos: 'otokita.mkt_videos', campaigns: 'otokita.mkt_campaigns', posters: 'otokita.mkt_poster_batches',
    partners: 'otokita.mkt_partners', assets: 'otokita.mkt_assets', okrs: 'otokita.okrs', krs: 'otokita.krs',
    kpis: 'otokita.kpis', tasks: 'otokita.tasks', taskCompletions: 'otokita.task_completions',
    employees: 'otokita.employees', notes: 'otokita.management_report_notes'
  };

  function read(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function arr(key){ return read(key, []); }
  function obj(key){ return read(key, {}); }
  function esc(v){ return window.ui?.escapeHtml ? window.ui.escapeHtml(v ?? '') : String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function money(n){ return window.ui?.money ? window.ui.money(Number(n||0)) : 'Rp' + Number(n||0).toLocaleString('id-ID'); }
  function pct(n){ return `${Number(n||0).toFixed(1)}%`; }
  function num(n){ return Number(n||0).toLocaleString('id-ID'); }
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function monthKey(d = new Date()){ return d.toISOString().slice(0,7); }
  function monthRange(month){
    const m = month || monthKey();
    if(window.QuarterUtil?.monthRange) return window.QuarterUtil.monthRange(m);
    const [y, mo] = m.split('-').map(Number);
    const end = new Date(y, mo, 0).toISOString().slice(0,10);
    return {start_date: `${m}-01`, end_date: end};
  }
  function quarterDates(q){
    if(window.QuarterUtil?.getQuarterDates) return window.QuarterUtil.getQuarterDates(q);
    const [y, qnRaw] = String(q||'').split('-Q');
    const qn = Number(qnRaw || 1);
    const startMonth = (qn - 1) * 3 + 1;
    const start = `${y}-${String(startMonth).padStart(2,'0')}-01`;
    const end = new Date(Number(y), startMonth + 2, 0).toISOString().slice(0,10);
    return {start_date:start, end_date:end};
  }
  function inRange(date, start, end){
    if(!date) return false;
    const d = String(date).slice(0,10);
    return (!start || d >= start) && (!end || d <= end);
  }
  function dateOf(row, fields){
    for(const f of fields){ if(row && row[f]) return String(row[f]).slice(0,10); }
    return '';
  }
  function sum(list, fn){ return (list||[]).reduce((a,x)=>a + Number(fn ? fn(x) : x || 0), 0); }
  function avg(list, fn){ return list && list.length ? sum(list, fn) / list.length : 0; }
  function accountCode(line){ return String(line.account_code || line.account_id || line.code || '').trim(); }
  function journalLines(start, end, asOf){
    const lines = [];
    arr(LS.journal).forEach(je => {
      const d = String(je.date || je.created_at || '').slice(0,10);
      if(asOf && d > asOf) return;
      if(!asOf && !inRange(d, start, end)) return;
      (je.lines || []).forEach(line => lines.push(Object.assign({}, line, {
        journal_id: je.id,
        journal_number: je.journal_number,
        date: d,
        description: je.description || '',
        client_name: je.client_name || '',
        source: je.source || '',
        doc_number: je.doc_number || ''
      })));
    });
    return lines;
  }
  function balanceByPrefix(prefixes, asOf){
    return sum(journalLines(null, null, asOf), l => {
      const code = accountCode(l);
      if(!prefixes.some(p => code.startsWith(p))) return 0;
      return Number(l.debit || 0) - Number(l.credit || 0);
    });
  }
  function amountByAccount(prefixes, start, end, natural){
    return sum(journalLines(start, end), l => {
      const code = accountCode(l);
      if(!prefixes.some(p => code.startsWith(p))) return 0;
      return natural === 'credit' ? Number(l.credit||0) - Number(l.debit||0) : Number(l.debit||0) - Number(l.credit||0);
    });
  }
  function employeeName(id){
    const e = arr(LS.employees).find(x => x.id === id);
    return e ? e.name : (id || '-');
  }
  function dataRange(type){
    const month = document.getElementById('reportMonth')?.value || monthKey();
    const quarter = document.getElementById('reportQuarter')?.value || (window.QuarterUtil?.getCurrentQuarter?.() || `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth()/3)+1}`);
    return type === 'quarterly' ? Object.assign({key:quarter}, quarterDates(quarter)) : Object.assign({key:month}, monthRange(month));
  }
  function noteKey(type, period, section){ return `${type}:${period}:${section}`; }
  function getNote(type, period, section, fallback=''){
    return obj(LS.notes)[noteKey(type, period, section)] ?? fallback;
  }
  function saveNote(type, period, section, value){
    const notes = obj(LS.notes);
    notes[noteKey(type, period, section)] = value;
    write(LS.notes, notes);
  }
  function noteArea(type, period, section, title, fallback){
    const val = getNote(type, period, section, fallback);
    return `<div class="report-note-block"><h3>${esc(title)}</h3><textarea class="report-note" data-note-type="${esc(type)}" data-note-period="${esc(period)}" data-note-section="${esc(section)}">${esc(val)}</textarea></div>`;
  }

  function operationalSummary(start, end){
    const leads = arr(LS.leads).filter(l => inRange(dateOf(l, ['created_at','date','tanggal_masuk','created_date']), start, end));
    const deals = arr(LS.deals).filter(d => inRange(dateOf(d, ['created_at','start_date','tanggal_mulai','deal_date','date']), start, end));
    const activeDeals = arr(LS.deals).filter(d => d.status === 'Aktif');
    const ditebus = deals.filter(d => d.status === 'Ditebus');
    const alertRed = activeDeals.filter(d => {
      const due = d.due_date ? new Date(String(d.due_date).slice(0,10)) : null;
      if(!due) return false;
      const diff = Math.ceil((due - new Date(todayISO())) / 86400000);
      return diff <= 3;
    }).length;
    return {
      leads, deals, activeDeals, ditebus,
      lead_count: leads.length,
      deal_count: deals.length,
      active_deal_count: activeDeals.length,
      conversion_rate: leads.length ? deals.length / leads.length * 100 : 0,
      principal: sum(deals, d => d.principal),
      tebus_collected: sum(ditebus, d => d.total_tebus),
      avg_deal_size: avg(deals, d => d.principal),
      alert_red: alertRed
    };
  }

  function financialSummary(start, end, asOf){
    const revenue = amountByAccount(['4'], start, end, 'credit');
    const expense = amountByAccount(['5'], start, end, 'debit');
    const net = revenue - expense;
    const cash = balanceByPrefix(['11000','11100','11200'], asOf || end || todayISO());
    const receivables = balanceByPrefix(['12100','12200','12300','12400','12500'], asOf || end || todayISO());
    const prepaid = balanceByPrefix(['11500'], asOf || end || todayISO());
    const motorSitaan = balanceByPrefix(['14000','14100'], asOf || end || todayISO());
    const fixedAssets = balanceByPrefix(['15100','15200','15400'], asOf || end || todayISO()) + balanceByPrefix(['15300'], asOf || end || todayISO());
    const assets = balanceByPrefix(['1'], asOf || end || todayISO());
    const liabilities = -balanceByPrefix(['2'], asOf || end || todayISO());
    const equity = -balanceByPrefix(['3'], asOf || end || todayISO());
    const marketingExpense = amountByAccount(['52000'], start, end, 'debit');
    const wageExpense = amountByAccount(['54000','54100'], start, end, 'debit');
    const opExpense = amountByAccount(['51000'], start, end, 'debit');
    return {revenue, expense, net_income: net, net_margin: revenue ? net/revenue*100 : 0, cash, receivables, prepaid, motor_sitaan_asset:motorSitaan, fixed_assets: fixedAssets, total_assets: assets, liabilities, equity, marketing_expense: marketingExpense, wage_expense: wageExpense, operational_expense: opExpense};
  }

  function marketingSummary(start, end, revenueEstimate){
    const posters = arr(LS.posters).filter(p => inRange(dateOf(p, ['date','tanggal_sebar','created_at']), start, end));
    const campaigns = arr(LS.campaigns).filter(c => inRange(dateOf(c, ['start_date','date','created_at']), start, end));
    const videos = arr(LS.videos).filter(v => inRange(dateOf(v, ['upload_date','date','created_at']), start, end));
    const partners = arr(LS.partners).filter(p => ['Aktif','active'].includes(p.status));
    const posterSpend = sum(posters, p => Number(p.print_cost || p.biaya_cetak || 0) + Number(p.distribution_cost || p.biaya_distribusi || 0));
    const campaignSpend = sum(campaigns, c => Number(c.total_spend || c.spend || c.budget_total || c.budget || 0));
    const spend = posterSpend + campaignSpend;
    const leads = arr(LS.leads).filter(l => l.lead_source && inRange(dateOf(l, ['created_at','date','tanggal_masuk']), start, end));
    const deals = arr(LS.deals).filter(d => d.lead_source && inRange(dateOf(d, ['created_at','start_date','deal_date']), start, end));
    const latestViews = sum(videos, v => {
      const snaps = v.snapshots || v.metrics || [];
      const s = snaps[snaps.length - 1] || v;
      return s.views || 0;
    });
    return {posters, campaigns, videos, partners, spend, posterSpend, campaignSpend, leads: leads.length, deals: deals.length, cpl: leads.length ? spend / leads.length : 0, cpd: deals.length ? spend / deals.length : 0, roi: spend ? ((revenueEstimate || 0) - spend) / spend * 100 : 0, video_count: videos.length, video_views: latestViews, active_partners: partners.length};
  }

  function okrCompletion(okr){
    if(window.MetricEngine?.computeOKRCompletion){
      try { return window.MetricEngine.computeOKRCompletion(okr).completion_pct || 0; } catch(e){}
    }
    const krs = arr(LS.krs).filter(k => k.okr_id === okr.id);
    if(!krs.length) return 0;
    return avg(krs, k => {
      const target = Number(k.target_value || 0);
      const cur = Number(k.manual_progress_value ?? k.current_value ?? 0);
      return target ? Math.min(100, cur / target * 100) : 0;
    });
  }
  function managementSummary(start, end, quarter){
    const tasks = arr(LS.tasks).filter(t => inRange(dateOf(t, ['start_datetime','created_at']), start, end));
    const completions = arr(LS.taskCompletions).filter(c => inRange(dateOf(c, ['instance_date','completed_at','created_at']), start, end));
    const employees = arr(LS.employees).filter(e => e.status !== 'inactive');
    const okrs = arr(LS.okrs).filter(o => !quarter || o.quarter_key === quarter);
    const okrAvg = okrs.length ? avg(okrs, okrCompletion) : 0;
    const overdue = tasks.filter(t => !['completed','cancelled'].includes(t.status) && dateOf(t, ['end_datetime','start_datetime']) < todayISO()).length;
    return {tasks, completions, employees, okrs, task_completion_rate: tasks.length ? completions.length / tasks.length * 100 : 0, employee_count: employees.length, okr_completion_avg: okrAvg, overdue_tasks: overdue};
  }
  function teamRows(start, end, quarter){
    const employees = arr(LS.employees);
    const tasks = arr(LS.tasks);
    const completions = arr(LS.taskCompletions).filter(c => inRange(dateOf(c, ['instance_date','completed_at','created_at']), start, end));
    const commissions = arr(LS.commissions).filter(c => inRange(dateOf(c, ['paid_at','approved_at','created_at']), start, end));
    const wages = arr(LS.wages).filter(w => inRange(dateOf(w, ['payment_date','created_at']), start, end));
    const okrs = arr(LS.okrs).filter(o => !quarter || o.quarter_key === quarter);
    return employees.map(e => {
      const assigned = tasks.filter(t => (t.assignee_employee_ids || []).includes(e.id) && inRange(dateOf(t, ['start_datetime','created_at']), start, end));
      const completed = completions.filter(c => assigned.some(t => t.id === c.task_id));
      const ownOkrs = okrs.filter(o => o.owner_employee_id === e.id);
      return {
        employee: e,
        assigned: assigned.length,
        completed: completed.length,
        completion_rate: assigned.length ? completed.length / assigned.length * 100 : 0,
        okr_completion: ownOkrs.length ? avg(ownOkrs, okrCompletion) : 0,
        commission: sum(commissions.filter(c => c.employee_id === e.id), c => c.commission_amount),
        wage: sum(wages.filter(w => w.employee_id === e.id), w => w.total_wage),
        review_count: (e.performance_reviews || []).length
      };
    });
  }

  function renderMetricGrid(items){
    return `<div class="grid four">${items.map(i => `<div class="kpi-card"><span>${esc(i.label)}</span><strong>${esc(i.value)}</strong>${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</div>`).join('')}</div>`;
  }
  function renderModuleTable(month, op, fin, mkt, mgmt){
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Module</th><th>Metric 1</th><th>Metric 2</th><th>Metric 3</th><th>Status</th></tr></thead><tbody>
      <tr><td>Operational</td><td>${op.lead_count} leads</td><td>${op.deal_count} deals</td><td>${pct(op.conversion_rate)} conversion</td><td>${op.alert_red ? `${op.alert_red} red alerts` : 'OK'}</td></tr>
      <tr><td>Financial</td><td>${money(fin.revenue)} revenue</td><td>${money(fin.expense)} expense</td><td>${money(fin.net_income)} net</td><td>${fin.net_income >= 0 ? 'Profit' : 'Loss'}</td></tr>
      <tr><td>Marketing</td><td>${money(mkt.spend)} spend</td><td>${mkt.leads} attributed leads</td><td>${money(mkt.cpl)} CPL</td><td>${mkt.roi ? pct(mkt.roi) + ' ROI' : 'N/A'}</td></tr>
      <tr><td>Management</td><td>${pct(mgmt.okr_completion_avg)} OKR</td><td>${pct(mgmt.task_completion_rate)} tasks</td><td>${mgmt.employee_count} employees</td><td>${mgmt.overdue_tasks ? `${mgmt.overdue_tasks} overdue` : 'OK'}</td></tr>
    </tbody></table></div>`;
  }

  function generateMonthly(month){
    const range = monthRange(month);
    const op = operationalSummary(range.start_date, range.end_date);
    const fin = financialSummary(range.start_date, range.end_date, range.end_date);
    const mkt = marketingSummary(range.start_date, range.end_date, fin.revenue);
    const q = window.QuarterUtil?.getCurrentQuarter?.(new Date(`${month}-15`)) || document.getElementById('reportQuarter')?.value;
    const mgmt = managementSummary(range.start_date, range.end_date, q);
    return {type:'monthly', period:month, range, operational:op, financial:fin, marketing:mkt, management:mgmt};
  }
  function generateQuarterly(q){
    const range = quarterDates(q);
    const op = operationalSummary(range.start_date, range.end_date);
    const fin = financialSummary(range.start_date, range.end_date, range.end_date);
    const mkt = marketingSummary(range.start_date, range.end_date, fin.revenue);
    const mgmt = managementSummary(range.start_date, range.end_date, q);
    const okrs = arr(LS.okrs).filter(o => o.quarter_key === q).map(o => ({
      okr: o,
      completion: okrCompletion(o),
      krs: arr(LS.krs).filter(k => k.okr_id === o.id).map(k => ({kr:k, progress: window.MetricEngine?.computeKRProgress ? window.MetricEngine.computeKRProgress(k) : {current_value:k.current_value||k.manual_progress_value||0, progress_pct:0, status:'manual'}}))
    }));
    return {type:'quarterly', period:q, range, operational:op, financial:fin, marketing:mkt, management:mgmt, okrs};
  }
  function generateTeam(period){
    const isQ = /^\d{4}-Q[1-4]$/.test(period||'');
    const range = isQ ? quarterDates(period) : monthRange(period || monthKey());
    const quarter = isQ ? period : (window.QuarterUtil?.getCurrentQuarter?.(new Date(`${period}-15`)) || null);
    return {type:'team', period, range, employees: teamRows(range.start_date, range.end_date, quarter)};
  }
  function generateInvestor(period){
    const range = monthRange(period || monthKey());
    const op = operationalSummary(range.start_date, range.end_date);
    const fin = financialSummary(range.start_date, range.end_date, range.end_date);
    const mkt = marketingSummary(range.start_date, range.end_date, fin.revenue);
    const mgmt = managementSummary(range.start_date, range.end_date, document.getElementById('reportQuarter')?.value);
    return {type:'investor', period, range, operational:op, financial:fin, marketing:mkt, management:mgmt};
  }

  function renderMonthly(data){
    const {period, operational:op, financial:fin, marketing:mkt, management:mgmt} = data;
    const summaryDefault = `Bulan ${period}: revenue ${money(fin.revenue)}, net income ${money(fin.net_income)}, ${op.deal_count} deal, ${op.lead_count} lead, marketing spend ${money(mkt.spend)}.`;
    return `<h2>Monthly Management Report — ${esc(period)}</h2>
      ${renderMetricGrid([
        {label:'Revenue', value:money(fin.revenue)}, {label:'Net Income', value:money(fin.net_income)},
        {label:'Deals Closed/Created', value:num(op.deal_count)}, {label:'Marketing Spend', value:money(mkt.spend)}
      ])}
      ${noteArea('monthly', period, 'executive', 'Executive Summary', summaryDefault)}
      <h3>Module Performance</h3>${renderModuleTable(period, op, fin, mkt, mgmt)}
      <h3>Financial Highlights</h3>${renderMetricGrid([
        {label:'Cash on Hand', value:money(fin.cash)}, {label:'Receivables', value:money(fin.receivables)},
        {label:'Expense', value:money(fin.expense)}, {label:'Net Margin', value:pct(fin.net_margin)}
      ])}
      <h3>Marketing Highlights</h3>${renderMetricGrid([
        {label:'CPL', value:money(mkt.cpl)}, {label:'Videos', value:num(mkt.video_count)},
        {label:'Video Views', value:num(mkt.video_views)}, {label:'Active Partners', value:num(mkt.active_partners)}
      ])}
      ${noteArea('monthly', period, 'forward', 'Forward Look / Blockers', 'Next: fokus follow-up lead hot, kontrol cash, dan jaga conversion.')}`;
  }
  function renderQuarterly(data){
    const {period, okrs, financial:fin, operational:op, management:mgmt} = data;
    return `<h2>Quarterly OKR Review — ${esc(period)}</h2>
      ${renderMetricGrid([
        {label:'Average OKR Completion', value:pct(mgmt.okr_completion_avg)}, {label:'Quarter Revenue', value:money(fin.revenue)},
        {label:'Quarter Net Income', value:money(fin.net_income)}, {label:'Quarter Deals', value:num(op.deal_count)}
      ])}
      <h3>OKR Achievement Summary</h3>
      <div class="list-stack">${okrs.length ? okrs.map(o => `<div class="list-item"><strong>${esc(o.okr.title || o.okr.title_zh)}</strong><small>${esc(employeeName(o.okr.owner_employee_id))} · ${pct(o.completion)}</small>${window.ui?.progressBar ? window.ui.progressBar(o.completion) : `<progress value="${o.completion}" max="100"></progress>`}<div>${o.krs.map(k => `<small>${esc(k.kr.title || k.kr.title_zh)} — ${num(k.progress.current_value)} / ${num(k.kr.target_value)} (${esc(k.progress.status)})</small>`).join('<br>')}</div></div>`).join('') : '<div class="empty-state">Belum ada OKR untuk quarter ini.</div>'}</div>
      ${noteArea('quarterly', period, 'worked', 'What Worked', 'Isi hasil yang berjalan baik quarter ini.')}
      ${noteArea('quarterly', period, 'not_worked', "What Didn't Work", 'Isi kendala utama quarter ini.')}
      ${noteArea('quarterly', period, 'next', 'Next Quarter Priorities', 'Isi prioritas quarter berikutnya.')}`;
  }
  function renderTeam(data){
    const rows = data.employees;
    const best = rows.slice().sort((a,b)=>b.completion_rate-a.completion_rate || b.okr_completion-a.okr_completion)[0];
    return `<h2>Team Performance Report — ${esc(data.period)}</h2>
      ${renderMetricGrid([
        {label:'Active Employees', value:num(rows.filter(r=>r.employee.status!=='inactive').length)},
        {label:'Best Performer', value: best ? best.employee.name : '-'},
        {label:'Total Commission', value:money(sum(rows,r=>r.commission))},
        {label:'Total Wage Paid', value:money(sum(rows,r=>r.wage))}
      ])}
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Role</th><th>Tasks</th><th>Task %</th><th>OKR %</th><th>Commission</th><th>Wage</th><th>Review</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(r.employee.name)}</td><td>${esc(r.employee.role)}</td><td>${r.completed}/${r.assigned}</td><td>${pct(r.completion_rate)}</td><td>${pct(r.okr_completion)}</td><td>${money(r.commission)}</td><td>${money(r.wage)}</td><td>${r.review_count}</td></tr>`).join('')}
      </tbody></table></div>
      ${noteArea('team', data.period, 'coaching', 'Coaching Opportunities', 'Isi catatan coaching / training yang dibutuhkan tim.')}`;
  }
  function renderInvestor(data){
    const {period, financial:fin, operational:op, marketing:mkt, management:mgmt} = data;
    return `<h2>Investor-Ready Summary — ${esc(period)}</h2>
      <div class="grid two"><div class="card"><h3>Financial Position</h3>
        <p>Cash: <b>${money(fin.cash)}</b></p><p>Receivables: <b>${money(fin.receivables)}</b></p><p>Total Assets: <b>${money(fin.total_assets)}</b></p><p>Liabilities: <b>${money(fin.liabilities)}</b></p>
      </div><div class="card"><h3>Performance vs Target</h3>
        <p>Revenue: <b>${money(fin.revenue)}</b></p><p>Net Income: <b>${money(fin.net_income)}</b></p><p>Net Margin: <b>${pct(fin.net_margin)}</b></p><p>OKR Completion: <b>${pct(mgmt.okr_completion_avg)}</b></p>
      </div></div>
      <h3>Key Milestones</h3><ul><li>${op.deal_count} deals in period, active deals now ${op.active_deal_count}</li><li>${op.lead_count} leads, conversion ${pct(op.conversion_rate)}</li><li>Marketing spend ${money(mkt.spend)}, CPL ${money(mkt.cpl)}</li></ul>
      ${noteArea('investor', period, 'risks', 'Risks + Mitigation', 'Risiko: keterlambatan tebus, kualitas lead, dan cash buffer. Mitigasi: follow-up H-5/H-3/H-1, filter quality lead, kontrol plafon.')}
      ${noteArea('investor', period, 'ask', 'Ask / Support Needed', 'Isi kalau ada kebutuhan dana, hiring, atau support operasional.')}`;
  }

  function currentTab(){ return document.querySelector('[data-report-tab].active')?.dataset.reportTab || 'monthly'; }
  function currentDataForTab(tab){
    const month = document.getElementById('reportMonth')?.value || monthKey();
    const quarter = document.getElementById('reportQuarter')?.value || (window.QuarterUtil?.getCurrentQuarter?.() || '2026-Q2');
    if(tab === 'monthly') return generateMonthly(month);
    if(tab === 'quarterly') return generateQuarterly(quarter);
    if(tab === 'team') return generateTeam(month);
    if(tab === 'investor') return generateInvestor(month);
    return generateMonthly(month);
  }
  function render(){
    const tab = currentTab();
    const root = document.getElementById('reportContent');
    if(!root) return;
    const data = currentDataForTab(tab);
    let html = '';
    if(tab === 'monthly') html = renderMonthly(data);
    if(tab === 'quarterly') html = renderQuarterly(data);
    if(tab === 'team') html = renderTeam(data);
    if(tab === 'investor') html = renderInvestor(data);
    root.innerHTML = `<div class="report-generated-at"><small>Last recalculated: ${new Date().toLocaleString('id-ID')}</small></div>${html}`;
    root.dataset.reportData = JSON.stringify(data);
    bindNoteAutosave();
  }
  function setReport(tab){
    document.querySelectorAll('[data-report-tab]').forEach(b => b.classList.toggle('active', b.dataset.reportTab === tab));
    render();
  }
  function bindNoteAutosave(){
    document.querySelectorAll('.report-note').forEach(area => {
      area.addEventListener('blur', () => {
        saveNote(area.dataset.noteType, area.dataset.notePeriod, area.dataset.noteSection, area.value);
        window.ui?.toast?.('Notes saved');
      });
    });
  }
  function saveSnapshot(){
    const root = document.getElementById('reportContent');
    const data = JSON.parse(root?.dataset.reportData || '{}');
    const id = window.storage.add('management_reports', {type: currentTab(), period: data.period, data, saved_at: new Date().toISOString()});
    window.ui?.toast?.(`Snapshot saved: ${id}`);
  }
  function init(){
    const m = document.getElementById('reportMonth');
    if(m && !m.value) m.value = monthKey();
    const q = document.getElementById('reportQuarter');
    if(q && !q.options.length){
      const cur = window.QuarterUtil?.getCurrentQuarter?.() || `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth()/3)+1}`;
      const opts = window.QuarterUtil?.quarterOptions ? window.QuarterUtil.quarterOptions(cur,4) : [cur];
      q.innerHTML = opts.map(x => `<option ${x===cur?'selected':''}>${x}</option>`).join('');
    }
    document.querySelectorAll('[data-report-tab]').forEach(b => b.addEventListener('click', () => setReport(b.dataset.reportTab)));
    document.getElementById('generateReportBtn')?.addEventListener('click', render);
    document.getElementById('reportMonth')?.addEventListener('change', render);
    document.getElementById('reportQuarter')?.addEventListener('change', render);
    document.getElementById('saveReportBtn')?.addEventListener('click', saveSnapshot);
    document.getElementById('exportReportPdf')?.addEventListener('click', () => {
      if(window.PDFExport?.exportNode) window.PDFExport.exportNode(document.getElementById('reportContent'), `management-${currentTab()}-report.pdf`);
      else window.print();
    });
    if(!document.querySelector('[data-report-tab].active')) document.querySelector('[data-report-tab="monthly"]')?.classList.add('active');
    render();
  }

  window.ManagementReports = {generateMonthly, generateQuarterly, generateTeam, generateInvestor, render, init, setReport};
})();
