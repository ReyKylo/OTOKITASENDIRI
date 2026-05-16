(function(){
  function pad(n){ return String(n).padStart(2,'0'); }
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function getCurrentQuarter(date=new Date()){
    const q = Math.floor(date.getMonth()/3)+1;
    return `${date.getFullYear()}-Q${q}`;
  }
  function getQuarterDates(key){
    const m = String(key||getCurrentQuarter()).match(/(\d{4})-Q([1-4])/);
    const y = m ? Number(m[1]) : new Date().getFullYear();
    const q = m ? Number(m[2]) : Math.floor(new Date().getMonth()/3)+1;
    const startM = (q-1)*3;
    const start = new Date(y,startM,1);
    const end = new Date(y,startM+3,0);
    return {start_date:`${y}-${pad(startM+1)}-01`, end_date:`${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`};
  }
  function addQuarter(key,delta){
    const m=String(key||getCurrentQuarter()).match(/(\d{4})-Q([1-4])/); let y=Number(m?.[1]||new Date().getFullYear()), q=Number(m?.[2]||1)+delta;
    while(q<1){q+=4;y--;} while(q>4){q-=4;y++;}
    return `${y}-Q${q}`;
  }
  function daysBetween(a,b){ return Math.ceil((new Date(b)-new Date(a))/(86400000))+1; }
  function getQuarterProgress(key){
    const {start_date,end_date}=getQuarterDates(key); const now=todayISO();
    const total=Math.max(daysBetween(start_date,end_date),1);
    const elapsed=Math.min(Math.max(daysBetween(start_date, now),0), total);
    return {days_elapsed:elapsed, days_total:total, days_remaining:Math.max(total-elapsed,0), progress_pct:Math.round(elapsed/total*1000)/10};
  }
  function formatQuarter(key,lang){
    const m=String(key||getCurrentQuarter()).match(/(\d{4})-Q([1-4])/); const y=m?.[1]||''; const q=m?.[2]||'';
    if(lang==='zh') return `${y}年第${['一','二','三','四'][Number(q)-1]}季度`;
    return `Q${q} ${y}`;
  }
  function monthKey(date=new Date()){ return `${date.getFullYear()}-${pad(date.getMonth()+1)}`; }
  function monthRange(key){
    const [y,m]=String(key||monthKey()).split('-').map(Number); const end=new Date(y,m,0);
    return {start_date:`${y}-${pad(m)}-01`, end_date:`${y}-${pad(m)}-${pad(end.getDate())}`};
  }
  function quarterOptions(center=getCurrentQuarter(), span=4){ const arr=[]; for(let i=-span;i<=span;i++) arr.push(addQuarter(center,i)); return arr; }
  window.QuarterUtil={todayISO,getCurrentQuarter,getQuarterDates,getQuarterProgress,formatQuarter,addQuarter,monthKey,monthRange,quarterOptions};
})();
