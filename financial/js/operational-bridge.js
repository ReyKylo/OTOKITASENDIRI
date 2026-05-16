(function(){
  const DEAL_KEY = 'otokita.deals';

  function safeParse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function links(){ return storage.read('journal_links') || {}; }
  function saveLinks(obj){ storage.write('journal_links', obj); }
  function cleanKey(value){
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
  }

  function normalizeDateKey(value){
    if(value === undefined || value === null || String(value).trim() === '') return '';
    const raw = String(value).trim();
    if(/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
    const slash = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if(slash){
      const d = slash[1].padStart(2,'0');
      const m = slash[2].padStart(2,'0');
      const y = slash[3].length === 2 ? '20' + slash[3] : slash[3];
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(raw);
    if(!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0,10);
    return cleanKey(raw);
  }

  function sourceDealNumberOf(deal){
    return deal.deal_number || deal.deal_no || deal.no_deal || deal.nomor_deal || deal.deal_ref ||
      deal.inventory_id || deal.inventory_number || deal.inventory_no || deal.no_inventory ||
      deal.source_deal_number || deal.original_deal_id || deal.deal_id || deal.id || '';
  }

  function inventoryInDateOf(deal){
    return deal.inventory_in_date || deal.tanggal_masuk_inventory || deal.tanggal_masuk || deal.tgl_masuk ||
      deal.start_date || deal.tanggal_mulai || deal.created_at || deal.date_in || deal.deal_date || deal.date || deal.created_date || '';
  }

  function customerOf(deal){ return deal.customer_name || deal.nama_customer || deal.client_name || ''; }
  function motorOf(deal){ return deal.motorcycle_info || deal.motorcycle_type || deal.motor || deal.vehicle || ''; }

  function makeFinanceDealKey(deal){
    const dealNoRaw = sourceDealNumberOf(deal);
    const inDate = normalizeDateKey(inventoryInDateOf(deal)) || 'no_date';
    const dealNo = cleanKey(dealNoRaw);
    if(dealNo) return `opsdeal_${dealNo}_${inDate}`;

    // Fallback hanya kalau OPS JSON tidak punya nomor deal sama sekali.
    // Customer repeat order dengan tanggal masuk berbeda tetap jadi deal berbeda.
    const base = [
      inDate,
      cleanKey(customerOf(deal)),
      cleanKey(motorOf(deal)),
      cleanKey(productOf(deal)),
      Math.round(principalOf(deal))
    ].filter(Boolean).join('_');
    return `opsdeal_fallback_${base || 'unknown'}`;
  }

  function normalizeDeal(deal){
    const originalDealId = deal.original_deal_id || deal.deal_id || deal.id || '';
    const sourceDealNumber = sourceDealNumberOf({...deal, original_deal_id: originalDealId});
    const inventoryDate = normalizeDateKey(inventoryInDateOf(deal));
    const financeKey = deal.finance_deal_key || makeFinanceDealKey({...deal, original_deal_id: originalDealId, source_deal_number: sourceDealNumber});
    return {
      ...deal,
      id: financeKey,
      finance_deal_key: financeKey,
      original_deal_id: originalDealId,
      source_deal_number: sourceDealNumber,
      inventory_in_date: inventoryDate || deal.inventory_in_date || ''
    };
  }

  function operationalDeals(){
    const raw = safeParse(localStorage.getItem(DEAL_KEY), []);
    return Array.isArray(raw) ? raw.map(normalizeDeal) : [];
  }
  function saveOperationalDeals(deals){ localStorage.setItem(DEAL_KEY, JSON.stringify((deals || []).map(normalizeDeal))); }

  function normalizeLinksForDeal(dealId){
    const all = links();
    const current = all[dealId];
    if(Array.isArray(current)) return { disbursement: current, redeem: [], forfeit: [] };
    if(current && typeof current === 'object') return { disbursement: current.disbursement || [], redeem: current.redeem || [], forfeit: current.forfeit || [] };
    return { disbursement: [], redeem: [], forfeit: [] };
  }
  function isEventPosted(dealId, eventType){ return normalizeLinksForDeal(dealId)[eventType]?.length > 0; }
  function markLinked(dealId, journalId, eventType='disbursement'){
    if(!dealId || !journalId) return;
    const all = links();
    const normalized = normalizeLinksForDeal(dealId);
    if(!normalized[eventType]) normalized[eventType] = [];
    if(!normalized[eventType].includes(journalId)) normalized[eventType].push(journalId);
    all[dealId] = normalized;
    saveLinks(all);
  }
  function linkedEntries(dealId, eventType){
    const ids = normalizeLinksForDeal(dealId)[eventType] || [];
    const journals = storage.list('journal');
    return ids.map(id => journals.find(j => j.id === id)).filter(Boolean);
  }
  function latestLinkedEntry(dealId, eventType){
    const entries = linkedEntries(dealId, eventType).filter(e => !(e.meta && e.meta.reversal_of));
    return entries[entries.length - 1] || null;
  }
  function entrySignature(entry){
    const lines = (entry.lines || []).map(l => ({code: String(l.account_code || ''), debit: Math.round(UI.num(l.debit)), credit: Math.round(UI.num(l.credit))}))
      .sort((a,b)=>(a.code+a.debit+a.credit).localeCompare(b.code+b.debit+b.credit));
    return JSON.stringify({
      event: entry.deal_event || '',
      date: String(entry.date || '').slice(0,10),
      client: String(entry.client_name || '').trim(),
      lines
    });
  }
  function needsRevision(deal, eventType){
    const oldEntry = latestLinkedEntry(deal.id, eventType);
    if(!oldEntry) return false;
    const newEntry = generateEntryTemplate(deal, eventType, oldEntry.source || 'import_ops_json');
    return entrySignature(oldEntry) !== entrySignature(newEntry);
  }
  function reversalEntry(oldEntry, reason='Revisi dari OPS JSON'){
    return {
      date: UI.dateToday(),
      description: `REVERSAL ${oldEntry.journal_number || ''} — ${oldEntry.description || reason}`,
      client_name: oldEntry.client_name || '',
      doc_number: oldEntry.doc_number || oldEntry.deal_id || '',
      proof_link: oldEntry.proof_link || '',
      source: 'revision_ops_json',
      deal_id: oldEntry.deal_id || null,
      deal_event: oldEntry.deal_event || 'disbursement',
      cf_ref: oldEntry.cf_ref || '',
      lines: (oldEntry.lines || []).map(l => ({...l, debit: UI.num(l.credit), credit: UI.num(l.debit)})),
      meta: {reversal_of: oldEntry.id, reversal_of_journal_number: oldEntry.journal_number, reason}
    };
  }
  function revisionEntriesForDeal(deal, eventType, source='import_ops_json'){
    const oldEntry = latestLinkedEntry(deal.id, eventType);
    if(!oldEntry) return [generateEntryTemplate(deal, eventType, source)];
    const newEntry = generateEntryTemplate(deal, eventType, source);
    newEntry.description = `REVISI ${oldEntry.journal_number || ''} — ${newEntry.description}`;
    newEntry.source = 'revision_ops_json';
    newEntry.meta = {...(newEntry.meta || {}), revision_of: oldEntry.id, previous_journal_number: oldEntry.journal_number};
    return [reversalEntry(oldEntry), newEntry];
  }

  function productReceivable(product){
    if(String(product).includes('Cicilan')) return '12200';
    if(String(product).includes('Jembatan')) return '12300';
    return '12100';
  }
  function productRevenue(product){
    if(String(product).includes('Cicilan')) return '41200';
    if(String(product).includes('Jembatan')) return '41300';
    return '41100';
  }
  function line(code, debit=0, credit=0){
    const a=UI.accountByCode(code);
    return {account_id:a?.id || '', account_code:code, account_name_snapshot:a?.name_id || code, debit:UI.num(debit), credit:UI.num(credit)};
  }
  function firstDate(...values){
    const found = values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    if(!found) return UI.dateToday();
    return String(found).slice(0,10);
  }
  function lastPaymentDate(deal){
    const hist = Array.isArray(deal.payment_history) ? deal.payment_history : [];
    const dates = hist.map(p => p.date || p.payment_date || p.paid_at || p.created_at).filter(Boolean).sort();
    return dates[dates.length-1];
  }
  function principalOf(deal){ return UI.num(deal.principal ?? deal.pokok ?? deal.modal ?? deal.amount_principal ?? deal.plafon_bersih ?? 0); }
  function totalOf(deal){
    const p = principalOf(deal);
    const t = UI.num(deal.total_tebus ?? deal.total_tagihan ?? deal.total ?? deal.redeem_amount ?? 0);
    return t > 0 ? t : p;
  }
  function feeOf(deal){ return Math.max(0, totalOf(deal) - principalOf(deal)); }
  function cashOutOf(deal){ return Math.max(0, principalOf(deal) - feeOf(deal)); }
  function statusOf(deal){ return String(deal.status || deal.deal_status || '').trim(); }
  function productOf(deal){ return deal.product_type || deal.product || deal.skema || 'JS Lunas 30H'; }

  function eventLabel(eventType){
    const zh = window.i18n?.getLang?.() === 'zh';
    if(eventType === 'redeem') return zh ? '赎回收款' : 'Pelunasan / Ditebus';
    if(eventType === 'forfeit') return zh ? '逾期没收' : 'Hangus / Motor Sitaan';
    return zh ? '放款（利息前收）' : 'Pencairan (bunga dibayar depan)';
  }

  function generateEntryTemplate(deal, eventType, source='auto_from_deal'){
    deal = normalizeDeal(deal);
    const event = eventType || deal._pending_event || 'disbursement';
    const product = productOf(deal);
    const principal = principalOf(deal);
    const total = totalOf(deal);
    const fee = feeOf(deal);
    const cashOut = cashOutOf(deal);
    const ar = productReceivable(product);
    const rev = productRevenue(product);
    const dealNoForDisplay = deal.source_deal_number || deal.original_deal_id || deal.finance_deal_key || deal.id || '-';
    const inDateForDisplay = deal.inventory_in_date || firstDate(deal.created_at, deal.start_date, deal.tanggal_mulai, deal.date_in, deal.date);
    let date = firstDate(deal.inventory_in_date, deal.created_at, deal.start_date, deal.tanggal_mulai, deal.date_in, deal.date);
    let desc = `Pencairan deal ${customerOf(deal) || ''} — ${product} (Deal ${dealNoForDisplay}, masuk ${inDateForDisplay}, bunga dibayar di depan)`;
    let lines = [];

    if(event === 'redeem'){
      date = firstDate(deal.redeemed_at, deal.redeem_date, deal.tanggal_keluar, lastPaymentDate(deal), deal.closed_at, deal.due_date, deal.updated_at);
      desc = `Pelunasan / ditebus ${customerOf(deal) || ''} — ${product} (Deal ${dealNoForDisplay}, masuk ${inDateForDisplay})`;
      lines = [line('11000', principal, 0), line(ar, 0, principal)];
    } else if(event === 'forfeit'){
      date = firstDate(deal.hangus_at, deal.forfeit_date, deal.tanggal_keluar, deal.closed_at, deal.due_date, deal.updated_at);
      desc = `Deal hangus / motor sitaan ${customerOf(deal) || ''} — ${product} (Deal ${dealNoForDisplay}, masuk ${inDateForDisplay})`;
      lines = [line('14000', principal, 0), line(ar, 0, principal)];
    } else {
      // Bunga/fee dibayar di depan: piutang hanya pokok, revenue langsung diakui, kas keluar net = pokok - fee.
      // Contoh: pokok 13 jt, fee 3,9 jt => Dr Piutang 13 jt / Cr Kas 9,1 jt / Cr Pendapatan 3,9 jt.
      lines = [line(ar, principal, 0)];
      if(cashOut > 0) lines.push(line('11000', 0, cashOut));
      if(fee > 0) lines.push(line(rev, 0, fee));
    }

    return {
      date,
      description: desc,
      client_name: customerOf(deal),
      doc_number: `${dealNoForDisplay}${inDateForDisplay ? ' / ' + inDateForDisplay : ''}`,
      proof_link: '',
      source,
      deal_id: deal.id,
      deal_event: event,
      cf_ref: '',
      lines,
      created_by_role: storage.getSettings().role || 'Admin',
      meta: {
        principal,
        total_tebus: total,
        upfront_fee: fee,
        net_cash_out: cashOut,
        product_type: product,
        finance_deal_key: deal.finance_deal_key,
        source_deal_number: deal.source_deal_number || '',
        original_deal_id: deal.original_deal_id || '',
        inventory_in_date: deal.inventory_in_date || ''
      }
    };
  }

  function expectedEventsForDeal(deal){
    const status = statusOf(deal);
    const events = ['disbursement'];
    if(status === 'Ditebus') events.push('redeem');
    if(status === 'Hangus') events.push('forfeit');
    return events;
  }
  function getEventsForDeal(deal){
    return getPendingItemsForDeal(deal).map(x => x.event);
  }
  function getPendingItemsForDeal(deal){
    deal = normalizeDeal(deal);
    return expectedEventsForDeal(deal).flatMap(event => {
      if(!isEventPosted(deal.id, event)) return [{deal, event, action:'post'}];
      if(needsRevision(deal, event)) return [{deal, event, action:'revision'}];
      return [];
    });
  }
  function getPendingEvents(deals=operationalDeals()){
    return deals
      .map(normalizeDeal)
      .filter(d => d && d.id && ['Aktif','Ditebus','Hangus'].includes(statusOf(d)))
      .flatMap(deal => getPendingItemsForDeal(deal));
  }
  function getPendingDeals(){
    return getPendingEvents().map(({deal,event,action}) => ({...deal, _pending_event:event, _pending_action:action, _pending_label:eventLabel(event) + (action === 'revision' ? ' — Revisi' : '')}));
  }

  function postFromDeal(deal, edits={}){
    deal = normalizeDeal(deal);
    const event = edits.deal_event || deal._pending_event || 'disbursement';
    const action = edits.deal_action || deal._pending_action || 'post';
    const source = edits.source || 'auto_from_deal';
    if(action === 'revision'){
      const savedEntries = revisionEntriesForDeal(deal, event, source).map(e => Journal.post({...e, deal_event:event}));
      return savedEntries;
    }
    const entry = {...generateEntryTemplate(deal, event, source), ...edits, deal_event:event};
    const saved = Journal.post(entry);
    markLinked(deal.id, saved.id, event);
    return saved;
  }

  function extractDealsFromOpsJSON(jsonInput){
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
    let deals = [];
    if(Array.isArray(data)) deals = data;
    else if(Array.isArray(data.deals)) deals = data.deals;
    else if(Array.isArray(data.inventory)) deals = data.inventory;
    else if(Array.isArray(data.Inventory)) deals = data.Inventory;
    else if(Array.isArray(data.operational_deals)) deals = data.operational_deals;
    else if(Array.isArray(data['otokita.deals'])) deals = data['otokita.deals'];
    else if(data.tables && Array.isArray(data.tables.deals)) deals = data.tables.deals;
    else if(data.data && Array.isArray(data.data.deals)) deals = data.data.deals;

    return deals.map(normalizeDeal);
  }

  function mergeOperationalDeals(importedDeals, replace=false){
    importedDeals = (importedDeals || []).map(normalizeDeal);
    if(replace){ saveOperationalDeals(importedDeals); return importedDeals.length; }
    const existing = operationalDeals();
    const map = new Map(existing.map(d => [d.id, d]));
    importedDeals.forEach(d => map.set(d.id, {...(map.get(d.id)||{}), ...d}));
    const merged = [...map.values()];
    saveOperationalDeals(merged);
    return importedDeals.length;
  }

  function previewEntriesFromDeals(deals, source='import_ops_json'){
    return getPendingEvents(deals).flatMap(({deal,event,action}) => {
      if(action === 'revision') return revisionEntriesForDeal(deal, event, source);
      return [generateEntryTemplate(deal, event, source)];
    });
  }

  window.Bridge={
    operationalDeals, saveOperationalDeals, extractDealsFromOpsJSON, mergeOperationalDeals,
    getPendingEvents, getPendingDeals, generateEntryTemplate, previewEntriesFromDeals, postFromDeal,
    markLinked, isEventPosted, linkedEntries, latestLinkedEntry, entrySignature, needsRevision, revisionEntriesForDeal,
    normalizeDeal, makeFinanceDealKey, sourceDealNumberOf, inventoryInDateOf,
    productReceivable, productRevenue, principalOf, totalOf, feeOf, cashOutOf, eventLabel
  };
})();
