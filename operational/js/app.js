(async function () {
  function pageName() { return document.body.dataset.page || 'dashboard'; }
  function refreshShell() {
    const settings = window.storage.getSettings();
    const roleEl = document.getElementById('roleIndicator');
    if (roleEl) roleEl.textContent = settings.role;
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === pageName()));
    const pending = window.storage.list('approvals').length;
    const badge = document.getElementById('pendingBadge');
    if (badge) { badge.textContent = pending; badge.classList.toggle('hidden', pending === 0); }
    document.body.classList.toggle('readonly', settings.role === 'Marketing');
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.toggle('hidden', settings.role !== 'Admin'));
  }
  function applyRoleGate() {
    const settings = window.storage.getSettings();
    if (pageName() === 'calculator' && settings.role === 'Marketing') {
      document.getElementById('calculatorLocked')?.classList.remove('hidden');
      document.getElementById('calculatorContent')?.classList.add('hidden');
    }
  }
  function bindGlobalLanguageToggle() {
    document.getElementById('globalLangToggle')?.addEventListener('click', async () => {
      const current = window.storage.getSettings().language || 'id';
      const next = current === 'id' ? 'zh' : 'id';
      await window.i18n.setLanguage(next);
      refreshShell();
      const settingLanguage = document.getElementById('settingLanguage');
      if (settingLanguage) settingLanguage.value = next;
    });
  }
  function bindGlobalJsonBackup() {
    document.querySelectorAll('.globalExportJson').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        window.ui.download(`otokita-operational-backup-${stamp}.json`, window.storage.exportAll());
        window.ui.toast('Backup JSON tersimpan. Bisa dipakai untuk pindah browser/laptop.');
      });
    });
    document.querySelectorAll('.globalImportJson').forEach((input) => {
      input.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!confirm('Import JSON akan mengganti data Operational di browser ini. Lanjut?')) {
          event.target.value = '';
          return;
        }
        try {
          const text = await file.text();
          window.storage.importAll(text);
          window.ui.toast('Import sukses. Halaman akan reload.');
          setTimeout(() => location.reload(), 500);
        } catch (err) {
          window.ui.toast('Import gagal: ' + err.message);
          event.target.value = '';
        }
      });
    });
  }

  window.appRefreshShell = refreshShell;
  window.appApplyRoleGate = applyRoleGate;

  try {
    await window.storage.init();
    await window.i18n.init();
    refreshShell();
    bindGlobalLanguageToggle();
    bindGlobalJsonBackup();
    applyRoleGate();
    if (typeof window.pageInit === 'function') window.pageInit();
  } catch (err) {
    console.error(err);
    alert('App gagal start: ' + err.message);
  }
})();
