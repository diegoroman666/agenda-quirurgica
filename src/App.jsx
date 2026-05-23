import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Eye, EyeOff, Calendar as CalendarIcon, LogIn, LogOut, User,
  Palette, Sun, Moon, ZoomIn, Info, HelpCircle, X, Plus, Trash2,
  RotateCcw, Calculator as CalcIcon, Download, FileSpreadsheet, FileText,
  ChevronLeft, ChevronRight, Search, Filter, Edit3, Save, StickyNote,
  Clock, Stethoscope, Receipt, TrendingUp, Loader2,
  Upload, CalendarClock, Tag, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import './App.css';
import * as api from './api';

const TAX_RATE = 0.1525; // Retencion honorarios Chile 2026 (escalonado: 14.5% 2025, 15.25% 2026, 16% 2027)

const DEFAULT_COLORS = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  accent: '#17a2b8',
  success: '#28a745',
};

const DEFAULT_TIPOS_CX = ['Laparoscopia', 'Artroscopia', 'Cirugia Abierta', 'Endoscopia', 'Microcirugia', 'Vanguard 360'];
const DEFAULT_MEDICOS = ['Dr./Dra.'];
const DEFAULT_INSTITUCIONES = ['Hospital San Fernando', 'Hospital Santacruz', 'Isamedica', 'Red Salud', 'Fusat'];

const NOTE_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'];
const JORNADA_COLORS = {
  ninguna: 'transparent',
  parcial: '#fde68a',
  completa: '#bfdbfe',
  extendida: '#fecaca',
  guardia: '#c7d2fe',
};
const LABEL_COLORS = [
  { v: '#0d6efd', n: 'Azul' },
  { v: '#28a745', n: 'Verde' },
  { v: '#dc3545', n: 'Rojo' },
  { v: '#fd7e14', n: 'Naranja' },
  { v: '#6f42c1', n: 'Violeta' },
  { v: '#20c997', n: 'Turquesa' },
  { v: '#e83e8c', n: 'Rosa' },
  { v: '#6c757d', n: 'Gris' },
];
const THEMES = [
  { name: 'Clinico', primary: '#0d6efd', accent: '#17a2b8' },
  { name: 'Esmeralda', primary: '#10b981', accent: '#14b8a6' },
  { name: 'Coral', primary: '#f43f5e', accent: '#fb923c' },
  { name: 'Violeta', primary: '#8b5cf6', accent: '#ec4899' },
];

const STORAGE = {
  data: 'agenda-quirurgica-data-v1',
  prefs: 'agenda-quirurgica-prefs-v1',
};

// ---------- utils ----------
const uid = () => `cx-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
const MASK = '•••••';
const fmtMaybe = (n, hidden) => hidden ? MASK : fmtMoney(n);
const pad2 = (n) => String(n).padStart(2, '0');
const dateToStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const calcFinance = (bruto) => {
  const v = parseFloat(bruto) || 0;
  const retencion = v * TAX_RATE;
  return { bruto: v, retencion, liquido: v - retencion };
};

const loadData = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE.data)) || { records: [], notes: {}, jornadas: {} }; }
  catch { return { records: [], notes: {}, jornadas: {} }; }
};
const saveData = (d) => localStorage.setItem(STORAGE.data, JSON.stringify(d));

const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE.prefs)) || {}; }
  catch { return {}; }
};
const savePrefs = (p) => localStorage.setItem(STORAGE.prefs, JSON.stringify(p));

// ---------- Eye Menu ----------
function EyeMenu({ open, onClose, colors, setColors, theme, setTheme, zoom, setZoom, onShowAbout, onShowHelp }) {
  const applyTheme = (t) => {
    const next = { ...colors, primary: t.primary, accent: t.accent };
    setColors(next);
    document.documentElement.style.setProperty('--primary-color', t.primary);
    document.documentElement.style.setProperty('--accent-color', t.accent);
  };
  const setPrimary = (v) => {
    const next = { ...colors, primary: v };
    setColors(next);
    document.documentElement.style.setProperty('--primary-color', v);
  };
  return (
    <>
      {open && <div className="eye-backdrop" onClick={onClose} />}
      <div className={`eye-menu ${open ? 'open' : ''}`} role="dialog" aria-label="Menu principal">
        <div className="eye-menu-header">
          <h3>Menu</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar menu"><X size={18} /></button>
        </div>

        <section className="eye-section">
          <div className="eye-section-title"><Palette size={14} /> Tema de color</div>
          <div className="theme-swatches">
            {THEMES.map((t) => (
              <button key={t.name} type="button" className={`theme-swatch ${colors.primary === t.primary ? 'on' : ''}`}
                style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.accent})` }}
                onClick={() => applyTheme(t)} title={t.name} aria-label={t.name} />
            ))}
          </div>
          <details className="eye-advanced">
            <summary><ChevronDown size={12} /> Personalizar color principal</summary>
            <div className="color-picker-line">
              <input type="color" value={colors.primary} onChange={(e) => setPrimary(e.target.value)} />
              <span>{colors.primary.toUpperCase()}</span>
              <button type="button" className="btn-ghost sm" onClick={() => applyTheme(THEMES[0])}><RotateCcw size={12} /></button>
            </div>
          </details>
        </section>

        <section className="eye-section">
          <div className="eye-section-title">Tema</div>
          <div className="theme-toggle">
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={16} /> Claro</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={16} /> Oscuro</button>
          </div>
        </section>

        <section className="eye-section">
          <div className="eye-section-title"><ZoomIn size={14} /> Zoom: {Math.round(zoom * 100)}%</div>
          <input type="range" min="0.7" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="zoom-range" />
          <div className="zoom-quick">
            <button onClick={() => setZoom(0.85)}>85%</button>
            <button onClick={() => setZoom(1)}>100%</button>
            <button onClick={() => setZoom(1.15)}>115%</button>
            <button onClick={() => setZoom(1.3)}>130%</button>
          </div>
        </section>

        <section className="eye-section">
          <button className="btn-ghost full" onClick={onShowHelp}><HelpCircle size={16} /> Como se usa la app</button>
          <button className="btn-ghost full" onClick={onShowAbout}><Info size={16} /> Acerca de</button>
        </section>

        <footer className="eye-footer">
          <small>Agenda Quirurgica</small>
          <small>Hecho por Diego Roman</small>
          <small>IEI-IA &copy; 2026</small>
        </footer>
      </div>
    </>
  );
}

