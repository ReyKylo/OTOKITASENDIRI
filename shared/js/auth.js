(function () {
  'use strict';

  const DEFAULT_SESSION = {
    user_id: 'local_admin',
    username: 'local',
    full_name: 'Local Admin',
    role: 'admin',
    employee_id: null,
    login_time: new Date().toISOString(),
    expires_at: '2999-12-31T23:59:59.000Z',
    auth_disabled: true
  };

  function rootPrefix() {
    const p = location.pathname || '';
    return p.includes('/operational/') || p.includes('/financial/') || p.includes('/marketing/') || p.includes('/management/') ? '../' : '';
  }

  function ensureLocalMode() {
    try {
      const settings = JSON.parse(localStorage.getItem('otokita.settings') || '{}');
      localStorage.setItem('otokita.settings', JSON.stringify(Object.assign({}, settings, {
        role: 'admin',
        auth_mode: 'disabled',
        language: settings.language || localStorage.getItem('otokita.lang') || 'id'
      })));
      localStorage.setItem('otokita.session', JSON.stringify(DEFAULT_SESSION));
    } catch (_) {}
  }

  function getSession() {
    ensureLocalMode();
    return Object.assign({}, DEFAULT_SESSION);
  }

  function isLoggedIn() { return true; }
  function hasUsers() { return true; }
  function hasLegacyOrInvalidUsers() { return false; }
  function listUsers() { return []; }

  function disabledMessage() {
    throw new Error('Login/auth sudah dimatikan. User management tidak dipakai di versi local ini.');
  }

  function createUser() { return disabledMessage(); }
  function changePassword() { return disabledMessage(); }
  function login() { return getSession(); }
  function logout() { location.href = rootPrefix() + 'index.html'; }
  function dangerousResetAuth() {
    localStorage.removeItem('otokita.auth_users');
    localStorage.removeItem('otokita.mock_users');
    ensureLocalMode();
    return true;
  }

  function getCurrentUser() { return getSession(); }
  function requireAuth() { ensureLocalMode(); return true; }
  function requireRole() { ensureLocalMode(); return true; }
  function requireModule() { ensureLocalMode(); return true; }
  function refreshSession() { return getSession(); }
  function getEmployeeIdOfCurrentUser() { return null; }

  function debugAccess() {
    const rows = ['home', 'operational', 'financial', 'marketing', 'management'].map((m) => ({
      module: m,
      level: 'full',
      canView: true,
      auth: 'disabled'
    }));
    console.table(rows);
    return { session: getSession(), users: [], hasUsers: true, auth_disabled: true, rows };
  }

  function initPageGuard() { ensureLocalMode(); }

  document.addEventListener('DOMContentLoaded', initPageGuard);

  window.auth = {
    hasUsers,
    hasLegacyOrInvalidUsers,
    listUsers,
    createUser,
    changePassword,
    login,
    logout,
    getSession,
    isLoggedIn,
    getCurrentUser,
    requireAuth,
    requireRole,
    requireModule,
    refreshSession,
    getEmployeeIdOfCurrentUser,
    debugAccess,
    dangerousResetAuth
  };
})();
