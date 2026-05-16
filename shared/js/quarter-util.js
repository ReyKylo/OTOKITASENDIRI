(function(){
 function getCurrentQuarter(d=new Date()){const q=Math.floor(d.getMonth()/3)+1;return `${d.getFullYear()}-Q${q}`;}
 function getQuarterDates(qk){const [y,q]=String(qk||getCurrentQuarter()).split('-Q');const startMonth=(Number(q)-1)*3;const start=new Date(Number(y),startMonth,1);const end=new Date(Number(y),startMonth+3,0);return {start_date:start.toISOString().slice(0,10),end_date:end.toISOString().slice(0,10)};}
 function getQuarterProgress(qk){const {start_date,end_date}=getQuarterDates(qk);const s=new Date(start_date),e=new Date(end_date),n=new Date();const total=Math.max(1,Math.ceil((e-s)/86400000)+1);const elapsed=Math.max(0,Math.min(total,Math.ceil((n-s)/86400000)+1));return {days_elapsed:elapsed,days_total:total,progress_pct:elapsed/total*100,days_remaining:Math.max(0,total-elapsed)};}
 function formatQuarter(qk,lang='id'){const [y,q]=String(qk).split('-Q');return lang==='zh'?`${y}年第${q}季度`:`Q${q} ${y}`;}
 window.QuarterUtil={getCurrentQuarter,getQuarterDates,getQuarterProgress,formatQuarter};
})();
