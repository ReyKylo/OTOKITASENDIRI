(function(){
  function emp(id){ return storage.get('employees', id); }
  function pctForEmployee(employee){
    if(!employee) return 0;
    const tier = employee.current_tier || '';
    const rules = employee.commission_rules || {};
    if(tier === 'senior_sales') return Number(rules.senior_sales_pct || 0);
    if(tier === 'sales') return Number(rules.sales_pct || 0);
    if(String(employee.role||'').toLowerCase().includes('senior')) return Number(rules.senior_sales_pct || 0);
    if(String(employee.role||'').toLowerCase().includes('sales')) return Number(rules.sales_pct || 0);
    return 0;
  }
  function productBase(deal){
    const p = Bridge.principalOf(deal);
    const product = String(Bridge.productOf ? Bridge.productOf(deal) : (deal.product_type||'')).toLowerCase();
    if(product.includes('15')) return p * 0.10;
    if(product.includes('30') && !product.includes('cicilan')) return p * 0.15;
    if(product.includes('cicilan')) return p * 0.30;
    if(product.includes('jembatan')) return Bridge.feeOf(deal) || p * 0.10;
    return Bridge.feeOf(deal);
  }
  function monthOf(date){ return String(date || UI.dateToday()).slice(0,7); }
  function existingFor(dealId, event){ return storage.list('commissions').find(c => c.deal_id === dealId && c.trigger_event === event); }
  function updateOperationalDeal(deal, changes){
    const arr = Bridge.operationalDeals ? Bridge.operationalDeals() : [];
    const idx = arr.findIndex(d => d.id === deal.id || d.finance_deal_key === deal.finance_deal_key || d.original_deal_id === deal.original_deal_id);
    if(idx >= 0){ arr[idx] = {...arr[idx], ...changes}; Bridge.saveOperationalDeals(arr); }
  }
  function createCommission({employee_id, deal_id, trigger_event, base_amount, commission_pct, period_month, notes}){
    if(!employee_id || !deal_id) return null;
    const existing = existingFor(deal_id, trigger_event);
    if(existing) return existing;
    if(!commission_pct || commission_pct <= 0 || !base_amount || base_amount <= 0) return null;
    const commission_amount = Math.round(Number(base_amount) * Number(commission_pct) / 100);
    const id = storage.add('commissions', {employee_id, deal_id, trigger_event, base_amount, commission_pct, commission_amount, period_month, status:'pending', journal_entry_id:null, approved_at:null, approved_by:null, paid_at:null, notes:notes||'', created_at:new Date().toISOString()});
    return storage.get('commissions', id);
  }
  function handleDealTebus(dealInput){
    const deal = Bridge.normalizeDeal(dealInput);
    if(!deal || String(deal.status) !== 'Ditebus') return null;
    if(existingFor(deal.id, 'ditebus')) return existingFor(deal.id, 'ditebus');
    if(deal.commission_calculated === true) return null;
    if(!deal.sales_pic_id){ console.warn('Deal Ditebus tanpa sales_pic_id, komisi dilewati', deal); return null; }
    const employee = emp(deal.sales_pic_id); const pct = pctForEmployee(employee);
    if(!pct) return null;
    const base = productBase(deal);
    const date = deal.redeemed_at || deal.redeem_date || deal.closed_at || deal.due_date || UI.dateToday();
    const com = createCommission({employee_id:deal.sales_pic_id, deal_id:deal.id, trigger_event:'ditebus', base_amount:base, commission_pct:pct, period_month:monthOf(date), notes:`Komisi deal ditebus ${deal.customer_name||''}`});
    if(com){ updateOperationalDeal(deal,{commission_calculated:true,commission_amount_snapshot:com.commission_amount}); }
    return com;
  }
  function receivableCode(deal){ return Bridge.productReceivable ? Bridge.productReceivable(deal.product_type || deal.product || '') : '12100'; }
  function handleDealHangus(dealInput){
    const deal = Bridge.normalizeDeal(dealInput);
    if(!deal || String(deal.status) !== 'Hangus') return null;
    let motor = storage.list('motor_sitaan').find(m => m.deal_id === deal.id);
    if(!motor){
      const totalWriteoff = Bridge.principalOf(deal);
      const id = storage.add('motor_sitaan', {deal_id:deal.id, customer_name:deal.customer_name||'', motorcycle_info:deal.motorcycle_info||deal.motorcycle_type||deal.motor||'', sales_pic_id:deal.sales_pic_id||null, date_sitaan:deal.hangus_at||deal.forfeit_date||deal.closed_at||UI.dateToday(), original_principal:Bridge.principalOf(deal), total_writeoff:totalWriteoff, status:'available', sale_date:null, sale_price:null, margin:null, commission_id:null, notes:'Auto-created dari deal Hangus', created_at:new Date().toISOString()});
      motor = storage.get('motor_sitaan', id);
      updateOperationalDeal(deal,{motor_sitaan_id:id,commission_calculated:false});
    }
    // Journal transfer to motor sitaan, only if Bridge belum posting forfeit.
    if(window.Bridge && !Bridge.isEventPosted(deal.id,'forfeit')){
      try { Bridge.postFromDeal({...deal,_pending_event:'forfeit'}); } catch(e) { console.warn('Forfeit journal gagal:', e); }
    }
    return motor;
  }
  function handleMotorSold(motorId, salePrice, saleDate=UI.dateToday(), proofLink=''){
    const motor = storage.get('motor_sitaan', motorId); if(!motor) throw new Error('Motor sitaan tidak ditemukan.');
    const writeoff = UI.num(motor.total_writeoff); const sale = UI.num(salePrice); const margin = sale - writeoff;
    const lines = [{account_code:'11000', debit:sale, credit:0},{account_code:'14000', debit:0, credit:writeoff}];
    if(margin >= 0) lines.push({account_code:'41400', debit:0, credit:margin});
    else lines.push({account_code:'59000', debit:Math.abs(margin), credit:0});
    const normLines = lines.map(l=>{ const a=UI.accountByCode(l.account_code); return {account_id:a?.id||'', account_code:l.account_code, account_name_snapshot:a?.name_id||l.account_code, debit:l.debit, credit:l.credit}; });
    const entry = Journal.post({date:saleDate, description:`Penjualan motor sitaan ${motor.customer_name||''}`, client_name:motor.customer_name||'', doc_number:motor.deal_id||motor.id, proof_link:proofLink||'', source:'motor_sitaan_sale', deal_id:motor.deal_id, deal_event:'motor_sitaan_sold', lines:normLines});
    let commission = null;
    if(margin > 0 && motor.sales_pic_id){ const employee = emp(motor.sales_pic_id); const pct = pctForEmployee(employee); commission = createCommission({employee_id:motor.sales_pic_id, deal_id:motor.deal_id, trigger_event:'hangus_sold', base_amount:margin, commission_pct:pct, period_month:monthOf(saleDate), notes:`Komisi margin motor sitaan ${motor.customer_name||''}`}); }
    storage.update('motor_sitaan', motorId, {status:'sold', sale_date:saleDate, sale_price:sale, margin, commission_id:commission?.id||null, journal_entry_id:entry.id});
    if(commission){ const arr=Bridge.operationalDeals(); const d=arr.find(x=>x.id===motor.deal_id); if(d) { d.commission_calculated=true; d.commission_amount_snapshot=commission.commission_amount; Bridge.saveOperationalDeals(arr); } }
    return {entry, commission, margin};
  }
  function approveCommission(id){ const c=storage.get('commissions',id); if(!c) return null; return storage.update('commissions', id, {status:'approved', approved_at:new Date().toISOString(), approved_by:storage.getSettings().role||'Admin'}); }
  function payCommission(id, payment={}){
    let c=storage.get('commissions',id); if(!c) throw new Error('Komisi tidak ditemukan.');
    if(c.status==='pending') c=approveCommission(id);
    if(c.status==='paid') return c;
    const e=emp(c.employee_id);
    const entry=Journal.post({date:payment.payment_date||UI.dateToday(),description:`Bayar komisi ${e?.name||''} — ${c.trigger_event}`,client_name:e?.name||'',doc_number:c.deal_id,proof_link:payment.proof_link||'',source:'commission_payment',deal_id:c.deal_id,deal_event:'commission_payment',lines:[line('54100',c.commission_amount,0),line('11000',0,c.commission_amount)]});
    const paid=storage.update('commissions',id,{status:'paid', paid_at:new Date().toISOString(), journal_entry_id:entry.id});
    if(window.Wage) Wage.refreshWageForEmployeeMonth(c.employee_id,c.period_month);
    return paid;
  }
  function line(code,debit,credit){ const a=UI.accountByCode(code); return {account_id:a?.id||'',account_code:code,account_name_snapshot:a?.name_id||code,debit:UI.num(debit),credit:UI.num(credit)}; }
  function syncFromOperational(){
    let count=0;
    (Bridge.operationalDeals ? Bridge.operationalDeals() : []).forEach(d=>{
      const status=String(d.status||'');
      if(status==='Ditebus'){ if(handleDealTebus(d)) count++; }
      if(status==='Hangus'){ if(handleDealHangus(d)) count++; }
    });
    return count;
  }
  function pendingCount(){ return storage.list('commissions').filter(c=>c.status==='pending').length; }
  function approvedUnpaidCount(){ return storage.list('commissions').filter(c=>c.status==='approved').length; }
  window.Commission={pctForEmployee,productBase,createCommission,handleDealTebus,handleDealHangus,handleMotorSold,approveCommission,payCommission,syncFromOperational,pendingCount,approvedUnpaidCount};
  document.addEventListener('DOMContentLoaded',()=>{ if(window.Bridge) syncFromOperational(); });
})();
