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
  PlusCircle,
  X,
  Search,
  Filter,
  ArrowRight,
  Receipt
} from 'lucide-react';

const XLSX_SCRIPT_URL = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
const TAX_RATE = 0.1525; // 15.25% solicitado

const Navbar = ({ view, setView, darkMode, setDarkMode }) => (
  <nav className={`navbar sticky-top border-bottom px-2 py-2 px-md-3 py-md-3 ${darkMode ? 'navbar-dark bg-dark border-secondary' : 'navbar-light bg-white border-light'}`} 
       style={{ backdropFilter: 'blur(20px)', backgroundColor: darkMode ? '#0f0f14' : '#ffffff', zIndex: 1050 }}>
    <div className="container-fluid flex-nowrap">
      <div className="d-flex align-items-center gap-2 gap-md-3" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
        <div className="bg-primary bg-gradient p-2 rounded-4 shadow-sm">
          <Stethoscope className="text-white" size={20} />
        </div>
        <div className="d-flex flex-column d-none d-sm-flex">
          <span className="fw-bold h6 mb-0 text-primary" style={{ letterSpacing: '-0.5px' }}>SurgiTrack <span className="text-info">Pro</span></span>
          <small className={`fw-bold text-uppercase ${darkMode ? 'text-light' : 'text-dark'}`} style={{ fontSize: '8px', opacity: 0.8 }}>Dra. Maria Joaquina</small>
        </div>
      </div>

      <div className="d-flex align-items-center gap-1 gap-md-2">
        <button onClick={() => setView('form')} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 me-2 shadow-sm">
          <PlusCircle size={18} /> <span className="d-none d-md-inline">Nueva Cx</span>
        </button>
        
        <div className={`d-flex p-1 rounded-4 border ${darkMode ? 'bg-secondary bg-opacity-25 border-secondary' : 'bg-light border-light'}`}>
          <button onClick={() => setView('dashboard')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'dashboard' ? 'btn-primary shadow-sm text-white' : 'border-0 text-secondary'}`}>
            <TrendingUp size={16} className="d-md-none"/> <span className="d-none d-md-inline">Análisis</span>
          </button>
          <button onClick={() => setView('calendar')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'calendar' ? 'btn-primary shadow-sm text-white' : 'border-0 text-secondary'}`}>
            <CalendarIcon size={16} className="d-md-none"/> <span className="d-none d-md-inline">Agenda</span>
          </button>
          <button onClick={() => setView('history')} className={`btn btn-sm px-2 px-md-3 rounded-pill fw-bold ${view === 'history' ? 'btn-primary shadow-sm text-white' : 'border-0 text-secondary'}`}>
            <ClipboardList size={16} className="d-md-none"/> <span className="d-none d-md-inline">Registros</span>
          </button>
        </div>
        
        <button onClick={() => setDarkMode(!darkMode)} className={`btn border-0 p-2 rounded-circle ${darkMode ? 'text-warning' : 'text-secondary'}`}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  </nav>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState('home'); 
  const [editingId, setEditingId] = useState(null);
  
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState(new Date());
  const [selectedDayRecords, setSelectedDayRecords] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('mj_surgical_v9_1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mj_surgical_v9_1', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = XLSX_SCRIPT_URL;
    document.head.appendChild(script);
  }, []);

  const calculateFinance = (bruto) => {
    const val = parseFloat(bruto) || 0;
    const retencion = val * TAX_RATE;
    const liquido = val - retencion;
    return { bruto: val, retencion, liquido };
  };

  const initialForm = {
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    institucion: '',
    paciente: '',
    tipoCx: '',
    valorBruto: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const openFormWithDate = (dateStr) => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      fecha: dateStr,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    setView('form');
  };

  const exportToExcel = (dataToExport, filename) => {
    if (!window.XLSX) return;
    const worksheetData = dataToExport.map(r => {
      const f = calculateFinance(r.valorBruto);
      return {
        "ID Registro": r.id, "Fecha": r.fecha, "Hora": r.hora, "Paciente": r.paciente,
        "Procedimiento": r.tipoCx, "Institución": r.institucion, "Monto Bruto ($)": f.bruto,
        "Retención 15.25% ($)": f.retencion, "Monto Neto ($)": f.liquido
      };
    });
    const worksheet = window.XLSX.utils.json_to_sheet(worksheetData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cirugías");
    window.XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const statsPeriodo = useMemo(() => {
    const month = selectedAnalysisDate.getMonth();
    const year = selectedAnalysisDate.getFullYear();
    const filtered = records.filter(r => {
      const d = new Date(r.fecha + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const bruto = filtered.reduce((acc, curr) => acc + (parseFloat(curr.valorBruto) || 0), 0);
    return { bruto, retencion: bruto * TAX_RATE, liquido: bruto * (1 - TAX_RATE), count: filtered.length, filteredRecords: filtered };
  }, [records, selectedAnalysisDate]);

  const filteredHistory = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tipoCx.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.institucion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const dateVal = new Date(r.fecha + "T00:00:00");
      const startLimit = dateRange.start ? new Date(dateRange.start + "T00:00:00") : null;
      const endLimit = dateRange.end ? new Date(dateRange.end + "T23:59:59") : null;
      const matchesDate = (!startLimit || dateVal >= startLimit) && (!endLimit || dateVal <= endLimit);
      
      return matchesSearch && matchesDate;
    });
  }, [records, searchTerm, dateRange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...formData, id: r.id } : r));
      setEditingId(null);
    } else {
      setRecords([{ ...formData, id: `CX-${Date.now()}` }, ...records]);
    }
    setFormData(initialForm);
    setView('history');
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

  // Resumen financiero del día seleccionado
  const selectedDayFinance = useMemo(() => {
    if (!selectedDayRecords) return null;
    const bruto = selectedDayRecords.records.reduce((acc, curr) => acc + (parseFloat(curr.valorBruto) || 0), 0);
    const retencion = bruto * TAX_RATE;
    const liquido = bruto - retencion;
    return { bruto, retencion, liquido };
  }, [selectedDayRecords]);

  return (
    <div className={`min-vh-100 d-flex flex-column ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`} style={{ width: '100vw', overflowX: 'hidden' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
      <style>{`
        body { font-family: 'Inter', sans-serif; background: ${darkMode ? '#0a0a0c' : '#f9fafb'}; }
        .text-contrast-fix { color: ${darkMode ? '#FFFFFF !important' : '#111827 !important'}; }
        .text-muted-fix { color: ${darkMode ? '#A1A1AA !important' : '#4B5563 !important'}; }
        
        .form-control, .form-select {
          background-color: ${darkMode ? '#1a1a20' : '#ffffff'} !important;
          color: ${darkMode ? '#ffffff' : '#000000'} !important;
          border: 1px solid ${darkMode ? '#3f3f46' : '#d1d5db'} !important;
          padding: 12px 16px;
          border-radius: 12px;
        }

        .glass-card { 
          background: ${darkMode ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; 
          backdrop-filter: blur(10px); 
          border: 1px solid ${darkMode ? '#333' : '#eee'};
          border-radius: 24px;
        }

        .calendar-cell { min-height: 100px; border-radius: 12px; transition: 0.2s; position: relative; border: 1px solid ${darkMode ? '#222' : '#eee'}; }
        .calendar-cell:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .calendar-cell:hover .day-add-btn { opacity: 1; }
        
        .day-add-btn {
          position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; border: none;
          background-color: ${darkMode ? '#334155' : '#e2e8f0'};
          color: ${darkMode ? '#fff' : '#0d6efd'};
        }
        .day-add-btn:hover { opacity: 1 !important; transform: scale(1.1); background: #0d6efd !important; color: white !important; }

        .btn-plus-float {
          position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%;
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 25px rgba(13, 110, 253, 0.4); transition: 0.3s;
        }
        
        /* Arreglo contraste botones navegación */
        .btn-nav-cal {
           background-color: ${darkMode ? '#2a2a35' : '#f8f9fa'};
           color: ${darkMode ? '#ffffff' : '#333333'};
           border: 1px solid ${darkMode ? '#3f3f46' : '#dee2e6'};
        }
        .btn-nav-cal:hover {
           background-color: ${darkMode ? '#3f3f46' : '#e9ecef'};
        }

        .animate-fade { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} />

      <button onClick={() => { setEditingId(null); setFormData(initialForm); setView('form'); }} className="btn btn-primary btn-plus-float">
        <Plus size={32} />
      </button>

      <main className="container-fluid px-3 px-md-5 py-4 flex-grow-1">
        
        {/* FORMULARIO */}
        {view === 'form' && (
          <div className="d-flex justify-content-center animate-fade py-2">
            <div className={`card glass-card p-4 p-md-5 w-100 shadow-lg`} style={{ maxWidth: '700px' }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="text-start">
                  <h2 className="fw-bold text-contrast-fix m-0">{editingId ? 'Editar Cirugía' : 'Nuevo Registro'}</h2>
                  <p className="text-muted-fix small">Retención Automática del {(TAX_RATE*100).toFixed(2)}%</p>
                </div>
                <button onClick={() => setView('calendar')} className={`btn rounded-circle p-2 border-0 ${darkMode ? 'text-light' : 'text-dark'}`}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6"><label className="form-label fw-bold text-contrast-fix small">FECHA</label>
                  <input type="date" className="form-control" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required /></div>
                <div className="col-md-6"><label className="form-label fw-bold text-contrast-fix small">HORA</label>
                  <input type="time" className="form-control" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">PACIENTE</label>
                  <input type="text" className="form-control" placeholder="Nombre completo" value={formData.paciente} onChange={e => setFormData({...formData, paciente: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">CIRUGÍA / PROCEDIMIENTO</label>
                  <input type="text" className="form-control" placeholder="Tipo de cirugía" value={formData.tipoCx} onChange={e => setFormData({...formData, tipoCx: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">INSTITUCIÓN</label>
                  <input type="text" className="form-control" placeholder="Clínica o Hospital" value={formData.institucion} onChange={e => setFormData({...formData, institucion: e.target.value})} required /></div>
                <div className="col-12"><label className="form-label fw-bold text-contrast-fix small">HONORARIOS BRUTOS ($)</label>
                  <input type="number" className="form-control fw-bold text-primary h4 py-3" value={formData.valorBruto} onChange={e => setFormData({...formData, valorBruto: e.target.value})} required /></div>
                <div className="col-12 mt-4"><button type="submit" className="btn btn-primary w-100 p-3 rounded-pill fw-bold shadow-sm">{editingId ? 'Guardar Cambios' : 'Confirmar Registro'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* CALENDARIO */}
        {view === 'calendar' && (
          <div className="animate-fade">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
              <h2 className="fw-bold m-0 text-contrast-fix">Agenda Quirúrgica</h2>
              <div className={`d-flex align-items-center rounded-pill p-1 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
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
                    <div key={i} className={`calendar-cell p-2 ${d.day ? (darkMode ? 'bg-dark' : 'bg-white') : 'bg-transparent border-0'} ${d.records?.length > 0 ? 'border-primary border-opacity-50 shadow-sm' : ''}`} style={d.records?.length > 0 ? {backgroundColor: darkMode ? '#1e293b' : '#f0f7ff'} : {}}>
                      {d.day && (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className={`fw-bold small ${d.records?.length > 0 ? 'text-primary' : 'text-contrast-fix'}`}>{d.day}</span>
                            <button onClick={(e) => { e.stopPropagation(); openFormWithDate(d.date); }} className="day-add-btn"><Plus size={14} /></button>
                          </div>
                          <div onClick={() => setSelectedDayRecords(d)} style={{ cursor: 'pointer', minHeight: '60px' }}>
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
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between mb-3">
                        <h4 className="fw-bold text-contrast-fix m-0">Día {selectedDayRecords.date.split('-').reverse().join('/')}</h4>
                        <button className={`btn-close ${darkMode ? 'btn-close-white' : ''}`} onClick={() => setSelectedDayRecords(null)}></button>
                      </div>

                      {/* RESUMEN FINANCIERO DEL DÍA */}
                      {selectedDayFinance.bruto > 0 && (
                        <div className={`p-3 rounded-4 mb-4 border ${darkMode ? 'bg-success bg-opacity-10 border-success border-opacity-25' : 'bg-success bg-opacity-10 border-success border-opacity-10'}`}>
                           <div className="d-flex align-items-center gap-2 mb-2">
                             <Receipt size={18} className="text-success"/>
                             <span className="fw-bold text-success small">Resumen Diario</span>
                           </div>
                           <div className="d-flex justify-content-between small mb-1">
                             <span className="text-muted-fix">Total Bruto:</span>
                             <span className="fw-bold text-contrast-fix">${selectedDayFinance.bruto.toLocaleString()}</span>
                           </div>
                           <div className="d-flex justify-content-between small mb-1">
                             <span className="text-muted-fix">Retención ({(TAX_RATE*100).toFixed(2)}%):</span>
                             <span className="fw-bold text-danger">-${selectedDayFinance.retencion.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                           </div>
                           <hr className="my-2 opacity-10" />
                           <div className="d-flex justify-content-between align-items-center">
                             <span className="fw-bold text-success small">LÍQUIDO:</span>
                             <span className="h5 fw-bold text-success m-0">${selectedDayFinance.liquido.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                           </div>
                        </div>
                      )}

                      <button onClick={() => openFormWithDate(selectedDayRecords.date)} className="btn btn-primary w-100 mb-4 rounded-pill fw-bold"><Plus size={18} className="me-2"/> Nueva en este día</button>
                      
                      <div className="records-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {selectedDayRecords.records.length === 0 ? (
                          <p className="text-center text-muted small py-4">No hay cirugías programadas</p>
                        ) : (
                          selectedDayRecords.records.map((r, idx) => (
                            <div key={idx} className="border-bottom border-secondary border-opacity-10 pb-3 mb-3 last-child-border-0">
                              <div className="d-flex justify-content-between fw-bold text-contrast-fix mb-1">
                                <span><Clock size={14} className="me-1"/>{r.hora}</span>
                                <span className="text-primary">${Number(r.valorBruto).toLocaleString()}</span>
                              </div>
                              <div className="text-contrast-fix fw-bold small">{r.paciente}</div>
                              <div className="text-muted-fix x-small mt-1" style={{ fontSize: '11px' }}>{r.tipoCx} • {r.institucion}</div>
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

        {/* ANÁLISIS (HISTÓRICO CUALQUIER MES/AÑO) */}
        {view === 'dashboard' && (
          <div className="animate-fade">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
              <h2 className="fw-bold text-contrast-fix m-0">Análisis Financiero</h2>
              <div className="d-flex gap-2">
                <select className={`form-select form-select-sm rounded-pill px-3 fw-bold ${darkMode ? 'bg-nav-cal' : ''}`} 
                        value={selectedAnalysisDate.getMonth()} 
                        onChange={e => setSelectedAnalysisDate(new Date(selectedAnalysisDate.getFullYear(), parseInt(e.target.value), 1))}>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className={`form-select form-select-sm rounded-pill px-3 fw-bold ${darkMode ? 'bg-nav-cal' : ''}`} 
                        value={selectedAnalysisDate.getFullYear()} 
                        onChange={e => setSelectedAnalysisDate(new Date(parseInt(e.target.value), selectedAnalysisDate.getMonth(), 1))}>
                  {[...Array(10)].map((_, i) => { const y = new Date().getFullYear() - 5 + i; return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
            </div>

            <div className={`glass-card p-4 p-md-5 shadow-lg mb-4`}>
              <div className="row align-items-center">
                <div className="col-lg-7">
                  <h4 className="text-primary fw-bold mb-4"><PieChart size={24} className="me-2"/> Resumen de {selectedAnalysisDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                  <div className="row g-3">
                    <div className="col-6"><div className="p-4 rounded-4 bg-secondary bg-opacity-10"><span className="d-block text-muted-fix small fw-bold mb-1">CIRUGÍAS</span><span className="h3 fw-bold text-contrast-fix">{statsPeriodo.count}</span></div></div>
                    <div className="col-6"><div className="p-4 rounded-4 bg-primary bg-opacity-10"><span className="d-block text-muted-fix small fw-bold mb-1">TOTAL BRUTO</span><span className="h3 fw-bold text-contrast-fix">${statsPeriodo.bruto.toLocaleString()}</span></div></div>
                  </div>
                </div>
                <div className="col-lg-5 text-lg-end mt-4 mt-lg-0 border-lg-start ps-lg-5">
                  <span className="text-muted-fix fw-bold small">MONTO NETO LIQUIDO</span>
                  <h2 className="display-5 fw-bold text-success mt-2">${statsPeriodo.liquido.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                  <div className="badge bg-danger bg-opacity-10 text-danger p-2 px-3 rounded-pill fw-bold">Retención Automática ({(TAX_RATE*100).toFixed(2)}%): -${statsPeriodo.retencion.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <button onClick={() => exportToExcel(statsPeriodo.filteredRecords, `Reporte_${selectedAnalysisDate.getMonth()+1}_${selectedAnalysisDate.getFullYear()}`)} className="btn btn-outline-success btn-sm w-100 mt-4 rounded-pill fw-bold"><FileSpreadsheet size={16}/> Exportar Excel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL CON FILTROS */}
        {view === 'history' && (
          <div className="animate-fade">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
              <h2 className="fw-bold text-contrast-fix m-0">Historial</h2>
              <div className="d-flex flex-wrap gap-2 w-100 w-lg-auto">
                <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                  <input type="text" className="form-control ps-5 rounded-pill" placeholder="Buscar por paciente, clínica..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => { setSearchTerm(''); setDateRange({start:'', end:''}) }} className={`btn rounded-pill fw-bold ${darkMode ? 'btn-outline-secondary' : 'btn-light border'}`}>Limpiar</button>
              </div>
            </div>

            <div className={`glass-card p-3 mb-4 shadow-sm border-0 d-flex flex-wrap align-items-center gap-3 ${darkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-primary"/>
                <span className="small fw-bold text-muted-fix">RANGO DE FECHAS:</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <input type="date" className="form-control form-control-sm rounded-pill" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <ArrowRight size={14} className="text-muted" />
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
                          <h5 className="fw-bold text-contrast-fix mb-1">{r.paciente}</h5>
                          <p className="text-primary small mb-3 fw-bold">{r.tipoCx}</p>
                          <div className={`p-3 rounded-4 mb-3 ${darkMode ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                            <div className="d-flex justify-content-between small"><span>Bruto:</span><span className="fw-bold text-contrast-fix">${f.bruto.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between small text-success fw-bold mt-1"><span>Neto ({(100 - TAX_RATE*100).toFixed(2)}%):</span><span>${f.liquido.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted-fix"><MapPin size={12} className="me-1"/>{r.institucion}</span>
                            <div className="d-flex gap-1">
                              <button onClick={() => { setFormData(r); setEditingId(r.id); setView('form'); }} className="btn btn-sm btn-outline-primary rounded-circle p-2"><Edit3 size={16}/></button>
                              <button onClick={() => { if(confirm('¿Eliminar registro?')) setRecords(records.filter(x => x.id !== r.id)) }} className="btn btn-sm btn-outline-danger rounded-circle p-2"><Trash2 size={16}/></button>
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

        {/* HOME */}
        {view === 'home' && (
          <div className="text-center py-5 animate-fade">
            <h1 className="display-4 fw-bold text-contrast-fix mb-3">Dra. <span className="text-primary">Maria Joaquina</span></h1>
            <p className="lead text-muted-fix mb-5">Gestión de Honorarios e Impuestos Quirúrgicos.</p>
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

      <footer className={`py-4 mt-auto border-top ${darkMode ? 'bg-dark border-secondary' : 'bg-white border-light'}`}>
        <div className="container text-center">
          <p className="small text-muted-fix mb-0 fw-bold opacity-75">SurgiTrack Pro Elite v9.1 • Dra. Maria Joaquina • Impuestos: {(TAX_RATE*100).toFixed(2)}%</p>
        </div>
      </footer>
    </div>
  );
}