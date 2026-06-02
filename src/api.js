// Cliente HTTP para las Netlify Functions de /api/*.
// La sesion vive en cookie httpOnly (set por /api/login) — el browser la envia
// automaticamente. No hay token que manejar en JS.

const readBody = async (res) => {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
};

const handle = async (res) => {
  if (res.ok) return readBody(res);
  const body = await readBody(res);
  const msg = (body && body.error) || (typeof body === 'string' && body) || `HTTP ${res.status}`;
  const err = new Error(msg);
  err.status = res.status;
  throw err;
};

export const apiMe = async () => {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (res.status === 401 || res.status === 404 || res.status === 503) return null;
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  // Defensa contra dev servers (Vite) que sirven index.html en rutas /api/*
  // cuando no hay backend. Solo aceptamos JSON con shape de usuario valido.
  if (!ct.includes('application/json')) return null;
  const body = await res.json().catch(() => null);
  if (!body || typeof body !== 'object' || !body.id || !body.email) return null;
  return body;
};

export const apiLogin = (email, password) =>
  fetch('/api/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle);

export const apiSignup = (email, password) =>
  fetch('/api/signup', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle);

export const apiLogout = () =>
  fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).then(handle);

// Devuelve TODOS los registros del usuario (activos + soft-deleted) para
// reconstruir el estado completo en el cliente (la papelera vive en el mismo
// array que los activos en el frontend).
export const apiGetRecords = async () => {
  const fetchOne = (deleted) =>
    fetch(`/api/records?deleted=${deleted}`, { credentials: 'same-origin' }).then(handle);
  const [active, deleted] = await Promise.all([fetchOne('false'), fetchOne('true')]);
  return [...(active || []), ...(deleted || [])];
};

// POST acepta objeto o array — el endpoint hace upsert por id (onConflictDoUpdate).
// Para batch (migracion localStorage -> cloud) pasamos array completo.
export const apiUpsertRecords = (records) => {
  const payload = (Array.isArray(records) ? records : [records]).map((r) => ({
    id: r.id,
    fecha: r.fecha || null,
    data: r,
    deleted: !!r.deleted,
  }));
  if (payload.length === 0) return Promise.resolve([]);
  return fetch('/api/records', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
};
