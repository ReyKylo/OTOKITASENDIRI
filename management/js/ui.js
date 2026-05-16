(function(){
 function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}
 function money(n){return 'Rp'+Number(n||0).toLocaleString('id-ID');}
 function pct(n){return `${Math.round(Number(n||0)*10)/10}%`;}
 function fmt(n,unit){ if(unit==='rp')return money(n); if(unit==='%')return pct(n); return Number(n||0).toLocaleString('id-ID'); }
 function toast(msg){ let r=document.getElementById('toastRoot'); if(!r){r=document.createElement('div');r.id='toastRoot';r.className='toast-root';document.body.appendChild(r);} const el=document.createElement('div');el.className='toast';el.textContent=msg;r.appendChild(el);setTimeout(()=>el.remove(),3000);}
 function empty(msg){return `<div class="empty-state">${escapeHtml(msg||'Data kosong')}</div>`;}
 function badge(text,cls='neutral'){return `<span class="badge-pill ${cls}">${escapeHtml(text)}</span>`;}
 function progressBar(p,cls=''){ const v=Math.max(0,Math.min(100,Number(p)||0)); return `<div class="progress"><span class="${cls}" style="width:${v}%"></span></div>`; }
 function employeeName(id){ const e=window.storage?.list('employees').find(x=>x.id===id); return e?e.name:'-'; }
 function employeeOptions(selected='',includeEmpty=true){ const opts=(window.storage?.list('employees')||[]).map(e=>`<option value="${escapeHtml(e.id)}" ${e.id===selected?'selected':''}>${escapeHtml(e.name)} — ${escapeHtml(e.role||'')}</option>`).join(''); return `${includeEmpty?'<option value="">-</option>':''}${opts}`;}
 function modal(title,body,footer=''){ const bd=document.createElement('div');bd.className='modal-backdrop';bd.innerHTML=`<div class="modal"><div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="close-btn" type="button">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${footer||`<button class="btn" data-close>${window.i18n?.t('close')||'Close'}</button>`}</div></div>`;document.body.appendChild(bd); const close=()=>bd.remove(); bd.querySelector('.close-btn').addEventListener('click',close); bd.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close)); return {node:bd, close};}
 function dataFrom(root){ const out={}; root.querySelectorAll('[data-field]').forEach(el=>{ if(el.type==='checkbox')out[el.dataset.field]=el.checked; else if(el.type==='number')out[el.dataset.field]=el.value===''?null:Number(el.value); else if(el.multiple)out[el.dataset.field]=Array.from(el.selectedOptions).map(o=>o.value); else out[el.dataset.field]=el.value; }); return out; }
 function setActiveTab(container,tab){ container.querySelectorAll('[data-tab-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.tabPanel!==tab)); container.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); }
 function bindTabs(root=document){ root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setActiveTab(btn.closest('.tabs')||document,btn.dataset.tab))); }
 function download(name,text,type='application/json'){ const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
 function readFile(input,cb){ const file=input.files?.[0]; if(!file)return; const fr=new FileReader(); fr.onload=()=>cb(fr.result); fr.readAsText(file); }
 function titleFor(obj){ return window.i18n?.lang()==='zh' ? (obj.title_zh||obj.title||obj.name) : (obj.title||obj.title_zh||obj.name); }
 window.ui={escapeHtml,money,pct,fmt,toast,empty,badge,progressBar,employeeName,employeeOptions,modal,dataFrom,bindTabs,setActiveTab,download,readFile,titleFor};
})();
