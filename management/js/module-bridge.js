(function(){
 const J=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return []}};
 const O=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}};
 const inRange=(date,start,end)=>{ if(!date)return false; const d=String(date).slice(0,10); return (!start||d>=start)&&(!end||d<=end); };
 function periodRange(period){
   if(!period||period==='all')return {};
   const now=new Date(), today=window.QuarterUtil.todayISO();
   if(period==='today')return {start_date:today,end_date:today};
   if(period==='current_month')return window.QuarterUtil.monthRange(window.QuarterUtil.monthKey(now));
   if(period==='current_quarter')return window.QuarterUtil.getQuarterDates(window.QuarterUtil.getCurrentQuarter(now));
   if(period==='ytd')return {start_date:`${now.getFullYear()}-01-01`,end_date:today};
   if(/^\d{4}-Q[1-4]$/.test(period))return window.QuarterUtil.getQuarterDates(period);
   if(/^\d{4}-\d{2}$/.test(period))return window.QuarterUtil.monthRange(period);
   return {};
 }
 function getOperationalData(){return {leads:J('otokita.leads'),deals:J('otokita.deals')};}
 function getFinancialData(){return {journal:J('otokita.journal'),coa:J('otokita.coa'),commissions:J('otokita.commissions'),wages:J('otokita.wages'),motor_sitaan:J('otokita.motor_sitaan')};}
 function getMarketingData(){return {videos:J('otokita.mkt_videos'),campaigns:J('otokita.mkt_campaigns'),posters:J('otokita.mkt_poster_batches'),partners:J('otokita.mkt_partners'),assets:J('otokita.mkt_assets')};}
 function checkModuleAvailability(){return {operational:!!localStorage.getItem('otokita.deals')||!!localStorage.getItem('otokita.leads'),financial:!!localStorage.getItem('otokita.journal')||!!localStorage.getItem('otokita.coa'),marketing:!!localStorage.getItem('otokita.mkt_videos')||!!localStorage.getItem('otokita.mkt_campaigns'),management:!!localStorage.getItem('otokita.management_initialized')};}
 function journalLines(start,end){ const {journal}=getFinancialData(); const lines=[]; journal.forEach(je=>(je.lines||[]).forEach(line=>{ if(inRange(je.date,start,end)) lines.push(Object.assign({date:je.date,description:je.description,journal_id:je.id},line)); })); return lines; }
 function accountBalance(prefixes, asOf){ const {journal}=getFinancialData(); let n=0; journal.forEach(je=>{ if(asOf&&String(je.date).slice(0,10)>asOf)return; (je.lines||[]).forEach(l=>{ const code=String(l.account_code||l.account_id||''); if(prefixes.some(p=>code.startsWith(p))) n+=Number(l.debit||0)-Number(l.credit||0); });}); return n; }
 function getEmployeeMetrics(employee_id,range){ const tasks=window.storage.list('tasks').filter(t=>(t.assignee_employee_ids||[]).includes(employee_id)); const comp=window.storage.list('task_completions').filter(c=>tasks.some(t=>t.id===c.task_id)); const commissions=J('otokita.commissions').filter(c=>c.employee_id===employee_id); const wages=J('otokita.wages').filter(w=>w.employee_id===employee_id); const okrs=window.storage.list('okrs').filter(o=>o.owner_employee_id===employee_id); const okr_completion=okrs.length?okrs.reduce((a,o)=>a+(window.MetricEngine?.computeOKRCompletion(o).completion_pct||0),0)/okrs.length:0; return {tasks_assigned:tasks.length,tasks_completed:comp.length,commission_earned:commissions.reduce((a,c)=>a+Number(c.commission_amount||0),0),wages_paid:wages.reduce((a,w)=>a+Number(w.total_wage||0),0),okr_completion}; }
 window.ModuleBridge={periodRange,inRange,getOperationalData,getFinancialData,getMarketingData,checkModuleAvailability,journalLines,accountBalance,getEmployeeMetrics};
})();
