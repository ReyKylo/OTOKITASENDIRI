(function(){
  const fmt = new Intl.NumberFormat('id-ID');
  function rp(n){ return 'Rp' + fmt.format(Number(n||0)); }
  function num(v){ if(v===null||v===undefined||v==='') return 0; return Number(String(v).replace(/[^0-9.-]/g,'')) || 0; }
  function esc(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function toast(msg){ const root=document.getElementById('toastRoot'); if(!root) return alert(msg); const el=document.createElement('div'); el.className='toast'; el.textContent=msg; root.appendChild(el); setTimeout(()=>el.remove(),3200); }
  function modal(title, bodyHTML, footerHTML='', opts={}){ const back=document.createElement('div'); back.className='modal-backdrop'; const size=opts.large?' large':''; back.innerHTML=`<div class="modal${size}"><div class="modal-head"><h2>${esc(title)}</h2><button class="close-btn" type="button">×</button></div><div class="modal-body">${bodyHTML}</div><div class="modal-foot">${footerHTML || '<button class="btn" data-close="1">Close</button>'}</div></div>`; document.body.appendChild(back); back.querySelector('.close-btn').onclick=()=>back.remove(); back.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>back.remove()); return back; }
  function accountName(acc, withCode=true){ if(!acc) return '-'; const lang=(window.i18n?.getLang?.() || 'id'); const name=lang==='zh' ? (acc.name_zh || acc.name_id || acc.code) : (acc.name_id || acc.name_zh || acc.code); return withCode ? `${acc.code} — ${name}` : name; }
  function accountByCode(code){ return storage.list('coa').find(a=>a.code===String(code)); }
  function accountByLine(line){ return storage.get('coa', line?.account_id) || accountByCode(line?.account_code); }
  function lineAccountName(line){ const acc=accountByLine(line); if(acc) return accountName(acc); return `${line?.account_code || ''} — ${line?.account_name_snapshot || ''}`.trim(); }
  function accountOptions(selected=''){ return storage.list('coa').filter(a=>a.is_active!==false).sort((a,b)=>a.code.localeCompare(b.code)).map(a=>`<option value="${a.id}" ${selected===a.id||selected===a.code?'selected':''}>${esc(accountName(a))}</option>`).join(''); }
  function dateToday(){ return new Date().toISOString().slice(0,10); }
  function monthKey(d=new Date()){ const x=typeof d==='string'?new Date(d):d; return x.toISOString().slice(0,7); }
  function monthStart(key){ return `${key}-01`; }
  function monthEnd(key){ const [y,m]=key.split('-').map(Number); return new Date(y,m,0).toISOString().slice(0,10); }
  function downloadText(filename, text, mime='text/plain'){ const blob=new Blob([text],{type:mime}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
  function flattenJournal(entries=storage.list('journal')){ const rows=[]; entries.forEach(e=>(e.lines||[]).forEach((l,idx)=>rows.push({...l, entry:e, line_index:idx}))); return rows; }
  function sumLines(lines){ return (lines||[]).reduce((a,l)=>({debit:a.debit+num(l.debit),credit:a.credit+num(l.credit)}),{debit:0,credit:0}); }
  function renderEntryLines(entry){ const rows=(entry.lines||[]).map(l=>`<tr><td>${esc(lineAccountName(l))}</td><td class="right">${rp(l.debit)}</td><td class="right">${rp(l.credit)}</td></tr>`).join(''); const s=sumLines(entry.lines); return `<table class="report-table"><thead><tr><th>${i18n.t('account')}</th><th>${i18n.t('debit')}</th><th>${i18n.t('credit')}</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="report-row-total"><td>${i18n.t('total')}</td><td class="right">${rp(s.debit)}</td><td class="right">${rp(s.credit)}</td></tr></tfoot></table>`; }
  function employeeName(id){ if(!id) return '-'; const e=storage.get('employees', id); return e ? e.name : '-'; }
  function employeeOptions(selected='', onlyActive=false){ return storage.list('employees').filter(e=>!onlyActive || e.status==='active').map(e=>`<option value="${esc(e.id)}" ${selected===e.id?'selected':''}>${esc(e.name)} — ${esc(e.role)}</option>`).join(''); }
  function commissionBadge(status){ const cls={pending:'pending',approved:'approved',paid:'paid'}[status]||'pending'; const label={pending:i18n.t('pending_commission'),approved:i18n.t('approved'),paid:i18n.t('paid')}[status]||status; return `<span class="commission-badge ${cls}">${esc(label)}</span>`; }
  function statusBadge(text, cls='neutral'){ return `<span class="status-pill ${cls}">${esc(text)}</span>`; }
  window.UI={rp,num,esc,toast,modal,accountName,accountByCode,accountByLine,lineAccountName,accountOptions,dateToday,monthKey,monthStart,monthEnd,downloadText,flattenJournal,sumLines,renderEntryLines,employeeName,employeeOptions,commissionBadge,statusBadge};
})();