// ---------- Login dropdown ----------
function LoginDropdown({ open, onClose, user, onLogout, onEmail, onSignup, loading, error, info }) {
  const [action, setAction] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (!open) {
      setAction('signin'); setEmail(''); setPassword(''); setConfirm(''); setLocalErr('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalErr('');
    if (action === 'signup') {
      if (email.trim().length < 3) { setLocalErr('El usuario debe tener al menos 3 caracteres.'); return; }
      if (password.length < 6) { setLocalErr('La contrasena debe tener al menos 6 caracteres.'); return; }
      if (password !== confirm) { setLocalErr('Las contrasenas no coinciden.'); return; }
      onSignup(email.trim(), password);
    } else {
      onEmail('signin', email.trim(), password);
    }
  };

  if (!open) return null;
  return (
    <>
      <div className="login-backdrop" onClick={onClose} />
      <div className="login-pop" role="dialog" aria-label="Cuenta">
        <div className="login-pop-head">
          <h4>{user ? 'Tu cuenta' : (action === 'signup' ? 'Crear cuenta' : 'Iniciar sesion')}</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {user ? (
          <>
            <div className="login-head">
              <div className="login-avatar"><User size={18} /></div>
              <div className="login-meta">
                <div className="login-name">{user.email}</div>
                <small className="muted">Sesion activa · {user.role === 'superadmin' ? 'Superadmin' : 'Usuario'}</small>
              </div>
            </div>
            <button className="btn-danger full" onClick={onLogout}><LogOut size={16} /> Cerrar sesion</button>
          </>
        ) : (
          <>
            <div className="login-tabs">
              <button type="button" className={action === 'signin' ? 'on' : ''} onClick={() => { setAction('signin'); setLocalErr(''); }}>Entrar</button>
              <button type="button" className={action === 'signup' ? 'on' : ''} onClick={() => { setAction('signup'); setLocalErr(''); }}>Crear cuenta</button>
            </div>

            {action === 'signup' ? (
              <p className="muted small">Eleg&iacute; cualquier nombre de usuario (ej. <code>juan123</code>) y una contrase&ntilde;a. Tus registros se sincronizan en la nube y los pod&eacute;s ver desde cualquier dispositivo.</p>
            ) : (
              <p className="muted small">Inicia sesion para sincronizar tus registros en la nube.</p>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <input
                className="input"
                type="text"
                required
                autoComplete={action === 'signup' ? 'username' : 'email'}
                placeholder={action === 'signup' ? 'Nombre de usuario' : 'Usuario o correo'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="input"
                type="password"
                required
                minLength={6}
                autoComplete={action === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Contrasena (min 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {action === 'signup' && (
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repetir contrasena"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              )}
              <button className="btn-primary full" disabled={loading}>
                {loading
                  ? <Loader2 size={16} className="spin" />
                  : (action === 'signup' ? <><User size={16} /> Crear cuenta</> : <><LogIn size={16} /> Entrar</>)}
              </button>
            </form>

            {(localErr || error) && <div className="alert-err">{localErr || error}</div>}
            {info && <div className="alert-ok">{info}</div>}
            <p className="muted xs">Sesion segura con JWT en cookie httpOnly + bcrypt.</p>
            <p className="muted xs"><b>Tip:</b> la app tambien funciona sin login — los datos quedan en este dispositivo.</p>
          </>
        )}
      </div>
    </>
  );
}

// ---------- Navbar ----------
function Navbar({ eyeOpen, toggleEye, onGotoAgenda, loginOpen, toggleLogin, user }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="logo-mark"><Stethoscope size={20} /></div>
        <div className="logo-text">
          <strong>Agenda</strong>
          <span>Quirurgica</span>
        </div>
      </div>

      <button className={`eye-btn ${eyeOpen ? 'closed' : ''}`} onClick={toggleEye} aria-label="Menu" title="Menu principal">
        {eyeOpen ? <EyeOff size={22} /> : <Eye size={22} />}
      </button>

      <div className="nav-right">
        <button className="nav-action" onClick={onGotoAgenda} title="Ir a la agenda">
          <CalendarIcon size={16} /> <span>Agenda</span>
        </button>
        <button className={`nav-action ${loginOpen ? 'active' : ''}`} onClick={toggleLogin} title="Iniciar sesion">
          {user ? <User size={16} /> : <LogIn size={16} />}
          <span className="d-hide-sm">{user ? 'Cuenta' : 'Iniciar sesion'}</span>
        </button>
      </div>
    </header>
  );
}

// ---------- Back Head (titulo + Ampliar + Cerrar con separacion) ----------
function BackHead({ title, icon: Icon, expanded, onToggleExpand, onClose }) {
  return (
    <div className="back-head">
      <h3>{Icon && <Icon size={18} />} {title}</h3>
      <div className="back-actions">
        <button className="icon-btn expand-btn" onClick={onToggleExpand}
          title={expanded ? 'Reducir' : 'Ampliar a pantalla completa'}>
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button className="icon-btn close-btn" onClick={onClose} title="Cerrar">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// ---------- Flip Card ----------
// Mide la cara activa (front o back) con ResizeObserver y aplica esa altura al
// .flip-inner. Esto permite que el flip 3D funcione igual en desktop y mobile
// (cards crecen al contenido real) sin atrapar el scroll dentro de un alto fijo.
function FlipCard({ flipped, front, back, className = '' }) {
  const innerRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useLayoutEffect(() => {
    if (!innerRef.current) return;
    const update = () => {
      const inner = innerRef.current;
      const active = flipped ? backRef.current : frontRef.current;
      if (!inner || !active) return;
      // scrollHeight de la face = altura real del contenido (incluso si el
      // padre tiene overflow). Sirve igual cuando la face es position:absolute.
      const natural = active.scrollHeight;
      if (natural <= 0) return;
      const isMobile = window.innerWidth < 820;
      // La agenda crece a su altura natural sin cap (sin scroll interno):
      // si la ventana del notebook es chica, scrollea la página, no la card.
      const hasAgenda = !!active.querySelector('.agenda-panel');
      const maxH = isMobile || hasAgenda ? Infinity : Math.round(window.innerHeight * 0.78);
      inner.style.height = `${Math.min(natural, maxH)}px`;
    };
    update();
    const t1 = setTimeout(update, 60);
    const t2 = setTimeout(update, 250); // segunda medicion por contenidos async
    const ro = new ResizeObserver(update);
    if (frontRef.current) ro.observe(frontRef.current);
    if (backRef.current) ro.observe(backRef.current);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [flipped]);

  return (
    <div className={`flip-card ${className} ${flipped ? 'is-flipped' : ''}`}>
      <div ref={innerRef} className="flip-inner">
        <div ref={frontRef} className="flip-face flip-front">{front}</div>
        <div ref={backRef} className="flip-face flip-back">{back}</div>
      </div>
    </div>
  );
}

// ---------- Registration Form ----------
function RegistroForm({ data, setData, onCancel, onSubmit, tiposCx, setTiposCx, medicos, setMedicos, instituciones, setInstituciones, editingId }) {
  const update = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const addOption = (list, setList, val) => {
    const t = (val || '').trim();
    if (t && !list.includes(t)) setList([...list, t]);
  };

  return (
    <form className="reg-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {editingId && <p className="muted small reg-edit-note">Editando registro existente</p>}
      <div className="reg-grid">
        <div>
          <label>Fecha</label>
          <input className="input" type="date" required value={data.fecha} onChange={(e) => update('fecha', e.target.value)} />
        </div>
        <div>
          <label>Hora inicio</label>
          <input className="input" type="time" required value={data.hora} onChange={(e) => update('hora', e.target.value)} />
        </div>
        <div className="col2">
          <label>Paciente</label>
          <input className="input" required placeholder="Nombre completo" value={data.paciente} onChange={(e) => update('paciente', e.target.value)} />
        </div>
        <div>
          <label>Edad</label>
          <input className="input" type="number" min="0" max="120" value={data.edad} onChange={(e) => update('edad', e.target.value)} />
        </div>
        <div>
          <label>Sexo</label>
          <select className="input" value={data.sexo} onChange={(e) => update('sexo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Femenino</option>
            <option>Masculino</option>
            <option>Otro</option>
          </select>
        </div>
        <div className="col2">
          <label>Tipo de cirugia</label>
          <div className="input-add">
            <select className="input" required value={data.tipoCx} onChange={(e) => update('tipoCx', e.target.value)}>
              <option value="">Seleccionar...</option>
              {tiposCx.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button type="button" className="icon-btn" title="Agregar tipo" onClick={() => {
              const v = prompt('Nuevo tipo de cirugia:'); addOption(tiposCx, setTiposCx, v);
            }}><Plus size={14} /></button>
          </div>
        </div>
        <div className="col2">
          <label>Cirujano</label>
          <div className="input-add">
            <select className="input" required value={data.medico} onChange={(e) => update('medico', e.target.value)}>
              <option value="">Seleccionar...</option>
              {medicos.map((m) => <option key={m}>{m}</option>)}
            </select>
            <button type="button" className="icon-btn" title="Agregar cirujano" onClick={() => {
              const v = prompt('Nombre del cirujano:'); addOption(medicos, setMedicos, v);
            }}><Plus size={14} /></button>
          </div>
        </div>
        <div className="col2">
          <label>Institucion / Clinica</label>
          <div className="input-add">
            <select className="input" required value={data.institucion} onChange={(e) => update('institucion', e.target.value)}>
              <option value="">Seleccionar...</option>
              {instituciones.map((i) => <option key={i}>{i}</option>)}
            </select>
            <button type="button" className="icon-btn" title="Agregar institucion" onClick={() => {
              const v = prompt('Nombre de la institucion:'); addOption(instituciones, setInstituciones, v);
            }}><Plus size={14} /></button>
          </div>
        </div>
        <div className="col2">
          <label>Honorarios brutos ($)</label>
          <input className="input bold" type="number" min="0" required value={data.valorBruto} onChange={(e) => update('valorBruto', e.target.value)} />
          {data.valorBruto && (
            <div className="finance-preview">
              <span>Retencion {(TAX_RATE * 100).toFixed(2)}%: <b>{fmtMoney(calcFinance(data.valorBruto).retencion)}</b></span>
              <span>Liquido: <b className="text-success">{fmtMoney(calcFinance(data.valorBruto).liquido)}</b></span>
            </div>
          )}
        </div>
        <div className="col2">
          <label><Tag size={12} /> Color etiqueta</label>
          <div className="label-color-row">
            {LABEL_COLORS.map((c) => (
              <button key={c.v} type="button" title={c.n}
                className={`label-color-chip ${data.colorEtiqueta === c.v ? 'on' : ''}`}
                style={{ background: c.v }}
                onClick={() => update('colorEtiqueta', c.v)} />
            ))}
            <button type="button" className={`label-color-chip none ${!data.colorEtiqueta ? 'on' : ''}`}
              onClick={() => update('colorEtiqueta', '')} title="Sin etiqueta"><X size={12} /></button>
          </div>
        </div>
        <div className="col2">
          <label>Observaciones</label>
          <textarea className="input" rows="2" placeholder="Notas opcionales..." value={data.obs} onChange={(e) => update('obs', e.target.value)} />
        </div>
      </div>

      <div className="reg-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary"><Save size={16} /> {editingId ? 'Guardar' : 'Registrar'}</button>
      </div>
    </form>
  );
}

// ---------- Day Detail Modal ----------
function DayModal({ dateStr, records, notes, jornada, onClose, onDelete, onRestore, onEdit, onMove, onAddNote, onUpdateNote, onSetJornada, onAdd, hideEarnings, setHideEarnings }) {
  const finance = useMemo(() => {
    const active = records.filter((r) => !r.deleted);
    const bruto = active.reduce((a, c) => a + (parseFloat(c.valorBruto) || 0), 0);
    return { bruto, retencion: bruto * TAX_RATE, liquido: bruto * (1 - TAX_RATE), count: active.length };
  }, [records]);

  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);

  const date = parseDate(dateStr);
  const dateLabel = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{dateLabel}</h3>
            <small className="muted">{finance.count} cirugia(s)</small>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-finance">
          <div><span>Bruto</span><b>{fmtMaybe(finance.bruto, hideEarnings)}</b></div>
          <div className="neg"><span>Retencion {(TAX_RATE * 100).toFixed(2)}%</span><b>{hideEarnings ? MASK : `-${fmtMoney(finance.retencion)}`}</b></div>
          <div className="pos">
            <span>
              Liquido del dia
              <button
                type="button"
                className="icon-btn earnings-eye"
                onClick={() => setHideEarnings((v) => !v)}
                title={hideEarnings ? 'Mostrar monto' : 'Ocultar monto'}
                aria-label={hideEarnings ? 'Mostrar monto' : 'Ocultar monto'}>
                {hideEarnings ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
            <b>{fmtMaybe(finance.liquido, hideEarnings)}</b>
          </div>
        </div>

        <div className="jornada-row">
          <span>Tipo de jornada:</span>
          {Object.keys(JORNADA_COLORS).map((k) => (
            <button key={k} className={`jornada-chip ${jornada === k ? 'active' : ''}`}
              style={{ background: JORNADA_COLORS[k], color: k === 'ninguna' ? 'inherit' : '#1a1a1a' }}
              onClick={() => onSetJornada(dateStr, k)}>{k}</button>
          ))}
        </div>

        <div className="modal-section">
          <div className="modal-section-head">
            <h4>Cirugias del dia</h4>
            <button className="btn-primary sm" onClick={() => onAdd(dateStr)}><Plus size={14} /> Agregar</button>
          </div>
          {records.length === 0 ? (
            <p className="muted center">Sin registros este dia.</p>
          ) : (
            <ul className="day-records">
              {records.map((r) => (
                <li key={r.id} className={r.deleted ? 'deleted' : ''}>
                  <div className="rec-time"><Clock size={12} /> {r.hora}</div>
                  <div className="rec-main">
                    <b>{r.paciente}</b>
                    <small>{r.tipoCx} · {r.medico} · {r.institucion}</small>
                  </div>
                  <div className="rec-money">{fmtMaybe(r.valorBruto, hideEarnings)}</div>
                  <div className="rec-actions">
                    {!r.deleted && <button className="icon-btn" title="Mover fecha (paciente suspendido)" onClick={() => onMove(r)}><CalendarClock size={14} /></button>}
                    {!r.deleted && <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}><Edit3 size={14} /></button>}
                    {r.deleted ? (
                      <button className="icon-btn ok" title="Restaurar" onClick={() => onRestore(r.id)}><RotateCcw size={14} /></button>
                    ) : (
                      <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-section">
          <div className="modal-section-head">
            <h4><StickyNote size={14} /> Notas</h4>
          </div>
          <div className="note-input">
            <input className="input" placeholder="Escribe una nota..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <div className="note-colors">
              {NOTE_COLORS.map((c) => (
                <button key={c} className={`note-color ${noteColor === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => setNoteColor(c)} type="button" />
              ))}
            </div>
            <button className="btn-primary sm" onClick={() => {
              if (noteText.trim()) { onAddNote(dateStr, { id: uid(), text: noteText.trim(), color: noteColor }); setNoteText(''); }
            }}><Plus size={14} /></button>
          </div>
          <div className="notes-list">
            {(notes || []).map((n) => (
              <div key={n.id} className="note" style={{ background: n.color }}>
                <span>{n.text}</span>
                <button className="icon-btn xs" onClick={() => onUpdateNote(dateStr, n.id, null)}><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- About / Help modals ----------
function InfoModal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---------- Calculator ----------
// Safe expression evaluator (no eval) - supports + - * / and decimals
const safeEval = (expr) => {
  const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
  if (!/^-?\d+(\.\d+)?([+\-*/]-?\d+(\.\d+)?)*$/.test(cleaned)) throw new Error('bad');
  const tokens = cleaned.match(/-?\d+(\.\d+)?|[+\-*/]/g) || [];
  // pass 1: * and /
  const mid = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '*' || t === '/') {
      const a = parseFloat(mid.pop()), b = parseFloat(tokens[++i]);
      mid.push(t === '*' ? a * b : a / b);
    } else mid.push(t);
  }
  // pass 2: + and -
  let acc = parseFloat(mid[0]);
  for (let i = 1; i < mid.length; i += 2) {
    const op = mid[i], b = parseFloat(mid[i + 1]);
    acc = op === '+' ? acc + b : acc - b;
  }
  return acc;
};

function CalculatorModal({ onClose }) {
  const [v, setV] = useState('0');
  const press = (k) => {
    if (k === 'C') return setV('0');
    if (k === '=') { try { setV(String(safeEval(v))); } catch { setV('Error'); } return; }
    if (k === '←') return setV(v.length > 1 ? v.slice(0, -1) : '0');
    setV(v === '0' ? String(k) : v + k);
  };
  const keys = ['C', '←', '÷', '×', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="calc-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3><CalcIcon size={16} /> Calculadora</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="calc-display">{v}</div>
        <div className="calc-grid">
          {keys.map((k) => (
            <button key={k} className={`calc-key ${['=', '+', '-', '×', '÷'].includes(k) ? 'op' : ''} ${k === '=' ? 'eq' : ''}`} onClick={() => press(k)}>{k}</button>
          ))}
        </div>
        <small className="muted center">Tip: util para sumar honorarios brutos antes del registro.</small>
      </div>
    </div>
  );
}

// ---------- Agenda (Weekly / Monthly) ----------
function AgendaPanel({ records, notes, jornadas, onSelectDay, onAddDay, expanded, onToggleExpand, onClose }) {
  const [mode, setMode] = useState('mes'); // semana | mes
  const [cursor, setCursor] = useState(new Date());

  const monthDays = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < first; i++) days.push(null);
    for (let i = 1; i <= last; i++) days.push(dateToStr(new Date(y, m, i)));
    return days;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return dateToStr(d);
    });
  }, [cursor]);

  const todayStr = dateToStr(new Date());
  const recordsByDay = useMemo(() => {
    const m = {};
    records.filter((r) => !r.deleted).forEach((r) => { (m[r.fecha] = m[r.fecha] || []).push(r); });
    return m;
  }, [records]);

  const titleLabel = mode === 'mes'
    ? cursor.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    : `Semana del ${parseDate(weekDays[0]).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`;

  const step = (dir) => {
    const c = new Date(cursor);
    if (mode === 'mes') c.setMonth(c.getMonth() + dir);
    else c.setDate(c.getDate() + 7 * dir);
    setCursor(c);
  };

  return (
    <div className="agenda-panel">
      <div className="agenda-head">
        <div className="agenda-title">
          <CalendarIcon size={18} />
          <h3>{titleLabel}</h3>
        </div>
        <div className="agenda-controls">
          <div className="seg">
            <button className={mode === 'semana' ? 'on' : ''} onClick={() => setMode('semana')}>Semana</button>
            <button className={mode === 'mes' ? 'on' : ''} onClick={() => setMode('mes')}>Mes</button>
          </div>
          <button className="icon-btn" onClick={() => step(-1)}><ChevronLeft size={16} /></button>
          <button className="btn-ghost sm" onClick={() => setCursor(new Date())}>Hoy</button>
          <button className="icon-btn" onClick={() => step(1)}><ChevronRight size={16} /></button>
          <div className="back-actions agenda-back-actions">
            <button className="icon-btn expand-btn" onClick={onToggleExpand}
              title={expanded ? 'Reducir' : 'Ampliar a pantalla completa'}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className="icon-btn close-btn" onClick={onClose} title="Cerrar"><X size={16} /></button>
          </div>
        </div>
      </div>

      {mode === 'mes' ? (
        <div className="month-grid">
          {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((d) => <div key={d} className="dow">{d}</div>)}
          {monthDays.map((ds, i) => {
            if (!ds) return <div key={i} className="day empty" />;
            const recs = recordsByDay[ds] || [];
            const jornada = jornadas[ds];
            const dayN = parseDate(ds).getDate();
            return (
              <div key={ds} className={`day ${ds === todayStr ? 'today' : ''}`}
                   style={{ background: jornada && jornada !== 'ninguna' ? JORNADA_COLORS[jornada] : undefined }}
                   onClick={() => onSelectDay(ds)}>
                <div className="day-head">
                  <span className="day-num">{dayN}</span>
                  <button className="add-mini" onClick={(e) => { e.stopPropagation(); onAddDay(ds); }}><Plus size={12} /></button>
                </div>
                <div className="day-events">
                  {recs.slice(0, 3).map((r) => (
                    <div key={r.id} className="ev"
                         style={r.colorEtiqueta ? { background: r.colorEtiqueta, color: '#fff' } : undefined}>
                      <b>{r.hora}</b> {r.paciente}
                    </div>
                  ))}
                  {recs.length > 3 && <small>+{recs.length - 3} mas</small>}
                  {(notes[ds] || []).slice(0, 1).map((n) => (
                    <div key={n.id} className="ev note" style={{ background: n.color, color: '#1a1a1a' }}>{n.text}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="week-scroll">
          <div className="week-grid">
            <div className="hours-col">
              <div className="dow-spacer" />
              {Array.from({ length: 24 }, (_, h) => <div key={h} className="hour-cell">{pad2(h)}:00</div>)}
            </div>
            {weekDays.map((ds) => {
              const d = parseDate(ds);
              const recs = recordsByDay[ds] || [];
              const jornada = jornadas[ds];
              return (
                <div key={ds} className={`week-col ${ds === todayStr ? 'today' : ''}`}>
                  <div className="week-col-head" onClick={() => onSelectDay(ds)}>
                    <small>{d.toLocaleDateString('es-CL', { weekday: 'short' })}</small>
                    <b>{d.getDate()}</b>
                    <button className="add-mini" onClick={(e) => { e.stopPropagation(); onAddDay(ds); }}><Plus size={12} /></button>
                  </div>
                  <div className="hours-wrap" style={{ background: jornada && jornada !== 'ninguna' ? JORNADA_COLORS[jornada] : undefined }}>
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="hour-slot" onClick={() => onSelectDay(ds)}>
                        {recs.filter((r) => parseInt(r.hora?.split(':')[0], 10) === h).map((r) => (
                          <div key={r.id} className="ev-slot"
                               style={r.colorEtiqueta ? { background: r.colorEtiqueta } : undefined}
                               title={`${r.paciente} · ${r.tipoCx}`}>
                            <b>{r.hora}</b> {r.paciente}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Reportes ----------
function ReportesPanel({ records, hideEarnings, setHideEarnings }) {
  const [preset, setPreset] = useState('mes');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const range = useMemo(() => {
    const now = new Date();
    let start, end;
    if (preset === 'dia') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (preset === 'semana') {
      start = new Date(now); start.setDate(now.getDate() - now.getDay());
      end = new Date(start); end.setDate(start.getDate() + 6);
    } else if (preset === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'bimestre') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'trimestre') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'anio') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else {
      start = from ? parseDate(from) : new Date(2000, 0, 1);
      end = to ? parseDate(to) : new Date(2100, 0, 1);
    }
    return { start, end };
  }, [preset, from, to]);

  const filtered = useMemo(() => records.filter((r) => {
    if (r.deleted) return false;
    const d = parseDate(r.fecha);
    return d >= range.start && d <= range.end;
  }), [records, range]);

  const stats = useMemo(() => {
    const bruto = filtered.reduce((a, c) => a + (parseFloat(c.valorBruto) || 0), 0);
    const retencion = bruto * TAX_RATE;
    return { bruto, retencion, liquido: bruto - retencion, count: filtered.length };
  }, [filtered]);

  const downloadXlsx = () => {
    if (!window.XLSX) { alert('Librerias de Excel cargando, intenta de nuevo en un segundo.'); return; }
    const rows = filtered.map((r) => {
      const f = calcFinance(r.valorBruto);
      return {
        Fecha: r.fecha, Hora: r.hora, Paciente: r.paciente,
        Cirugia: r.tipoCx, Cirujano: r.medico, Institucion: r.institucion,
        Edad: r.edad || '', Sexo: r.sexo || '',
        'Bruto ($)': f.bruto, [`Retencion ${(TAX_RATE * 100).toFixed(2)}% ($)`]: Math.round(f.retencion),
        'Liquido ($)': Math.round(f.liquido), Observaciones: r.obs || '',
      };
    });
    const ws = window.XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 11 }, { wch: 7 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 30 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Cirugias');
    window.XLSX.writeFile(wb, `agenda-quirurgica-${preset}.xlsx`);
  };

  const downloadPdf = () => {
    if (!window.jspdf) { alert('Librerias de PDF cargando, intenta de nuevo en un segundo.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const periodLabel = preset === 'custom' ? `${from || '—'} a ${to || '—'}` : preset;
    doc.setFontSize(18); doc.setTextColor(13, 110, 253);
    doc.text('Agenda Quirurgica', 14, 18);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Reporte ${periodLabel}`, 14, 26);
    doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 14, 32);
    doc.setDrawColor(200); doc.line(14, 36, 196, 36);

    doc.setFontSize(13); doc.setTextColor(0); doc.text('Resumen', 14, 46);
    doc.setFontSize(10);
    doc.text(`Cirugias: ${stats.count}`, 18, 54);
    doc.text(`Bruto: ${fmtMoney(stats.bruto)}`, 18, 60);
    doc.setTextColor(220, 53, 69);
    doc.text(`Retencion ${(TAX_RATE * 100).toFixed(2)}%: -${fmtMoney(stats.retencion)}`, 18, 66);
    doc.setFontSize(13); doc.setTextColor(40, 167, 69);
    doc.text(`Liquido: ${fmtMoney(stats.liquido)}`, 18, 76);

    doc.setFontSize(12); doc.setTextColor(0); doc.text('Detalle', 14, 90);
    doc.setFillColor(240, 240, 240); doc.rect(14, 93, 182, 6, 'F');
    doc.setFontSize(8); doc.setTextColor(60);
    doc.text('Fecha', 16, 97); doc.text('Paciente', 40, 97);
    doc.text('Cirugia', 86, 97); doc.text('Cirujano', 128, 97);
    doc.text('Bruto', 165, 97); doc.text('Liquido', 182, 97);

    let y = 104; doc.setTextColor(0);
    filtered.forEach((r) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const f = calcFinance(r.valorBruto);
      doc.text(String(r.fecha || ''), 16, y);
      doc.text(String(r.paciente || '').slice(0, 26), 40, y);
      doc.text(String(r.tipoCx || '').slice(0, 22), 86, y);
      doc.text(String(r.medico || '').slice(0, 18), 128, y);
      doc.text(fmtMoney(f.bruto), 165, y);
      doc.text(fmtMoney(f.liquido), 182, y);
      y += 5;
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Hecho por Diego Roman · IEI-IA 2026 · Derechos reservados', 14, 290);
    doc.save(`agenda-quirurgica-${preset}.pdf`);
  };

  return (
    <div className="reportes">
      <div className="rep-presets">
        {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['bimestre', '2 meses'], ['trimestre', '3 meses'], ['anio', 'Año'], ['custom', 'Personalizado']].map(([k, l]) => (
          <button key={k} className={preset === k ? 'on' : ''} onClick={() => setPreset(k)}>{l}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="rep-range">
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span>a</span>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}

      <div className="earnings-toolbar">
        <button
          type="button"
          className="earnings-toggle"
          onClick={() => setHideEarnings((v) => !v)}
          title={hideEarnings ? 'Mostrar montos' : 'Ocultar montos'}
          aria-label={hideEarnings ? 'Mostrar montos ganados' : 'Ocultar montos ganados'}>
          {hideEarnings ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{hideEarnings ? 'Mostrar montos' : 'Ocultar montos'}</span>
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi"><span>Cirugias</span><b>{stats.count}</b></div>
        <div className="kpi"><span>Bruto</span><b>{fmtMaybe(stats.bruto, hideEarnings)}</b></div>
        <div className="kpi neg"><span>Retencion {(TAX_RATE * 100).toFixed(2)}%</span><b>{hideEarnings ? MASK : `-${fmtMoney(stats.retencion)}`}</b></div>
        <div className="kpi pos"><span>Liquido</span><b>{fmtMaybe(stats.liquido, hideEarnings)}</b></div>
      </div>

      <div className="rep-actions">
        <button className="btn-primary" onClick={downloadXlsx}><FileSpreadsheet size={16} /> Descargar Excel</button>
        <button className="btn-primary" onClick={downloadPdf} style={{ background: '#dc3545' }}><FileText size={16} /> Descargar PDF</button>
      </div>

      <div className="rep-list">
        {preset === 'anio' ? (
          <p className="muted center">
            Año completo seleccionado ({stats.count} registros). Usá los botones <b>Descargar Excel</b> o <b>Descargar PDF</b> para ver el detalle.
          </p>
        ) : filtered.length === 0 ? (
          <p className="muted center">Sin registros en este periodo.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rep-row">
              <small>{r.fecha} {r.hora}</small>
              <b>{r.paciente}</b>
              <span>{r.tipoCx}</span>
              <span className="money">{fmtMaybe(r.valorBruto, hideEarnings)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Historial ----------
function HistorialPanel({ records, onEdit, onDelete, onRestore, onView, onMove, hideEarnings, setHideEarnings }) {
  const [q, setQ] = useState('');
  const [filterCol, setFilterCol] = useState('paciente');
  const [showDeleted, setShowDeleted] = useState(false);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return records.filter((r) => {
      if (!showDeleted && r.deleted) return false;
      if (showDeleted && !r.deleted) return false;
      if (!term) return true;
      const val = String(r[filterCol] ?? '').toLowerCase();
      return val.includes(term);
    });
  }, [records, q, filterCol, showDeleted]);

  return (
    <div className="historial">
      <div className="hist-toolbar">
        <div className="hist-search">
          <Search size={14} />
          <input className="input" placeholder={`Buscar por ${filterCol}...`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={filterCol} onChange={(e) => setFilterCol(e.target.value)}>
          <option value="paciente">Paciente</option>
          <option value="tipoCx">Tipo de cirugia</option>
          <option value="medico">Cirujano</option>
          <option value="institucion">Institucion</option>
          <option value="fecha">Fecha</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          Papelera
        </label>
        <button
          type="button"
          className="earnings-toggle"
          onClick={() => setHideEarnings((v) => !v)}
          title={hideEarnings ? 'Mostrar montos' : 'Ocultar montos'}
          aria-label={hideEarnings ? 'Mostrar montos ganados' : 'Ocultar montos ganados'}>
          {hideEarnings ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{hideEarnings ? 'Mostrar montos' : 'Ocultar montos'}</span>
        </button>
      </div>

      {/* Vista de tabla (desktop / tablet) */}
      <div className="hist-table-wrap">
        <table className="hist-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Hora</th><th>Paciente</th><th>Cirugia</th><th>Cirujano</th><th>Institucion</th><th>Bruto</th><th>Liquido</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="muted center">Sin registros.</td></tr>
            ) : filtered.map((r) => {
              const f = calcFinance(r.valorBruto);
              return (
                <tr key={r.id} className={r.deleted ? 'deleted' : ''}>
                  <td>{r.fecha}</td>
                  <td>{r.hora}</td>
                  <td><b>{r.paciente}</b></td>
                  <td>{r.tipoCx}</td>
                  <td>{r.medico}</td>
                  <td>{r.institucion}</td>
                  <td>{fmtMaybe(f.bruto, hideEarnings)}</td>
                  <td className="pos">{fmtMaybe(f.liquido, hideEarnings)}</td>
                  <td className="actions">
                    <button className="icon-btn" title="Ver" onClick={() => onView(r)}><Eye size={14} /></button>
                    {!r.deleted && <button className="icon-btn" title="Mover fecha" onClick={() => onMove(r)}><CalendarClock size={14} /></button>}
                    {!r.deleted && <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}><Edit3 size={14} /></button>}
                    {r.deleted ? (
                      <button className="icon-btn ok" title="Restaurar" onClick={() => onRestore(r.id)}><RotateCcw size={14} /></button>
                    ) : (
                      <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de cards (móvil) — sin scroll horizontal */}
      <div className="hist-cards-mobile">
        {filtered.length === 0 ? (
          <p className="muted center">Sin registros.</p>
        ) : filtered.map((r) => {
          const f = calcFinance(r.valorBruto);
          return (
            <div key={r.id} className={`hist-card ${r.deleted ? 'deleted' : ''}`}>
              <div className="hist-card-head">
                <div className="hist-card-name">
                  <b>{r.paciente}</b>
                  <small className="muted">{r.fecha} · {r.hora}</small>
                </div>
                <div className="hist-card-actions actions">
                  <button className="icon-btn" title="Ver" onClick={() => onView(r)}><Eye size={14} /></button>
                  {!r.deleted && <button className="icon-btn" title="Mover fecha" onClick={() => onMove(r)}><CalendarClock size={14} /></button>}
                  {!r.deleted && <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}><Edit3 size={14} /></button>}
                  {r.deleted ? (
                    <button className="icon-btn ok" title="Restaurar" onClick={() => onRestore(r.id)}><RotateCcw size={14} /></button>
                  ) : (
                    <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
              <div className="hist-card-body">
                <span><b>Cirugía:</b> {r.tipoCx}</span>
                <span><b>Cirujano:</b> {r.medico}</span>
                <span><b>Institución:</b> {r.institucion}</span>
              </div>
              <div className="hist-card-money">
                <span>Bruto: <b>{fmtMaybe(f.bruto, hideEarnings)}</b></span>
                <span className="pos">Líquido: <b>{fmtMaybe(f.liquido, hideEarnings)}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      <small className="muted">{filtered.length} registro(s)</small>
    </div>
  );
}

// ---------- Move Date Modal ----------
function MoveDateModal({ record, onSave, onClose }) {
  const [newDate, setNewDate] = useState(record.fecha);
  const [newTime, setNewTime] = useState(record.hora || '08:00');
  const [reason, setReason] = useState(record.motivoMovimiento || '');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3><CalendarClock size={18} /> Reprogramar / Mover fecha</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="move-info">
          <span>Paciente:</span> <b>{record.paciente}</b><br />
          <span>Cirugia:</span> <b>{record.tipoCx}</b><br />
          <small className="muted">Actual: {record.fecha} {record.hora}</small>
        </div>
        <div className="reg-grid">
          <div>
            <label>Nueva fecha</label>
            <input className="input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div>
            <label>Nueva hora</label>
            <input className="input" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
          <div className="col2">
            <label>Motivo (opcional)</label>
            <input className="input" placeholder="Ej: paciente suspendido, sala no disponible..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <div className="reg-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => { onSave(record.id, newDate, newTime, reason); onClose(); }}>
            <Save size={14} /> Mover fecha
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Importar Excel Modal ----------
const APP_FIELDS = [
  { k: 'paciente', l: 'Paciente', match: ['paciente', 'nombre', 'patient'], required: true },
  { k: 'fecha', l: 'Fecha o dia', match: ['fecha', 'date', 'dia'], required: false },
  { k: 'hora', l: 'Hora', match: ['hora', 'time', 'horario'] },
  { k: 'tipoCx', l: 'Tipo cirugia', match: ['cirugia', 'procedimiento', 'tipo'] },
  { k: 'medico', l: 'Cirujano', match: ['medico', 'cirujano', 'doctor', 'profesional'] },
  { k: 'institucion', l: 'Institucion', match: ['institucion', 'clinica', 'hospital', 'lugar'] },
  { k: 'valorBruto', l: 'Honorarios', match: ['valor', 'monto', 'honorario', 'precio', 'bruto'] },
  { k: 'edad', l: 'Edad', match: ['edad', 'age'] },
  { k: 'sexo', l: 'Sexo', match: ['sexo', 'genero', 'sex'] },
];

function ImportarExcelModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const now = new Date();
  const [targetMonth, setTargetMonth] = useState(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState('');

  const guessMap = (cols) => {
    const m = {};
    const lower = cols.map((c) => String(c).toLowerCase().trim());
    APP_FIELDS.forEach((f) => {
      const idx = lower.findIndex((c) => f.match.some((kw) => c.includes(kw)));
      if (idx >= 0) m[f.k] = cols[idx];
    });
    return m;
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!window.XLSX) { setErr('La libreria de Excel aun no cargo, espera 1-2 segundos.'); return; }
    setParsing(true); setErr('');
    try {
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!json.length) throw new Error('La hoja esta vacia.');
      const cols = Object.keys(json[0]);
      setHeaders(cols); setRows(json);
      setMapping(guessMap(cols));
      setFileName(file.name);
    } catch (e) { setErr(e.message || 'No se pudo leer el archivo.'); }
    finally { setParsing(false); }
  };

  const normalizeDate = (raw, ym) => {
    const [y, m] = ym.split('-').map(Number);
    if (!raw && raw !== 0) return `${ym}-01`;
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
      const [d, mm, yy] = s.split('/').map(Number);
      const year = yy < 100 ? 2000 + yy : yy;
      return `${year}-${pad2(mm)}-${pad2(d)}`;
    }
    if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(s)) {
      const [d, mm, yy] = s.split('-').map(Number);
      const year = yy < 100 ? 2000 + yy : yy;
      return `${year}-${pad2(mm)}-${pad2(d)}`;
    }
    if (/^\d{1,2}$/.test(s)) {
      return `${y}-${pad2(m)}-${pad2(Math.min(31, parseInt(s, 10)))}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return dateToStr(d);
    return `${ym}-01`;
  };

  const normalizeTime = (raw) => {
    if (!raw) return '08:00';
    const s = String(raw).trim();
    if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
    if (/^\d{1,2}$/.test(s)) return `${pad2(parseInt(s, 10))}:00`;
    return '08:00';
  };

  const doImport = () => {
    if (!rows.length) { setErr('Adjunta primero un archivo .xlsx, .xls o .csv'); return; }
    if (!mapping.paciente) { setErr('Debes mapear al menos la columna "Paciente".'); return; }
    const out = rows.map((row) => {
      const rec = { id: uid(), deleted: false, created_at: new Date().toISOString(), colorEtiqueta: LABEL_COLORS[0].v };
      APP_FIELDS.forEach((f) => { rec[f.k] = mapping[f.k] ? row[mapping[f.k]] ?? '' : ''; });
      rec.fecha = normalizeDate(rec.fecha, targetMonth);
      rec.hora = normalizeTime(rec.hora);
      rec.valorBruto = String(rec.valorBruto || '').replace(/[^\d.-]/g, '');
      return rec;
    }).filter((r) => String(r.paciente || '').trim().length > 0);
    if (!out.length) { setErr('Ningun registro tenia paciente valido.'); return; }
    onImport(out, targetMonth);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Upload size={18} /> Importar Excel a la agenda</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="muted small">Adjunta tu plantilla (.xlsx, .xls o .csv). Detectaremos las columnas y podras ajustar el mapeo antes de importarlas al mes elegido.</p>

        <div className="import-step">
          <label>1. Mes destino del calendario</label>
          <input className="input" type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} />
          <small className="muted">Si tu plantilla solo trae el dia (1, 2, 3...) sin mes/anio, se completa con este mes.</small>
        </div>

        <div className="import-step">
          <label>2. Archivo</label>
          <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFile(e.target.files?.[0])} />
          {parsing && <small className="muted"><Loader2 size={12} className="spin" /> Leyendo archivo...</small>}
          {fileName && <small className="muted">Archivo: <b>{fileName}</b> · {rows.length} filas detectadas</small>}
        </div>

        {headers.length > 0 && (
          <>
            <div className="import-step">
              <label>3. Mapear columnas → campos de la app</label>
              <div className="map-grid">
                {APP_FIELDS.map((f) => (
                  <div key={f.k} className="map-row">
                    <span>{f.l}{f.required && ' *'}</span>
                    <select className="input" value={mapping[f.k] || ''} onChange={(e) => setMapping({ ...mapping, [f.k]: e.target.value })}>
                      <option value="">— ignorar —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="import-step">
              <label>Previsualizacion (primeras 3 filas)</label>
              <div className="import-preview">
                {rows.slice(0, 3).map((r, i) => (
                  <div key={i} className="prev-row">
                    <b>{mapping.paciente ? r[mapping.paciente] : '(sin paciente)'}</b>
                    <small>{mapping.fecha ? normalizeDate(r[mapping.fecha], targetMonth) : `${targetMonth}-01`} {mapping.hora ? normalizeTime(r[mapping.hora]) : '08:00'}</small>
                    <small>{mapping.tipoCx ? r[mapping.tipoCx] : ''} · {mapping.medico ? r[mapping.medico] : ''}</small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {err && <div className="alert-err">{err}</div>}

        <div className="reg-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={doImport} disabled={!rows.length}>
            <Upload size={14} /> Importar {rows.length || ''} registros
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================
export default function App() {
  // prefs
  const prefs0 = loadPrefs();
  const [theme, setTheme] = useState(prefs0.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  const [colors, setColors] = useState({ ...DEFAULT_COLORS, ...(prefs0.colors || {}) });
  const [zoom, setZoom] = useState(prefs0.zoom || 1);
  // Visibilidad de montos ganados (persistida en prefs). Default: oculto.
  const [hideEarnings, setHideEarnings] = useState(
    prefs0.hideEarnings === undefined ? true : !!prefs0.hideEarnings
  );

  // data
  const [data, setData] = useState(loadData);
  const records = data.records;
  const notes = data.notes;
  const jornadas = data.jornadas;
  const updateData = (mut) => setData((prev) => { const next = mut(prev); saveData(next); return next; });

  // UI state
  const [eyeOpen, setEyeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  // Flip por slot: tl=registro, tr=agenda, bl=reportes, br=historial
  const [flippedSlots, setFlippedSlots] = useState({ tl: false, tr: false, bl: false, br: false });
  // Que card esta expandido a full body (1 a la vez)
  const [expandedSlot, setExpandedSlot] = useState(null);
  const toggleFlip = (slot, v) => setFlippedSlots((p) => ({ ...p, [slot]: typeof v === 'boolean' ? v : !p[slot] }));
  const closeBack = (slot) => { setFlippedSlots((p) => ({ ...p, [slot]: false })); if (expandedSlot === slot) setExpandedSlot(null); };
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [movingRecord, setMovingRecord] = useState(null);
  const [authInfo, setAuthInfo] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  // auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // catalogs
  const prefsCatalogs = loadPrefs().catalogs || {};
  const [tiposCx, setTiposCx] = useState(prefsCatalogs.tiposCx || DEFAULT_TIPOS_CX);
  const [medicos, setMedicos] = useState(prefsCatalogs.medicos || DEFAULT_MEDICOS);
  const [instituciones, setInstituciones] = useState(prefsCatalogs.instituciones || DEFAULT_INSTITUCIONES);

  // form
  const emptyForm = () => ({
    fecha: dateToStr(new Date()),
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    paciente: '', edad: '', sexo: '', tipoCx: '', medico: '', institucion: '',
    valorBruto: '', obs: '', colorEtiqueta: LABEL_COLORS[0].v,
  });
  const [formData, setFormData] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const agendaRef = useRef(null);

  // persist prefs
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    Object.entries(colors).forEach(([k, v]) => document.documentElement.style.setProperty(`--${k}-color`, v));
    document.documentElement.style.setProperty('--app-zoom', zoom);
    // Zoom a nivel body: ajusta layout y scroll bounds en Chromium, Safari y Firefox modernos
    if (zoom === 1) document.body.style.removeProperty('zoom');
    else document.body.style.zoom = String(zoom);
    savePrefs({ theme, colors, zoom, hideEarnings, catalogs: { tiposCx, medicos, instituciones } });
  }, [theme, colors, zoom, hideEarnings, tiposCx, medicos, instituciones]);

  // CDN libs for XLSX + PDF
  useEffect(() => {
    const inject = (src) => {
      if (document.querySelector(`script[data-cdn="${src}"]`)) return;
      const s = document.createElement('script');
      s.src = src; s.async = true; s.dataset.cdn = src;
      document.head.appendChild(s);
    };
    inject('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
    inject('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }, []);

  // Lock body scroll when any modal is open — evita que el scroll del modal
  // se contagie al body (mezcla con el fondo / scroll del contraste).
  const anyModalOpen = !!(selectedDay || movingRecord || viewRecord || showCalculator || showImportExcel || showAbout || showHelp);
  useEffect(() => {
    if (anyModalOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [anyModalOpen]);

  // ---------- CLOUD SYNC (Netlify DB) ----------
  // - Al iniciar sesion: baja los registros del usuario via /api/records, sube
  //   los locales que no existan remotamente (migracion del primer dispositivo)
  //   y mergea. La sesion vive en cookie httpOnly seteada por /api/login.
  // - En cada cambio posterior a records: upsert delta via POST /api/records.
  // - Sin sesion: solo localStorage (modo offline).
  const syncBootRef = useRef(false);
  const lastSyncedSigRef = useRef('');
  useEffect(() => {
    if (!user) {
      syncBootRef.current = false;
      lastSyncedSigRef.current = '';
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await api.apiGetRecords();
        if (cancelled) return;
        const remote = (rows || []).map((row) => ({ ...(row.data || {}), id: row.id, deleted: !!row.deleted }));
        const remoteIds = new Set(remote.map((r) => r.id));
        const localOnly = (records || []).filter((r) => !remoteIds.has(r.id));
        if (localOnly.length > 0) {
          try { await api.apiUpsertRecords(localOnly); }
          catch (e) { console.warn('[sync] migration upload:', e.message); }
        }
        const merged = [...remote, ...localOnly];
        updateData((p) => ({ ...p, records: merged }));
        lastSyncedSigRef.current = JSON.stringify(merged.map((r) => [r.id, r]));
        syncBootRef.current = true;
      } catch (e) {
        console.warn('[sync] boot:', e?.message || e);
        syncBootRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !syncBootRef.current) return;
    const sig = JSON.stringify((records || []).map((r) => [r.id, r]));
    if (sig === lastSyncedSigRef.current) return;
    const prev = (() => { try { return new Map(JSON.parse(lastSyncedSigRef.current || '[]')); } catch { return new Map(); } })();
    const changed = (records || []).filter((r) => {
      const p = prev.get(r.id);
      return !p || JSON.stringify(p) !== JSON.stringify(r);
    });
    if (changed.length === 0) { lastSyncedSigRef.current = sig; return; }
    (async () => {
      try { await api.apiUpsertRecords(changed); lastSyncedSigRef.current = sig; }
      catch (e) { console.warn('[sync] push:', e.message); }
    })();
  }, [records, user?.id]);

  // auth bootstrap: pregunta /api/me al cargar para saber si hay sesion activa
  // (cookie httpOnly persiste entre reloads y dispositivos del mismo browser).
  useEffect(() => {
    let mounted = true;
    api.apiMe()
      .then((me) => { if (mounted) setUser(me); })
      .catch(() => { if (mounted) setUser(null); });
    return () => { mounted = false; };
  }, []);

  // handlers
  const gotoAgenda = () => {
    toggleFlip('tr', true);
    setExpandedSlot('tr');
    setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleEmail = async (_action, email, password) => {
    setAuthLoading(true); setAuthError(''); setAuthInfo('');
    try {
      const me = await api.apiLogin(email, password);
      setUser(me);
      setLoginOpen(false);
    } catch (e) { setAuthError(e.message || 'Credenciales invalidas'); }
    finally { setAuthLoading(false); }
  };

  const handleSignup = async (email, password) => {
    setAuthLoading(true); setAuthError(''); setAuthInfo('');
    try {
      const me = await api.apiSignup(email, password);
      setUser(me);
      setLoginOpen(false);
      setAuthInfo('Cuenta creada y sesion iniciada.');
    } catch (e) { setAuthError(e.message || 'No se pudo crear la cuenta'); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    try { await api.apiLogout(); } catch {}
    setUser(null); setLoginOpen(false);
  };

  const openNewRegistro = (dateStr) => {
    setEditingId(null);
    setFormData({ ...emptyForm(), fecha: dateStr || dateToStr(new Date()) });
    toggleFlip('tl', true);
    document.getElementById('card-registro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitRegistro = () => {
    updateData((prev) => {
      const next = { ...prev };
      if (editingId) {
        next.records = prev.records.map((r) => r.id === editingId ? { ...r, ...formData } : r);
      } else {
        next.records = [...prev.records, { id: uid(), ...formData, deleted: false, created_at: new Date().toISOString() }];
      }
      return next;
    });
    closeBack('tl');
    setEditingId(null);
    setFormData(emptyForm());
  };

  const editRecord = (r) => {
    setEditingId(r.id);
    setFormData({ ...emptyForm(), ...r });
    toggleFlip('tl', true);
    setSelectedDay(null);
    document.getElementById('card-registro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteRecord = (id) => updateData((p) => ({ ...p, records: p.records.map((r) => r.id === id ? { ...r, deleted: true } : r) }));
  const restoreRecord = (id) => updateData((p) => ({ ...p, records: p.records.map((r) => r.id === id ? { ...r, deleted: false } : r) }));
  const moveRecord = (id, newDate, newTime, motivo) => updateData((p) => ({
    ...p,
    records: p.records.map((r) => r.id === id ? { ...r, fecha: newDate, hora: newTime, motivoMovimiento: motivo || r.motivoMovimiento } : r),
  }));
  const bulkImport = (newRecords) => updateData((p) => ({ ...p, records: [...p.records, ...newRecords] }));

  const addNote = (dateStr, note) => updateData((p) => ({ ...p, notes: { ...p.notes, [dateStr]: [...(p.notes[dateStr] || []), note] } }));
  const removeNote = (dateStr, noteId) => updateData((p) => ({ ...p, notes: { ...p.notes, [dateStr]: (p.notes[dateStr] || []).filter((n) => n.id !== noteId) } }));
  const setJornada = (dateStr, kind) => updateData((p) => ({ ...p, jornadas: { ...p.jornadas, [dateStr]: kind } }));

  const selectedDayRecords = useMemo(() => selectedDay ? records.filter((r) => r.fecha === selectedDay) : [], [records, selectedDay]);

  return (
    <div className="app-shell" style={{ '--app-zoom': zoom }}>
      <Navbar
        eyeOpen={eyeOpen}
        toggleEye={() => setEyeOpen((v) => !v)}
        onGotoAgenda={gotoAgenda}
        loginOpen={loginOpen}
        toggleLogin={() => setLoginOpen((v) => !v)}
        user={user}
      />

      <EyeMenu
        open={eyeOpen}
        onClose={() => setEyeOpen(false)}
        colors={colors}
        setColors={setColors}
        theme={theme}
        setTheme={setTheme}
        zoom={zoom}
        setZoom={setZoom}
        onShowAbout={() => { setEyeOpen(false); setShowAbout(true); }}
        onShowHelp={() => { setEyeOpen(false); setShowHelp(true); }}
      />

      <LoginDropdown
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        user={user}
        onLogout={handleLogout}
        onEmail={handleEmail}
        onSignup={handleSignup}
        loading={authLoading}
        error={authError}
        info={authInfo}
      />

      <main className="main-content">
        <section className="hero">
          <h1>Bienvenido a tu <span className="grad">Agenda Quirurgica</span></h1>
          <p>Registra cirugias, visualiza la agenda semanal o mensual y calcula tus honorarios con retencion automatica del {(TAX_RATE * 100).toFixed(2)}%.</p>
        </section>

        <section className={`grid-4 ${expandedSlot ? `expanded-${expandedSlot}` : ''}`} ref={agendaRef}>
          {/* CARD 1 - Registro */}
          <div id="card-registro" className="grid-slot slot-tl">
            <FlipCard
              flipped={flippedSlots.tl}
              front={
                <div className="card front-card">
                  <div className="card-icon"><Stethoscope size={28} /></div>
                  <h3>Iniciar registro</h3>
                  <p>Agrega una nueva cirugia con paciente, monto, fecha, hora, color de etiqueta y mas. O importa una plantilla Excel completa.</p>
                  <div className="card-actions-row">
                    <button className="btn-primary big" onClick={() => openNewRegistro()}>
                      <Plus size={18} /> Nuevo registro
                    </button>
                    <button className="btn-ghost" onClick={() => setShowImportExcel(true)}>
                      <Upload size={16} /> Importar Excel
                    </button>
                  </div>
                </div>
              }
              back={
                <div className="card back-card">
                  <BackHead title="Nuevo registro" icon={Stethoscope}
                    expanded={expandedSlot === 'tl'}
                    onToggleExpand={() => setExpandedSlot(expandedSlot === 'tl' ? null : 'tl')}
                    onClose={() => { closeBack('tl'); setEditingId(null); }} />
                  <RegistroForm
                    data={formData}
                    setData={setFormData}
                    onCancel={() => { closeBack('tl'); setEditingId(null); }}
                    onSubmit={submitRegistro}
                    tiposCx={tiposCx} setTiposCx={setTiposCx}
                    medicos={medicos} setMedicos={setMedicos}
                    instituciones={instituciones} setInstituciones={setInstituciones}
                    editingId={editingId}
                  />
                </div>
              }
            />
          </div>

          {/* CARD 2 - Agenda */}
          <div className="grid-slot slot-tr">
            <FlipCard
              flipped={flippedSlots.tr}
              front={
                <div className="card front-card">
                  <div className="card-icon"><CalendarIcon size={28} /></div>
                  <h3>Revisar agenda</h3>
                  <p>Visualiza por semana o mes. Bloques de 24 horas, jornadas y notas.</p>
                  <button className="btn-primary big" onClick={() => toggleFlip('tr', true)}>
                    <CalendarIcon size={18} /> Abrir agenda
                  </button>
                </div>
              }
              back={
                <div className="card back-card no-pad">
                  <AgendaPanel
                    records={records}
                    notes={notes}
                    jornadas={jornadas}
                    onSelectDay={setSelectedDay}
                    onAddDay={openNewRegistro}
                    expanded={expandedSlot === 'tr'}
                    onToggleExpand={() => setExpandedSlot(expandedSlot === 'tr' ? null : 'tr')}
                    onClose={() => closeBack('tr')}
                  />
                </div>
              }
            />
          </div>

          {/* CARD 3 - Reportes */}
          <div className="grid-slot slot-bl">
            <FlipCard
              flipped={flippedSlots.bl}
              front={
                <div className="card front-card">
                  <div className="card-icon"><TrendingUp size={28} /></div>
                  <h3>Reportes y descargas</h3>
                  <p>Ingresos por semana, mes, 2 meses o personalizado. Retencion {(TAX_RATE * 100).toFixed(2)}%.</p>
                  <div className="card-actions-row">
                    <button className="btn-primary big" onClick={() => toggleFlip('bl', true)}>
                      <Download size={18} /> Ver reportes
                    </button>
                    <button className="btn-ghost" onClick={() => setShowCalculator(true)}><CalcIcon size={16} /> Calculadora</button>
                  </div>
                </div>
              }
              back={
                <div className="card back-card">
                  <BackHead title="Reportes" icon={TrendingUp}
                    expanded={expandedSlot === 'bl'}
                    onToggleExpand={() => setExpandedSlot(expandedSlot === 'bl' ? null : 'bl')}
                    onClose={() => closeBack('bl')} />
                  <ReportesPanel records={records} hideEarnings={hideEarnings} setHideEarnings={setHideEarnings} />
                </div>
              }
            />
          </div>

          {/* CARD 4 - Historial */}
          <div className="grid-slot slot-br">
            <FlipCard
              flipped={flippedSlots.br}
              front={
                <div className="card front-card">
                  <div className="card-icon"><Receipt size={28} /></div>
                  <h3>Historial</h3>
                  <p>Busca registros por paciente, cirujano, institucion o fecha. Papelera con restauracion.</p>
                  <button className="btn-primary big" onClick={() => toggleFlip('br', true)}>
                    <Filter size={18} /> Abrir historial
                  </button>
                </div>
              }
              back={
                <div className="card back-card">
                  <BackHead title="Historial" icon={Receipt}
                    expanded={expandedSlot === 'br'}
                    onToggleExpand={() => setExpandedSlot(expandedSlot === 'br' ? null : 'br')}
                    onClose={() => closeBack('br')} />
                  <HistorialPanel
                    records={records}
                    onEdit={editRecord}
                    onDelete={deleteRecord}
                    onRestore={restoreRecord}
                    onView={setViewRecord}
                    onMove={setMovingRecord}
                    hideEarnings={hideEarnings}
                    setHideEarnings={setHideEarnings}
                  />
                </div>
              }
            />
          </div>
        </section>

        <footer className="app-footer">
          <span>Agenda Quirurgica</span> · <span>Hecho por Diego Roman</span> · <span>IEI-IA &copy; 2026</span> · <span>Derechos reservados</span>
        </footer>
      </main>

      {selectedDay && (
        <DayModal
          dateStr={selectedDay}
          records={selectedDayRecords}
          notes={notes[selectedDay] || []}
          jornada={jornadas[selectedDay] || 'ninguna'}
          onClose={() => setSelectedDay(null)}
          onDelete={deleteRecord}
          onRestore={restoreRecord}
          onEdit={editRecord}
          onMove={setMovingRecord}
          onAddNote={addNote}
          onUpdateNote={removeNote}
          onSetJornada={setJornada}
          onAdd={openNewRegistro}
          hideEarnings={hideEarnings}
          setHideEarnings={setHideEarnings}
        />
      )}

      {movingRecord && (
        <MoveDateModal
          record={movingRecord}
          onSave={moveRecord}
          onClose={() => setMovingRecord(null)}
        />
      )}

      {showImportExcel && (
        <ImportarExcelModal
          onClose={() => setShowImportExcel(false)}
          onImport={(recs) => { bulkImport(recs); toggleFlip('tr', true); setExpandedSlot('tr'); }}
        />
      )}

      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}

      {showAbout && (
        <InfoModal title="Acerca de" onClose={() => setShowAbout(false)}>
          <p><b>Agenda Quirurgica</b></p>
          <p>Planner profesional para cirujanos. Registra cirugias, gestiona la agenda y calcula tus honorarios netos con la retencion de impuesto Chile {new Date().getFullYear()} ({(TAX_RATE * 100).toFixed(2)}%).</p>
          <hr />
          <p>Hecho por <b>Diego Roman</b></p>
          <p>IEI-IA &copy; 2026 · Todos los derechos reservados.</p>
        </InfoModal>
      )}

      {showHelp && (
        <InfoModal title="Como se usa la app" onClose={() => setShowHelp(false)}>
          <ol className="help-list">
            <li><b>Iniciar registro</b> (arriba izq.): el grid gira y muestra el formulario con color de etiqueta. Tambien puedes <b>Importar Excel</b> con una plantilla y mapear las columnas al mes destino.</li>
            <li><b>Revisar agenda</b> (arriba der.): se expande al body. Elige entre <b>Semana</b> o <b>Mes</b>. Click en un dia abre el modal con cirugias, jornada, notas y boton de <b>Mover fecha</b> (para pacientes suspendidos).</li>
            <li><b>Reportes y descargas</b> (abajo izq.): elige rango (semana, mes, 2 meses, 3 meses, anio, personalizado) y <b>Descarga Excel</b> (.xlsx) o <b>Descarga PDF</b>.</li>
            <li><b>Historial</b> (abajo der.): filtra por columna. Acciones por fila: ver, mover fecha, editar, eliminar/restaurar.</li>
            <li>El icono <b>ojo</b> abre el menu: tema de color (4 swatches), claro/oscuro, zoom, acerca de y esta ayuda.</li>
            <li>El boton <b>Iniciar sesion</b> permite crear una cuenta o entrar con tu usuario y contrasena para sincronizar tus registros en la nube y verlos desde cualquier dispositivo. Tambien funciona sin login (datos en este dispositivo).</li>
          </ol>
        </InfoModal>
      )}

      {viewRecord && (
        <InfoModal title="Detalle de cirugia" onClose={() => setViewRecord(null)}>
          <dl className="detail-dl">
            <dt>Fecha</dt><dd>{viewRecord.fecha} {viewRecord.hora}</dd>
            <dt>Paciente</dt><dd>{viewRecord.paciente} {viewRecord.edad && `(${viewRecord.edad} a, ${viewRecord.sexo})`}</dd>
            <dt>Cirugia</dt><dd>{viewRecord.tipoCx}</dd>
            <dt>Cirujano</dt><dd>{viewRecord.medico}</dd>
            <dt>Institucion</dt><dd>{viewRecord.institucion}</dd>
            <dt>Bruto</dt><dd>{fmtMoney(viewRecord.valorBruto)}</dd>
            <dt>Retencion</dt><dd>-{fmtMoney(calcFinance(viewRecord.valorBruto).retencion)}</dd>
            <dt>Liquido</dt><dd className="pos"><b>{fmtMoney(calcFinance(viewRecord.valorBruto).liquido)}</b></dd>
            {viewRecord.obs && (<><dt>Observaciones</dt><dd>{viewRecord.obs}</dd></>)}
          </dl>
        </InfoModal>
      )}
    </div>
  );
}
