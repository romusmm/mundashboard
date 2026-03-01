import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  Copy,
  FileText,
  Flag,
  Handshake,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Scale,
  ScrollText,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const storageKeys = {
  onboardingCompleted: 'mun_onboarding_completed',
  settings: 'mun_settings',
  speakers: 'mun_speakers',
  alliances: 'mun_alliances',
  notesGeneral: 'mun_notes_general',
  notesCountries: 'mun_notes_countries',
  speeches: 'mun_speeches',
  attackProfiles: 'mun_attack_profiles',
  resolution: 'mun_resolution',
  timerState: 'mun_timer_state',
};

const defaultSettings = {
  pais: '',
  comite: '',
  diaActual: 'Día 1',
  faseActual: 'Debate general',
  tema1: '',
  tema2: '',
  countries: [],
  duracionDiscurso: 90,
  duracionTemporizador: 120,
  marcoLegal: 'ONU',
};

const defaultTimer = {
  mode: 'Discurso',
  initial: 120,
  remaining: 120,
  running: false,
};

const nav = [
  ['Sesión', LayoutDashboard],
  ['Temporizador', AlarmClock],
  ['Oradores', Users],
  ['Alianzas', Handshake],
  ['Notas', NotebookPen],
  ['Documentos', FileText],
  ['Referencias', BookOpen],
  ['Resolución', ScrollText],
  ['Configuración', Settings],
];

