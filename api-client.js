(() => {
  const base = (window.PISHRO_API_BASE || 'api').replace(/\/$/, '');
  let csrfToken = '';

  async function request(path, options = {}) {
    const config = { credentials: 'same-origin', ...options };
    config.headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
    const response = await fetch(`${base}/${path}`, config);
    const type = response.headers.get('content-type') || '';
    const payload = type.includes('application/json') ? await response.json() : { ok: response.ok, error: await response.text() };
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.error || 'Request failed.');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    if (payload.csrf_token) csrfToken = payload.csrf_token;
    return payload;
  }

  async function me() {
    const payload = await request('auth/me.php');
    if (payload.csrf_token) csrfToken = payload.csrf_token;
    return payload;
  }

  async function login(username, password) {
    const payload = await request('auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    csrfToken = payload.csrf_token || '';
    return payload;
  }

  async function logout() {
    const payload = await request('auth/logout.php', { method: 'POST' });
    csrfToken = '';
    return payload;
  }

  function query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });
    const suffix = search.toString();
    return suffix ? `?${suffix}` : '';
  }

  const api = {
    request,
    me,
    login,
    logout,
    getTeams: () => request(`public/teams.php`),
    getStats: () => request(`public/stats.php`),
    getPublicPlayers: (params = {}) => request(`public/players.php${query(params)}`),
    getAdminPlayers: (team) => request(`admin/players.php${query({ team })}`),
    savePlayer: (formData) => request('admin/players.php', { method: 'POST', body: formData }),
    deletePlayer: (id) => request(`admin/players.php${query({ id })}`, { method: 'DELETE' }),
    submitContact: (data) => request('public/contact.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  };

  window.PishroAPI = api;
})();
