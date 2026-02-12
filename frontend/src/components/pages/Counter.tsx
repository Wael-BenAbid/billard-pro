import React from 'react';
import { BilliardSession, AppSettings } from '../../../types';
import { formatTime } from '../../utils/dateTimeUtils';
import { calculateSessionPrice } from '../../utils/priceCalculator';

interface CounterProps {
  sessions: BilliardSession[];
  currentTime: Date;
  settings: AppSettings;
  onStartStop: (tableId: 'A' | 'B', clientName?: string, rateType?: 'normal' | 'vip') => void;
  onTogglePayment: (id: string) => void;
  onNameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSession: (sessionId: string, updates: Partial<BilliardSession>) => void;
  isAdmin: boolean;
}

/**
 * Counter component - displays billiard tables and session management
 * 
 * IMPORTANT: Price calculation is done on the backend.
 * The frontend shows ESTIMATED prices for active sessions only.
 * Final prices come from the backend when sessions are stopped.
 */
export const Counter: React.FC<CounterProps> = ({
  sessions,
  currentTime,
  settings,
  onStartStop,
  onTogglePayment,
  onNameSession,
  onDeleteSession,
  onEditSession,
  isAdmin,
}) => {
  const [editingSession, setEditingSession] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const activeSessionA = sessions.find(s => s.tableId === 'A' && !s.stopTime);
  const activeSessionB = sessions.find(s => s.tableId === 'B' && !s.stopTime);
  
  const historySessions = sessions
    .filter(s => s.stopTime)
    .sort((a, b) => b.timestamp - a.timestamp);

  const formatDuration = (session: BilliardSession) => {
    if (!session.startTime) return '0:00';
    const start = new Date(session.startTime);
    const end = session.stopTime ? new Date(session.stopTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, '0')}`;
  };

  /**
   * Get price for display purposes.
   * For active sessions: shows ESTIMATED price (calculated locally)
   * For completed sessions: shows FINAL price from backend
   */
  const getPrice = (session: BilliardSession) => {
    if (session.stopTime) {
      // Final price from backend
      return Number(session.price);
    }
    // Estimated price for active session (simulation only)
    const mins = Math.floor((currentTime.getTime() - new Date(session.startTime).getTime()) / 60000);
    return calculateSessionPrice(mins, settings);
  };

  const handleNameSubmit = (sessionId: string) => {
    if (editValue.trim()) {
      onNameSession(sessionId, editValue.trim());
    }
    setEditingSession(null);
    setEditValue('');
  };

  const TableCard: React.FC<{
    tableId: 'A' | 'B';
    activeSession: BilliardSession | undefined;
    color: string;
  }> = ({ tableId, activeSession, color }) => (
    <div className="bg-zinc-900/50 rounded-[2rem] p-8 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black italic" style={{ color }}>
          TABLE {tableId}
        </h2>
        <button
          onClick={() => onStartStop(tableId)}
          className={`px-8 py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all ${
            activeSession
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'hover:brightness-110 text-black'
          }`}
          style={{ backgroundColor: activeSession ? undefined : color }}
        >
          {activeSession ? 'STOP' : 'START'}
        </button>
      </div>

      {activeSession ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-black/30 rounded-2xl p-6">
            <div>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Client</p>
              {editingSession === activeSession.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-bold outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleNameSubmit(activeSession.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <p
                  className="text-2xl font-black text-white cursor-pointer hover:text-zinc-300"
                  onClick={() => {
                    setEditingSession(activeSession.id);
                    setEditValue(activeSession.clientName);
                  }}
                >
                  {activeSession.clientName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Temps</p>
              <p className="text-4xl font-black" style={{ color }}>
                {formatDuration(activeSession)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/30 rounded-2xl p-6">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Prix (estimation)</p>
            <p className="text-3xl font-black" style={{ color }}>
              {(getPrice(activeSession) / 1000).toFixed(3)} DT
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-black/20 rounded-2xl">
          <p className="text-zinc-600 font-black italic text-xl">LIBRE</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Active Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TableCard tableId="A" activeSession={activeSessionA} color={settings.tableAColor} />
        <TableCard tableId="B" activeSession={activeSessionB} color={settings.tableBColor} />
      </div>

      {/* Session History */}
      <div className="bg-zinc-900/50 rounded-[2rem] p-8 border border-white/5">
        <h3 className="text-xl font-black italic text-white mb-6">HISTORIQUE DES SESSIONS</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
                <th className="pb-4">Table</th>
                <th className="pb-4">Client</th>
                <th className="pb-4">Heure</th>
                <th className="pb-4">Durée</th>
                <th className="pb-4">Prix (final)</th>
                <th className="pb-4">Status</th>
                {isAdmin && <th className="pb-4">Action</th>}
              </tr>
            </thead>
            <tbody>
              {historySessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black uppercase"
                      style={{
                        backgroundColor: session.tableId === 'A' ? settings.tableAColor : settings.tableBColor,
                        color: 'white',
                      }}
                    >
                      {session.tableId}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-white">{session.clientName}</td>
                  <td className="py-4 text-zinc-400">
                    {session.startTime ? formatTime(session.startTime) : '--:--'}
                  </td>
                  <td className="py-4 text-zinc-400">{session.durationMinutes} min</td>
                  <td className="py-4 font-black" style={{ color: settings.themeColor }}>
                    {(session.price / 1000).toFixed(3)} DT
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => onTogglePayment(session.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        session.isPaid
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {session.isPaid ? 'PAYÉ' : 'DÛ'}
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="py-4">
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="text-red-500 hover:text-red-400 font-bold text-sm"
                      >
                        SUPPR
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