const references = {
  frases: ['Moción para abrir lista de oradores.', 'Punto de información al orador.', 'Moción para caucus moderado de 10 minutos.', 'Moción para cerrar debate.'],
  legal: {
    ONU: ['Carta de las Naciones Unidas', 'Reglas de procedimiento estándar', 'Resoluciones de Asamblea General'],
    OEA: ['Carta de la OEA', 'Reglamento interno del comité', 'Convención Americana sobre DD.HH.'],
  },
};

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-3xl border border-[rgba(60,60,67,0.10)] bg-white/85 p-10 text-center shadow-soft">
      <Icon className="mx-auto mb-4 text-[#6E6E73]" size={34} />
      <h3 className="text-xl font-semibold text-[#1C1C1E]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-[#6E6E73]">{description}</p>
      {onAction && (
        <button onClick={onAction} className="mt-5 rounded-full bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0062CC]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState('Sesión');
  const [topic, setTopic] = useState('Tema 1');
  const [settings, setSettings] = useState(defaultSettings);
  const [timer, setTimer] = useState(defaultTimer);
  const [speakers, setSpeakers] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [notesGeneral, setNotesGeneral] = useState('');
  const [notesCountries, setNotesCountries] = useState({});
  const [speeches, setSpeeches] = useState([]);
  const [attackProfiles, setAttackProfiles] = useState({});
  const [resolution, setResolution] = useState({ title: '', clauses: '', signatories: 0, status: 'Borrador' });
  const [toasts, setToasts] = useState([]);
  const [onboardingStep, setOnboardingStep] = useState(readLS(storageKeys.onboardingCompleted, false) ? 0 : 1);
  const [presentingSpeechId, setPresentingSpeechId] = useState(null);
  const saveRef = useRef();

  const pushToast = useCallback((message, variant = 'info') => {
    setToasts((prev) => [...prev.slice(-2), { id: crypto.randomUUID(), message, variant }]);
  }, []);

  useEffect(() => {
    setSettings(readLS(storageKeys.settings, defaultSettings));
    setSpeakers(readLS(storageKeys.speakers, []));
    setAlliances(readLS(storageKeys.alliances, []));
    setNotesGeneral(readLS(storageKeys.notesGeneral, ''));
    setNotesCountries(readLS(storageKeys.notesCountries, {}));
    setSpeeches(readLS(storageKeys.speeches, []));
    setAttackProfiles(readLS(storageKeys.attackProfiles, {}));
    setResolution(readLS(storageKeys.resolution, { title: '', clauses: '', signatories: 0, status: 'Borrador' }));
    setTimer(readLS(storageKeys.timerState, defaultTimer));
  }, []);

  useEffect(() => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
      localStorage.setItem(storageKeys.speakers, JSON.stringify(speakers));
      localStorage.setItem(storageKeys.alliances, JSON.stringify(alliances));
      localStorage.setItem(storageKeys.notesGeneral, JSON.stringify(notesGeneral));
      localStorage.setItem(storageKeys.notesCountries, JSON.stringify(notesCountries));
      localStorage.setItem(storageKeys.speeches, JSON.stringify(speeches));
      localStorage.setItem(storageKeys.attackProfiles, JSON.stringify(attackProfiles));
      localStorage.setItem(storageKeys.resolution, JSON.stringify(resolution));
      localStorage.setItem(storageKeys.timerState, JSON.stringify(timer));
    }, 280);
    return () => clearTimeout(saveRef.current);
  }, [settings, speakers, alliances, notesGeneral, notesCountries, speeches, attackProfiles, resolution, timer]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev.remaining <= 1) {
          pushToast('Tiempo finalizado.', 'warning');
          return { ...prev, running: false, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running, pushToast]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => setToasts((prev) => prev.slice(1)), 3200);
    return () => clearTimeout(id);
  }, [toasts]);

  const currentSpeaker = useMemo(() => speakers.find((s) => s.status === 'actual'), [speakers]);
  const nextSpeakers = useMemo(() => speakers.filter((s) => s.status === 'pendiente').slice(0, 4), [speakers]);

  const updateTimerMode = (mode, initial) => setTimer({ mode, initial, remaining: initial, running: false });
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (onboardingStep > 0) {
    return (
      <Onboarding
        step={onboardingStep}
        settings={settings}
        setSettings={setSettings}
        onBack={() => setOnboardingStep((s) => Math.max(1, s - 1))}
        onNext={() => setOnboardingStep((s) => Math.min(5, s + 1))}
        onDone={() => {
          localStorage.setItem(storageKeys.onboardingCompleted, JSON.stringify(true));
          setOnboardingStep(0);
          pushToast('Configuración inicial completada.', 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen font-ui text-[#1C1C1E]">
      <aside className={`fixed left-4 top-4 bottom-4 z-20 rounded-3xl glass p-4 shadow-soft transition-all ${collapsed ? 'w-[84px]' : 'w-[250px]'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-[#007AFF]" size={20} />
            {!collapsed && <span className="font-semibold">Centro MUN</span>}
          </div>
          <button onClick={() => setCollapsed((p) => !p)}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        </div>
        <nav className="space-y-1">
          {nav.map(([name, Icon]) => (
            <button key={name} onClick={() => setView(name)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm ${view === name ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#6E6E73] hover:bg-white/70'}`}>
              <Icon size={16} />
              {!collapsed && name}
            </button>
          ))}
        </nav>
        {!collapsed && (
          <div className="mt-8 rounded-2xl border border-[rgba(60,60,67,0.10)] bg-white/80 p-3 text-xs text-[#6E6E73]">
            <p className="font-medium text-[#1C1C1E]">Estado actual</p>
            <p className="mt-1">{settings.comite || 'Comité sin definir'}</p>
            <p>{settings.diaActual} · {settings.faseActual}</p>
          </div>
        )}
      </aside>

      <div className={`transition-all ${collapsed ? 'ml-[108px]' : 'ml-[278px]'} mr-5 py-4`}>
        <header className="glass sticky top-4 z-10 mb-6 flex items-center justify-between rounded-2xl px-5 py-3">
          <div>
            <h1 className="text-lg font-semibold">{view}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => setTopic('Tema 1')} className={`rounded-full px-3 py-1 ${topic === 'Tema 1' ? 'bg-[#007AFF] text-white' : 'bg-white/70 text-[#6E6E73]'}`}>Tema 1</button>
            <button onClick={() => setTopic('Tema 2')} className={`rounded-full px-3 py-1 ${topic === 'Tema 2' ? 'bg-[#007AFF] text-white' : 'bg-white/70 text-[#6E6E73]'}`}>Tema 2</button>
            <span className="rounded-full bg-white/70 px-3 py-1">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="rounded-full bg-white/70 px-3 py-1">{settings.diaActual}</span>
            <span className="rounded-full bg-white/70 px-3 py-1">{settings.faseActual}</span>
          </div>
        </header>

        <main className="view-enter mx-auto max-w-6xl pb-12">
          {view === 'Sesión' && (
            <section className="space-y-5">
              <div className="rounded-3xl bg-white p-8 shadow-soft">
                <p className="text-sm text-[#6E6E73]">Tiempo activo · {timer.mode}</p>
                <p className="font-number mt-2 text-7xl">{formatTime(timer.remaining)}</p>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => setTimer((t) => ({ ...t, running: !t.running }))} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">{timer.running ? 'Pausar' : 'Iniciar'}</button>
                  <button onClick={() => setTimer((t) => ({ ...t, running: false, remaining: t.initial }))} className="rounded-full bg-[#1C1C1E] px-5 py-2 text-sm font-semibold text-white">Reiniciar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <p className="text-sm text-[#6E6E73]">Siguiente en lista</p>
                  {nextSpeakers.length ? nextSpeakers.map((s) => <p key={s.id} className="mt-2 text-sm">• {s.country}</p>) : <p className="mt-3 text-sm text-[#AEAEB2]">No hay oradores en la lista.</p>}
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <p className="text-sm text-[#6E6E73]">Resumen operativo</p>
                  <p className="mt-2 text-sm">Oradores: {speakers.length}</p>
                  <p className="text-sm">Alianzas registradas: {alliances.length}</p>
                  <p className="text-sm">Discursos: {speeches.length}</p>
                </div>
              </div>
            </section>
          )}

          {view === 'Temporizador' && (
            <section className="rounded-3xl bg-white p-8 shadow-soft">
              <div className="mb-6 flex gap-2">
                {[['Discurso', settings.duracionDiscurso], ['Caucus', 300], ['Sesión', 900]].map(([m, v]) => (
                  <button key={m} onClick={() => updateTimerMode(m, v)} className={`rounded-full px-4 py-2 text-sm ${timer.mode === m ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'}`}>{m}</button>
                ))}
              </div>
              <div className="mx-auto grid h-80 w-80 place-items-center rounded-full timer-ring p-3" style={{ '--progress': `${100 - (timer.remaining / timer.initial) * 100}%` }}>
                <div className="grid h-full w-full place-items-center rounded-full bg-white">
                  <p className="font-number text-6xl">{formatTime(timer.remaining)}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => setTimer((t) => ({ ...t, running: !t.running }))} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">{timer.running ? 'Pausar' : 'Iniciar'}</button>
                <button onClick={() => setTimer((t) => ({ ...t, running: false, remaining: t.initial }))} className="rounded-full bg-[#1C1C1E] px-5 py-2 text-sm font-semibold text-white">Reiniciar</button>
              </div>
            </section>
          )}

          {view === 'Oradores' && (
            <SpeakersView speakers={speakers} setSpeakers={setSpeakers} currentSpeaker={currentSpeaker} pushToast={pushToast} />
          )}

          {view === 'Alianzas' && (
            <AlliancesView alliances={alliances} setAlliances={setAlliances} countries={settings.countries} />
          )}

          {view === 'Notas' && (
            <NotesView settings={settings} notesGeneral={notesGeneral} setNotesGeneral={setNotesGeneral} notesCountries={notesCountries} setNotesCountries={setNotesCountries} />
          )}

          {view === 'Documentos' && (
            <DocumentsView
              speeches={speeches}
              setSpeeches={setSpeeches}
              attackProfiles={attackProfiles}
              setAttackProfiles={setAttackProfiles}
              countries={settings.countries}
              presentingSpeechId={presentingSpeechId}
              setPresentingSpeechId={setPresentingSpeechId}
              pushToast={pushToast}
            />
          )}

          {view === 'Referencias' && (
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-soft"><h3 className="font-semibold">Frases parlamentarias</h3>{references.frases.map((f) => <p key={f} className="mt-3 text-sm text-[#6E6E73]">{f}</p>)}</div>
              <div className="rounded-3xl bg-white p-6 shadow-soft"><h3 className="font-semibold">Marco legal {settings.marcoLegal}</h3>{references.legal[settings.marcoLegal].map((f) => <p key={f} className="mt-3 text-sm text-[#6E6E73]">{f}</p>)}</div>
            </section>
          )}

          {view === 'Resolución' && (
            <section className="rounded-3xl bg-white p-7 shadow-soft">
              <input value={resolution.title} onChange={(e) => setResolution((r) => ({ ...r, title: e.target.value }))} placeholder="Título del proyecto" className="w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
              <textarea value={resolution.clauses} onChange={(e) => setResolution((r) => ({ ...r, clauses: e.target.value }))} placeholder="Cláusulas operativas" className="mt-3 h-64 w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input type="number" value={resolution.signatories} onChange={(e) => setResolution((r) => ({ ...r, signatories: Number(e.target.value) }))} className="rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
                <select value={resolution.status} onChange={(e) => setResolution((r) => ({ ...r, status: e.target.value }))} className="rounded-xl border border-[rgba(60,60,67,0.10)] p-3"><option>Borrador</option><option>Negociación</option><option>Lista para firma</option></select>
                <div className="rounded-xl bg-[#F2F2F7] p-3 text-sm">Firmantes: {resolution.signatories}</div>
              </div>
            </section>
          )}

          {view === 'Configuración' && (
            <section className="rounded-3xl bg-white p-7 shadow-soft space-y-3">
              <h3 className="font-semibold">Preferencias de sesión</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={settings.diaActual} onChange={(e) => setSettings((s) => ({ ...s, diaActual: e.target.value }))} className="rounded-xl border p-3" />
                <input value={settings.faseActual} onChange={(e) => setSettings((s) => ({ ...s, faseActual: e.target.value }))} className="rounded-xl border p-3" />
                <input type="number" value={settings.duracionDiscurso} onChange={(e) => setSettings((s) => ({ ...s, duracionDiscurso: Number(e.target.value) }))} className="rounded-xl border p-3" />
                <select value={settings.marcoLegal} onChange={(e) => setSettings((s) => ({ ...s, marcoLegal: e.target.value }))} className="rounded-xl border p-3"><option>ONU</option><option>OEA</option></select>
              </div>
            </section>
          )}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => <div key={t.id} className={`glass flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-soft ${t.variant === 'success' ? 'text-[#34C759]' : t.variant === 'warning' ? 'text-[#FF9500]' : 'text-[#007AFF]'}`}><Sparkles size={14} /> {t.message}</div>)}
      </div>

      {presentingSpeechId && (
        <div className="fixed inset-0 z-40 bg-[#1C1C1E] p-10 text-white">
          <button onClick={() => setPresentingSpeechId(null)} className="mb-6 rounded-full bg-white/20 p-2"><X /></button>
          <pre className="whitespace-pre-wrap text-xl leading-relaxed">{speeches.find((s) => s.id === presentingSpeechId)?.content}</pre>
        </div>
      )}
    </div>
  );
}

