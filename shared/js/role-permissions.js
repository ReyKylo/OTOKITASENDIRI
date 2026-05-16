(function(){
  'use strict';
  const MODULES = ['home','operational','financial','marketing','management'];
  function normalizeRole(role) { return String(role || 'admin').trim().toLowerCase().replace(/[\s-]+/g, '_') || 'admin'; }
  function normalizeModule(moduleName) {
    const raw = String(moduleName || 'home').trim().toLowerCase();
    if (!raw || raw === 'root' || raw === 'index') return 'home';
    return raw;
  }
  function getLevel() { return 'full'; }
  function can() { return true; }
  function getAccessibleModules() { return MODULES.filter((m) => m !== 'home'); }
  window.permissions = {
    ROLE_PERMISSIONS: { admin: { home:'full', operational:'full', financial:'full', marketing:'full', management:'full' } },
    ROLE_ALIASES: {},
    normalizeRole,
    normalizeModule,
    getLevel,
    can,
    getAccessibleModules
  };
})();
