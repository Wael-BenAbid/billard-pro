import React from 'react';
import { BilliardSession, AppSettings } from '../../../types';

interface DashboardProps {
  sessions: BilliardSession[];
  settings: AppSettings;
  currentTime: Date;
  onStartStop: (tableId: 'A' | 'B', clientName?: string, rateType?: 'normal' | 'vip') => void;
  onTogglePayment: (id: string) => void;
  onNameSession: (sessionId: string, name: string, existingSession?: BilliardSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSession: (sessionId: string, updates: Partial<BilliardSession>) => void;
  onRequestAdmin: () => void;
  isAdmin: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  settings,
  currentTime,
  onStartStop,
  onTogglePayment,
  onNameSession,
  onDeleteSession,
  onEditSession,
  onRequestAdmin,
  isAdmin,
}) => {
  const [completedSession, setCompletedSession] = React.useState<BilliardSession | null>(null);
  const [completedTableId, setCompletedTableId] = React.useState<'A' | 'B' | null>(null);
  const [clientName, setClientName] = React.useState('');
  const [rateType, setRateType] = React.useState<'normal' | 'vip'>('normal');
  const [showStartModal, setShowStartModal] = React.useState(false);
  
  // Force re-render every second to update timer display
  const [now, setNow] = React.useState(Date.now());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Edit session modal state
  const [editingSession, setEditingSession] = React.useState<BilliardSession | null>(null);
  const [editForm, setEditForm] = React.useState({
    clientName: '',
    durationMinutes: 0,
    price: 0,
    isPaid: false,
  });
  const [adminPassword, setAdminPassword] = React.useState('');
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordForSession, setPasswordForSession] = React.useState<BilliardSession | null>(null);
  
  // Custom delete modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);

  const formatPrice = (mil: number) => {
    if (mil < 10000) return `${Math.round(mil)} mil`;
    const dt = mil / 1000;
    return `${dt.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} DT`;
  };

  // Professional timer: calculate elapsed time from startTime timestamp
  // This ensures accuracy even if page is refreshed
  const calculateElapsed = (startTime: string | null | undefined) => {
    if (!startTime) return 0;
    const start = typeof startTime === 'string' && startTime.includes('T') 
      ? new Date(startTime).getTime() 
      : Date.now();
    return now - start;
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '--:--';
    if (time.includes('T')) {
      const date = new Date(time);
      return date.toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return time;
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms < 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Calculate live price in real-time
  const calculateLivePrice = (startTime: string | null | undefined, ratePerHour: number = 10) => {
    if (!startTime) return "0.000";
    const start = typeof startTime === 'string' && startTime.includes('T') 
      ? new Date(startTime).getTime() 
      : Date.now();
    const diffHours = (now - start) / (1000 * 60 * 60);
    const price = diffHours * ratePerHour;
    return price.toFixed(3);
  };

  // Calculate occupation rate for today
  const calculateOccupationRate = (tableId: 'A' | 'B') => {
    const today = new Date().toISOString().split('T')[0];
    const dayStart = new Date(today + 'T00:00:00');
    const now = new Date();
    const totalMinutesToday = (now.getTime() - dayStart.getTime()) / 60000;
    
    const tableSessions = sessions.filter(s => 
      s.tableId === tableId && 
      s.date === today &&
      s.stopTime !== null
    );
    
    const occupiedMinutes = tableSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    // Add current session if active
    const activeSession = sessions.find(s => s.tableId === tableId && !s.stopTime && s.date === today);
    if (activeSession) {
      const startTime = new Date(activeSession.startTime);
      const currentMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      return Math.min(100, Math.round(((occupiedMinutes + currentMinutes) / totalMinutesToday) * 100));
    }
    
    return Math.min(100, Math.round((occupiedMinutes / totalMinutesToday) * 100));
  };

  const getTableSessions = (tableId: 'A' | 'B') => {
    const today = new Date().toISOString().split('T')[0];
    return sessions
      .filter(s => s.tableId === tableId && s.date === today)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const tableASessions = getTableSessions('A');
  const tableBSessions = getTableSessions('B');

  const handleStartStop = (tableId: 'A' | 'B') => {
    const active = sessions.find(s => s.tableId === tableId && !s.stopTime);
    if (active) {
      // Show client name modal for stopping
      setCompletedSession(active);
      setCompletedTableId(tableId);
      setClientName(active.clientName || '');
      setShowStartModal(false);
    } else {
      // Direct start without modal - use default values
      onStartStop(tableId, 'Anonyme', 'normal');
    }
  };

  const handleConfirmStart = () => {
    if (completedTableId) {
      onStartStop(completedTableId, clientName.trim() || 'Anonyme', rateType);
      setShowStartModal(false);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleConfirmClient = () => {
    if (completedSession && completedTableId) {
      const name = clientName.trim() || 'Anonyme';
      const updatedSession = { ...completedSession, clientName: name };
      onNameSession(completedSession.id, name, updatedSession);
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleSkipClient = () => {
    if (completedSession && completedTableId) {
      const updatedSession = { ...completedSession, clientName: 'Anonyme' };
      onNameSession(completedSession.id, 'Anonyme', updatedSession);
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (isAdmin) {
      setSessionToDelete(sessionId);
      setShowDeleteModal(true);
    } else {
      // Request admin password first
      setPasswordForSession(sessions.find(s => s.id === sessionId) || null);
      setShowPasswordModal(true);
    }
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const handlePasswordConfirm = () => {
    if (passwordForSession && adminPassword === 'admin123') {
      onDeleteSession(passwordForSession.id);
      setShowPasswordModal(false);
      setAdminPassword('');
      setPasswordForSession(null);
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleEditSession = (session: BilliardSession) => {
    if (isAdmin) {
      setEditingSession(session);
      setEditForm({
        clientName: session.clientName || '',
        durationMinutes: session.durationMinutes,
        price: session.price,
        isPaid: session.isPaid,
      });
    } else {
      setPasswordForSession(session);
      setShowPasswordModal(true);
    }
  };

  const handleEditConfirm = () => {
    if (editingSession) {
      onEditSession(editingSession.id, editForm);
      setEditingSession(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Table Cards - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {['A', 'B'].map(tId => {
          const active = sessions.find(s => s.tableId === tId && !s.stopTime);
          const tableColor = tId === 'A' ? settings.tableAColor : settings.tableBColor;
          const elapsed = active ? calculateElapsed(active.startTime) : 0;
          const mins = Math.floor(elapsed / 60000);
          const secs = Math.floor((elapsed % 60000) / 1000);

          return (
            <div
              key={tId}
              style={{
                borderColor: active ? tableColor : 'rgba(255,255,255,0.1)',
                boxShadow: active
                  ? `0 0 50px ${tableColor}30, 0 0 100px ${tableColor}10`
                  : '0 10px 40px rgba(0,0,0,0.5)',
              }}
              className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] ${
                active ? 'bg-black/60 border-2' : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              {active && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${tableColor}, transparent)`,
                    boxShadow: `0 0 20px ${tableColor}, 0 0 40px ${tableColor}`,
                  }}
                />
              )}

              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3
                  style={{ color: tableColor }}
                  className="font-black text-4xl italic tracking-tighter"
                >
                  TABLE {tId}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${active ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: active ? tableColor : '#444',
                      boxShadow: active
                        ? `0 0 15px ${tableColor}, 0 0 30px ${tableColor}60`
                        : 'none',
                    }}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                      active ? 'font-bold' : 'font-normal'
                    }`}
                    style={{ color: active ? tableColor : '#666' }}
                  >
                    {active ? 'EN COURS' : 'LIBRE'}
                  </span>
                </div>
              </div>

              <div
                className={`relative bg-black/50 rounded-[2rem] p-8 mb-6 text-center border border-white/5 transition-all duration-300 ${
                  active ? 'scale-[1.02]' : ''
                }`}
                style={{
                  animation: active ? 'pulse-glow 1.5s ease-in-out infinite alternate' : 'none',
                }}
              >
                <p className="text-zinc-500 text-[10px] font-black uppercase mb-2 tracking-widest">
                  COMPTEUR
                </p>
                <p
                  style={{
                    color: tableColor,
                    textShadow: active
                      ? `0 0 20px ${tableColor}80, 0 0 40px ${tableColor}40`
                      : 'none',
                  }}
                  className="text-6xl font-mono font-black tracking-wider"
                >
                  {formatDuration(elapsed)}
                </p>
              </div>

              {/* Live Price Display */}
              {active && (
                <div className="bg-black/40 backdrop-blur-sm rounded-[1.5rem] p-4 mb-6 text-center border border-white/5">
                  <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">
                    EN COURS
                  </p>
                  <p
                    style={{ color: tableColor }}
                    className="text-2xl font-mono font-black"
                  >
                    {calculateLivePrice(active.startTime)} DT
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/5 text-center">
                  <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">
                    DÉBUT
                  </p>
                  <p className="text-xl font-mono font-bold text-white">
                    {active?.startTime ? formatTime(active.startTime) : '--:--'}
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/5 text-center">
                  <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">
                    CLIENT
                  </p>
                  <p className="text-lg font-bold text-white truncate">
                    {active?.clientName || '--'}
                  </p>
                </div>
              </div>

              {/* Occupation Rate Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Occupation Today
                  </span>
                  <span className="text-[10px] font-black" style={{ color: tableColor }}>
                    {calculateOccupationRate(tId as 'A' | 'B')}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${calculateOccupationRate(tId as 'A' | 'B')}%`,
                      backgroundColor: tableColor,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleStartStop(tId as 'A' | 'B')}
                className={`w-full py-4 rounded-[1.5rem] font-black text-base uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  active
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'text-black hover:brightness-110'
                }`}
                style={{
                  backgroundColor: active ? undefined : tableColor,
                  boxShadow: !active
                    ? `0 0 20px ${tableColor}60, 0 0 40px ${tableColor}30`
                    : 'none',
                }}
              >
                {active ? 'ARRÊTER' : 'DÉMARRER'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Overall Occupation Stats */}
      <div className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-8">
        <h3 className="text-lg font-black italic tracking-tighter uppercase text-white mb-6">
          Taux d'Occupation Global
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-white">Table A</span>
              <span className="text-sm font-bold" style={{ color: settings.tableAColor }}>
                {calculateOccupationRate('A')}%
              </span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${calculateOccupationRate('A')}%`, backgroundColor: settings.tableAColor }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-white">Table B</span>
              <span className="text-sm font-bold" style={{ color: settings.tableBColor }}>
                {calculateOccupationRate('B')}%
              </span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${calculateOccupationRate('B')}%`, backgroundColor: settings.tableBColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions du Jour - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessions Table A */}
        <section
          className="bg-zinc-900/30 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500"
          style={{ borderLeft: `4px solid ${settings.tableAColor}` }}
        >
          <div
            className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center"
          >
            <h4
              className="text-lg font-black italic tracking-tighter uppercase"
              style={{ color: settings.tableAColor }}
            >
              Sessions Table A
            </h4>
            <span
              className="px-3 py-1 rounded-full text-[10px] font-black"
              style={{ backgroundColor: `${settings.tableAColor}20`, color: settings.tableAColor }}
            >
              {tableASessions.length}
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase border-b border-white/5 bg-zinc-900/50">
                  <th className="p-4">Client</th>
                  <th className="p-4">Heure</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableASessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-zinc-700 font-black uppercase text-xs tracking-widest"
                    >
                      Aucune session
                    </td>
                  </tr>
                ) : (
                  tableASessions.slice(0, 10).map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-bold text-white text-sm">{s.clientName || 'En cours...'}</td>
                      <td className="p-4 font-bold text-white text-sm">{formatTime(s.startTime)}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => handleEditSession(s)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-500 transition-all"
                          title="Éditer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onTogglePayment(s.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                            s.isPaid
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}
                        >
                          {s.isPaid ? 'Payé' : 'Non payé'}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sessions Table B */}
        <section
          className="bg-zinc-900/30 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500"
          style={{ borderLeft: `4px solid ${settings.tableBColor}` }}
        >
          <div
            className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center"
          >
            <h4
              className="text-lg font-black italic tracking-tighter uppercase"
              style={{ color: settings.tableBColor }}
            >
              Sessions Table B
            </h4>
            <span
              className="px-3 py-1 rounded-full text-[10px] font-black"
              style={{ backgroundColor: `${settings.tableBColor}20`, color: settings.tableBColor }}
            >
              {tableBSessions.length}
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase border-b border-white/5 bg-zinc-900/50">
                  <th className="p-4">Client</th>
                  <th className="p-4">Heure</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableBSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-zinc-700 font-black uppercase text-xs tracking-widest"
                    >
                      Aucune session
                    </td>
                  </tr>
                ) : (
                  tableBSessions.slice(0, 10).map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-bold text-white text-sm">{s.clientName || 'En cours...'}</td>
                      <td className="p-4 font-bold text-white text-sm">{formatTime(s.startTime)}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => handleEditSession(s)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-500 transition-all"
                          title="Éditer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onTogglePayment(s.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                            s.isPaid
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}
                        >
                          {s.isPaid ? 'Payé' : 'Non payé'}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Start Session Modal */}
      {showStartModal && completedTableId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${settings.themeColor}20` }}
              >
                <span className="text-4xl">🎱</span>
              </div>
              <h2 className="text-3xl font-black italic text-white">
                Nouvelle Session
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                Table {completedTableId}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Nom du Client
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Entrez le nom du client"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Tarif
              </label>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setRateType('normal')}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase transition-all ${
                    rateType === 'normal'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setRateType('vip')}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase transition-all ${
                    rateType === 'vip'
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  VIP
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStart}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Name Modal */}
      {completedSession && !showStartModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${settings.themeColor}20` }}
              >
                <span className="text-4xl">🎱</span>
              </div>
              <h2 className="text-3xl font-black italic text-white">
                Session Terminée
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                Durée: {formatDuration(calculateElapsed(completedSession.startTime))}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Nom du Client
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Entrez le nom du client"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
                autoFocus
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSkipClient}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Passer
              </button>
              <button
                onClick={handleConfirmClient}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${settings.themeColor}20` }}
              >
                <span className="text-4xl">✏️</span>
              </div>
              <h2 className="text-3xl font-black italic text-white">
                Éditer Session
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                Table {editingSession.tableId}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Nom du Client
              </label>
              <input
                type="text"
                value={editForm.clientName}
                onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Durée (min)
                </label>
                <input
                  type="number"
                  value={editForm.durationMinutes}
                  onChange={e => setEditForm({ ...editForm, durationMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Prix (DT)
                </label>
                <input
                  type="number"
                  value={(editForm.price / 1000).toFixed(3)}
                  onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) * 1000 })}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.isPaid}
                  onChange={e => setEditForm({ ...editForm, isPaid: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white font-bold">Payé</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setEditingSession(null)}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700"
              >
                Annuler
              </button>
              <button
                onClick={handleEditConfirm}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${settings.themeColor}20` }}
              >
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-2xl font-black italic text-white">
                Administration
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                Mot de passe requis
              </p>
            </div>

            <div>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Mot de passe admin"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2 text-center"
                autoFocus
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPassword('');
                  setPasswordForSession(null);
                }}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700"
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordConfirm}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl" style={{ borderTop: '4px solid #ff3b30' }}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-red-500/20">
                <span className="text-3xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-black italic text-white">
                Confirmation
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                Voulez-vous vraiment supprimer cette session ?
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700 transition-all"
              >
                ANNULER
              </button>
              <button
                onClick={confirmDeleteSession}
                className="flex-1 py-4 bg-red-500 rounded-2xl font-black text-sm uppercase text-white hover:bg-red-600 transition-all"
                style={{ boxShadow: '0 0 15px rgba(255, 59, 48, 0.4)' }}
              >
                SUPPRIMER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