function Onboarding({ step, settings, setSettings, onBack, onNext, onDone }) {
  const [countryInput, setCountryInput] = useState('');
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="glass w-full max-w-3xl rounded-3xl p-8 shadow-soft">
        <p className="text-sm text-[#6E6E73]">Configuración inicial · Paso {step} de 5</p>
        {step === 1 && <div className="mt-5 grid gap-3 md:grid-cols-2"><input placeholder="Mi país" value={settings.pais} onChange={(e) => setSettings((s) => ({ ...s, pais: e.target.value }))} className="rounded-xl border p-3" /><input placeholder="Comité" value={settings.comite} onChange={(e) => setSettings((s) => ({ ...s, comite: e.target.value }))} className="rounded-xl border p-3" /><input placeholder="Día actual" value={settings.diaActual} onChange={(e) => setSettings((s) => ({ ...s, diaActual: e.target.value }))} className="rounded-xl border p-3" /><input placeholder="Fase actual" value={settings.faseActual} onChange={(e) => setSettings((s) => ({ ...s, faseActual: e.target.value }))} className="rounded-xl border p-3" /></div>}
        {step === 2 && <div className="mt-5 grid gap-3"><input placeholder="Tema 1" value={settings.tema1} onChange={(e) => setSettings((s) => ({ ...s, tema1: e.target.value }))} className="rounded-xl border p-3" /><input placeholder="Tema 2" value={settings.tema2} onChange={(e) => setSettings((s) => ({ ...s, tema2: e.target.value }))} className="rounded-xl border p-3" /></div>}
        {step === 3 && <div className="mt-5"><textarea value={countryInput} onChange={(e) => setCountryInput(e.target.value)} placeholder="Un país por línea" className="h-40 w-full rounded-xl border p-3" /><div className="mt-3 flex gap-2"><button onClick={() => setSettings((s) => ({ ...s, countries: countryInput.split('\n').map((v) => v.trim()).filter(Boolean) }))} className="rounded-full bg-[#007AFF] px-4 py-2 text-sm text-white">Cargar lista</button><button onClick={() => setSettings((s) => ({ ...s, countries: ['Argentina', 'Brasil', 'Chile', 'Canadá', 'México', 'Francia', 'Estados Unidos'] }))} className="rounded-full bg-[#1C1C1E] px-4 py-2 text-sm text-white">Lista por defecto</button></div></div>}
        {step === 4 && <div className="mt-5 grid gap-3 md:grid-cols-2"><input type="number" value={settings.duracionDiscurso} onChange={(e) => setSettings((s) => ({ ...s, duracionDiscurso: Number(e.target.value) }))} className="rounded-xl border p-3" placeholder="Duración promedio del discurso" /><input type="number" value={settings.duracionTemporizador} onChange={(e) => setSettings((s) => ({ ...s, duracionTemporizador: Number(e.target.value) }))} className="rounded-xl border p-3" placeholder="Duración inicial del temporizador" /><select value={settings.marcoLegal} onChange={(e) => setSettings((s) => ({ ...s, marcoLegal: e.target.value }))} className="rounded-xl border p-3"><option>OEA</option><option>ONU</option></select></div>}
        {step === 5 && <div className="mt-4 rounded-2xl bg-white/85 p-5 text-sm"><p className="font-semibold">Resumen</p><p className="mt-2">{settings.pais} · {settings.comite}</p><p>{settings.diaActual} · {settings.faseActual}</p><p>{settings.tema1} / {settings.tema2}</p><p>{settings.countries.length} países cargados</p></div>}
        <div className="mt-8 flex justify-between">
          <button onClick={onBack} disabled={step === 1} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-50">Atrás</button>
          {step === 5 ? <button onClick={onDone} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">Entrar al centro de comando</button> : <button onClick={onNext} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">Continuar</button>}
        </div>
      </div>
    </div>
  );
}

