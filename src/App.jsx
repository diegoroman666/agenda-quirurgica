import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  ClipboardList, 
  Moon,
  Sun,
  Edit3,
  Clock,
  Stethoscope,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calculator,
  TrendingUp,
  AlertCircle,
  FileText,
  MapPin,
  Calendar as CalendarIcon,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * COMPONENTE NAVBAR
 * Diseño premium con desenfoque de fondo y soporte para modo oscuro.
 */
const Navbar = ({ view, setView, darkMode, setDarkMode, currentTime }) => (
  <nav className={`navbar sticky-top border-bottom px-2 py-2 px-md-3 py-md-3 ${darkMode ? 'navbar-dark bg-dark border-secondary' : 'navbar-light bg-white border-light'}`} 
       style={{ backdropFilter: 'blur(20px)', backgroundColor: darkMode ? 'rgba(15, 15, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)', zIndex: 1050 }}>
    <div className="container-fluid flex-nowrap">
      <div className="d-flex align-items-center gap-2 gap-md-3" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
        <div className="bg-primary bg-gradient p-2 rounded-4 shadow-sm">
          <Stethoscope className="text-white" size={20} />
        </div>
        <div className="d-flex flex-column d-none d-sm-flex">
          <span className="fw-bold h6 mb-0 text-primary" style={{ letterSpacing: '-0.5px' }}>SurgiTrack <span className="text-info">Pro</span></span>
          <small className={`fw-bold text-uppercase opacity-75 ${darkMode ? 'text-white' : 'text-dark'}`} style={{ fontSize: '8px', letterSpacing: '1px' }}>Dra. Maria Joaquina</small>
        </div>
      </div>

      <div className={`d-none d-lg-flex align-items-center gap-3 px-3 py-2 rounded-pill border shadow-sm ${darkMode ? 'bg-white bg-opacity-10 text-white border-secondary' : 'bg-light text-primary border-primary border-opacity-10'}`}>
        <Clock size={16} />
        <span className="font-monospace fw-bold small">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      <div className="d-flex align-items-center gap-1 gap-md-2">
        <div className="d-flex bg-secondary bg-opacity-10 p-1 rounded-4 border me-1 me-md-2">
          <button onClick={() => setView('dashboard')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold transition-all ${view === 'dashboard' ? 'btn-primary shadow-sm' : 'border-0 text-secondary'}`}>
            <TrendingUp size={16} className="d-md-none"/> <span className="d-none d-md-inline">Análisis</span>
          </button>
          <button onClick={() => setView('calendar')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold transition-all ${view === 'calendar' ? 'btn-primary shadow-sm' : 'border-0 text-secondary'}`}>
            <CalendarIcon size={16} className="d-md-none"/> <span className="d-none d-md-inline">Agenda</span>
          </button>
          <button onClick={() => setView('history')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold transition-all ${view === 'history' ? 'btn-primary shadow-sm' : 'border-0 text-secondary'}`}>
            <ClipboardList size={16} className="d-md-none"/> <span className="d-none d-md-inline">Registros</span>
          </button>
        </div>
        
        <button onClick={() => setDarkMode(!darkMode)} className={`btn border-0 p-2 rounded-circle hover-scale ${darkMode ? 'text-warning' : 'text-secondary'}`}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  </nav>
);

const Footer = ({ darkMode }) => (
  <footer className={`py-5 mt-auto border-top ${darkMode ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-light'}`}>
    <div className="container text-center">
      <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
         <Stethoscope className="text-primary" />
         <span className="fw-bold h5 mb-0">SurgiTrack Pro</span>
      </div>
      <p className="small opacity-50 mb-0">Desarrollado con <Heart size={12} className="text-danger fill-danger" /> para la Dra. Maria Joaquina.</p>
    </div>
  </footer>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState('home'); 
  const [editingId, setEditingId] = useState(null);
  const [showFinances, setShowFinances] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('mj_surgical_v5_final');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mj_surgical_v5_final', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const initialForm = {
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    institucion: '',
    paciente: '',
    tipoCx: '',
    estadoCx: 'Programada',
    valorBruto: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const calculateFinance = (bruto) => {
    const val = parseFloat(bruto) || 0;
    const retencion = val * 0.15;
    const liquido = val - retencion;
    return { bruto: val, retencion, liquido };
  };

  const downloadCSV = () => {
    const headers = ["Fecha", "Hora", "Paciente", "Procedimiento", "Institucion", "Estado", "Bruto", "Retencion(15%)", "Liquido"];
    const rows = records.map(r => {
      const f = calculateFinance(r.valorBruto);
      return [r.fecha, r.hora, r.paciente, r.tipoCx, r.institucion, r.estadoCx, f.bruto, f.retencion, f.liquido].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_MJ_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...formData, id: r.id } : r));
      setEditingId(null);
    } else {
      setRecords([{ ...formData, id: Date.now() }, ...records]);
    }
    setFormData(initialForm);
    setView('history');
  };

  const startEdit = (record) => {
    setFormData(record);
    setEditingId(record.id);
    setView('form');
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
      days.push({ day: i, date: dateStr, records: records.filter(r => r.fecha === dateStr) });
    }
    return days;
  }, [currentCalDate, records]);

  return (
    <div className={`min-vh-100 d-flex flex-column m-0 p-0 ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`} 
         style={{ transition: 'background 0.3s ease', overflowX: 'hidden', width: '100vw' }}>
      
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        body { overflow-x: hidden; width: 100vw; margin: 0; padding: 0; background: ${darkMode ? '#121212' : '#f8f9fa'}; }
        .fw-black { font-weight: 800 !important; }
        .card { border-radius: 24px; border: none; }
        .glass-panel { background: ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; backdrop-filter: blur(10px); border: 1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; }
        
        /* Correcion de inputs en Modo Oscuro */
        .form-control, .form-select { 
          color: ${darkMode ? '#ffffff' : '#212529'} !important;
          background-color: ${darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff'} !important;
          border-color: ${darkMode ? 'rgba(255,255,255,0.1)' : '#dee2e6'} !important;
        }
        .form-control::placeholder { color: ${darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} !important; }
        .form-label { color: ${darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} !important; }

        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; min-width: 800px; }
        .calendar-container { overflow-x: auto; padding-bottom: 20px; }
        .calendar-cell { min-height: 140px; border-radius: 20px; transition: transform 0.2s; position: relative; }
        .calendar-cell:hover { transform: scale(1.02); }

        .text-time-contrast { color: ${darkMode ? '#00d2ff' : '#0d6efd'} !important; }
        .btn-primary { background: linear-gradient(135deg, #0d6efd 0%, #00d2ff 100%); border: none; }
      `}</style>
      
      <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} currentTime={currentTime} />

      <main className="container-fluid px-3 px-md-5 flex-grow-1 py-4">
        
        {/* HOME */}
        {view === 'home' && (
          <div className="row align-items-center py-5">
            <div className="col-lg-6 mb-5 mb-lg-0 text-center text-lg-start">
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-4 fw-bold">DRA. MARIA JOAQUINA</span>
              <h1 className="display-2 fw-black mb-4 ls-n1">Gestión de <span className="text-primary">Vanguardia</span> Quirúrgica.</h1>
              <p className="lead opacity-75 mb-5 pe-lg-5">Control total de tus procedimientos, finanzas y agenda en una plataforma diseñada para la excelencia médica.</p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <button className="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg" onClick={() => setView('calendar')}>Explorar Agenda</button>
                <button className="btn btn-outline-primary btn-lg px-5 py-3 rounded-pill fw-bold" onClick={() => { setFormData(initialForm); setView('form'); }}>Nueva Intervención</button>
              </div>
            </div>
            <div className="col-lg-6">
              <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80" className="img-fluid rounded-5 shadow-2xl" alt="Cirugía" />
            </div>
          </div>
        )}

        {/* CALENDARIO */}
        {view === 'calendar' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
              <h2 className="fw-black m-0 h1">Calendario Quirúrgico</h2>
              <div className="d-flex align-items-center glass-panel p-2 rounded-pill shadow-sm">
                <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="btn btn-light rounded-circle p-2"><ChevronLeft size={20}/></button>
                <span className="px-4 fw-bold text-uppercase text-primary" style={{ minWidth: '180px', textAlign: 'center' }}>
                  {currentCalDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="btn btn-light rounded-circle p-2"><ChevronRight size={20}/></button>
              </div>
            </div>

            <div className="calendar-container">
              <div className="calendar-grid text-center mb-3">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                  <div key={d} className="fw-bold text-secondary small text-uppercase ls-2">{d}</div>
                ))}
              </div>

              <div className="calendar-grid">
                {calendarDays.map((d, i) => (
                  <div key={i}>
                    {d.day ? (
                      <div 
                        onClick={() => setView('history')}
                        className={`calendar-cell p-3 border ${d.records.length > 0 ? 'border-primary bg-primary bg-opacity-10' : (darkMode ? 'bg-white bg-opacity-5 border-secondary border-opacity-20' : 'bg-white border-light shadow-sm')}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between">
                          <span className={`fw-black h4 ${d.records.length > 0 ? 'text-primary' : 'opacity-25'}`}>{d.day}</span>
                          {d.records.length > 0 && <span className="badge rounded-pill bg-primary">{d.records.length}</span>}
                        </div>
                        <div className="mt-2">
                          {d.records.slice(0, 2).map((r, idx) => (
                            <div key={idx} className="bg-primary text-white p-1 mb-1 rounded text-truncate fw-bold" style={{ fontSize: '10px' }}>
                              {r.paciente}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFormData({...initialForm, fecha: d.date}); setView('form'); }}
                          className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 m-2 shadow"
                          style={{ width: '30px', height: '30px' }}
                        ><PlusCircle size={14}/></button>
                      </div>
                    ) : <div className="calendar-cell opacity-0"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REGISTROS */}
        {view === 'history' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
               <h2 className="fw-black h1 m-0">Historial Médico</h2>
               <div className="d-flex gap-2">
                  <button className="btn btn-outline-success rounded-pill px-4 fw-bold d-flex align-items-center gap-2" onClick={downloadCSV}>
                    <Download size={18}/> Exportar Excel
                  </button>
                  <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => { setFormData(initialForm); setView('form'); }}>
                    Nueva Cirugía
                  </button>
               </div>
            </div>

            <div className="row g-4">
               {records.map(r => {
                 const f = calculateFinance(r.valorBruto);
                 return (
                   <div className="col-12 col-lg-4" key={r.id}>
                     <div className={`card h-100 ${darkMode ? 'bg-secondary bg-opacity-10 border-secondary' : 'bg-white shadow-sm border-light'}`}>
                       <div className="card-body p-4">
                         <div className="d-flex justify-content-between mb-3">
                           <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 py-2 px-3">{r.fecha}</span>
                           <span className={`badge rounded-pill ${r.estadoCx === 'Realizada' ? 'bg-success' : 'bg-warning text-dark'}`}>{r.estadoCx}</span>
                         </div>
                         <h4 className="fw-black">{r.paciente}</h4>
                         <p className="text-secondary small"><MapPin size={12} className="me-1"/> {r.institucion}</p>
                         <hr className="opacity-10"/>
                         <div className="glass-panel p-3 rounded-4 mb-3">
                            <div className="d-flex justify-content-between small opacity-75"><span>Bruto:</span><span>${f.bruto.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between small text-danger"><span>Retención:</span><span>-${f.retencion.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between fw-black text-success h5 mt-2 pt-2 border-top border-secondary border-opacity-10">
                               <span>Líquido:</span><span>${f.liquido.toLocaleString()}</span>
                            </div>
                         </div>
                         <div className="d-flex justify-content-end gap-2">
                           <button onClick={() => startEdit(r)} className="btn btn-sm btn-outline-primary rounded-circle p-2"><Edit3 size={18}/></button>
                           <button onClick={() => setRecords(records.filter(x => x.id !== r.id))} className="btn btn-sm btn-outline-danger rounded-circle p-2"><Trash2 size={18}/></button>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="animate__animated animate__fadeIn">
             <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className="fw-black h1">Dashboard Financiero</h2>
                <button onClick={() => setShowFinances(!showFinances)} className="btn btn-outline-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-2">
                  {showFinances ? <EyeOff size={18}/> : <Eye size={18}/>}
                  {showFinances ? 'Ocultar Datos' : 'Ver Datos'}
                </button>
             </div>
             <div className="row g-4 mb-5 text-white">
                <div className="col-md-4">
                   <div className="p-5 rounded-5 bg-primary bg-gradient shadow-lg">
                      <p className="small fw-bold opacity-75 mb-1 text-uppercase">Total Ingresos Brutos</p>
                      <h2 className="display-4 fw-black">{showFinances ? `$${records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0).toLocaleString()}` : '$ ••••••'}</h2>
                   </div>
                </div>
                <div className="col-md-4">
                   <div className="p-5 rounded-5 bg-dark border border-secondary shadow-lg">
                      <p className="small fw-bold opacity-75 mb-1 text-uppercase text-danger">Impuestos (15%)</p>
                      <h2 className="display-4 fw-black text-danger">{showFinances ? `-$${(records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0) * 0.15).toLocaleString()}` : '$ ••••••'}</h2>
                   </div>
                </div>
                <div className="col-md-4">
                   <div className="p-5 rounded-5 bg-success bg-gradient shadow-lg">
                      <p className="small fw-bold opacity-75 mb-1 text-uppercase">Ganancia Líquida MJ</p>
                      <h2 className="display-4 fw-black">{showFinances ? `$${(records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0) * 0.85).toLocaleString()}` : '$ ••••••'}</h2>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* FORMULARIO */}
        {view === 'form' && (
          <div className="d-flex justify-content-center py-4">
             <div className={`card border-0 shadow-2xl rounded-5 w-100 ${darkMode ? 'bg-secondary bg-opacity-10' : 'bg-white shadow-lg'}`} style={{ maxWidth: '700px' }}>
                <div className="card-body p-4 p-md-5">
                   <h2 className="fw-black text-center mb-5">{editingId ? 'Editar' : 'Nueva'} Cirugía</h2>
                   <form onSubmit={handleSubmit} className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fw-bold small ls-2">FECHA</label>
                        <input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} className="form-control p-3 rounded-4" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small ls-2">HORA</label>
                        <input type="time" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} className="form-control p-3 rounded-4" required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold small ls-2">NOMBRE DEL PACIENTE</label>
                        <input type="text" placeholder="Ej: Juan Pérez" value={formData.paciente} onChange={(e) => setFormData({...formData, paciente: e.target.value})} className="form-control p-3 rounded-4" required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold small ls-2">TIPO DE INTERVENCIÓN</label>
                        <input type="text" placeholder="Ej: Colecistectomía" value={formData.tipoCx} onChange={(e) => setFormData({...formData, tipoCx: e.target.value})} className="form-control p-3 rounded-4" required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold small ls-2">CENTRO MÉDICO</label>
                        <input type="text" placeholder="Ej: Clínica Santa María" value={formData.institucion} onChange={(e) => setFormData({...formData, institucion: e.target.value})} className="form-control p-3 rounded-4" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small ls-2">VALOR BRUTO ($)</label>
                        <input type="number" placeholder="Monto total" value={formData.valorBruto} onChange={(e) => setFormData({...formData, valorBruto: e.target.value})} className="form-control p-3 rounded-4 fw-bold text-primary" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small ls-2">ESTADO</label>
                        <select value={formData.estadoCx} onChange={(e) => setFormData({...formData, estadoCx: e.target.value})} className="form-select p-3 rounded-4">
                          <option>Programada</option>
                          <option>Realizada</option>
                          <option>Cancelada</option>
                        </select>
                      </div>

                      <div className="col-12 mt-5 d-flex gap-3">
                        <button type="button" onClick={() => setView('calendar')} className="btn btn-outline-secondary flex-grow-1 p-3 rounded-pill fw-bold">Volver</button>
                        <button type="submit" className="btn btn-primary flex-grow-1 p-3 rounded-pill fw-bold shadow">Guardar Cambios</button>
                      </div>
                   </form>
                </div>
             </div>
          </div>
        )}

      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
}