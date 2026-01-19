import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Download, 
  Trash2, 
  LayoutDashboard, 
  ClipboardList, 
  Home,
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
  AlertCircle
} from 'lucide-react';

// --- COMPONENTES DE UI ---

const Card = ({ children, className = "" }) => (
  <div className={`rounded-3xl p-6 transition-all duration-300 shadow-sm border ${className} 
    dark:bg-[#1e293b] dark:border-slate-700 bg-white border-slate-200`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", type = "button" }) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md",
    secondary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">{label}</label>
    <input 
      {...props}
      className="w-full rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
    />
  </div>
);

// --- APP PRINCIPAL ---

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState('home'); 
  const [editingId, setEditingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  // --- PERSISTENCIA DE DATOS (LOCAL STORAGE) ---
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('mj_surgical_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mj_surgical_records', JSON.stringify(records));
  }, [records]);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manejo de tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const initialForm = {
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    institucion: '',
    medico: '',
    paciente: '',
    tipoCx: '',
    estadoCx: 'Programada',
    valorBruto: '',
    observaciones: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const calculateFinance = (bruto) => {
    const val = parseFloat(bruto) || 0;
    const retencion = val * 0.15;
    const liquido = val - retencion;
    return { bruto: val, retencion, liquido };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...formData, id: r.id } : r));
      setEditingId(null);
    } else {
      const newRecord = { ...formData, id: Date.now() };
      setRecords([newRecord, ...records]);
    }
    setFormData(initialForm);
    setView('calendar');
  };

  const startEdit = (record) => {
    setFormData(record);
    setEditingId(record.id);
    setView('form');
  };

  const deleteRecord = (id) => {
    setRecords(current => current.filter(r => r.id !== id));
  };

  // --- LÓGICA DE CALENDARIO ---
  const calendarDays = useMemo(() => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, currentMonth: false });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayRecords = records.filter(r => r.fecha === dateStr);
      days.push({ 
        day: i, 
        currentMonth: true, 
        date: dateStr, 
        records: dayRecords || [] 
      });
    }
    return days;
  }, [currentCalDate, records]);

  // --- NAVBAR ---
  const Navbar = () => (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Stethoscope className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-300 leading-tight">
              SurgiTrack
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 dark:text-white">Maria Joaquina</span>
          </div>
        </div>

        {/* RELOJ DIGITAL EN NAVBAR */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <Clock size={18} className="text-indigo-500" />
          <span className="font-mono text-lg font-black text-slate-700 dark:text-indigo-300 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'dashboard', label: 'Estadísticas', icon: <Activity size={14}/> },
              { id: 'calendar', label: 'Agenda', icon: <PlusCircle size={14}/> },
              { id: 'history', label: 'Registros', icon: <ClipboardList size={14}/> }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setView(item.id)} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === item.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-indigo-400'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
          
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-all border border-slate-200 dark:border-slate-700">
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white font-black shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-default">MJ</div>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pb-20 pt-8">
        
        {view === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center max-w-4xl mx-auto space-y-10 py-20">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-[0.3em]">
              <Activity size={16}/> Dashboard Médico v2.0
            </div>
            <h1 className="text-7xl font-black tracking-tighter leading-[0.9]">
              ¡Hola de nuevo, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">Maria Joaquina!</span>
            </h1>
            <p className="text-2xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
              Tus datos están seguros. Revisa tu agenda quirúrgica y gestiona tus honorarios con un solo clic.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Button className="px-12 py-5 text-xl rounded-2xl shadow-indigo-500/40" onClick={() => setView('calendar')}>Ver Mi Agenda</Button>
              <Button variant="outline" className="px-12 py-5 text-xl rounded-2xl" onClick={() => { setFormData(initialForm); setView('form'); }}>Añadir Cirugía</Button>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="animate-in fade-in duration-500 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-1">
                <h2 className="text-5xl font-black tracking-tight">Agenda Quirúrgica</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Organización por días y pacientes</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><ChevronLeft size={24}/></button>
                  <span className="text-xl font-black min-w-[200px] text-center uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    {currentCalDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><ChevronRight size={24}/></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                <div key={d} className="text-center text-sm font-black text-slate-400 uppercase py-2 tracking-[0.2em]">{d}</div>
              ))}
              {calendarDays.map((d, i) => (
                <div 
                  key={i} 
                  onClick={() => d.day && setView('history')}
                  className={`min-h-[160px] rounded-[2.5rem] p-5 border transition-all cursor-pointer group relative overflow-hidden
                    ${!d.day ? 'opacity-0 pointer-events-none' : ''}
                    ${d.records && d.records.length > 0 
                      ? 'border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-lg shadow-indigo-100 dark:shadow-none' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-900'}
                  `}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-2xl font-black ${d.records && d.records.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700'}`}>{d.day}</span>
                    {d.records && d.records.length > 0 && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md">{d.records.length}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    {d.records && d.records.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] bg-white/80 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 truncate shadow-sm backdrop-blur-sm">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                         <span className="font-bold uppercase tracking-tighter opacity-80">{r.paciente}</span>
                      </div>
                    ))}
                    {d.records && d.records.length > 3 && (
                      <div className="text-[9px] text-center font-bold text-slate-400 uppercase pt-1">+{d.records.length - 3} más</div>
                    )}
                  </div>

                  {d.day && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setFormData({...initialForm, fecha: d.date}); 
                        setView('form'); 
                      }}
                      className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-xl"
                    >
                      <PlusCircle size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in duration-500 space-y-10">
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-8">
               <div>
                 <h2 className="text-5xl font-black tracking-tighter">Registros Médicos</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-2">Historial acumulado de Maria Joaquina</p>
               </div>
               <div className="flex gap-4">
                 <Button onClick={() => { setFormData(initialForm); setView('form'); }}>Nuevo Registro</Button>
                 <Button onClick={() => setView('calendar')} variant="outline">Ver Calendario</Button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {records.length === 0 ? (
                 <div className="col-span-full py-40 text-center opacity-30">
                   <ClipboardList size={80} className="mx-auto mb-6 text-indigo-500"/>
                   <p className="text-2xl font-black uppercase tracking-widest">Aún no hay cirugías guardadas</p>
                 </div>
               ) : (
                 records.map(r => {
                   const finance = calculateFinance(r.valorBruto);
                   return (
                     <Card key={r.id} className="group hover:shadow-2xl border-t-[12px] border-t-indigo-600 relative overflow-hidden">
                        <div className="flex justify-between text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest">
                          <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><Clock size={14}/> {r.fecha} • {r.hora}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{r.estadoCx}</span>
                        </div>
                        
                        <h4 className="text-3xl font-black mb-1 tracking-tighter">{r.paciente}</h4>
                        <p className="text-indigo-500 font-black mb-6 uppercase text-sm tracking-widest">{r.tipoCx}</p>
                        
                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500"><Stethoscope size={16}/></div>
                             <span className="font-bold">Dr/a. {r.medico}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500"><Home size={16}/></div>
                             <span className="italic font-medium">{r.institucion}</span>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 mb-2 border border-slate-100 dark:border-slate-800 shadow-inner">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Honorario Bruto</span>
                            <span className="font-mono text-lg font-bold tabular-nums">${finance.bruto.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-3">
                            <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest">Retención (15%)</span>
                            <span className="font-mono font-bold text-rose-500 tabular-nums">-${finance.retencion.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-500 uppercase font-black tracking-[0.2em]">Líquido MJ</span>
                            <span className="font-mono text-2xl font-black text-emerald-500 tabular-nums">${finance.liquido.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <button onClick={() => startEdit(r)} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-transform"><Edit3 size={20}/></button>
                          <button onClick={() => deleteRecord(r.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                        </div>
                     </Card>
                   );
                 })
               )}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-left-8 duration-500 space-y-10">
            <h2 className="text-5xl font-black tracking-tighter">Finanzas de Maria Joaquina</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <Card className="bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden h-56 flex flex-col justify-end p-8 group">
                  <Calculator className="absolute -right-8 -top-8 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
                  <p className="text-indigo-100 text-sm font-black uppercase tracking-widest mb-2">Total Honorarios Brutos</p>
                  <p className="text-6xl font-black tabular-nums tracking-tighter">${records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0).toLocaleString()}</p>
               </Card>
               <Card className="bg-rose-500 text-white border-none shadow-2xl relative overflow-hidden h-56 flex flex-col justify-end p-8 group">
                  <AlertCircle className="absolute -right-8 -top-8 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
                  <p className="text-rose-100 text-sm font-black uppercase tracking-widest mb-2">Retenciones Fiscales (15%)</p>
                  <p className="text-6xl font-black tabular-nums tracking-tighter">-${(records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0) * 0.15).toLocaleString()}</p>
               </Card>
               <Card className="bg-emerald-600 text-white border-none shadow-2xl relative overflow-hidden h-56 flex flex-col justify-end p-8 group">
                  <TrendingUp className="absolute -right-8 -top-8 w-48 h-48 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
                  <p className="text-emerald-100 text-sm font-black uppercase tracking-widest mb-2">Pago Líquido Maria J.</p>
                  <p className="text-6xl font-black tabular-nums tracking-tighter">${(records.reduce((a, b) => a + (Number(b.valorBruto) || 0), 0) * 0.85).toLocaleString()}</p>
               </Card>
            </div>

            <Card className="bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-900/50">
               <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Activity size={32} className="text-indigo-500" /> Rendimiento Quirúrgico Global</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                  {[
                    { label: 'Total Cirugías', val: records.length, color: 'text-indigo-600' },
                    { label: 'Realizadas', val: records.filter(r => r.estadoCx === 'Realizada').length, color: 'text-emerald-500' },
                    { label: 'Programadas', val: records.filter(r => r.estadoCx === 'Programada').length, color: 'text-amber-500' },
                    { label: 'Canceladas', val: records.filter(r => r.estadoCx === 'Cancelada').length, color: 'text-rose-500' }
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center group">
                      <p className={`text-6xl font-black mb-2 transition-transform group-hover:scale-110 ${stat.color}`}>{stat.val}</p>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                    </div>
                  ))}
               </div>
            </Card>
          </div>
        )}

        {view === 'form' && (
          <div className="max-w-2xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-indigo-100 dark:border-indigo-900 shadow-2xl p-10">
              <div className="flex items-center gap-6 mb-12">
                <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/40"><PlusCircle size={32}/></div>
                <div>
                  <h3 className="text-4xl font-black tracking-tighter">{editingId ? 'Editar Registro' : 'Nueva Cirugía'}</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Panel de Maria Joaquina</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} required />
                  <Input label="Hora" name="hora" type="time" value={formData.hora} onChange={handleInputChange} required />
                </div>
                
                <Input label="Paciente" name="paciente" placeholder="Nombre completo" value={formData.paciente} onChange={handleInputChange} required />
                <Input label="Tipo de Procedimiento" name="tipoCx" placeholder="Ej: Blefaroplastía Superior" value={formData.tipoCx} onChange={handleInputChange} required />
                
                <div className="grid grid-cols-2 gap-6">
                  <Input label="Institución" name="institucion" placeholder="Hospital / Clínica" value={formData.institucion} onChange={handleInputChange} required />
                  <Input label="Médico Responsable" name="medico" placeholder="Dr/a. Nombre" value={formData.medico} onChange={handleInputChange} required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Estado</label>
                    <select 
                      name="estadoCx"
                      value={formData.estadoCx}
                      onChange={handleInputChange}
                      className="w-full rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option>Programada</option>
                      <option>Realizada</option>
                      <option>Cancelada</option>
                    </select>
                  </div>
                  <Input label="Monto Bruto ($)" name="valorBruto" type="number" value={formData.valorBruto} onChange={handleInputChange} required />
                </div>

                {formData.valorBruto && (
                  <div className="p-8 bg-indigo-600 rounded-[2.5rem] border border-indigo-400 shadow-2xl text-white">
                    <div className="flex justify-between text-xs font-black mb-2 opacity-80 uppercase tracking-widest">
                      <span>Retención Estimada (15%):</span>
                      <span className="text-rose-200">-${(formData.valorBruto * 0.15).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-3xl font-black items-center">
                      <span className="tracking-tighter uppercase text-sm font-black opacity-60">Líquido Maria Joaquina:</span>
                      <span className="tabular-nums">${(formData.valorBruto * 0.85).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1 py-4 text-lg rounded-2xl" onClick={() => setView('calendar')}>Cancelar</Button>
                  <Button type="submit" className="flex-[2] py-4 text-xl rounded-2xl shadow-xl shadow-indigo-500/30">
                    {editingId ? 'Actualizar Registro' : 'Confirmar Agenda'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-16 px-6 bg-white dark:bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50"></div>
              <span className="text-lg font-black text-slate-800 dark:text-white tracking-widest uppercase">SurgiTrack MJ Edition</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-[0.4em] font-black">Sistema de Contabilidad Médica Segura</p>
          </div>
          <div className="flex gap-12 text-slate-400 font-black text-xs uppercase tracking-[0.2em]">
             <span className="hover:text-indigo-500 cursor-pointer transition-colors">Backup Manual</span>
             <span className="hover:text-indigo-500 cursor-pointer transition-colors">Privacidad</span>
             <span className="hover:text-indigo-500 cursor-pointer transition-colors">Soporte Maria J.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}