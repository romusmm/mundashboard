import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Handshake,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
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
  tema1: 'Tema 1',
  tema2: 'Tema 2',
  countries: [],
  duracionDiscurso: 90,
  duracionTemporizador: 120,
  marcoLegal: 'ONU',
  legalCustom: {
    ONU: [],
    OEA: [],
  },
};

const defaultTimer = {
  mode: 'Discurso',
  initial: 120,
  remaining: 120,
  running: false,
  customMinutes: 2,
  customSeconds: 0,
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

const referenceBase = {
  frases: [
    'Moción para abrir lista de oradores.',
    'Punto de información al orador.',
    'Moción para caucus moderado de 10 minutos.',
    'Moción para cerrar debate.',
  ],
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
    <div className="rounded-3xl border border-[rgba(60,60,67,0.10)] bg-white/90 p-10 text-center shadow-soft">
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
  const [topicKey, setTopicKey] = useState('tema1');
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

  const currentTopicLabel = topicKey === 'tema1' ? settings.tema1 || 'Tema 1' : settings.tema2 || 'Tema 2';

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
    }, 300);
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

  useEffect(() => {
    if (!settings.countries.length) return;
    setAlliances((prev) => {
      const map = new Map(prev.map((item) => [item.country, item]));
      return settings.countries.map((country) => map.get(country) || { id: crypto.randomUUID(), country, kind: 'neutral' });
    });
  }, [settings.countries]);

  const topicSpeakers = useMemo(() => speakers.filter((s) => s.topicKey === topicKey), [speakers, topicKey]);
  const currentSpeaker = useMemo(() => topicSpeakers.find((s) => s.status === 'actual'), [topicSpeakers]);
  const nextSpeakers = useMemo(() => topicSpeakers.filter((s) => s.status === 'pendiente').slice(0, 4), [topicSpeakers]);

  const topicAlliances = useMemo(() => alliances.filter((a) => a.topicKey === topicKey || !a.topicKey), [alliances, topicKey]);

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const applyTimerPreset = (mode, seconds) => {
    setTimer((prev) => ({ ...prev, mode, initial: seconds, remaining: seconds, running: false }));
  };

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

  const legalItems = [...referenceBase.legal[settings.marcoLegal], ...(settings.legalCustom?.[settings.marcoLegal] || [])];

  return (
    <div className="min-h-screen font-ui text-[#1C1C1E]">
      <aside className={`fixed bottom-4 left-4 top-4 z-20 rounded-3xl glass-strong p-4 shadow-soft transition-all ${collapsed ? 'w-[88px]' : 'w-[260px]'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-[#007AFF]" size={20} />
            {!collapsed && <span className="font-semibold">Centro MUN</span>}
          </div>
          <button onClick={() => setCollapsed((p) => !p)}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        </div>

        <nav className="space-y-1">
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => setView(name)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm ${view === name ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#6E6E73] hover:bg-white/70'}`}
            >
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
            <p className="mt-1 text-[#007AFF]">{currentTopicLabel}</p>
          </div>
        )}
      </aside>

      <div className={`mr-5 py-4 transition-all ${collapsed ? 'ml-[114px]' : 'ml-[288px]'}`}>
        <header className="glass sticky top-4 z-10 mb-6 flex items-center justify-between rounded-2xl px-5 py-3">
          <h1 className="text-lg font-semibold">{view}</h1>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setTopicKey('tema1')}
              className={`rounded-full px-3 py-1 ${topicKey === 'tema1' ? 'bg-[#007AFF] text-white' : 'bg-white/70 text-[#6E6E73]'}`}
            >
              {settings.tema1 || 'Tema 1'}
            </button>
            <button
              onClick={() => setTopicKey('tema2')}
              className={`rounded-full px-3 py-1 ${topicKey === 'tema2' ? 'bg-[#007AFF] text-white' : 'bg-white/70 text-[#6E6E73]'}`}
            >
              {settings.tema2 || 'Tema 2'}
            </button>
            <span className="rounded-full bg-white/70 px-3 py-1">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="rounded-full bg-white/70 px-3 py-1">{settings.diaActual}</span>
            <span className="rounded-full bg-white/70 px-3 py-1">{settings.faseActual}</span>
          </div>
        </header>

        <main className="view-enter mx-auto max-w-6xl pb-12">
          {view === 'Sesión' && (
            <section className="space-y-5">
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-soft">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 via-transparent to-[#34C759]/10" />
                <div className="relative">
                  <p className="text-sm text-[#6E6E73]">Tiempo activo · {timer.mode}</p>
                  <p className="font-number mt-2 text-7xl">{formatTime(timer.remaining)}</p>
                  <p className="mt-2 text-sm text-[#6E6E73]">Contexto actual: {currentTopicLabel}</p>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setTimer((t) => ({ ...t, running: !t.running }))} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">
                      {timer.running ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button onClick={() => setTimer((t) => ({ ...t, running: false, remaining: t.initial }))} className="rounded-full bg-[#1C1C1E] px-5 py-2 text-sm font-semibold text-white">
                      Reiniciar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <p className="text-sm text-[#6E6E73]">Siguiente en lista</p>
                  {nextSpeakers.length ? nextSpeakers.map((s) => <p key={s.id} className="mt-2 text-sm">• {s.country}</p>) : <p className="mt-3 text-sm text-[#AEAEB2]">No hay oradores pendientes para este tema.</p>}
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <p className="text-sm text-[#6E6E73]">Resumen operativo</p>
                  <p className="mt-2 text-sm">Oradores en este tema: {topicSpeakers.length}</p>
                  <p className="text-sm">Alianzas en este tema: {topicAlliances.length}</p>
                  <p className="text-sm">Discursos guardados: {speeches.length}</p>
                </div>
              </div>
            </section>
          )}

          {view === 'Temporizador' && (
            <section className="rounded-3xl bg-white p-8 shadow-soft">
              <div className="mb-6 flex flex-wrap gap-2">
                {[['Discurso', settings.duracionDiscurso], ['Caucus', 300], ['Sesión', 900]].map(([m, v]) => (
                  <button key={m} onClick={() => applyTimerPreset(m, Number(v))} className={`rounded-full px-4 py-2 text-sm ${timer.mode === m ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'}`}>
                    {m}
                  </button>
                ))}
              </div>

              <div className="mx-auto grid h-80 w-80 place-items-center rounded-full timer-ring p-3" style={{ '--progress': `${100 - (timer.remaining / Math.max(timer.initial, 1)) * 100}%` }}>
                <div className="grid h-full w-full place-items-center rounded-full bg-white">
                  <p className="font-number text-6xl">{formatTime(timer.remaining)}</p>
                </div>
              </div>

              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[rgba(60,60,67,0.10)] bg-[#F8F8FC] p-4">
                <p className="mb-3 text-sm font-semibold">Temporizador personalizado</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-[#6E6E73]">Minutos
                    <input
                      type="number"
                      min={0}
                      value={timer.customMinutes}
                      onChange={(e) => setTimer((t) => ({ ...t, customMinutes: Number(e.target.value) || 0 }))}
                      className="mt-1 w-full rounded-xl border p-2"
                    />
                  </label>
                  <label className="text-sm text-[#6E6E73]">Segundos
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={timer.customSeconds}
                      onChange={(e) => setTimer((t) => ({ ...t, customSeconds: Math.min(59, Math.max(0, Number(e.target.value) || 0)) }))}
                      className="mt-1 w-full rounded-xl border p-2"
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    const total = timer.customMinutes * 60 + timer.customSeconds;
                    if (!total) return pushToast('Ingresa una duración mayor a 0.', 'warning');
                    applyTimerPreset('Personalizado', total);
                  }}
                  className="mt-3 rounded-full bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-white"
                >
                  Aplicar tiempo personalizado
                </button>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => setTimer((t) => ({ ...t, running: !t.running }))} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">
                  {timer.running ? 'Pausar' : 'Iniciar'}
                </button>
                <button onClick={() => setTimer((t) => ({ ...t, running: false, remaining: t.initial }))} className="rounded-full bg-[#1C1C1E] px-5 py-2 text-sm font-semibold text-white">
                  Reiniciar
                </button>
              </div>
            </section>
          )}

          {view === 'Oradores' && (
            <SpeakersView
              countries={settings.countries}
              topicKey={topicKey}
              speakers={speakers}
              setSpeakers={setSpeakers}
              currentSpeaker={currentSpeaker}
              pushToast={pushToast}
            />
          )}

          {view === 'Alianzas' && (
            <AlliancesView
              topicKey={topicKey}
              countries={settings.countries}
              alliances={alliances}
              setAlliances={setAlliances}
            />
          )}

          {view === 'Notas' && (
            <NotesView
              topicKey={topicKey}
              countries={settings.countries}
              notesGeneral={notesGeneral}
              setNotesGeneral={setNotesGeneral}
              notesCountries={notesCountries}
              setNotesCountries={setNotesCountries}
            />
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
            <ReferencesView settings={settings} setSettings={setSettings} legalItems={legalItems} />
          )}

          {view === 'Resolución' && (
            <section className="rounded-3xl bg-white p-7 shadow-soft">
              <input value={resolution.title} onChange={(e) => setResolution((r) => ({ ...r, title: e.target.value }))} placeholder="Título del proyecto" className="w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
              <textarea value={resolution.clauses} onChange={(e) => setResolution((r) => ({ ...r, clauses: e.target.value }))} placeholder="Cláusulas operativas" className="mt-3 h-64 w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm text-[#6E6E73]">Firmantes
                  <input type="number" value={resolution.signatories} onChange={(e) => setResolution((r) => ({ ...r, signatories: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3" />
                </label>
                <label className="text-sm text-[#6E6E73]">Estado
                  <select value={resolution.status} onChange={(e) => setResolution((r) => ({ ...r, status: e.target.value }))} className="mt-1 w-full rounded-xl border border-[rgba(60,60,67,0.10)] p-3">
                    <option>Borrador</option>
                    <option>Negociación</option>
                    <option>Lista para firma</option>
                  </select>
                </label>
                <div className="rounded-xl bg-[#F2F2F7] p-3 text-sm">Firmantes actuales: {resolution.signatories}</div>
              </div>
            </section>
          )}

          {view === 'Configuración' && (
            <section className="space-y-3 rounded-3xl bg-white p-7 shadow-soft">
              <h3 className="font-semibold">Preferencias de sesión</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={settings.diaActual} onChange={(e) => setSettings((s) => ({ ...s, diaActual: e.target.value }))} className="rounded-xl border p-3" placeholder="Día actual" />
                <input value={settings.faseActual} onChange={(e) => setSettings((s) => ({ ...s, faseActual: e.target.value }))} className="rounded-xl border p-3" placeholder="Fase actual" />
                <input value={settings.tema1} onChange={(e) => setSettings((s) => ({ ...s, tema1: e.target.value }))} className="rounded-xl border p-3" placeholder="Tema 1" />
                <input value={settings.tema2} onChange={(e) => setSettings((s) => ({ ...s, tema2: e.target.value }))} className="rounded-xl border p-3" placeholder="Tema 2" />
                <label className="text-sm text-[#6E6E73]">Duración promedio de discurso (segundos)
                  <input type="number" value={settings.duracionDiscurso} onChange={(e) => setSettings((s) => ({ ...s, duracionDiscurso: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-xl border p-3" />
                </label>
                <select value={settings.marcoLegal} onChange={(e) => setSettings((s) => ({ ...s, marcoLegal: e.target.value }))} className="rounded-xl border p-3">
                  <option>ONU</option>
                  <option>OEA</option>
                </select>
              </div>
            </section>
          )}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`glass flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-soft ${t.variant === 'success' ? 'text-[#34C759]' : t.variant === 'warning' ? 'text-[#FF9500]' : 'text-[#007AFF]'}`}>
            <Sparkles size={14} /> {t.message}
          </div>
        ))}
      </div>

      {presentingSpeechId && (
        <PresentationModal speech={speeches.find((s) => s.id === presentingSpeechId)} onClose={() => setPresentingSpeechId(null)} />
      )}
    </div>
  );
}

function Onboarding({ step, settings, setSettings, onBack, onNext, onDone }) {
  const [countryInput, setCountryInput] = useState(settings.countries.join('\n'));
  const parsedCountries = countryInput
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="glass-strong w-full max-w-3xl rounded-3xl p-8 shadow-soft">
        <p className="text-sm text-[#6E6E73]">Configuración inicial · Paso {step} de 5</p>

        {step === 1 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[#6E6E73]">Mi país
              <input value={settings.pais} onChange={(e) => setSettings((s) => ({ ...s, pais: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Comité
              <input value={settings.comite} onChange={(e) => setSettings((s) => ({ ...s, comite: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Día actual
              <input value={settings.diaActual} onChange={(e) => setSettings((s) => ({ ...s, diaActual: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Fase actual
              <input value={settings.faseActual} onChange={(e) => setSettings((s) => ({ ...s, faseActual: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 grid gap-3">
            <label className="text-sm text-[#6E6E73]">Tema 1
              <input value={settings.tema1} onChange={(e) => setSettings((s) => ({ ...s, tema1: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Tema 2
              <input value={settings.tema2} onChange={(e) => setSettings((s) => ({ ...s, tema2: e.target.value }))} className="mt-1 rounded-xl border p-3" />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5">
            <p className="mb-2 text-sm text-[#6E6E73]">Pega o escribe un país por línea. Luego presiona <strong>Cargar lista</strong> para guardarlos.</p>
            <textarea value={countryInput} onChange={(e) => setCountryInput(e.target.value)} placeholder="Argentina\nBrasil\nChile" className="h-44 w-full rounded-xl border p-3" />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSettings((s) => ({ ...s, countries: parsedCountries }))} className="rounded-full bg-[#007AFF] px-4 py-2 text-sm text-white">Cargar lista</button>
              <button onClick={() => {
                const defaults = ['Argentina', 'Brasil', 'Chile', 'Canadá', 'México', 'Francia', 'Estados Unidos'];
                setCountryInput(defaults.join('\n'));
                setSettings((s) => ({ ...s, countries: defaults }));
              }} className="rounded-full bg-[#1C1C1E] px-4 py-2 text-sm text-white">Usar lista por defecto</button>
            </div>
            <p className="mt-3 text-sm text-[#6E6E73]">Países listos: {settings.countries.length}</p>
          </div>
        )}

        {step === 4 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[#6E6E73]">Duración promedio del discurso (segundos)
              <input type="number" value={settings.duracionDiscurso} onChange={(e) => setSettings((s) => ({ ...s, duracionDiscurso: Number(e.target.value) || 0 }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Duración inicial del temporizador (segundos)
              <input type="number" value={settings.duracionTemporizador} onChange={(e) => setSettings((s) => ({ ...s, duracionTemporizador: Number(e.target.value) || 0 }))} className="mt-1 rounded-xl border p-3" />
            </label>
            <label className="text-sm text-[#6E6E73]">Marco legal por defecto
              <select value={settings.marcoLegal} onChange={(e) => setSettings((s) => ({ ...s, marcoLegal: e.target.value }))} className="mt-1 rounded-xl border p-3">
                <option>OEA</option>
                <option>ONU</option>
              </select>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="mt-4 rounded-2xl bg-white/90 p-5 text-sm">
            <p className="font-semibold">Resumen</p>
            <p className="mt-2">{settings.pais} · {settings.comite}</p>
            <p>{settings.diaActual} · {settings.faseActual}</p>
            <p>{settings.tema1} / {settings.tema2}</p>
            <p>{settings.countries.length} países cargados</p>
            <p>Duración promedio de discurso: {settings.duracionDiscurso}s</p>
            <p>Marco legal por defecto: {settings.marcoLegal}</p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={onBack} disabled={step === 1} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-50">Atrás</button>
          {step === 5 ? (
            <button onClick={onDone} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">Entrar al centro de comando</button>
          ) : (
            <button onClick={onNext} className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white">Continuar</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SpeakersView({ countries, topicKey, speakers, setSpeakers, currentSpeaker, pushToast }) {
  const [country, setCountry] = useState(countries[0] || '');
  const topicSpeakers = speakers.filter((s) => s.topicKey === topicKey);

  const addSpeaker = () => {
    if (!country) return;
    const existsPending = topicSpeakers.some((s) => s.country === country && s.status !== 'tachado');
    if (existsPending) return pushToast('Ese país ya está en la lista activa para este tema.', 'warning');
    setSpeakers((prev) => [...prev, { id: crypto.randomUUID(), topicKey, country, status: 'pendiente' }]);
    pushToast('Orador agregado.', 'success');
  };

  const setCurrent = (id) => {
    setSpeakers((prev) => prev.map((s) => {
      if (s.topicKey !== topicKey) return s;
      if (s.id === id) return { ...s, status: 'actual' };
      if (s.status === 'actual') return { ...s, status: 'pendiente' };
      return s;
    }));
    pushToast('Orador actualizado: hablando ahora.', 'info');
  };

  const toggleCross = (id) => {
    setSpeakers((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return { ...s, status: s.status === 'tachado' ? 'pendiente' : 'tachado' };
    }));
  };

  return (
    <section className="space-y-4">
      {currentSpeaker ? (
        <div className="rounded-2xl border border-[#007AFF] bg-white p-4 text-sm">
          Hablando ahora: <strong>{currentSpeaker.country}</strong>
        </div>
      ) : (
        <EmptyState icon={Users} title="No hay orador activo" description="Selecciona un país y marca quién está hablando." />
      )}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border p-3">
            {!countries.length && <option value="">No hay países cargados</option>}
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addSpeaker} className="rounded-full bg-[#007AFF] px-4 text-white">Agregar a lista</button>
        </div>

        {topicSpeakers.length ? (
          <div className="space-y-2">
            {topicSpeakers.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#F2F2F7] p-3 text-sm">
                <span className={`${s.status === 'tachado' ? 'text-[#AEAEB2] line-through' : 'text-[#1C1C1E]'}`}>{s.country}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrent(s.id)} className={`rounded-full px-3 py-1 ${s.status === 'actual' ? 'bg-[#007AFF] text-white' : 'bg-white'}`}>Habla ahora</button>
                  <button onClick={() => toggleCross(s.id)} className="rounded-full bg-white px-3 py-1">{s.status === 'tachado' ? 'Reactivar' : 'Tachar'}</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ListChecks} title="No hay oradores en la lista" description="Empieza agregando países desde tu lista inicial." />
        )}
      </div>
    </section>
  );
}

function AlliancesView({ topicKey, countries, alliances, setAlliances }) {
  const topicAlliances = alliances.filter((a) => a.topicKey === topicKey || !a.topicKey);

  const cycle = (country) => {
    const order = ['neutral', 'aliado', 'opositor'];
    setAlliances((prev) => {
      const idx = prev.findIndex((x) => x.country === country && (x.topicKey === topicKey || !x.topicKey));
      if (idx === -1) return [...prev, { id: crypto.randomUUID(), country, kind: 'aliado', topicKey }];
      const current = prev[idx];
      const nextKind = order[(order.indexOf(current.kind) + 1) % order.length];
      const copy = [...prev];
      copy[idx] = { ...current, kind: nextKind, topicKey };
      return copy;
    });
  };

  const stats = {
    aliado: topicAlliances.filter((a) => a.kind === 'aliado').length,
    neutral: topicAlliances.filter((a) => a.kind === 'neutral').length,
    opositor: topicAlliances.filter((a) => a.kind === 'opositor').length,
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {['aliado', 'neutral', 'opositor'].map((k) => (
          <div key={k} className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs uppercase text-[#6E6E73]">{k}</p>
            <p className="mt-1 text-2xl font-semibold">{stats[k]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        {countries.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => {
              const record = topicAlliances.find((a) => a.country === country) || { kind: 'neutral' };
              const palette = record.kind === 'aliado'
                ? 'border-[#34C759]/40 bg-[#34C759]/10'
                : record.kind === 'opositor'
                ? 'border-[#FF3B30]/40 bg-[#FF3B30]/10'
                : 'border-[rgba(60,60,67,0.10)] bg-[#F8F8FC]';
              return (
                <button key={country} onClick={() => cycle(country)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${palette}`}>
                  <p className="font-medium">{country}</p>
                  <p className="mt-1 text-sm capitalize text-[#6E6E73]">{record.kind} · click para cambiar</p>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Handshake} title="Aún no hay países cargados" description="Primero carga países desde la configuración inicial." />
        )}
      </div>
    </section>
  );
}

function NotesView({ topicKey, countries, notesGeneral, setNotesGeneral, notesCountries, setNotesCountries }) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || '');

  useEffect(() => {
    if (!countries.includes(selectedCountry)) {
      setSelectedCountry(countries[0] || '');
    }
  }, [countries, selectedCountry]);

  const noteKey = `${topicKey}::${selectedCountry}`;

  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">Notas generales de sesión</span>
          <span className="text-[#6E6E73]">Autoguardado activo</span>
        </div>
        <textarea value={notesGeneral} onChange={(e) => setNotesGeneral(e.target.value)} className="h-[500px] w-full rounded-2xl border p-4" placeholder="Escribe observaciones generales de estrategia, mociones y dinámicas..." />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <p className="mb-2 text-sm font-semibold">Notas por país (por tema)</p>
        {countries.length ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`rounded-xl px-3 py-2 text-left text-sm ${selectedCountry === country ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#1C1C1E]'}`}
                >
                  {country}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6E6E73]">Editando: <strong>{selectedCountry}</strong> · Tema: <strong>{topicKey === 'tema1' ? 'Tema 1' : 'Tema 2'}</strong></p>
            <textarea
              value={notesCountries[noteKey] || ''}
              onChange={(e) => setNotesCountries((p) => ({ ...p, [noteKey]: e.target.value }))}
              className="mt-2 h-[320px] w-full rounded-xl border p-3"
              placeholder="Contradicciones, líneas de negociación, puntos de presión..."
            />
          </>
        ) : (
          <EmptyState icon={NotebookPen} title="Sin países para notas" description="Carga países para empezar notas tácticas por delegación." />
        )}
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
      <div className="flex gap-2">
        {['Discursos', 'Perfiles de ataque'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm ${tab === t ? 'bg-[#007AFF] text-white' : 'bg-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Discursos' && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="grid gap-3 md:grid-cols-2">
            <input placeholder="Título" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="rounded-xl border p-3" />
            <button
              onClick={() => {
                if (!draft.title && !draft.content) return;
                setSpeeches((p) => [...p, { ...draft, id: crypto.randomUUID() }]);
                setDraft({ title: '', content: '' });
                pushToast('Discurso guardado.', 'success');
              }}
              className="rounded-full bg-[#007AFF] px-4 text-white"
            >
              Guardar discurso
            </button>
          </div>
          <textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} placeholder="Pega o redacta un discurso" className="mt-3 h-44 w-full rounded-xl border p-3" />
          <p className="mt-2 text-sm text-[#6E6E73]">Palabras: {draft.content.split(/\s+/).filter(Boolean).length} · Duración estimada: {estimate(draft.content)} min</p>

          <div className="mt-5 space-y-2">
            {speeches.length ? (
              speeches.map((s) => (
                <div key={s.id} className="rounded-xl bg-[#F2F2F7] p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{s.title || 'Sin título'}</p>
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setSpeeches((p) => [...p, { ...s, id: crypto.randomUUID(), title: `${s.title} (copia)` }])} className="rounded-full bg-white px-3 py-1">Duplicar</button>
                      <button onClick={() => setPresentingSpeechId(s.id)} className="rounded-full bg-white px-3 py-1">Presentar</button>
                      <button onClick={() => setSpeeches((p) => p.filter((x) => x.id !== s.id))} className="rounded-full bg-white px-3 py-1">Eliminar</button>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#6E6E73]">{s.content}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={FileText} title="Aún no has creado discursos" description="Empieza redactando o pegando tu primer discurso." />
            )}
          </div>
        </div>
      )}

      {tab === 'Perfiles de ataque' && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-3 flex gap-2">
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="rounded-xl border p-3">
              {!countries.length && <option value="">No hay países</option>}
              {countries.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input value={bullet} onChange={(e) => setBullet(e.target.value)} placeholder="Agregar contradicción o vulnerabilidad" className="flex-1 rounded-xl border p-3" />
            <button
              onClick={() => {
                if (!selectedCountry || !bullet) return;
                setAttackProfiles((p) => ({ ...p, [selectedCountry]: [...(p[selectedCountry] || []), bullet] }));
                setBullet('');
              }}
              className="rounded-full bg-[#007AFF] px-4 text-white"
            >
              Agregar
            </button>
          </div>

          {Object.keys(attackProfiles).length ? (
            Object.entries(attackProfiles).map(([country, items]) => (
              <div key={country} className="mb-3 rounded-xl bg-[#F2F2F7] p-3">
                <p className="font-medium">{country}</p>
                {items.map((item, idx) => (
                  <div key={`${country}-${idx}`} className="mt-1 flex items-center justify-between text-sm">
                    <span>• {item}</span>
                    <button onClick={() => navigator.clipboard.writeText(`Pregunta para ${country}: ${item}`)} className="rounded-full bg-white px-2 py-1">
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <EmptyState icon={ShieldAlert} title="Todavía no has cargado perfiles de ataque" description="Selecciona un país y agrega contradicciones o debilidades." />
          )}
        </div>
      )}

      {presentingSpeechId && <div className="rounded-xl bg-[#F2F2F7] p-3 text-sm">Modo presentación activo.</div>}
    </section>
  );
}

function ReferencesView({ settings, setSettings, legalItems }) {
  const [customItem, setCustomItem] = useState('');

  return (
    <section className="grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="font-semibold">Frases parlamentarias</h3>
        {referenceBase.frases.map((f) => <p key={f} className="mt-3 text-sm text-[#6E6E73]">{f}</p>)}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="font-semibold">Marco legal {settings.marcoLegal}</h3>
        <div className="mt-3 space-y-2">
          {legalItems.map((f, i) => <p key={`${f}-${i}`} className="text-sm text-[#6E6E73]">• {f}</p>)}
        </div>

        <div className="mt-4 rounded-xl border border-[rgba(60,60,67,0.10)] bg-[#F8F8FC] p-3">
          <p className="text-sm font-medium">Agregar base legal personalizada</p>
          <div className="mt-2 flex gap-2">
            <input value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="Artículo, resolución o precedente" className="flex-1 rounded-xl border p-2" />
            <button
              onClick={() => {
                if (!customItem.trim()) return;
                setSettings((s) => ({
                  ...s,
                  legalCustom: {
                    ...s.legalCustom,
                    [s.marcoLegal]: [...(s.legalCustom?.[s.marcoLegal] || []), customItem.trim()],
                  },
                }));
                setCustomItem('');
              }}
              className="rounded-full bg-[#007AFF] px-3 text-sm text-white"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PresentationModal({ speech, onClose }) {
  return (
    <div className="fixed inset-0 z-40 bg-[#0E0E11]/90 p-4 md:p-10">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[rgba(20,20,26,0.92)] shadow-soft backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
          <div>
            <p className="text-sm text-white/70">Modo presentación</p>
            <h3 className="text-lg font-semibold">{speech?.title || 'Discurso'}</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-white/90">
          <pre className="whitespace-pre-wrap font-ui text-lg leading-relaxed">{speech?.content || 'Sin contenido.'}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
