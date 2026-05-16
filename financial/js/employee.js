(function(){
  function hasReferences(id){ return storage.list('commissions').some(c=>c.employee_id===id) || storage.list('wages').some(w=>w.employee_id===id); }
  function roleOptions(selected){ return ['Co-Owner','Admin','Sales','Junior Sales','Senior Sales','Marketing','Operational','Lain'].map(v=>`<option ${selected===v?'selected':''}>${v}</option>`).join(''); }
  function tierOptions(selected){ return `<option value="" ${!selected?'selected':''}>-</option><option value="sales" ${selected==='sales'?'selected':''}>Sales</option><option value="senior_sales" ${selected==='senior_sales'?'selected':''}>Senior Sales</option>`; }
  function render(){
    const body=document.getElementById('employeeTbody'); if(!body) return;
    body.innerHTML=storage.list('employees').map(e=>`<tr><td>${UI.esc(e.name)}</td><td>${UI.esc(e.role)}</td><td>${UI.statusBadge(e.status,e.status==='active'?'active':'rejected')}</td><td class="right">${UI.rp(e.base_salary)}</td><td>${UI.esc((e.commission_rules?.sales_pct||0)+'% / '+(e.commission_rules?.senior_sales_pct||0)+'%')}</td><td>${UI.esc(e.current_tier||'-')}</td><td><div class="table-actions"><button class="icon-btn emp-edit" data-id="${e.id}">✎</button><button class="icon-btn row-delete emp-del" data-id="${e.id}">🗑</button></div></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state">Belum ada karyawan.</div></td></tr>';
    body.querySelectorAll('.emp-edit').forEach(b=>b.onclick=()=>openModal(storage.get('employees',b.dataset.id)));
    body.querySelectorAll('.emp-del').forEach(b=>b.onclick=()=>deleteEmp(b.dataset.id)); const cnt=document.getElementById('employeePendingCommissionCount'); if(cnt) cnt.textContent=window.Commission?Commission.pendingCount():storage.list('commissions').filter(c=>c.status==='pending').length;
  }
  function openModal(existing=null){
    const e=existing||{name:'',role:'Sales',status:'active',base_salary:0,commission_rules:{sales_pct:5,senior_sales_pct:7.5},current_tier:'sales',joined_date:UI.dateToday(),notes:''};
    const body=`<div class="form-grid"><label>${i18n.t('employee_name')}<input id="empName" value="${UI.esc(e.name)}"></label><label>Role<select id="empRole">${roleOptions(e.role)}</select></label><label>Status<select id="empStatus"><option value="active">active</option><option value="inactive">inactive</option></select></label><label>${i18n.t('base_salary')}<input id="empSalary" type="number" value="${e.base_salary||0}"></label><label>Sales %<input id="empSalesPct" type="number" step="0.1" value="${e.commission_rules?.sales_pct||0}"></label><label>Senior Sales %<input id="empSeniorPct" type="number" step="0.1" value="${e.commission_rules?.senior_sales_pct||0}"></label><label>${i18n.t('sales_tier')}<select id="empTier">${tierOptions(e.current_tier)}</select></label><label>Joined Date<input id="empJoin" type="date" value="${e.joined_date||UI.dateToday()}"></label><label class="wide">Notes<textarea id="empNotes">${UI.esc(e.notes||'')}</textarea></label></div>`;
    const m=UI.modal(existing?'Edit Employee':'Tambah Employee',body,`<button class="btn" data-close="1">Cancel</button><button class="btn primary" id="saveEmp">Save</button>`,{large:true});
    m.querySelector('#empStatus').value=e.status||'active';
    m.querySelector('#saveEmp').onclick=()=>{
      const role=m.querySelector('#empRole').value; const tier=m.querySelector('#empTier').value;
      if(!m.querySelector('#empName').value.trim()) return UI.toast('Nama wajib.');
      if(String(role).toLowerCase().includes('sales') && !tier) return UI.toast('Sales role wajib punya current tier.');
      const data={name:m.querySelector('#empName').value.trim(),role,status:m.querySelector('#empStatus').value,base_salary:UI.num(m.querySelector('#empSalary').value),commission_rules:{sales_pct:UI.num(m.querySelector('#empSalesPct').value),senior_sales_pct:UI.num(m.querySelector('#empSeniorPct').value)},current_tier:tier||null,joined_date:m.querySelector('#empJoin').value,notes:m.querySelector('#empNotes').value};
      existing?storage.update('employees',existing.id,data):storage.add('employees',data);
      m.remove(); UI.toast('Employee tersimpan.'); render(); if(window.Wage) Wage.renderWageTab();
    };
  }
  function deleteEmp(id){ if(hasReferences(id)) return UI.toast('Employee sudah punya commission/wage record, tidak bisa dihapus.'); if(confirm('Hapus employee ini?')){ storage.remove('employees',id); render(); } }
  function init(){ if(document.body.dataset.page!=='jurnal') return; document.getElementById('addEmployeeBtn')?.addEventListener('click',()=>openModal()); document.getElementById('goWageBtn')?.addEventListener('click',()=>location.href='laporan.html#wage'); render(); document.addEventListener('language:changed',render); }
  window.Employee={render,openModal,hasReferences};
  document.addEventListener('DOMContentLoaded',init);
})();
