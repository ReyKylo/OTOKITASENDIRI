(function(){
  function escapeHtml(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  const esc=escapeHtml;
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));}
  function pct(n){return `${Number(n||0).toFixed(1)}%`;}
  function fmt(v,unit){if(unit==='rp')return money(v); if(unit==='%')return pct(v); return new Intl.NumberFormat('id-ID').format(Number(v||0));}
  function date(s){return s?new Date(s).toLocaleDateString('id-ID'):'-';}
  function daysUntil(d){if(!d)return 999; return Math.ceil((new Date(d)-new Date())/86400000);}
  function addDaysISO(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
  function alertLevel(d,status){if(status&&status!=='Aktif')return 'green'; const n=daysUntil(d); return n<=3?'red':n<=7?'yellow':'green';}
  function pill(label,type='neutral'){return `<span class="pill ${type}">${escapeHtml(label)}</span>`;}
  function badge(label,type='neutral'){return pill(label,type);}
  function statusPill(v){const t=String(v||'').toLowerCase();return pill(v||'-',t.includes('hot')||t.includes('aktif')||t.includes('deal')?'green':t.includes('cold')||t.includes('tolak')?'red':'yellow');}
  function alertPill(level){return pill(level,level);}
  function empty(msg){return `<div class="empty-state">${escapeHtml(msg||'Tidak ada data')}</div>`;}
  function toast(msg){let root=document.getElementById('toastRoot'); if(!root){root=document.createElement('div');root.id='toastRoot';root.className='toast-root';document.body.appendChild(root);} const el=document.createElement('div'); el.className='toast'; el.textContent=msg; root.appendChild(el); setTimeout(()=>el.remove(),3200);}
  function modal(title,body,foot){const back=document.createElement('div');back.className='modal-backdrop';back.innerHTML=`<div class="modal"><div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="close-btn" data-close>&times;</button></div><div class="modal-body">${body||''}</div><div class="modal-foot">${foot||'<button class="btn" data-close>Close</button>'}</div></div>`;document.body.appendChild(back); const close=()=>back.remove(); back.querySelectorAll('[data-close]').forEach(b=>b.onclick=close); return {node:back,close};}
  function field(label,name,value='',type='text'){return `<label><span>${escapeHtml(label)}</span><input data-field="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}"></label>`;}
  function textareaField(label,name,value=''){return `<label class="full"><span>${escapeHtml(label)}</span><textarea data-field="${escapeHtml(name)}">${escapeHtml(value)}</textarea></label>`;}
  function dataFrom(root){const out={};root.querySelectorAll('[data-field]').forEach(el=>{let v=el.type==='checkbox'?el.checked:el.value;if(el.type==='number')v=Number(v||0);out[el.dataset.field]=v;});return out;}
  const getFormData=dataFrom, formData=dataFrom;
  function setFormData(root,data){root.querySelectorAll('[data-field]').forEach(el=>{const v=data?.[el.dataset.field]; if(el.type==='checkbox')el.checked=!!v; else if(v!=null)el.value=v;});}
  function getCheckedIds(root=document){return [...root.querySelectorAll('input[type="checkbox"][data-id]:checked')].map(x=>x.dataset.id);}
  const selectedIds=getCheckedIds;
  function confirmDelete(msg){return confirm(msg||'Delete data ini?');}
  function download(filename,content,type='application/json'){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);}
  function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(file);});}
  function parseCsv(text){if(window.Papa) return Papa.parse(text,{header:true,skipEmptyLines:true}).data; const lines=String(text).trim().split(/\r?\n/); const heads=lines.shift().split(/[,;\t]/); return lines.map(l=>Object.fromEntries(l.split(/[,;\t]/).map((v,i)=>[heads[i],v])));}
  function progressBar(p,color='yellow'){return `<div class="progress"><i style="width:${Math.max(0,Math.min(100,Number(p||0)))}%;background:${color==='green'?'var(--green)':color==='red'?'var(--red)':color==='blue'?'var(--blue)':'var(--brand-gold)'}"></i></div>`;}
  function gauge(value,min,max){const v=Number(value||0), mn=Number(min||0), mx=Number(max||mn||1); const pct=Math.max(0,Math.min(1,v/mx)); const dash=251*pct; const color=v>=mx?'var(--green)':v>=mn?'var(--brand-gold)':v>=mn*.5?'#F79009':'var(--red)'; return `<div class="gauge-wrap"><svg class="gauge-svg" viewBox="0 0 200 110"><path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" stroke-width="18"/><path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="${color}" stroke-width="18" stroke-dasharray="${dash} 251" stroke-linecap="round"/><text x="100" y="82" text-anchor="middle" font-size="20" font-weight="800" fill="var(--brand-navy)">${Math.round(pct*100)}%</text></svg></div>`;}
  function employeeName(id){if(!id)return '-'; const e=window.storage?.get('employees',id); return e?e.name:'-';}
  function employeeOptions(selected='',emptyOpt=false){const arr=window.storage?.list('employees')||[];return `${emptyOpt?'<option value="">-</option>':''}${arr.map(e=>`<option value="${escapeHtml(e.id)}" ${e.id===selected?'selected':''}>${escapeHtml(e.name)} — ${escapeHtml(e.role||'')}</option>`).join('')}`;}
  function titleFor(o){const lang=window.i18n?.current?.()||window.i18n?.lang?.()||'id'; return (lang==='zh'&&(o.title_zh||o.name_zh))||(o.title||o.name||o.name_id||o.label_id||'-');}
  function bindTabs(root=document){root.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{const group=btn.closest('.tabs')||root; group.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); group.querySelectorAll('[data-tab-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.tabPanel!==btn.dataset.tab));});}
  function kpiCard(kpi,ach){return `<article class="card kpi-card"><div class="card-head"><h2>${escapeHtml(titleFor(kpi))}</h2>${pill(ach.status,ach.color||'yellow')}</div><strong class="big-metric">${fmt(ach.achieved_value,kpi.unit)}</strong><p>${window.i18n?.t('kpi_employee.target_range','Target Range')}: ${fmt(ach.min_target,kpi.unit)} - ${fmt(ach.max_target,kpi.unit)}</p>${gauge(ach.achieved_value,ach.min_target,ach.max_target)}</article>`;}
  function employeeAvatar(e){return `<span class="avatar">${escapeHtml((e?.name||'?')[0])}</span>`;}
  function statusType(s){s=String(s||'').toLowerCase();return s.includes('active')||s.includes('published')||s.includes('paid')?'green':s.includes('pause')||s.includes('draft')?'yellow':s.includes('cancel')||s.includes('down')?'red':'neutral';}
  function commissionStatusBadge(deal){const s=deal.commission_calculated?'Calculated':(deal.status==='Ditebus'||deal.status==='Hangus'?'Awaiting Calc':'Pending');return pill(s,deal.commission_calculated?'green':'yellow');}
  function getEmployees(){return window.storage?.list('employees')||[];} function getSalesEmployees(){return getEmployees().filter(e=>e.status==='active'&&!['Admin','Marketing'].includes(e.role));}
  function salesPicOptions(selected='',includeEmpty=true){return `${includeEmpty?'<option value="">-</option>':''}${getSalesEmployees().map(e=>`<option value="${e.id}" ${selected===e.id?'selected':''}>${escapeHtml(e.name)} — ${escapeHtml(e.role)}</option>`).join('')}`;}
  function salesPicField(label,value='',required=false){return `<label><span>${escapeHtml(label||'Sales PIC')}</span><select data-field="sales_pic_id" ${required?'required':''}>${salesPicOptions(value,true)}</select></label>`;}
  function populateSalesPicSelects(root=document){root.querySelectorAll('select[data-field="sales_pic_id"],select[data-sales-pic-filter]').forEach(s=>{const val=s.value||s.dataset.value||'';s.innerHTML=s.dataset.salesPicFilter!==undefined?`<option value="">Semua Sales PIC</option>${salesPicOptions(val,false)}`:salesPicOptions(val,true);s.value=val;});}
  function bindRowClicks(){}
  function exportPdf(node,filename){if(window.PDFExport)return window.PDFExport.exportNode(node,filename); window.print();}
  window.ui={escapeHtml,esc,money,pct,fmt,date,daysUntil,addDaysISO,alertLevel,alertPill,pill,badge,statusPill,empty,toast,modal,field,textareaField,dataFrom,getFormData,formData,setFormData,getCheckedIds,selectedIds,confirmDelete,download,readFile,parseCsv,progressBar,gauge,employeeName,employeeOptions,titleFor,bindTabs,kpiCard,employeeAvatar,statusType,commissionStatusBadge,getEmployees,getSalesEmployees,salesPicOptions,salesPicField,populateSalesPicSelects,bindRowClicks,exportPdf};
})();
(function(){
  function num(v){return Number(String(v||0).replace(/[^0-9.-]/g,''))||0;}
  function rp(v){return window.ui.money(v);}
  function dateToday(){return new Date().toISOString().slice(0,10);}
  function statusBadge(label,type){return window.ui.pill(label,type==='active'?'green':type==='rejected'?'red':'yellow');}
  const oldModal=window.ui.modal;
  function modal(title,body,foot,opts){const m=oldModal(title,body,foot); m.querySelector=(...a)=>m.node.querySelector(...a); m.querySelectorAll=(...a)=>m.node.querySelectorAll(...a); m.remove=()=>m.close(); return m;}
  window.UI=Object.assign({},window.ui,{num,rp,dateToday,statusBadge,modal});
})();
