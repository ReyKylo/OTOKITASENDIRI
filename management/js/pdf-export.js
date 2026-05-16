(function(){
 async function exportNode(node,filename='report.pdf'){
  if(!node) return window.ui.toast('Area export tidak ditemukan.');
  if(window.jspdf && window.html2canvas){
    const canvas=await window.html2canvas(node,{scale:2,backgroundColor:'#ffffff'});
    const img=canvas.toDataURL('image/png');
    const {jsPDF}=window.jspdf; const pdf=new jsPDF('p','mm','a4');
    const w=190,h=canvas.height*w/canvas.width; pdf.setFontSize(12); pdf.text('OTOKITA Management · Internal Use Only',10,10); pdf.addImage(img,'PNG',10,16,w,h); pdf.setFontSize(9); pdf.text(`Printed: ${new Date().toLocaleString('id-ID')}`,10,287); pdf.save(filename);
  } else {
    const win=window.open('','_blank'); win.document.write(`<html><head><title>${filename}</title><link rel="stylesheet" href="css/style.css"></head><body>${node.outerHTML}<script>window.print()<\/script></body></html>`); win.document.close();
  }
 }
 function exportMonthly(){ exportNode(document.getElementById('reportContent'),'monthly-management-report.pdf'); }
 function exportOKR(){ exportNode(document.getElementById('okrList'),'okr-review.pdf'); }
 window.PDFExport={exportNode,exportMonthly,exportOKR};
})();