function SpeakersView({ speakers, setSpeakers, currentSpeaker, pushToast }) {
  const [country, setCountry] = useState('');
  const setCurrent = (id) => setSpeakers((prev) => prev.map((s) => ({ ...s, status: s.id === id ? 'actual' : s.status === 'actual' ? 'pendiente' : s.status })));
  return (
    <section className="space-y-4">
      {currentSpeaker ? <div className="rounded-2xl border border-[#007AFF] bg-white p-4 text-sm">Hablando ahora: <strong>{currentSpeaker.country}</strong></div> : <EmptyState icon={Users} title="No hay orador activo" description="Agrega oradores y marca quién está hablando." />}
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex gap-2"><input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="País" className="flex-1 rounded-xl border p-3" /><button onClick={() => { if (!country) return; setSpeakers((p) => [...p, { id: crypto.randomUUID(), country, status: 'pendiente' }]); setCountry(''); pushToast('Orador agregado.', 'success'); }} className="rounded-full bg-[#007AFF] px-4 text-white">Agregar</button></div>
        {speakers.length ? speakers.map((s) => <div key={s.id} className="mb-2 flex items-center justify-between rounded-xl bg-[#F2F2F7] p-3 text-sm"><span>{s.country}</span><div className="flex gap-2"><button onClick={() => setCurrent(s.id)} className="rounded-full bg-white px-3 py-1">Habla ahora</button><button onClick={() => setSpeakers((p) => p.filter((x) => x.id !== s.id))} className="rounded-full bg-white px-3 py-1">Quitar</button></div></div>) : <EmptyState icon={ListChecks} title="No hay oradores en la lista" description="Empieza agregando países a la lista de oradores." />}
      </div>
    </section>
  );
}

function AlliancesView({ alliances, setAlliances, countries }) {
  const [filter, setFilter] = useState('todos');
  const [country, setCountry] = useState(countries[0] || '');
  const [kind, setKind] = useState('aliado');
  const data = alliances.filter((a) => filter === 'todos' || a.kind === filter);
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">{['aliado', 'neutral', 'opositor'].map((k) => <div key={k} className="rounded-2xl bg-white p-4 shadow-soft"><p className="text-xs uppercase text-[#6E6E73]">{k}</p><p className="mt-1 text-2xl font-semibold">{alliances.filter((a) => a.kind === k).length}</p></div>)}</div>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap gap-2">
          {['todos', 'aliado', 'neutral', 'opositor'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-sm ${filter === f ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7]'}`}>{f}</button>)}
        </div>
        <div className="mb-4 flex gap-2"><input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="País" className="flex-1 rounded-xl border p-3" /><select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border p-3"><option>aliado</option><option>neutral</option><option>opositor</option></select><button onClick={() => country && setAlliances((p) => [...p, { id: crypto.randomUUID(), country, kind }])} className="rounded-full bg-[#007AFF] px-4 text-white">Agregar</button></div>
        {data.length ? <div className="grid gap-3 md:grid-cols-2">{data.map((a) => <div key={a.id} className="rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft"><p className="font-medium">{a.country}</p><p className="text-sm capitalize text-[#6E6E73]">{a.kind}</p></div>)}</div> : <EmptyState icon={Handshake} title="Aún no hay alianzas" description="Empieza agregando países aliados u opositores." />}
      </div>
    </section>
  );
}

function NotesView({ settings, notesGeneral, setNotesGeneral, notesCountries, setNotesCountries }) {
  const [search, setSearch] = useState('');
  const filtered = settings.countries.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">Notas generales</span><span className="text-[#6E6E73]">Autoguardado activo</span></div>
        <textarea value={notesGeneral} onChange={(e) => setNotesGeneral(e.target.value)} className="h-[480px] w-full rounded-2xl border p-4" placeholder="Escribe observaciones de sesión..." />
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar país" className="w-full rounded-xl border p-3" />
        <div className="mt-4 space-y-2 max-h-[520px] overflow-auto">
          {filtered.map((country) => <details key={country} className="rounded-xl bg-[#F2F2F7] p-3"><summary className="cursor-pointer font-medium">{country}</summary><textarea value={notesCountries[country] || ''} onChange={(e) => setNotesCountries((p) => ({ ...p, [country]: e.target.value }))} className="mt-2 h-24 w-full rounded-lg border p-2" /></details>)}
        </div>
      </div>
    </section>
  );
}

function DocumentsView({ speeches, setSpeeches, attackProfiles, setAttackProfiles, countries, presentingSpeechId, setPresentingSpeechId, pushToast }) {
  const [tab, setTab] = useState('Discursos');
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || '');
  const [bullet, setBullet] = useState('');
  const estimate = (text) => Math.ceil(text.split(/\s+/).filter(Boolean).length / 130);
  return (
    <section className="space-y-4">
      <div className="flex gap-2">{['Discursos', 'Perfiles de ataque'].map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm ${tab === t ? 'bg-[#007AFF] text-white' : 'bg-white'}`}>{t}</button>)}</div>
      {tab === 'Discursos' && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="grid gap-3 md:grid-cols-2"><input placeholder="Título" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="rounded-xl border p-3" /><button onClick={() => { if (!draft.title && !draft.content) return; setSpeeches((p) => [...p, { ...draft, id: crypto.randomUUID() }]); setDraft({ title: '', content: '' }); pushToast('Discurso guardado.', 'success'); }} className="rounded-full bg-[#007AFF] px-4 text-white">Guardar discurso</button></div>
          <textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} placeholder="Pega o redacta un discurso" className="mt-3 h-44 w-full rounded-xl border p-3" />
          <p className="mt-2 text-sm text-[#6E6E73]">Palabras: {draft.content.split(/\s+/).filter(Boolean).length} · Duración estimada: {estimate(draft.content)} min</p>
          <div className="mt-5 space-y-2">
            {speeches.length ? speeches.map((s) => <div key={s.id} className="rounded-xl bg-[#F2F2F7] p-3"><div className="flex items-center justify-between"><p className="font-medium">{s.title || 'Sin título'}</p><div className="flex gap-2 text-xs"><button onClick={() => setSpeeches((p) => [...p, { ...s, id: crypto.randomUUID(), title: `${s.title} (copia)` }])} className="rounded-full bg-white px-3 py-1">Duplicar</button><button onClick={() => setPresentingSpeechId(s.id)} className="rounded-full bg-white px-3 py-1">Presentar</button><button onClick={() => setSpeeches((p) => p.filter((x) => x.id !== s.id))} className="rounded-full bg-white px-3 py-1">Eliminar</button></div></div><p className="mt-1 line-clamp-2 text-sm text-[#6E6E73]">{s.content}</p></div>) : <EmptyState icon={FileText} title="Aún no has creado discursos" description="Empieza redactando o pegando tu primer discurso." />}
          </div>
        </div>
      )}
      {tab === 'Perfiles de ataque' && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-3 flex gap-2"><select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="rounded-xl border p-3">{countries.map((c) => <option key={c}>{c}</option>)}</select><input value={bullet} onChange={(e) => setBullet(e.target.value)} placeholder="Agregar vulnerabilidad" className="flex-1 rounded-xl border p-3" /><button onClick={() => { if (!selectedCountry || !bullet) return; setAttackProfiles((p) => ({ ...p, [selectedCountry]: [...(p[selectedCountry] || []), bullet] })); setBullet(''); }} className="rounded-full bg-[#007AFF] px-4 text-white">Agregar</button></div>
          {Object.keys(attackProfiles).length ? Object.entries(attackProfiles).map(([country, items]) => <div key={country} className="mb-3 rounded-xl bg-[#F2F2F7] p-3"><p className="font-medium">{country}</p>{items.map((item, idx) => <div key={`${country}-${idx}`} className="mt-1 flex items-center justify-between text-sm"><span>• {item}</span><button onClick={() => navigator.clipboard.writeText(`Pregunta para ${country}: ${item}`)} className="rounded-full bg-white px-2 py-1"><Copy size={12} /></button></div>)}</div>) : <EmptyState icon={ShieldAlert} title="Todavía no has cargado perfiles de ataque" description="Selecciona un país y agrega contradicciones o debilidades." />}
        </div>
      )}
      {presentingSpeechId && <div className="rounded-xl bg-[#F2F2F7] p-3 text-sm">Modo presentación activo.</div>}
    </section>
  );
}

export default App;
