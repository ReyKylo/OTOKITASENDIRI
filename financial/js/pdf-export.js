(function(){
  function safeName(s){ return String(s || 'report').replace(/[^a-z0-9-_]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase(); }
  function money(n){ return UI.rp(Number(n || 0)); }
  function activeLang(){ return window.i18n?.getLang?.() || 'id'; }
  function label(idText, zhText){ return activeLang() === 'zh' ? zhText : idText; }
  function monthLabel(month){ return window.Report?.monthLabel ? Report.monthLabel(month) : month; }
  function pdfReady(){ return !!(window.jspdf && window.jspdf.jsPDF); }
  function newPdf(title, subtitle){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','mm','a4');
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(15);
    pdf.text('OTOKITA', 14, 16);
    pdf.setFontSize(12);
    pdf.text(String(title || ''), 14, 24);
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.text(String(subtitle || ''), 14, 31);
    pdf.text(`${label('Dicetak','打印日期')}: ${UI.dateToday()}`, 150, 16);
    pdf.setDrawColor(31,56,100);
    pdf.line(14, 36, 196, 36);
    return { pdf, y: 44 };
  }
  function footer(pdf){
    const pages = pdf.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      pdf.setPage(i);
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(8);
      pdf.text(`Internal Use Only · Page ${i}/${pages}`, 14, 290);
    }
  }
  function pageBreak(ctx, needed=14){
    if(ctx.y + needed <= 280) return;
    ctx.pdf.addPage();
    ctx.y = 18;
  }
  function text(ctx, value, x=14, opts={}){
    pageBreak(ctx, opts.h || 7);
    ctx.pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    ctx.pdf.setFontSize(opts.size || 10);
    ctx.pdf.text(String(value ?? ''), x, ctx.y);
    ctx.y += opts.step || 7;
  }
  function table(ctx, headers, rows, widths){
    const pdf = ctx.pdf;
    const startX = 14;
    const rowH = 8;
    function drawHeader(){
      pageBreak(ctx, rowH + 2);
      let x = startX;
      pdf.setFillColor(31,56,100);
      pdf.rect(startX, ctx.y - 5.5, widths.reduce((a,b)=>a+b,0), rowH, 'F');
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255,255,255);
      headers.forEach((h,i)=>{ pdf.text(String(h), x + 2, ctx.y); x += widths[i]; });
      pdf.setTextColor(0,0,0);
      ctx.y += rowH;
    }
    drawHeader();
    rows.forEach((row, idx)=>{
      pageBreak(ctx, rowH + 2);
      let x = startX;
      if(idx % 2 === 0){ pdf.setFillColor(248,250,252); pdf.rect(startX, ctx.y - 5.5, widths.reduce((a,b)=>a+b,0), rowH, 'F'); }
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(8);
      row.forEach((cell,i)=>{
        const value = String(cell ?? '');
        const clipped = value.length > 32 ? value.slice(0,29) + '...' : value;
        pdf.text(clipped, x + 2, ctx.y);
        x += widths[i];
      });
      ctx.y += rowH;
    });
  }
  function printableHtml(title, body){
    return `<!doctype html><html><head><meta charset="utf-8"><title>${UI.esc(title)}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1F3864;color:#fff}.right{text-align:right}.total{font-weight:bold;background:#f7f7f7}.head{display:flex;gap:12px;align-items:center;margin-bottom:18px}.logo{width:64px;height:64px;object-fit:contain}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save PDF</button>${body}<script>setTimeout(()=>window.print(),300)<\/script></body></html>`;
  }
  function fallbackPrint(title, bodyHtml){
    const html = printableHtml(title, bodyHtml);
    const win = window.open('', '_blank');
    if(win){ win.document.open(); win.document.write(html); win.document.close(); return; }
    UI.downloadText(`${safeName(title)}-${UI.dateToday()}.html`, html, 'text/html');
    UI.toast('PDF library belum loaded. File HTML print-view sudah didownload.');
  }
  async function exportElement(elementOrId, title='report'){
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if(!el) return UI.toast('Area PDF tidak ditemukan.');
    if(window.html2canvas && pdfReady()){
      const cloneTitle = document.createElement('div');
      cloneTitle.className='pdf-header-temp';
      cloneTitle.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div><b>OTOKITA</b><div>${UI.esc(title)}</div></div><div>${label('Dicetak','打印日期')}: ${UI.dateToday()}</div></div>`;
      el.prepend(cloneTitle);
      try{
        const canvas = await html2canvas(el,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
        cloneTitle.remove();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p','mm','a4');
        const img = canvas.toDataURL('image/png');
        const pageWidth = 210, pageHeight=297, margin=10;
        const imgWidth = pageWidth - margin*2;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight, position = margin;
        pdf.addImage(img,'PNG',margin,position,imgWidth,imgHeight);
        heightLeft -= (pageHeight - margin*2);
        while(heightLeft > 0){ position = heightLeft - imgHeight + margin; pdf.addPage(); pdf.addImage(img,'PNG',margin,position,imgWidth,imgHeight); heightLeft -= (pageHeight - margin*2); }
        footer(pdf);
        pdf.save(`${safeName(title)}-${UI.dateToday()}.pdf`);
        return;
      }catch(err){
        cloneTitle.remove();
        console.error(err);
      }
    }
    fallbackPrint(title, `<h1>${UI.esc(title)}</h1>${el.outerHTML}`);
  }
  function getWagesForMonth(month, ensure=true){
    if(ensure && window.Wage?.refreshWageForEmployeeMonth){
      storage.list('employees').filter(e=>e.status==='active').forEach(e=>Wage.refreshWageForEmployeeMonth(e.id, month));
    }
    return storage.list('wages').filter(w=>w.period_month===month);
  }
  function wageRowData(w){
    const emp = storage.get('employees', w.employee_id) || {};
    return { emp, w, commissions: (w.commissions || []).map(id=>storage.get('commissions', id)).filter(Boolean) };
  }
  function exportWageSummary(month){
    month = month || document.getElementById('wageMonth')?.value || UI.monthKey();
    const wages = getWagesForMonth(month, true);
    if(!wages.length) return UI.toast('Belum ada wage data. Klik Generate Wage Period dulu.');
    const rows = wages.map(w=>{ const {emp}=wageRowData(w); return [emp.name||'-', emp.role||'-', money(w.base_salary), money(w.total_commission), money(w.total_wage), w.status||'draft']; });
    const totalBase = wages.reduce((a,w)=>a+UI.num(w.base_salary),0);
    const totalCom = wages.reduce((a,w)=>a+UI.num(w.total_commission),0);
    const totalWage = wages.reduce((a,w)=>a+UI.num(w.total_wage),0);
    const title = `${label('Ringkasan Gaji','工资汇总')} ${monthLabel(month)}`;
    if(!pdfReady()){
      const html = `<div class="head"><img class="logo" src="assets/otokita-logo.png"><div><h1>${UI.esc(title)}</h1><div>${label('Periode','期间')}: ${UI.esc(monthLabel(month))}</div></div></div><table><thead><tr><th>${label('Nama','姓名')}</th><th>Role</th><th>${label('Gaji Pokok','基本工资')}</th><th>${label('Komisi','佣金')}</th><th>${label('Total Gaji','总工资')}</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i>=2&&i<=4?'right':''}">${UI.esc(c)}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr class="total"><td colspan="2">Total</td><td class="right">${money(totalBase)}</td><td class="right">${money(totalCom)}</td><td class="right">${money(totalWage)}</td><td></td></tr></tfoot></table>`;
      return fallbackPrint(title, html);
    }
    const ctx = newPdf(title, `${label('Periode','期间')}: ${monthLabel(month)}`);
    table(ctx, [label('Nama','姓名'), 'Role', label('Gaji Pokok','基本工资'), label('Komisi','佣金'), label('Total','总计'), 'Status'], rows, [36,28,33,33,33,20]);
    ctx.y += 4;
    text(ctx, `Total ${label('Gaji Pokok','基本工资')}: ${money(totalBase)}`, 14, {bold:true});
    text(ctx, `Total ${label('Komisi','佣金')}: ${money(totalCom)}`, 14, {bold:true});
    text(ctx, `Total ${label('Gaji','工资')}: ${money(totalWage)}`, 14, {bold:true});
    footer(ctx.pdf);
    ctx.pdf.save(`${safeName(title)}-${UI.dateToday()}.pdf`);
  }
  function exportSlipGaji(wageId){
    const w = storage.get('wages', wageId);
    if(!w) return UI.toast('Wage record tidak ditemukan. Klik Generate Wage Period dulu.');
    if(window.Wage?.refreshWageForEmployeeMonth) Wage.refreshWageForEmployeeMonth(w.employee_id, w.period_month);
    const fresh = storage.get('wages', wageId) || w;
    const { emp, commissions } = wageRowData(fresh);
    const title = `${label('Slip Gaji','工资单')} ${emp.name || ''} ${fresh.period_month}`;
    if(!pdfReady()){
      const html = `<div class="head"><img class="logo" src="assets/otokita-logo.png"><div><h1>${label('Slip Gaji','工资单')}</h1><div>${label('Periode','期间')}: ${UI.esc(monthLabel(fresh.period_month))}</div></div></div><table><tbody><tr><td>${label('Nama Karyawan','员工姓名')}</td><td>${UI.esc(emp.name||'-')}</td></tr><tr><td>Role</td><td>${UI.esc(emp.role||'-')}</td></tr><tr><td>ID</td><td>${UI.esc(emp.id||'-')}</td></tr><tr><td>${label('Gaji Pokok','基本工资')}</td><td class="right">${money(fresh.base_salary)}</td></tr>${commissions.map(c=>`<tr><td>${label('Komisi','佣金')} ${UI.esc(c.deal_id)} (${UI.esc(c.trigger_event)})</td><td class="right">${money(c.commission_amount)}</td></tr>`).join('')}<tr class="total"><td>${label('Total Gaji','总工资')}</td><td class="right">${money(fresh.total_wage)}</td></tr></tbody></table><footer>${label('Dicetak','打印日期')}: ${UI.dateToday()} · Confidential</footer>`;
      return fallbackPrint(title, html);
    }
    const ctx = newPdf(label('Slip Gaji / 工资单','工资单 / Slip Gaji'), `${label('Periode','期间')}: ${monthLabel(fresh.period_month)}`);
    text(ctx, `${label('Nama Karyawan','员工姓名')}: ${emp.name || '-'}`, 14, {bold:true});
    text(ctx, `Role: ${emp.role || '-'}`, 14);
    text(ctx, `ID: ${emp.id || '-'}`, 14);
    ctx.y += 2;
    const rows = [[label('Gaji Pokok','基本工资'), money(fresh.base_salary)]];
    commissions.forEach(c=>rows.push([`${label('Komisi','佣金')} ${c.deal_id} (${c.trigger_event})`, money(c.commission_amount)]));
    rows.push([label('Total Gaji','总工资'), money(fresh.total_wage)]);
    table(ctx, [label('Komponen','项目'), label('Jumlah','金额')], rows, [120,60]);
    ctx.y += 8;
    text(ctx, 'Confidential', 14, {bold:true, size:9});
    footer(ctx.pdf);
    ctx.pdf.save(`${safeName(title)}-${UI.dateToday()}.pdf`);
  }
  window.PDFExport={exportElement,exportWageSummary,exportSlipGaji};
})();
