document.addEventListener('DOMContentLoaded', async()=>{
  await window.storage.init(); await window.i18n.load();
  const page=document.body.dataset.page; document.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
  const role=window.storage.getSettings().role||'Admin'; document.getElementById('roleIndicator').textContent=role;
  if(['Sales'].includes(role)){document.getElementById('appRoot')?.classList.add('hidden');document.getElementById('accessDenied')?.classList.remove('hidden');}
  document.getElementById('langToggle')?.addEventListener('click', async()=>{ await window.i18n.toggle(); window.ui?.toast?.(window.i18n.t('language_saved','Language updated')); });
  document.getElementById('exportJsonBtn')?.addEventListener('click',()=>window.ui.download(`otokita-marketing-backup-${window.storage.todayISO()}.json`,window.storage.exportAll()));
  document.getElementById('importJsonInput')?.addEventListener('change',async(e)=>{const f=e.target.files[0];if(!f)return;try{window.storage.importAll(await f.text());window.ui.toast('Import berhasil. Reloading...');setTimeout(()=>location.reload(),700);}catch(err){window.ui.toast(err.message);}});
  window.addEventListener('languageChanged',()=>{ window.i18n.apply(); });
  if(page==='dashboard') window.MarketingDashboard?.init();
  if(page==='offline') window.OfflinePage?.init();
  if(page==='tiktok') window.TiktokPage?.init();
  if(page==='meta') window.MetaPage?.init();
  if(page==='partners') window.PartnersPage?.init();
  if(page==='assets') window.AssetsPage?.init();
  if(page==='reports') window.ReportsPage?.init();
});
