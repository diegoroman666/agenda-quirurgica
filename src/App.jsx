import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Eye, EyeOff, Calendar as CalendarIcon, LogIn, LogOut, User,
  Palette, Sun, Moon, ZoomIn, Info, HelpCircle, X, Plus, Trash2,
  RotateCcw, Calculator as CalcIcon, Download, FileSpreadsheet, FileText,
  ChevronLeft, ChevronRight, Search, Filter, Edit3, Save, StickyNote,
  Clock, Stethoscope, Building2, Scissors, Receipt, TrendingUp, Loader2
} from 'lucide-react';
import './App.css';
import { supabase } from './supabase';

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

const STORAGE = {
  data: 'agenda-quirurgica-data-v1',
  prefs: 'agenda-quirurgica-prefs-v1',
};

// ---------- utils ----------
const uid = () => `cx-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
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
  const handleColor = (k, v) => {
    const next = { ...colors, [k]: v };
    setColors(next);
    document.documentElement.style.setProperty(`--${k}-color`, v);
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
          <div className="eye-section-title"><Palette size={14} /> Personalizar colores</div>
          <div className="color-grid">
            {Object.entries(colors).map(([k, v]) => (
              <label key={k} className="color-cell">
                <input type="color" value={v} onChange={(e) => handleColor(k, e.target.value)} />
                <span>{k}</span>
              </label>
            ))}
          </div>
          <button className="btn-ghost full" onClick={() => { setColors(DEFAULT_COLORS); Object.entries(DEFAULT_COLORS).forEach(([k, v]) => document.documentElement.style.setProperty(`--${k}-color`, v)); }}>
            <RotateCcw size={14} /> Restaurar
          </button>
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
function LoginDropdown({ open, onClose, user, onLogout, onGoogle, onEmailLogin, loading, error }) {
  const [mode, setMode] = useState('main'); // main | email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => { if (!open) { setMode('main'); setEmail(''); setPassword(''); } }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="login-backdrop" onClick={onClose} />
      <div className="login-pop">
        {user ? (
          <>
            <div className="login-head">
              <div className="login-avatar"><User size={18} /></div>
              <div>
                <div className="login-name">{user.email}</div>
                <small>Sesion activa</small>
              </div>
            </div>
            <button className="btn-danger full" onClick={onLogout}><LogOut size={16} /> Cerrar sesion</button>
          </>
        ) : mode === 'main' ? (
          <>
            <h4>Iniciar sesion</h4>
            <p className="muted small">Vincular con tu cuenta Google es la opcion mas segura (OAuth, sin contrasena local).</p>
            <button className="btn-google full" onClick={onGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.5 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 40.5 16.2 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.2 5.2c-.4.4 6.5-4.7 6.5-14.5 0-1.2-.1-2.3-.4-3.5z"/></svg>
              Continuar con Google
            </button>
            <div className="divider"><span>o</span></div>
            <button className="btn-ghost full" onClick={() => setMode('email')}>Iniciar con correo y contrasena</button>
            {error && <div className="alert-err">{error}</div>}
            <p className="muted xs">Tu sesion queda protegida por Supabase Auth (cifrado JWT + cookies httpOnly).</p>
          </>
        ) : (
          <>
            <h4>Acceso con correo</h4>
            <form onSubmit={(e) => { e.preventDefault(); onEmailLogin(email, password); }}>
              <input className="input" type="email" required placeholder="correo@dominio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input" type="password" required minLength={6} placeholder="Contrasena (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn-primary full" disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : <><LogIn size={16} /> Entrar / Registrar</>}</button>
            </form>
            {error && <div className="alert-err">{error}</div>}
            <button className="btn-ghost full" onClick={() => setMode('main')}>Volver</button>
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

// ---------- Flip Card ----------
function FlipCard({ flipped, front, back, className = '' }) {
  return (
    <div className={`flip-card ${className} ${flipped ? 'is-flipped' : ''}`}>
      <div className="flip-inner">
        <div className="flip-face flip-front">{front}</div>
        <div className="flip-face flip-back">{back}</div>
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
      <div className="reg-form-head">
        <h3>{editingId ? 'Editar cirugia' : 'Nuevo registro'}</h3>
        <button type="button" className="icon-btn" onClick={onCancel}><X size={18} /></button>
      </div>

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
function DayModal({ dateStr, records, notes, jornada, onClose, onDelete, onRestore, onEdit, onAddNote, onUpdateNote, onSetJornada, onAdd }) {
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
          <div><span>Bruto</span><b>{fmtMoney(finance.bruto)}</b></div>
          <div className="neg"><span>Retencion {(TAX_RATE * 100).toFixed(2)}%</span><b>-{fmtMoney(finance.retencion)}</b></div>
          <div className="pos"><span>Liquido del dia</span><b>{fmtMoney(finance.liquido)}</b></div>
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
                  <div className="rec-money">{fmtMoney(r.valorBruto)}</div>
                  <div className="rec-actions">
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
function AgendaPanel({ records, notes, jornadas, onSelectDay, onAddDay, onMinimize }) {
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
          <button className="btn-ghost sm" onClick={onMinimize}><X size={14} /> Cerrar</button>
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
                    <div key={r.id} className="ev"><b>{r.hora}</b> {r.paciente}</div>
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
                        <div key={r.id} className="ev-slot" title={`${r.paciente} · ${r.tipoCx}`}>
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
      )}
    </div>
  );
}

// ---------- Reportes ----------
function ReportesPanel({ records }) {
  const [preset, setPreset] = useState('mes');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const range = useMemo(() => {
    const now = new Date();
    let start, end;
    if (preset === 'semana') {
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

  const downloadCSV = () => {
    const headers = ['Fecha', 'Hora', 'Paciente', 'Cirugia', 'Cirujano', 'Institucion', 'Bruto', 'Retencion', 'Liquido'];
    const rows = filtered.map((r) => {
      const f = calcFinance(r.valorBruto);
      return [r.fecha, r.hora, r.paciente, r.tipoCx, r.medico, r.institucion, f.bruto, f.retencion.toFixed(0), f.liquido.toFixed(0)];
    });
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `agenda-quirurgica-${preset}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reportes">
      <div className="rep-presets">
        {[['semana', 'Semana'], ['mes', 'Mes'], ['bimestre', '2 meses'], ['trimestre', '3 meses'], ['anio', 'Anio'], ['custom', 'Personalizado']].map(([k, l]) => (
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

      <div className="kpi-row">
        <div className="kpi"><span>Cirugias</span><b>{stats.count}</b></div>
        <div className="kpi"><span>Bruto</span><b>{fmtMoney(stats.bruto)}</b></div>
        <div className="kpi neg"><span>Retencion {(TAX_RATE * 100).toFixed(2)}%</span><b>-{fmtMoney(stats.retencion)}</b></div>
        <div className="kpi pos"><span>Liquido</span><b>{fmtMoney(stats.liquido)}</b></div>
      </div>

      <div className="rep-actions">
        <button className="btn-primary" onClick={downloadCSV}><FileSpreadsheet size={16} /> Descargar CSV</button>
        <button className="btn-ghost" onClick={() => window.print()}><FileText size={16} /> Imprimir / PDF</button>
      </div>

      <div className="rep-list">
        {filtered.length === 0 ? <p className="muted center">Sin registros en este periodo.</p> : (
          filtered.slice(0, 10).map((r) => (
            <div key={r.id} className="rep-row">
              <small>{r.fecha} {r.hora}</small>
              <b>{r.paciente}</b>
              <span>{r.tipoCx}</span>
              <span className="money">{fmtMoney(r.valorBruto)}</span>
            </div>
          ))
        )}
        {filtered.length > 10 && <small className="muted center">... y {filtered.length - 10} mas (descarga CSV para verlos todos).</small>}
      </div>
    </div>
  );
}

// ---------- Historial ----------
function HistorialPanel({ records, onEdit, onDelete, onRestore, onView }) {
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
      </div>

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
                  <td>{fmtMoney(f.bruto)}</td>
                  <td className="pos">{fmtMoney(f.liquido)}</td>
                  <td className="actions">
                    <button className="icon-btn" title="Ver" onClick={() => onView(r)}><Eye size={14} /></button>
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
      <small className="muted">{filtered.length} registro(s)</small>
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

  // data
  const [data, setData] = useState(loadData);
  const records = data.records;
  const notes = data.notes;
  const jornadas = data.jornadas;
  const updateData = (mut) => setData((prev) => { const next = mut(prev); saveData(next); return next; });

  // UI state
  const [eyeOpen, setEyeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registroFlipped, setRegistroFlipped] = useState(false);
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [reportesFlipped, setReportesFlipped] = useState(false);
  const [historialFlipped, setHistorialFlipped] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
    valorBruto: '', obs: '',
  });
  const [formData, setFormData] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const agendaRef = useRef(null);

  // persist prefs
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    Object.entries(colors).forEach(([k, v]) => document.documentElement.style.setProperty(`--${k}-color`, v));
    document.documentElement.style.setProperty('--app-zoom', zoom);
    savePrefs({ theme, colors, zoom, catalogs: { tiposCx, medicos, instituciones } });
  }, [theme, colors, zoom, tiposCx, medicos, instituciones]);

  // auth listener
  useEffect(() => {
    let mounted = true;
    if (!supabase?.auth) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user || null);
    }).catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, []);

  // handlers
  const gotoAgenda = () => {
    setAgendaExpanded(true);
    setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleGoogle = async () => {
    setAuthLoading(true); setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e) { setAuthError(e.message || 'Error al vincular con Google'); }
    finally { setAuthLoading(false); }
  };

  const handleEmailLogin = async (email, password) => {
    setAuthLoading(true); setAuthError('');
    try {
      let res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error && res.error.message.toLowerCase().includes('invalid')) {
        res = await supabase.auth.signUp({ email, password });
      }
      if (res.error) throw res.error;
      setLoginOpen(false);
    } catch (e) { setAuthError(e.message || 'Error de autenticacion'); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setUser(null); setLoginOpen(false);
  };

  const openNewRegistro = (dateStr) => {
    setEditingId(null);
    setFormData({ ...emptyForm(), fecha: dateStr || dateToStr(new Date()) });
    setRegistroFlipped(true);
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
    setRegistroFlipped(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const editRecord = (r) => {
    setEditingId(r.id);
    setFormData({ ...emptyForm(), ...r });
    setRegistroFlipped(true);
    setSelectedDay(null);
    document.getElementById('card-registro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteRecord = (id) => updateData((p) => ({ ...p, records: p.records.map((r) => r.id === id ? { ...r, deleted: true } : r) }));
  const restoreRecord = (id) => updateData((p) => ({ ...p, records: p.records.map((r) => r.id === id ? { ...r, deleted: false } : r) }));

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
        onGoogle={handleGoogle}
        onEmailLogin={handleEmailLogin}
        loading={authLoading}
        error={authError}
      />

      <main className="main-content" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <section className="hero">
          <h1>Bienvenido a tu <span className="grad">Agenda Quirurgica</span></h1>
          <p>Registra cirugias, visualiza la agenda semanal o mensual y calcula tus honorarios con retencion automatica del {(TAX_RATE * 100).toFixed(2)}%.</p>
        </section>

        <section className={`grid-4 ${agendaExpanded ? 'agenda-mode' : ''}`} ref={agendaRef}>
          {/* CARD 1 - Registro */}
          <div id="card-registro" className="grid-slot slot-tl">
            <FlipCard
              flipped={registroFlipped}
              front={
                <div className="card front-card">
                  <div className="card-icon"><Stethoscope size={28} /></div>
                  <h3>Iniciar registro</h3>
                  <p>Agrega una nueva cirugia con paciente, monto, fecha, hora y mas.</p>
                  <button className="btn-primary big" onClick={() => openNewRegistro()}>
                    <Plus size={18} /> Nuevo registro
                  </button>
                </div>
              }
              back={
                <div className="card back-card">
                  <RegistroForm
                    data={formData}
                    setData={setFormData}
                    onCancel={() => { setRegistroFlipped(false); setEditingId(null); }}
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
              flipped={agendaExpanded}
              front={
                <div className="card front-card">
                  <div className="card-icon"><CalendarIcon size={28} /></div>
                  <h3>Revisar agenda</h3>
                  <p>Visualiza por semana o mes. Bloques de 24 horas, jornadas y notas.</p>
                  <button className="btn-primary big" onClick={() => setAgendaExpanded(true)}>
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
                    onMinimize={() => setAgendaExpanded(false)}
                  />
                </div>
              }
            />
          </div>

          {/* CARD 3 - Reportes */}
          <div className="grid-slot slot-bl">
            <FlipCard
              flipped={reportesFlipped}
              front={
                <div className="card front-card">
                  <div className="card-icon"><TrendingUp size={28} /></div>
                  <h3>Reportes y descargas</h3>
                  <p>Ingresos por semana, mes, 2 meses o personalizado. Retencion {(TAX_RATE * 100).toFixed(2)}%.</p>
                  <div className="card-actions-row">
                    <button className="btn-primary big" onClick={() => setReportesFlipped(true)}>
                      <Download size={18} /> Ver reportes
                    </button>
                    <button className="btn-ghost" onClick={() => setShowCalculator(true)}><CalcIcon size={16} /> Calculadora</button>
                  </div>
                </div>
              }
              back={
                <div className="card back-card">
                  <div className="back-head">
                    <h3><TrendingUp size={18} /> Reportes</h3>
                    <button className="icon-btn" onClick={() => setReportesFlipped(false)}><X size={18} /></button>
                  </div>
                  <ReportesPanel records={records} />
                </div>
              }
            />
          </div>

          {/* CARD 4 - Historial */}
          <div className="grid-slot slot-br">
            <FlipCard
              flipped={historialFlipped}
              front={
                <div className="card front-card">
                  <div className="card-icon"><Receipt size={28} /></div>
                  <h3>Historial</h3>
                  <p>Busca registros por paciente, cirujano, institucion o fecha. Papelera con restauracion.</p>
                  <button className="btn-primary big" onClick={() => setHistorialFlipped(true)}>
                    <Filter size={18} /> Abrir historial
                  </button>
                </div>
              }
              back={
                <div className="card back-card">
                  <div className="back-head">
                    <h3><Receipt size={18} /> Historial</h3>
                    <button className="icon-btn" onClick={() => setHistorialFlipped(false)}><X size={18} /></button>
                  </div>
                  <HistorialPanel
                    records={records}
                    onEdit={editRecord}
                    onDelete={deleteRecord}
                    onRestore={restoreRecord}
                    onView={setViewRecord}
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
          onAddNote={addNote}
          onUpdateNote={removeNote}
          onSetJornada={setJornada}
          onAdd={openNewRegistro}
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
            <li><b>Iniciar registro</b> (arriba izq.): el grid gira y muestra el formulario. Completa paciente, fecha, hora, monto y guarda — vuelve a su posicion.</li>
            <li><b>Revisar agenda</b> (arriba der.): se expande al body. Eligo entre <b>Semana</b> o <b>Mes</b>. Click en un dia abre el modal con cirugias, jornada y notas.</li>
            <li><b>Reportes y descargas</b> (abajo izq.): elige rango (semana, mes, 2 meses, 3 meses, anio, personalizado) y descarga CSV o imprime PDF.</li>
            <li><b>Historial</b> (abajo der.): filtra por columna (paciente, cirugia, cirujano, institucion, fecha). Eliminar manda a papelera con opcion de restaurar.</li>
            <li>El icono <b>ojo</b> abre el menu: colores, claro/oscuro, zoom, acerca de y esta ayuda.</li>
            <li>El boton <b>Iniciar sesion</b> permite vincular tu Gmail por Google OAuth (mas seguro). Tambien funciona sin login (datos en este dispositivo).</li>
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
