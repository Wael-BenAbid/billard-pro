import React from 'react';
import { BilliardSession, AppSettings } from '../../../types';

interface DashboardProps {
  sessions: BilliardSession[];
  settings: AppSettings;
  currentTime: Date;
  onStartStop: (tableId: 'A' | 'B') => void;
  onTogglePayment: (id: string) => void;
  onNameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  settings,
  currentTime,
  onStartStop,
  onTogglePayment,
  onNameSession,
  onDeleteSession,
}) => {
  const [completedSession, setCompletedSession] = React.useState<BilliardSession | null>(null);
  const [completedTableId, setCompletedTableId] = React.useState<'A' | 'B' | null>(null);
  const [clientName, setClientName] = React.useState('');

  const formatPrice = (mil: number) => {
    if (mil < 10000) return `${Math.round(mil)} mil`;
    const dt = mil / 1000;
    return `${dt.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} DT`;
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '--:--';
    // Handle ISO format or time string
    if (time.includes('T')) {
      const date = new Date(time);
      return date.toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return time;
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
      // Show client name modal
      setCompletedSession(active);
      setCompletedTableId(tableId);
      setClientName('');
    } else {
      onStartStop(tableId);
    }
  };

  const handleConfirmClient = () => {
    if (completedSession && completedTableId) {
      // Stop the session and set the name in one go
      const name = clientName.trim() || 'Unknown';
      
      // First update the session with the name
      const updatedSession = {
        ...completedSession,
        clientName: name,
      };
      
      onNameSession(completedSession.id, name, updatedSession);
      
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleSkipClient = () => {
    if (completedSession && completedTableId) {
      // Stop the session without name
      const updatedSession = {
        ...completedSession,
        clientName: 'Unknown',
      };
      
      onNameSession(completedSession.id, 'Unknown', updatedSession);
      
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleDeleteSession = (sessionId: string, tableId: 'A' | 'B') => {
    if (window.confirm('Voulez-vous vraiment supprimer cette session ?')) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <div className="space-y-12">
      {/* Table Cards - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {['A', 'B'].map(tId => {
          const active = sessions.find(s => s.tableId === tId && !s.stopTime);
          const tableColor = tId === 'A' ? settings.tableAColor : settings.tableBColor;
          const elapsed = active ? Math.floor((Date.now() - active.timestamp) / 1000) : 0;
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          const hours = Math.floor(mins / 60);
          const displayMins = mins % 60;

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
                  {hours > 0 ? `${hours}:` : ''}
                  {displayMins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </p>
              </div>

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
                    TARIF
                  </p>
                  <p style={{ color: tableColor }} className="text-xl font-black">
                    {active
                      ? formatPrice(Math.round((elapsed / 60) * settings.rateBase))
                      : '0 DT'}
                  </p>
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
                  <th className="p-4">Durée</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableASessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-zinc-700 font-black uppercase text-xs tracking-widest"
                    >
                      Aucune session
                    </td>
                  </tr>
                ) : (
                  tableASessions.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-bold text-white text-sm">{s.clientName || 'En cours...'}</td>
                      <td className="p-4 font-bold text-white text-sm">{s.durationMinutes} min</td>
                      <td className="p-4 font-black text-white text-sm">{formatPrice(s.price)}</td>
                      <td className="p-4 flex gap-2">
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
                          onClick={() => handleDeleteSession(s.id, 'A')}
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
                  <th className="p-4">Durée</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableBSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-zinc-700 font-black uppercase text-xs tracking-widest"
                    >
                      Aucune session
                    </td>
                  </tr>
                ) : (
                  tableBSessions.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-bold text-white text-sm">{s.clientName || 'En cours...'}</td>
                      <td className="p-4 font-bold text-white text-sm">{s.durationMinutes} min</td>
                      <td className="p-4 font-black text-white text-sm">{formatPrice(s.price)}</td>
                      <td className="p-4 flex gap-2">
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
                          onClick={() => handleDeleteSession(s.id, 'B')}
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

      {/* Client Name Modal */}
      {completedSession && (
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
                Total: {formatPrice(completedSession.price)}
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
    </div>
  );
};

export default Dashboard;
