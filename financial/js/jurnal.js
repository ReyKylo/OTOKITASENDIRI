(function(){
  function nextNumber(){
    const nums = storage.list('journal').map(e => Number(String(e.journal_number||'').replace(/\D/g,''))).filter(Boolean);
    return `JU-${String((Math.max(0,...nums)+1)).padStart(3,'0')}`;
  }
  function makeLine(code,debit,credit){
    const a=UI.accountByCode(code);
    return {account_id:a?.id||'',account_code:code,account_name_snapshot:a?.name_id||code,debit:UI.num(debit),credit:UI.num(credit)};
  }
  function normalizeLines(lines){
    return (lines||[]).map(l=>{
      const acc = storage.get('coa', l.account_id) || UI.accountByCode(l.account_code);
      return { account_id: acc?.id || l.account_id || '', account_code: acc?.code || l.account_code || '', account_name_snapshot: acc?.name_id || l.account_name_snapshot || '', debit: UI.num(l.debit), credit: UI.num(l.credit) };
    }).filter(l => l.account_id && (l.debit || l.credit));
  }
  function validate(entry){
    const lines = normalizeLines(entry.lines);
    const s = UI.sumLines(lines);
    if(!entry.date) throw new Error('Tanggal wajib diisi.');
    if(!entry.description) throw new Error('Keterangan wajib diisi.');
    if(lines.length < 2) throw new Error('Minimal 2 baris akun.');
    if(lines.some(l => l.debit && l.credit)) throw new Error('Satu line tidak boleh debit dan kredit sekaligus.');
    if(Math.round(s.debit) !== Math.round(s.credit)) throw new Error(`Debit dan kredit belum balance. Debit ${UI.rp(s.debit)} vs Kredit ${UI.rp(s.credit)}`);
    if(s.debit <= 0) throw new Error('Nominal tidak boleh nol.');
    return {...entry, lines};
  }
  function post(entry){
    const clean = validate(entry);
    const item = { ...clean, journal_number: clean.journal_number || nextNumber(), source: clean.source || 'manual', created_by_role: storage.getSettings().role || 'Admin', created_at: clean.created_at || new Date().toISOString() };
    const id = storage.add('journal', item);
    const saved = storage.get('journal', id);
    if(saved.deal_id && window.Bridge) Bridge.markLinked(saved.deal_id, saved.id, saved.deal_event || 'disbursement');
    return saved;
  }
  function updateEntry(id, entry){ const clean=validate(entry); return storage.update('journal', id, clean); }
  function canDelete(){ return true; }
  function deleteEntry(id){ if(!confirm('Hapus jurnal ini? Buku Besar dan Laporan akan berubah.')) return; storage.remove('journal', id); UI.toast('Jurnal dihapus.'); renderJournalPage(); }
  function accountSelect(selected=''){ return `<select class="line-account">${UI.accountOptions(selected)}</select>`; }
  function lineRow(line={}){ return `<div class="entry-line">${accountSelect(line.account_id)}<input class="line-debit" type="number" min="0" placeholder="Debit" value="${line.debit||''}"><input class="line-credit" type="number" min="0" placeholder="Kredit" value="${line.credit||''}"><button class="icon-btn row-remove" type="button">×</button></div>`; }
  function collectLines(root){ return [...root.querySelectorAll('.entry-line')].map(r=>({account_id:r.querySelector('.line-account').value,debit:UI.num(r.querySelector('.line-debit').value),credit:UI.num(r.querySelector('.line-credit').value)})); }
  function updateCheck(modalEl){ const lines=collectLines(modalEl); const s=UI.sumLines(lines); const box=modalEl.querySelector('.balance-check'); const ok=Math.round(s.debit)===Math.round(s.credit)&&s.debit>0; box.className='balance-check '+(ok?'ok':'bad'); box.textContent=`Debit ${UI.rp(s.debit)} / Kredit ${UI.rp(s.credit)} — ${ok?'BALANCE':'BELUM BALANCE'}`; }
  function sourceOptions(selected='manual'){
    return ['manual','auto_from_deal','import_ops_json','import_cashflow'].map(v=>`<option value="${v}" ${selected===v?'selected':''}>${v}</option>`).join('');
  }
  function openJournalModal(existing=null){
    const entry = existing || {date:UI.dateToday(),description:'',client_name:'',doc_number:'',proof_link:'',source:'manual',lines:[{},{}]};
    const body = `<div class="form-grid"><label>Tanggal<input id="mDate" type="date" value="${entry.date||UI.dateToday()}"></label><label>No Doc<input id="mDoc" value="${UI.esc(entry.doc_number||'')}"></label><label>Keterangan<input id="mDesc" value="${UI.esc(entry.description||'')}"></label><label>Client Name<input id="mClient" value="${UI.esc(entry.client_name||'')}"></label><label>Proof Link<input id="mProof" value="${UI.esc(entry.proof_link||'')}"></label><label>Sumber<select id="mSource">${sourceOptions(entry.source||'manual')}</select></label></div><hr><div class="entry-lines">${(entry.lines||[{},{}]).map(lineRow).join('')}</div><button class="btn" id="addLine" type="button">+ Line</button><div class="balance-check bad" style="margin-top:12px">Check</div>`;
    const foot = `<button class="btn" data-close="1">Cancel</button><button class="btn primary" id="saveEntry" type="button">${existing?'Save':'Post'}</button>`;
    const m=UI.modal(existing?'Edit Jurnal':'Tambah Jurnal Manual',body,foot,{large:true});
    const bind=()=>{ m.querySelectorAll('input,select').forEach(el=>el.oninput=()=>updateCheck(m)); m.querySelectorAll('.row-remove').forEach(b=>b.onclick=()=>{b.closest('.entry-line').remove(); updateCheck(m);}); };
    m.querySelector('#addLine').onclick=()=>{ m.querySelector('.entry-lines').insertAdjacentHTML('beforeend',lineRow({})); bind(); updateCheck(m); };
    bind(); updateCheck(m);
    m.querySelector('#saveEntry').onclick=()=>{ try{ const data={date:m.querySelector('#mDate').value,description:m.querySelector('#mDesc').value,client_name:m.querySelector('#mClient').value,doc_number:m.querySelector('#mDoc').value,proof_link:m.querySelector('#mProof').value,source:m.querySelector('#mSource').value,deal_id:entry.deal_id||null,deal_event:entry.deal_event||null,cf_ref:entry.cf_ref||'',lines:collectLines(m)}; existing?updateEntry(existing.id,{...existing,...data}):post(data); m.remove(); UI.toast('Jurnal tersimpan.'); renderJournalPage(); }catch(e){UI.toast(e.message);} };
  }
  function renderJournalTable(){
    const body=document.getElementById('journalTbody'); if(!body) return;
    const q=(document.getElementById('journalSearch')?.value||'').toLowerCase(); const start=document.getElementById('journalStart')?.value; const end=document.getElementById('journalEnd')?.value; const accId=document.getElementById('journalAccount')?.value; const source=document.getElementById('journalSource')?.value;
    let rows=UI.flattenJournal(storage.list('journal')).filter(r=>{ const e=r.entry; const text=[e.description,e.journal_number,e.client_name,e.doc_number,e.cf_ref,e.deal_id,e.deal_event].join(' ').toLowerCase(); return (!q||text.includes(q))&&(!start||e.date>=start)&&(!end||e.date<=end)&&(!accId||r.account_id===accId)&&(!source||e.source===source); });
    rows.sort((a,b)=>String(b.entry.date).localeCompare(String(a.entry.date)) || String(b.entry.journal_number).localeCompare(String(a.entry.journal_number)));
    body.innerHTML=rows.map(r=>`<tr><td><input class="journal-check" type="checkbox" value="${r.entry.id}"></td><td>${r.entry.date}</td><td>${r.entry.journal_number}</td><td>${UI.esc(r.entry.doc_number||'')}</td><td>${UI.esc(r.entry.description)}</td><td>${UI.esc(UI.lineAccountName(r))}</td><td class="right">${r.debit?UI.rp(r.debit):'-'}</td><td class="right">${r.credit?UI.rp(r.credit):'-'}</td><td>${UI.esc(r.entry.client_name||'')}</td><td>${UI.esc(r.entry.cf_ref||r.entry.deal_id||'')}${r.entry.deal_event?` · ${UI.esc(r.entry.deal_event)}`:''}</td><td>${r.entry.proof_link?`<a href="${UI.esc(r.entry.proof_link)}" target="_blank">link</a>`:'-'}</td><td><div class="table-actions"><button class="icon-btn row-edit" data-id="${r.entry.id}">✎</button><button class="icon-btn row-delete" data-id="${r.entry.id}">🗑</button></div></td></tr>`).join('') || `<tr><td colspan="12"><div class="empty-state">${i18n.t('no_journal')}</div></td></tr>`;
    body.querySelectorAll('.row-edit').forEach(b=>b.onclick=()=>openJournalModal(storage.get('journal',b.dataset.id)));
    body.querySelectorAll('.row-delete').forEach(b=>b.onclick=()=>deleteEntry(b.dataset.id));
  }
  function fillJournalFilters(){ const sel=document.getElementById('journalAccount'); if(sel) sel.innerHTML='<option value="">'+i18n.t('all_accounts')+'</option>'+UI.accountOptions(sel.value||''); }
  function selectedJournalIds(){ return [...document.querySelectorAll('.journal-check:checked')].map(x=>x.value).filter((v,i,a)=>a.indexOf(v)===i); }
  function previewEntry(entry, onConfirm){
    const meta = entry.meta ? `<div class="warning-item green">Fee/bunga dibayar di depan. Piutang = ${UI.rp(entry.meta.principal)}, fee = ${UI.rp(entry.meta.upfront_fee)}, kas keluar net = ${UI.rp(entry.meta.net_cash_out)}.</div>` : '';
    const title = entry.deal_event ? `Preview Journal Entry — ${Bridge.eventLabel(entry.deal_event)}` : 'Preview Journal Entry';
    const m=UI.modal(title,`<p><b>${UI.esc(entry.description)}</b></p><p>${entry.date} · ${UI.esc(entry.client_name||'')}</p>${meta}${UI.renderEntryLines(entry)}`,`<button class="btn" data-close="1">Cancel</button><button class="btn primary" id="confirmPost">Post</button>`,{large:true});
    m.querySelector('#confirmPost').onclick=()=>{ try{ onConfirm(entry); m.remove(); UI.toast('Entry berhasil diposting.'); renderJournalPage(); }catch(e){UI.toast(e.message);} };
  }
  function reviewPending(){
    const deals=Bridge.getPendingDeals();
    if(!deals.length) return UI.toast('Tidak ada pending auto entry.');
    const html=deals.map((d,idx)=>`<div class="list-item"><strong>${UI.esc(d.customer_name||'-')} — ${UI.esc(d._pending_label||'')}</strong><small>Deal ${UI.esc(d.source_deal_number||d.original_deal_id||d.id||'-')} · masuk ${UI.esc(d.inventory_in_date||'-')} · ${UI.esc(d.product_type||d.product||'')} · pokok ${UI.rp(Bridge.principalOf(d))} · fee upfront ${UI.rp(Bridge.feeOf(d))} · ${UI.esc(d.status||'')}</small><button class="btn primary small post-deal" data-idx="${idx}">Review & Post</button></div>`).join('');
    const m=UI.modal('Pending Auto Entries',html,'<button class="btn" data-close="1">Close</button>');
    m.querySelectorAll('.post-deal').forEach(b=>b.onclick=()=>{ const deal=deals[Number(b.dataset.idx)]; const entry=Bridge.generateEntryTemplate(deal, deal._pending_event); previewEntry(entry,()=>Bridge.postFromDeal(deal)); });
  }

  // Legacy CSV import tetap ada sebagai helper, tapi tombol utama sekarang import OPS JSON.
  const categoryMap={ 'Operasional':'51000','Marketing':'52000','Renovasi':'53000','Modal Masuk':'31000','Modal Deal':'12100','Pendapatan':'41100','Gaji':'54000','Sewa':'55000','Transport':'51000','Lain-lain Keluar':'59000','Lain-lain Masuk':'41900' };
  function parseCSV(text){ const lines=text.trim().split(/\r?\n/).filter(Boolean); const rows=[]; for(const line of lines){ const parts=line.split(/\t|,|;/).map(s=>s.trim()); if(parts.length<6 || /tanggal/i.test(parts[0])) continue; rows.push({date:parts[0],cf_ref:parts[1],description:parts[2],category:parts[3],debit:UI.num(parts[4]),credit:UI.num(parts[5])}); } return rows; }
  function uniqueCashflowRef(row){
    if (row.cf_ref) return row.cf_ref;
    const desc = String(row.description || '').toLowerCase();
    if (desc.includes('print poster')) return 'CF-035';
    if (desc.includes('print dan keperluan print')) return 'CF-036';
    return 'CF-' + Date.now().toString().slice(-6);
  }
  function entryFromCashflow(row, mapping=categoryMap){
    const cash='11000';
    const desc = String(row.description || '');
    const descLow = desc.toLowerCase();
    const cf = uniqueCashflowRef(row);
    if (descLow.includes('print poster')) {
      return {date:row.date,description:'Print Poster 1500 ('+cf+')',client_name:'',doc_number:cf,proof_link:'',source:'import_cashflow_corrected',deal_id:null,cf_ref:cf,lines:[makeLine('52000',UI.num(row.credit||row.debit),0),makeLine(cash,0,UI.num(row.credit||row.debit))]};
    }
    if (descLow.includes('print dan keperluan print')) {
      const printer=1123664, materai=200000, hvs=58706, tinta=59161, cashTotal=UI.num(row.credit||1428856), diff=(printer+materai+hvs+tinta)-cashTotal;
      return {date:row.date,description:'Print dan Keperluan print — split aset & beban ('+cf+')',client_name:'',doc_number:cf,proof_link:'',source:'import_cashflow_corrected',deal_id:null,cf_ref:cf,lines:[makeLine('15100',printer,0),makeLine('51000',materai,0),makeLine('51000',hvs,0),makeLine('51000',tinta,0),makeLine('51000',0,diff),makeLine(cash,0,cashTotal)]};
    }
    const category = descLow.includes('print poster') ? 'Marketing' : row.category;
    const code=mapping[category]||'59000'; const isIn=row.debit>0; const amount=isIn?row.debit:row.credit;
    const lines=isIn?[makeLine(cash,amount,0),makeLine(code,0,amount)]:[makeLine(code,amount,0),makeLine(cash,0,amount)];
    return {date:row.date,description:row.description,client_name:'',doc_number:cf,proof_link:'',source:'import_cashflow',deal_id:null,cf_ref:cf,lines};
  }

  function sampleOpsJSON(){
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      deals: [
        {id:'DEAL-001', inventory_in_date:'2026-05-16', created_at:'2026-05-16T09:00:00.000Z', customer_name:'Angga Nopriansyah', product_type:'Cicilan 3 Bulan', principal:13000000, total_tebus:16900000, due_date:'2026-08-13', status:'Aktif'},
        {id:'DEAL-002', inventory_in_date:'2026-05-20', created_at:'2026-05-20T09:00:00.000Z', customer_name:'Angga Nopriansyah', product_type:'JS Lunas 30H', principal:2500000, total_tebus:2875000, due_date:'2026-06-19', status:'Aktif'},
        {id:'DEAL-003', inventory_in_date:'2026-05-01', created_at:'2026-05-01T10:00:00.000Z', redeemed_at:'2026-05-16', customer_name:'Andika Firmansyah', product_type:'JS Lunas 30H', principal:2500000, total_tebus:2875000, due_date:'2026-05-31', status:'Ditebus'}
      ]
    }, null, 2);
  }

  function renderOpsPreview(container, entries, deals){
    const info = `<div class="warning-list"><div class="warning-item green">Import ini ambil dari JSON OPS bagian deals/inventory. Bunga/fee dianggap dibayar di depan, jadi pencairan: Dr Piutang pokok, Cr Kas net, Cr Pendapatan fee.</div><div class="warning-item">Identity deal pakai nomor deal + tanggal masuk inventory. Repeat order customer yang sama di tanggal berbeda akan dianggap deal berbeda.</div><div class="warning-item">Deals terbaca: ${deals.length}. Journal events yang belum pernah diposting / perlu revisi: ${entries.length}.</div></div>`;
    const list = entries.slice(0,20).map(e=>`<div class="list-item"><strong>${UI.esc(e.date)} — ${UI.esc(e.description)}</strong><small>${UI.esc(e.deal_event||'')} · ${UI.esc(e.client_name||'')} · ${UI.esc(e.doc_number||'')}</small>${UI.renderEntryLines(e)}</div>`).join('');
    container.innerHTML = info + (list || '<div class="empty-state">Tidak ada journal baru. Mungkin deal sudah pernah diposting.</div>');
  }

  function openImportModal(){
    const body=`<p><b>Import dari OPS JSON</b></p><p>Upload / paste hasil Export JSON dari Operational module. System akan ambil <code>deals</code> / <code>inventory</code>, simpan ke <code>otokita.deals</code>, lalu preview jurnal pencairan, pelunasan, atau hangus.</p><label class="btn file-btn">Upload OPS JSON<input id="opsJsonFile" type="file" accept="application/json" hidden></label><textarea id="opsJsonText" style="margin-top:12px">${UI.esc(sampleOpsJSON())}</textarea><div id="importPreview" style="margin-top:12px"></div>`;
    const foot=`<button class="btn" data-close="1">Cancel</button><button class="btn" id="previewImport">Preview</button><button class="btn" id="saveDealsOnly">Import Deals Only</button><button class="btn primary" id="commitImport">Import + Post Journal</button>`;
    const m=UI.modal('Import dari OPS JSON',body,foot,{large:true});
    let deals=[]; let preview=[];
    const readText=()=>m.querySelector('#opsJsonText').value;
    const buildPreview=()=>{
      deals = Bridge.extractDealsFromOpsJSON(readText());
      preview = Bridge.previewEntriesFromDeals(deals, 'import_ops_json');
      renderOpsPreview(m.querySelector('#importPreview'), preview, deals);
    };
    m.querySelector('#opsJsonFile').onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ m.querySelector('#opsJsonText').value=r.result; buildPreview(); }; r.readAsText(f); };
    m.querySelector('#previewImport').onclick=()=>{ try{ buildPreview(); }catch(e){ UI.toast('JSON OPS tidak valid: '+e.message); } };
    m.querySelector('#saveDealsOnly').onclick=()=>{ try{ if(!deals.length) buildPreview(); Bridge.mergeOperationalDeals(deals); UI.toast(`${deals.length} deal OPS berhasil diimport.`); m.remove(); renderJournalPage(); }catch(e){ UI.toast('Import gagal: '+e.message); } };
    m.querySelector('#commitImport').onclick=()=>{ try{ if(!deals.length) buildPreview(); Bridge.mergeOperationalDeals(deals); if(!preview.length) preview = Bridge.previewEntriesFromDeals(deals, 'import_ops_json'); if(!preview.length) return UI.toast('Tidak ada journal baru untuk diposting.'); if(!confirm(`Post ${preview.length} journal dari OPS JSON?`)) return; preview.forEach(e=>post(e)); m.remove(); UI.toast(`${deals.length} deal dan ${preview.length} journal berhasil diimport.`); renderJournalPage(); }catch(e){ UI.toast('Import gagal: '+e.message); } };
  }

  function renderJournalPage(){ fillJournalFilters(); renderJournalTable(); if(window.COA) COA.render(); }
  function init(){
    if(!document.body || document.body.dataset.page!=='jurnal') return;
    document.getElementById('addJournalBtn')?.addEventListener('click',()=>openJournalModal());
    document.getElementById('reviewPendingBtn')?.addEventListener('click',reviewPending);
    document.getElementById('openImportBtn')?.addEventListener('click',openImportModal);
    ['journalSearch','journalStart','journalEnd','journalAccount','journalSource'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderJournalTable));
    document.getElementById('bulkDeleteJournal')?.addEventListener('click',()=>{ const ids=selectedJournalIds(); if(!ids.length) return UI.toast('Pilih jurnal dulu.'); if(confirm(`Hapus ${ids.length} jurnal?`)){ storage.bulkRemove('journal',ids); renderJournalPage(); }});
    document.getElementById('selectAllJournal')?.addEventListener('change',e=>document.querySelectorAll('.journal-check').forEach(c=>c.checked=e.target.checked));
    if(location.hash==='#manual') setTimeout(()=>openJournalModal(),300);
    if(location.hash==='#import') setTimeout(()=>openImportModal(),300);
    document.addEventListener('language:changed',renderJournalPage);
    renderJournalPage();
  }
  window.Journal={post,validate,nextNumber,openJournalModal,previewEntry,reviewPending,openImportModal,renderJournalPage,categoryMap,parseCSV,entryFromCashflow};
  document.addEventListener('DOMContentLoaded',init);
})();
