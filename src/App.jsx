import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus,
  Trash2, 
  ClipboardList, 
  Moon, 
  Sun,
  Edit3,
  Clock,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar as CalendarIcon,
  PieChart,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  X,
  Search,
  Filter,
  ArrowRight,
  Receipt,
  RotateCcw,
  Settings,
  Palette,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Shield,
  Loader2,
  Users,
  Pencil
} from 'lucide-react';
import './App.css';
import { supabase, isAdmin } from './supabase';

const XLSX_SCRIPT_URL = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
const JSPDF_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const TAX_RATE = 0.1525;

const DEFAULT_COLORS = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  accent: '#17a2b8',
  success: '#28a745'
};

const COLOR_LABELS = {
  primary: 'Primario',
  secondary: 'Secundario',
  accent: 'Acento',
  success: 'Éxito'
};

const SettingsPanel = ({ show, onClose, colors, setColors }) => {
  const handleColorChange = (key, value) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    document.documentElement.style.setProperty(`--${key}-color`, value);
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    Object.entries(DEFAULT_COLORS).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}-color`, value);
    });
  };

  return (
    <>
      {show && <div className="settings-backdrop" onClick={onClose} />}
      <div className={`settings-drawer ${show ? 'open' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h3 className="fw-bold m-0"><Palette size={20} className="me-2" />Personalizar</h3>
          <button onClick={onClose} className="btn btn-sm p-1 border-0" style={{ color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>
        <p className="settings-subtitle">Ajusta la paleta de colores de la aplicación</p>

        <div className="color-preview-row">
          {Object.values(colors).map((c, i) => (
            <div key={i} className="color-preview-swatch" style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="settings-section-title">Colores principales</div>

        {Object.entries(colors).map(([key, value]) => (
          <div className="color-picker-group" key={key}>
            <label>{COLOR_LABELS[key]}</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={value}
                onChange={e => handleColorChange(key, e.target.value)}
              />
              <span className="hex-value">{value.toUpperCase()}</span>
            </div>
          </div>
        ))}

        <hr className="settings-divider" />

        <button
          onClick={resetColors}
          className="btn btn-outline-secondary w-100 rounded-pill fw-bold py-2"
        >
          <RotateCcw size={16} className="me-2" />Restaurar valores predeterminados
        </button>
      </div>
    </>
  );
};

const AuthScreen = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet />
      <div className="card glass-card p-4 p-md-5 shadow-lg" style={{ maxWidth: '420px', width: '90%' }}>
        <div className="text-center mb-4">
          <div className="bg-primary bg-gradient p-3 rounded-4 shadow-sm d-inline-block mb-3">
            <Stethoscope className="text-white" size={32} />
          </div>
          <h2 className="fw-bold text-contrast-fix m-0">SurgiTrack <span className="text-primary">Pro</span></h2>
          <p className="text-muted-fix small">Dra. Maria Joaquina</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold text-contrast-fix small">EMAIL</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold text-contrast-fix small">CONTRASEÑA</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimo 6 caracteres" minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary w-100 p-3 rounded-pill fw-bold shadow-sm" disabled={loading}>
            {loading ? <Loader2 size={20} className="spinner-border" /> : (
              <>
                {isLogin ? <LogIn size={18} className="me-2" /> : <UserPlus size={18} className="me-2" />}
                {isLogin ? 'Iniciar Sesion' : 'Registrarse'}
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button className="btn btn-link text-decoration-none small" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ view, setView, darkMode, setDarkMode, onOpenSettings, user, onLogout, adminView }) => (
  <nav className="navbar sticky-top border-bottom px-2 py-2 px-md-3 py-md-3 navbar-dark" 
       style={{ backdropFilter: 'blur(20px)', backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--navbar-border)', zIndex: 1050 }}>
    <div className="container-fluid flex-nowrap">
      <div className="d-flex align-items-center gap-2 gap-md-3" onClick={() => setView(adminView ? 'admin' : 'home')} style={{ cursor: 'pointer' }}>
        <div className="bg-primary bg-gradient p-2 rounded-4 shadow-sm">
          <Stethoscope className="text-white" size={20} />
        </div>
        <div className="d-flex flex-column d-none d-sm-flex">
          <span className="fw-bold h6 mb-0 text-primary" style={{ letterSpacing: '-0.5px' }}>SurgiTrack <span className="text-info">Pro</span></span>
          <small className="fw-bold text-uppercase" style={{ fontSize: '8px', opacity: 0.8, color: 'var(--text-contrast)' }}>Dra. Maria Joaquina</small>
        </div>
      </div>

      <div className="d-flex align-items-center gap-1 gap-md-2">
        {!adminView && (
          <>
            <button onClick={() => setView('form')} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 me-2 shadow-sm">
              <PlusCircle size={18} /> <span className="d-none d-md-inline">Nueva Cx</span>
            </button>
            
            <div className="d-flex p-1 rounded-4 border" style={{ backgroundColor: darkMode ? 'rgba(108,117,125,0.15)' : 'rgba(248,249,250,1)', borderColor: 'var(--border-secondary)' }}>
              <button onClick={() => setView('dashboard')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'dashboard' ? 'btn-primary shadow-sm text-white' : 'border-0'}`} style={{ color: view !== 'dashboard' ? 'var(--text-muted)' : undefined }}>
                <TrendingUp size={16} className="d-md-none"/> <span className="d-none d-md-inline">Analisis</span>
              </button>
              <button onClick={() => setView('calendar')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'calendar' ? 'btn-primary shadow-sm text-white' : 'border-0'}`} style={{ color: view !== 'calendar' ? 'var(--text-muted)' : undefined }}>
                <CalendarIcon size={16} className="d-md-none"/> <span className="d-none d-md-inline">Agenda</span>
              </button>
              <button onClick={() => setView('history')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'history' ? 'btn-primary shadow-sm text-white' : 'border-0'}`} style={{ color: view !== 'history' ? 'var(--text-muted)' : undefined }}>
                <ClipboardList size={16} className="d-md-none"/> <span className="d-none d-md-inline">Registros</span>
              </button>
            </div>
          </>
        )}
        
        {isAdmin(user) && (
          <button onClick={() => setView(adminView ? 'home' : 'admin')} className={`btn btn-sm rounded-pill fw-bold px-3 ${adminView ? 'btn-warning' : 'btn-outline-warning'}`}>
            <Shield size={16} className="me-1" /> {adminView ? 'Volver' : 'Admin'}
          </button>
        )}

        <button onClick={onOpenSettings} className="btn border-0 p-2 rounded-circle" style={{ color: 'var(--text-muted)' }} title="Personalizar colores">
          <Settings size={20} />
        </button>

        <button onClick={() => setDarkMode(!darkMode)} className={`btn border-0 p-2 rounded-circle ${darkMode ? 'text-warning' : 'text-secondary'}`}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="dropdown">
          <button className="btn border-0 p-2 rounded-circle" style={{ color: 'var(--text-muted)' }} data-bs-toggle="dropdown">
            <User size={20} />
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text small fw-bold text-truncate" style={{ maxWidth: '200px' }}>{user.email}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={onLogout}><LogOut size={16} className="me-2" />Cerrar Sesion</button></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
);

const AdminView = ({ records, loading, onDelete, onRestore }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const term = searchTerm.toLowerCase();
      return (
        r.paciente?.toLowerCase().includes(term) ||
        r.tipoCx?.toLowerCase().includes(term) ||
        r.institucion?.toLowerCase().includes(term) ||
        r.medico?.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Loader2 size={40} className="spinner-border text-primary" />
        <p className="text-muted-fix mt-3">Cargando todas las cirugias...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade text-start">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-contrast-fix m-0"><Shield size={28} className="me-2 text-warning" />Panel de Administrador</h2>
          <p className="text-muted-fix small">Todas las cirugias registradas por todos los usuarios</p>
        </div>
        <div className="position-relative flex-grow-1" style={{ maxWidth: '350px' }}>
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: 'var(--text-muted)' }} size={18} />
          <input type="text" className="form-control ps-5 rounded-pill" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="glass-card p-3 p-md-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge bg-warning rounded-pill px-3">{filteredRecords.length} registros totales</span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-5">
            <ClipboardList size={60} className="text-muted opacity-25 mb-3" />
            <p className="text-muted-fix h5">No hay registros.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className={`table table-hover align-middle mb-0`} style={{ color: 'var(--text-contrast)' }}>
              <thead>
                <tr className="small text-muted">
                  <th>USUARIO</th>
                  <th>FECHA</th>
                  <th>HORA</th>
                  <th>PACIENTE</th>
                  <th>CIRUGIA</th>
                  <th>MEDICO</th>
                  <th>INSTITUCION</th>
                  <th>HONORARIOS</th>
                  <th className="text-end">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} className={r.deleted ? 'opacity-50' : ''}>
                    <td className="small text-muted-fix">{r.user_email || 'N/A'}</td>
                    <td>{r.fecha}</td>
                    <td>{r.hora}</td>
                    <td className="fw-bold">{r.paciente}</td>
                    <td>{r.tipoCx}</td>
                    <td><span className="badge bg-info bg-opacity-10 text-info">{r.medico || 'N/A'}</span></td>
                    <td>{r.institucion}</td>
                    <td className="fw-bold text-primary">${Number(r.valorBruto || 0).toLocaleString()}</td>
                    <td className="text-end">
                      {r.deleted ? (
                        <button onClick={() => onRestore(r.id)} title="Restaurar" className="btn btn-sm btn-outline-success rounded-circle"><RotateCcw size={14}/></button>
                      ) : (
                        <button onClick={() => onDelete(r.id)} title="Eliminar" className="btn btn-sm btn-outline-danger rounded-circle"><Trash2 size={14}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('surgitrack-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [colors, setColors] = useState(() => {
    const saved = localStorage.getItem('surgitrack-colors');
    if (saved) {
      try { return { ...DEFAULT_COLORS, ...JSON.parse(saved) }; } catch { return { ...DEFAULT_COLORS }; }
    }
    return { ...DEFAULT_COLORS };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState('home'); 
  const [editingId, setEditingId] = useState(null);
  
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState(new Date());
  const [selectedDayRecords, setSelectedDayRecords] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [allRecords, setAllRecords] = useState([]);
  const [medicos, setMedicos] = useState(() => {
    const saved = localStorage.getItem('surgitrack-medicos');
    return saved ? JSON.parse(saved) : ['Dr./Dra.'];
  });
  const [showMedicoManager, setShowMedicoManager] = useState(false);
  const [newMedico, setNewMedico] = useState('');

  const [records, setRecords] = useState([]);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    institucion: '',
    paciente: '',
    tipoCx: '',
    medico: '',
    valorBruto: '',
    deleted: false
  });

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setAuthLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAdminView(false);
      if (!session?.user) {
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('surgitrack-medicos', JSON.stringify(medicos));
  }, [medicos]);

  const fetchRecords = async () => {
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('cirugias')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchAllRecords = async () => {
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('cirugias')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllRecords(data || []);
    } catch (err) {
      console.error('Error fetching all records:', err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (adminView && isAdmin(user)) {
      fetchAllRecords();
    }
  }, [adminView, user]);

  useEffect(() => {
    localStorage.setItem('surgitrack-dark', String(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('surgitrack-colors', JSON.stringify(colors));
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}-color`, value);
    });
  }, [colors]);

  useEffect(() => {
    const scripts = [XLSX_SCRIPT_URL, JSPDF_SCRIPT_URL];
    scripts.forEach(url => {
      const script = document.createElement("script");
      script.src = url;
      document.head.appendChild(script);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecords([]);
    setAdminView(false);
  };

  const calculateFinance = (bruto) => {
    const val = parseFloat(bruto) || 0;
    const retencion = val * TAX_RATE;
    const liquido = val - retencion;
    return { bruto: val, retencion, liquido };
  };

  const activeRecords = useMemo(() => records.filter(r => !r.deleted), [records]);
  const trashedRecords = useMemo(() => records.filter(r => r.deleted), [records]);

  const openFormWithDate = (dateStr) => {
    setEditingId(null);
    setFormData({
      fecha: dateStr,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      institucion: '',
      paciente: '',
      tipoCx: '',
      medico: '',
      valorBruto: '',
      deleted: false
    });
    setView('form');
  };

  const addMedico = () => {
    if (newMedico.trim() && !medicos.includes(newMedico.trim())) {
      setMedicos([...medicos, newMedico.trim()]);
      setNewMedico('');
    }
  };

  const removeMedico = (index) => {
    if (medicos.length > 1) {
      setMedicos(medicos.filter((_, i) => i !== index));
    }
  };

  const exportToExcel = (dataToExport, filename) => {
    if (!window.XLSX) return;
    const worksheetData = dataToExport.map(r => {
      const f = calculateFinance(r.valorBruto);
      return {
        "ID Registro": r.id, "Fecha": r.fecha, "Hora": r.hora, "Paciente": r.paciente,
        "Procedimiento": r.tipoCx, "Medico": r.medico || 'N/A', "Institucion": r.institucion, "Monto Bruto ($)": f.bruto,
        "Retencion 15.25% ($)": f.retencion, "Monto Neto ($)": f.liquido
      };
    });
    const worksheet = window.XLSX.utils.json_to_sheet(worksheetData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cirugias");
    window.XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToPDF = (stats, date) => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const mes = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    doc.setFontSize(22);
    doc.setTextColor(13, 110, 253);
    doc.text("SurgiTrack Pro Elite", 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Reporte Financiero Mensual: ${mes}`, 20, 35);
    doc.text(`Dra. Maria Joaquina`, 20, 42);

    doc.setDrawColor(200);
    doc.line(20, 50, 190, 50);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumen de Ingresos", 20, 65);
    
    doc.setFontSize(11);
    doc.text(`Total de Procedimientos: ${stats.count}`, 30, 75);
    doc.text(`Total Ingresos Brutos: $${stats.bruto.toLocaleString()}`, 30, 85);
    doc.setTextColor(220, 53, 69);
    doc.text(`Retencion de Impuestos (${(TAX_RATE * 100).toFixed(2)}%): -$${stats.retencion.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 30, 95);
    
    doc.setFontSize(16);
    doc.setTextColor(25, 135, 84);
    doc.text(`TOTAL LIQUIDO PERCIBIDO: $${stats.liquido.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 20, 115);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Generado automaticamente por SurgiTrack Pro Elite v10.0", 20, 280);

    doc.save(`Reporte_Financiero_${mes.replace(' ', '_')}.pdf`);
  };

  const statsPeriodo = useMemo(() => {
    const month = selectedAnalysisDate.getMonth();
    const year = selectedAnalysisDate.getFullYear();
    const filtered = activeRecords.filter(r => {
      const d = new Date(r.fecha + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const bruto = filtered.reduce((acc, curr) => acc + (parseFloat(curr.valorBruto) || 0), 0);
    return { bruto, retencion: bruto * TAX_RATE, liquido: bruto * (1 - TAX_RATE), count: filtered.length, filteredRecords: filtered };
  }, [activeRecords, selectedAnalysisDate]);

  const filteredHistory = useMemo(() => {
    return activeRecords.filter(r => {
      const matchesSearch = 
        r.paciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tipoCx?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.institucion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.medico?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const dateVal = new Date(r.fecha + "T00:00:00");
      const startLimit = dateRange.start ? new Date(dateRange.start + "T00:00:00") : null;
      const endLimit = dateRange.end ? new Date(dateRange.end + "T23:59:59") : null;
      const matchesDate = (!startLimit || dateVal >= startLimit) && (!endLimit || dateVal <= endLimit);
      
      return matchesSearch && matchesDate;
    });
  }, [activeRecords, searchTerm, dateRange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDbLoading(true);
    try {
      const recordData = {
        ...formData,
        user_id: user.id,
        user_email: user.email,
        created_by: user.email
      };

      if (editingId) {
        const { error } = await supabase
          .from('cirugias')
          .update(recordData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cirugias')
          .insert([{ ...recordData, id: `CX-${Date.now()}` }]);
        if (error) throw error;
      }
      
      await fetchRecords();
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        institucion: '',
        paciente: '',
        tipoCx: '',
        medico: '',
        valorBruto: '',
        deleted: false
      });
      setEditingId(null);
      setView('history');
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const softDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('cirugias')
        .update({ deleted: true })
        .eq('id', id);
      if (error) throw error;
      await fetchRecords();
      if(selectedDayRecords) {
        setSelectedDayRecords(prev => ({
          ...prev,
          records: prev.records.filter(r => r.id !== id)
        }));
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const restoreRecord = async (id) => {
    try {
      const { error } = await supabase
        .from('cirugias')
        .update({ deleted: false })
        .eq('id', id);
      if (error) throw error;
      await fetchRecords();
    } catch (err) {
      console.error('Error restoring:', err);
    }
  };

  const adminDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('cirugias')
        .update({ deleted: true })
        .eq('id', id);
      if (error) throw error;
      await fetchAllRecords();
    } catch (err) {
      console.error('Error admin delete:', err);
    }
  };

  const adminRestore = async (id) => {
    try {
      const { error } = await supabase
        .from('cirugias')
        .update({ deleted: false })
        .eq('id', id);
      if (error) throw error;
      await fetchAllRecords();
    } catch (err) {
      console.error('Error admin restore:', err);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date: dateStr, records: activeRecords.filter(r => r.fecha === dateStr) });
    }
    return days;
  }, [currentCalDate, activeRecords]);

  const selectedDayFinance = useMemo(() => {
    if (!selectedDayRecords) return null;
    const bruto = selectedDayRecords.records.reduce((acc, curr) => acc + (parseFloat(curr.valorBruto) || 0), 0);
    const retencion = bruto * TAX_RATE;
    const liquido = bruto - retencion;
    return { bruto, retencion, liquido };
  }, [selectedDayRecords]);

  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 size={40} className="spinner-border text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} darkMode={darkMode} />;
  }

  const currentView = adminView ? 'admin' : view;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ width: '100vw', overflowX: 'hidden', backgroundColor: 'var(--bg-primary)', color: 'var(--text-contrast)' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet />
      <style>{`
        body { font-family: 'Inter', sans-serif; background: var(--bg-primary); color: var(--text-contrast); }
        .text-contrast-fix { color: var(--text-contrast) !important; }
        .text-muted-fix { color: var(--text-muted) !important; }
        
        .form-control, .form-select {
          background-color: var(--bg-input) !important;
          color: var(--text-contrast) !important;
          border: 1px solid var(--border-input) !important;
          padding: 12px 16px;
          border-radius: 12px;
        }

        .glass-card { 
          background: var(--bg-card); 
          backdrop-filter: blur(10px); 
          border: 1px solid var(--border-color);
          border-radius: 24px;
          box-shadow: var(--shadow-glass);
        }

        .calendar-cell { 
          min-height: 100px; 
          border-radius: 12px; 
          transition: 0.2s; 
          border: 1px solid var(--border-color); 
          padding: 8px;
        }

        .btn-circular-add {
          width: 26px !important;
          height: 26px !important;
          min-width: 26px !important;
          min-height: 26px !important;
          max-width: 26px !important;
          max-height: 26px !important;
          border-radius: 50% !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          background-color: var(--primary-color) !important;
          color: #ffffff !important;
          cursor: pointer !important;
          transition: transform 0.2s, background-color 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }
        
        .btn-circular-add:hover {
          background-color: color-mix(in srgb, var(--primary-color) 85%, black) !important;
          transform: scale(1.1);
        }

        .btn-plus-float {
          position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%;
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 25px color-mix(in srgb, var(--primary-color) 40%, transparent);
          transition: 0.3s;
          color: #ffffff !important;
        }

        .btn-plus-float:hover {
          transform: scale(1.1);
          box-shadow: 0 14px 32px color-mix(in srgb, var(--primary-color) 50%, transparent);
        }
        
        .btn-nav-cal {
           background-color: var(--btn-nav-cal-bg);
           color: var(--btn-nav-cal-text);
           border: 1px solid var(--border-input);
        }

        .animate-fade { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Navbar view={view} setView={(v) => { setView(v); setAdminView(false); }} darkMode={darkMode} setDarkMode={setDarkMode} onOpenSettings={() => setShowSettings(true)} user={user} onLogout={handleLogout} adminView={adminView} />

      <SettingsPanel show={showSettings} onClose={() => setShowSettings(false)} colors={colors} setColors={setColors} />

      {!adminView && (
        <button onClick={() => { setEditingId(null); setFormData({ fecha: new Date().toISOString().split('T')[0], hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), institucion: '', paciente: '', tipoCx: '', medico: '', valorBruto: '', deleted: false }); setView('form'); }} className="btn btn-primary btn-plus-float">
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      <main className="container-fluid px-3 px-md-5 py-4 flex-grow-1">
        
        {currentView === 'form' && (
          <div className="d-flex justify-content-center animate-fade py-2">
            <div className="card glass-card p-4 p-md-5 w-100 shadow-lg" style={{ maxWidth: '700px' }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="text-start">
                  <h2 className="fw-bold text-contrast-fix m-0">{editingId ? 'Editar Cirugia' : 'Nuevo Registro'}</h2>
                  <p className="text-muted-fix small">Retencion Automatica del {(TAX_RATE*100).toFixed(2)}%</p>
                </div>
                <button onClick={() => setView('calendar')} className="btn rounded-circle p-2 border-0" style={{ color: 'var(--text-contrast)' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="row g-3 text-start">
                <div className="col-md-6"><label className="form-label fw-bold text-contrast-fix small">FECHA</label>
                  <input type="date" className="form-control" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required /></div>
                <div className="col-md-6"><label className="form-label fw-bold text-contrast-fix small">HORA</label>
                  <input type="time" className="form-control" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">PACIENTE</label>
                  <input type="text" className="form-control" placeholder="Nombre completo" value={formData.paciente} onChange={e => setFormData({...formData, paciente: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">CIRUGIA / PROCEDIMIENTO</label>
                  <input type="text" className="form-control" placeholder="Tipo de cirugia" value={formData.tipoCx} onChange={e => setFormData({...formData, tipoCx: e.target.value})} required /></div>
                <div className="col-12">
                  <label className="form-label fw-bold text-contrast-fix small d-flex justify-content-between align-items-center">
                    MEDICO QUE OPERA
                    <button type="button" className="btn btn-sm btn-outline-primary rounded-pill py-0 px-2" onClick={() => setShowMedicoManager(!showMedicoManager)}>
                      <Pencil size={12} className="me-1" /> Gestionar Medicos
                    </button>
                  </label>
                  <select className="form-select" value={formData.medico} onChange={e => setFormData({...formData, medico: e.target.value})} required>
                    <option value="">Seleccionar medico...</option>
                    {medicos.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
                {showMedicoManager && (
                  <div className="col-12">
                    <div className="p-3 rounded-4 border" style={{ backgroundColor: 'var(--bg-card-alt)', borderColor: 'var(--border-color)' }}>
                      <h6 className="fw-bold text-contrast-fix small mb-3"><Users size={16} className="me-2" />Gestionar Medicos</h6>
                      <div className="d-flex gap-2 mb-3">
                        <input type="text" className="form-control form-control-sm" placeholder="Nombre del medico" value={newMedico} onChange={e => setNewMedico(e.target.value)} />
                        <button type="button" className="btn btn-sm btn-primary rounded-pill" onClick={addMedico}><Plus size={16} /></button>
                      </div>
                      <div className="list-group list-group-flush">
                        {medicos.map((m, i) => (
                          <div key={i} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2" style={{ backgroundColor: 'transparent', borderColor: 'var(--border-color)' }}>
                            <span className="small text-contrast-fix">{m}</span>
                            {medicos.length > 1 && (
                              <button type="button" className="btn btn-sm btn-outline-danger rounded-circle p-1" onClick={() => removeMedico(i)}><X size={14} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">INSTITUCION</label>
                  <input type="text" className="form-control" placeholder="Clinica o Hospital" value={formData.institucion} onChange={e => setFormData({...formData, institucion: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">HONORARIOS BRUTOS ($)</label>
                  <input type="number" className="form-control fw-bold text-primary h4 py-3" value={formData.valorBruto} onChange={e => setFormData({...formData, valorBruto: e.target.value})} required /></div>
                <div className="col-12 mt-4"><button type="submit" className="btn btn-primary w-100 p-3 rounded-pill fw-bold shadow-sm" disabled={dbLoading}>{dbLoading ? <Loader2 size={20} className="spinner-border" /> : (editingId ? 'Guardar Cambios' : 'Confirmar Registro')}</button></div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'admin' && (
          <AdminView records={allRecords} loading={dbLoading} onDelete={adminDelete} onRestore={adminRestore} />
        )}

        {currentView === 'calendar' && (
          <div className="animate-fade">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
              <h2 className="fw-bold m-0 text-contrast-fix">Agenda Quirurgica</h2>
              <div className="d-flex align-items-center rounded-pill p-1" style={{ backgroundColor: darkMode ? 'rgba(108,117,125,0.15)' : 'var(--bg-card-alt)' }}>
                <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="btn btn-sm btn-nav-cal rounded-circle"><ChevronLeft size={16}/></button>
                <span className="px-3 fw-bold text-uppercase small text-contrast-fix" style={{ minWidth: '160px', textAlign: 'center' }}>
                  {currentCalDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="btn btn-sm btn-nav-cal rounded-circle"><ChevronRight size={16}/></button>
              </div>
            </div>

            <div className="row g-4">
              <div className={selectedDayRecords ? "col-lg-8" : "col-12"}>
                <div className="calendar-grid d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => ( <div key={d} className="text-center fw-bold text-muted small py-2">{d}</div> ))}
                  {calendarDays.map((d, i) => (
                    <div key={i} className={`calendar-cell ${d.day ? (darkMode ? 'bg-dark' : 'bg-white') : 'bg-transparent border-0'} ${d.records?.length > 0 ? 'border-primary border-opacity-50 shadow-sm' : ''}`} style={d.records?.length > 0 ? {backgroundColor: 'var(--bg-calendar-event)'} : {}}>
                      {d.day && (
                        <>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className={`fw-bold small ${d.records?.length > 0 ? 'text-primary' : 'text-contrast-fix'}`}>{d.day}</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openFormWithDate(d.date); }} 
                              className="btn-circular-add"
                            >
                              <Plus size={16} strokeWidth={4} />
                            </button>
                          </div>
                          <div onClick={() => setSelectedDayRecords(d)} style={{ cursor: 'pointer', minHeight: '50px' }}>
                            {d.records?.slice(0, 2).map((r, idx) => (
                              <div key={idx} className="bg-primary bg-opacity-10 text-primary small px-2 py-1 rounded mb-1 text-truncate fw-bold" style={{ fontSize: '9px' }}>{r.paciente}</div>
                            ))}
                            {d.records?.length > 2 && <div className="text-muted-fix text-center fw-bold" style={{ fontSize: '8px' }}>+{d.records.length - 2}</div>}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedDayRecords && (
                <div className="col-lg-4 animate-fade">
                  <div className={`card glass-card h-100 shadow-lg ${darkMode ? 'border-secondary' : ''}`}>
                    <div className="card-body p-4 text-start">
                      <div className="d-flex justify-content-between mb-3">
                        <h4 className="fw-bold text-contrast-fix m-0">Dia {selectedDayRecords.date.split('-').reverse().join('/')}</h4>
                        <button className={`btn-close ${darkMode ? 'btn-close-white' : ''}`} onClick={() => setSelectedDayRecords(null)}></button>
                      </div>

                      {selectedDayFinance && selectedDayFinance.bruto > 0 && (
                        <div className="p-3 rounded-4 mb-4 border" style={{ backgroundColor: 'color-mix(in srgb, var(--success-color) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--success-color) 25%, transparent)' }}>
                           <div className="d-flex align-items-center gap-2 mb-2">
                             <Receipt size={18} className="text-success"/>
                             <span className="fw-bold text-success small">Resumen Diario</span>
                           </div>
                           <div className="d-flex justify-content-between small mb-1">
                             <span className="text-muted-fix">Total Bruto:</span>
                             <span className="fw-bold text-contrast-fix">${selectedDayFinance.bruto.toLocaleString()}</span>
                           </div>
                           <div className="d-flex justify-content-between small mb-1">
                             <span className="text-muted-fix">Retencion ({(TAX_RATE*100).toFixed(2)}%):</span>
                             <span className="fw-bold text-danger">-${selectedDayFinance.retencion.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                           </div>
                           <hr className="my-2 opacity-10" />
                           <div className="d-flex justify-content-between align-items-center">
                             <span className="fw-bold text-success small">LIQUIDO:</span>
                             <span className="h5 fw-bold text-success m-0">${selectedDayFinance.liquido.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                           </div>
                        </div>
                      )}

                      <button onClick={() => openFormWithDate(selectedDayRecords.date)} className="btn btn-primary w-100 mb-4 rounded-pill fw-bold"><Plus size={18} className="me-2"/> Nueva en este dia</button>
                      
                      <div className="records-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {selectedDayRecords.records.length === 0 ? (
                          <p className="text-center text-muted small py-4">No hay cirugias programadas</p>
                        ) : (
                          selectedDayRecords.records.map((r, idx) => (
                            <div key={idx} className="border-bottom border-secondary border-opacity-10 pb-3 mb-3 last-child-border-0">
                              <div className="d-flex justify-content-between fw-bold text-contrast-fix mb-1">
                                <span><Clock size={14} className="me-1"/>{r.hora}</span>
                                <span className="text-primary">${Number(r.valorBruto).toLocaleString()}</span>
                              </div>
                              <div className="text-contrast-fix fw-bold small">{r.paciente}</div>
                              <div className="text-muted-fix x-small mt-1" style={{ fontSize: '11px' }}>{r.tipoCx} • {r.medico || 'Sin medico'} • {r.institucion}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="animate-fade text-start">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
              <h2 className="fw-bold text-contrast-fix m-0">Analisis Financiero</h2>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm rounded-pill px-3 fw-bold"
                        value={selectedAnalysisDate.getMonth()} 
                        onChange={e => setSelectedAnalysisDate(new Date(selectedAnalysisDate.getFullYear(), parseInt(e.target.value), 1))}>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="form-select form-select-sm rounded-pill px-3 fw-bold"
                        value={selectedAnalysisDate.getFullYear()} 
                        onChange={e => setSelectedAnalysisDate(new Date(parseInt(e.target.value), selectedAnalysisDate.getMonth(), 1))}>
                  {[...Array(10)].map((_, i) => { const y = new Date().getFullYear() - 5 + i; return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
            </div>

            <div className="glass-card p-4 p-md-5 shadow-lg mb-4">
              <div className="row align-items-center">
                <div className="col-lg-7">
                  <h4 className="text-primary fw-bold mb-4"><PieChart size={24} className="me-2"/> Resumen de {selectedAnalysisDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                  <div className="row g-3">
                    <div className="col-6"><div className="p-4 rounded-4" style={{ backgroundColor: 'color-mix(in srgb, var(--secondary-color) 10%, transparent)' }}><span className="d-block text-muted-fix small fw-bold mb-1">CIRUGIAS</span><span className="h3 fw-bold text-contrast-fix">{statsPeriodo.count}</span></div></div>
                    <div className="col-6"><div className="p-4 rounded-4" style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, transparent)' }}><span className="d-block text-muted-fix small fw-bold mb-1">TOTAL BRUTO</span><span className="h3 fw-bold text-contrast-fix">${statsPeriodo.bruto.toLocaleString()}</span></div></div>
                  </div>
                </div>
                <div className="col-lg-5 text-lg-end mt-4 mt-lg-0 border-lg-start ps-lg-5">
                  <span className="text-muted-fix fw-bold small">MONTO NETO LIQUIDO</span>
                  <h2 className="display-5 fw-bold text-success mt-2">${statsPeriodo.liquido.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                  <div className="badge bg-danger bg-opacity-10 text-danger p-2 px-3 rounded-pill fw-bold">Retencion Automatica ({(TAX_RATE*100).toFixed(2)}%): -${statsPeriodo.retencion.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button onClick={() => exportToExcel(statsPeriodo.filteredRecords, `Reporte_${selectedAnalysisDate.getMonth()+1}_${selectedAnalysisDate.getFullYear()}`)} className="btn btn-outline-success btn-sm flex-grow-1 rounded-pill fw-bold"><FileSpreadsheet size={16} className="me-1"/> Excel</button>
                    <button onClick={() => exportToPDF(statsPeriodo, selectedAnalysisDate)} className="btn btn-outline-danger btn-sm flex-grow-1 rounded-pill fw-bold"><FileText size={16} className="me-1"/> Plantilla PDF</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Trash2 className="text-danger" size={20}/>
                <h5 className="fw-bold m-0 text-contrast-fix">Papelera de Reciclaje</h5>
              </div>
              <div className="glass-card p-3 p-md-4 shadow-sm">
                {trashedRecords.length === 0 ? (
                   <p className="text-muted small m-0 text-center py-3">La papelera esta vacia.</p>
                ) : (
                  <div className="table-responsive">
                    <table className={`table ${darkMode ? 'table-dark' : 'table-light'} table-hover align-middle mb-0`}>
                      <thead>
                        <tr className="small text-muted">
                          <th>PACIENTE</th>
                          <th>FECHA</th>
                          <th>VALOR BRUTO</th>
                          <th className="text-end">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trashedRecords.map(r => (
                          <tr key={r.id}>
                            <td className="fw-bold text-start">{r.paciente}</td>
                            <td className="text-start">{r.fecha}</td>
                            <td className="text-start">${Number(r.valorBruto).toLocaleString()}</td>
                            <td className="text-end">
                              <button onClick={() => restoreRecord(r.id)} title="Restaurar" className="btn btn-sm btn-outline-success rounded-circle me-2"><RotateCcw size={14}/></button>
                              <button onClick={() => softDelete(r.id)} title="Eliminar Permanente" className="btn btn-sm btn-outline-danger rounded-circle"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-fade text-start">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
              <h2 className="fw-bold text-contrast-fix m-0">Historial</h2>
              <div className="d-flex flex-wrap gap-2 w-100 w-lg-auto">
                <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: 'var(--text-muted)' }} size={18} />
                  <input type="text" className="form-control ps-5 rounded-pill" placeholder="Buscar por paciente, clinica, medico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => { setSearchTerm(''); setDateRange({start:'', end:''}) }} className="btn rounded-pill fw-bold" style={{ backgroundColor: darkMode ? 'transparent' : 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--border-color)', borderWidth: '1px', borderStyle: 'solid' }}>Limpiar</button>
              </div>
            </div>

            <div className="glass-card p-3 mb-4 shadow-sm border-0 d-flex flex-wrap align-items-center gap-3" style={{ backgroundColor: darkMode ? 'rgba(108,117,125,0.1)' : 'var(--bg-card)' }}>
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-primary"/>
                <span className="small fw-bold text-muted-fix">RANGO DE FECHAS:</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <input type="date" className="form-control form-control-sm rounded-pill" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                <input type="date" className="form-control form-control-sm rounded-pill" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
              </div>
              <div className="ms-auto">
                <span className="badge bg-primary rounded-pill px-3">{filteredHistory.length} registros</span>
              </div>
            </div>

            <div className="row g-4">
              {filteredHistory.length === 0 ? (
                <div className="col-12 text-center py-5"><ClipboardList size={60} className="text-muted opacity-25 mb-3" /><p className="text-muted-fix h5">No hay registros que coincidan.</p></div>
              ) : (
                filteredHistory.map(r => {
                  const f = calculateFinance(r.valorBruto);
                  return (
                    <div className="col-md-6 col-xl-4" key={r.id}>
                      <div className={`card h-100 shadow-sm border-0 ${darkMode ? 'bg-dark border-secondary' : 'bg-white'}`} style={{ borderRadius: '20px' }}>
                        <div className="card-body p-4">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary py-2 px-3 fw-bold rounded-pill">{r.fecha}</span>
                            <span className="text-muted small">#{r.id.split('-')[1].slice(-4)}</span>
                          </div>
                          <h5 className="fw-bold text-contrast-fix mb-1 text-start">{r.paciente}</h5>
                          <p className="text-primary small mb-1 fw-bold text-start">{r.tipoCx}</p>
                          {r.medico && <p className="text-info small mb-3 fw-bold text-start"><Stethoscope size={12} className="me-1"/>{r.medico}</p>}
                          <div className="p-3 rounded-4 mb-3" style={{ backgroundColor: darkMode ? 'rgba(108,117,125,0.1)' : 'var(--bg-card-alt)' }}>
                            <div className="d-flex justify-content-between small text-start"><span>Bruto:</span><span className="fw-bold text-contrast-fix">${f.bruto.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between small text-success fw-bold mt-1 text-start"><span>Neto ({(100 - TAX_RATE*100).toFixed(2)}%):</span><span>${f.liquido.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted-fix text-start"><MapPin size={12} className="me-1"/>{r.institucion}</span>
                            <div className="d-flex gap-1">
                              <button onClick={() => { setFormData(r); setEditingId(r.id); setView('form'); }} className="btn btn-sm btn-outline-primary rounded-circle p-2"><Edit3 size={16}/></button>
                              <button onClick={() => softDelete(r.id)} className="btn btn-sm btn-outline-danger rounded-circle p-2"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {currentView === 'home' && (
          <div className="text-center py-5 animate-fade">
            <h1 className="display-4 fw-bold text-contrast-fix mb-3">Dra. <span className="text-primary">Maria Joaquina</span></h1>
            <p className="lead text-muted-fix mb-5">Gestion de Honorarios e Impuestos Quirurgicos.</p>
            <div className="row justify-content-center g-4 px-2">
              {[ { v: 'form', i: <PlusCircle size={40}/>, t: 'Registrar Cx', c: 'text-primary' }, 
                 { v: 'calendar', i: <CalendarIcon size={40}/>, t: 'Ver Agenda', c: 'text-info' },
                 { v: 'history', i: <ClipboardList size={40}/>, t: 'Historial', c: 'text-success' },
                 { v: 'dashboard', i: <TrendingUp size={40}/>, t: 'Reporte Mensual', c: 'text-warning' }
              ].map(item => (
                <div key={item.v} className="col-6 col-md-3">
                  <div onClick={() => setView(item.v)} className="card p-4 glass-card h-100 cursor-pointer shadow-sm border-0 border-hover">
                    <div className={item.c + " mx-auto mb-3"}>{item.i}</div>
                    <h6 className="fw-bold text-contrast-fix">{item.t}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <footer className="py-4 mt-auto border-top" style={{ backgroundColor: 'var(--bg-nav)', borderColor: darkMode ? 'var(--border-secondary)' : 'var(--navbar-border)' }}>
        <div className="container text-center">
          <p className="small text-muted-fix mb-0 fw-bold opacity-75">SurgiTrack Pro Elite v10.0 • Dra. Maria Joaquina • Impuestos: {(TAX_RATE*100).toFixed(2)}%</p>
        </div>
      </footer>
    </div>
  );
}
