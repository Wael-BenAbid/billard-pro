import React, { useState, useMemo, useCallback } from 'react';
import { BilliardSession } from '../../../types';
import { useTimer } from '../../hooks/useTimer';
import { parseDateTime, formatDuration, formatPrice } from '../../utils/dateTimeUtils';
import { calculateSessionPrice } from '../../utils/priceCalculator';
import { useAppContext } from '../../context/AppContext';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const Dashboard: React.FC = () => {
  const { 
    sessions, 
    settings, 
    currentTime, 
    handleStartStop: contextHandleStartStop, 
    togglePayment, 
    handleNameSession, 
    handleDeleteSession: contextHandleDeleteSession, 
    handleEditSession: contextHandleEditSession,
    zTicket,
    user
  } = useAppContext();
  
  const isAdmin = user?.role === 'admin';
  // ========================================
  // STATE
  // ========================================
  const [completedSession, setCompletedSession] = useState<BilliardSession | null>(null);
  const [completedTableId, setCompletedTableId] = useState<'A' | 'B' | null>(null);
  const [clientName, setClientName] = useState('');
  const [rateType, setRateType] = useState<'normal' | 'vip'>('normal');
  const [showStartModal, setShowStartModal] = useState(false);
  
  // Edit session modal state
  const [editingSession, setEditingSession] = useState<BilliardSession | null>(null);
  const [editForm, setEditForm] = useState({
    clientName: '',
    durationMinutes: 0,
    price: 0,
    isPaid: false,
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForSession, setPasswordForSession] = useState<BilliardSession | null>(null);
  
  // Custom delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  // History filter state
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================
  
  /**
   * Récupère la session active pour une table
   */
  const getActiveSession = useCallback((tableId: 'A' | 'B'): BilliardSession | undefined => {
    return sessions.find(s => s.tableId === tableId && !s.stopTime);
  }, [sessions]);
  
  /**
   * Formate l'heure de début
   */
  const formatStartTime = useCallback((startTime: string | null): string => {
    const timestamp = parseDateTime(startTime);
    if (timestamp === null) return '--:--';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  /**
   * Calculate occupation rate for a specific table today
   */
  const calculateOccupationRate = useCallback((tableId: 'A' | 'B'): number => {
    const today = new Date().toISOString().split('T')[0];
    const dayStart = new Date(today + 'T00:00:00');
    const nowTime = new Date();
    const totalMinutesToday = (nowTime.getTime() - dayStart.getTime()) / 60000;
    
    // Guard against division by zero
    if (totalMinutesToday <= 0) return 0;
    
    const tableSessions = sessions.filter(s => 
      s.tableId === tableId && 
      s.date === today &&
      s.stopTime !== null
    );
    
    const occupiedMinutes = tableSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    // Add current session if active
    const activeSession = sessions.find(s => s.tableId === tableId && !s.stopTime && s.date === today);
    if (activeSession) {
      const startTime = parseDateTime(activeSession.startTime);
      if (startTime !== null) {
        const currentMinutes = Math.floor((nowTime.getTime() - startTime) / 60000);
        return Math.min(100, Math.round(((occupiedMinutes + currentMinutes) / totalMinutesToday) * 100));
      }
    }
    
    return Math.min(100, Math.round((occupiedMinutes / totalMinutesToday) * 100));
  }, [sessions]);
  
  // Filtered history based on filter state
  const filteredHistory = useMemo(() => {
    const completedSessions = sessions.filter(s => s.stopTime);
    
    switch (historyFilter) {
      case 'paid':
        return completedSessions.filter(s => s.isPaid);
      case 'unpaid':
        return completedSessions.filter(s => !s.isPaid);
      default:
        return completedSessions;
    }
  }, [sessions, historyFilter]);

  // ========================================
  // HANDLERS
  // ========================================
  
  const onStartStopTable = (tableId: 'A' | 'B') => {
    const active = sessions.find(s => s.tableId === tableId && !s.stopTime);
    if (active) {
      // Stop session - show client name modal
      setCompletedSession(active);
      setCompletedTableId(tableId);
      setClientName(active.clientName || '');
      setShowStartModal(false);
    } else {
      // Start session - direct start with default values
      contextHandleStartStop(tableId, 'Anonyme');
    }
  };

  const handleConfirmStart = () => {
    if (completedTableId) {
      contextHandleStartStop(completedTableId, clientName.trim() || 'Anonyme');
      setShowStartModal(false);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleConfirmClient = () => {
    if (completedSession && completedTableId) {
      const name = clientName.trim() || 'Anonyme';
      const updatedSession = { ...completedSession, clientName: name };
      handleNameSession(completedSession.id, name);
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const handleSkipClient = () => {
    if (completedSession && completedTableId) {
      handleNameSession(completedSession.id, 'Anonyme');
      setCompletedSession(null);
      setCompletedTableId(null);
      setClientName('');
    }
  };

  const onDeleteSession = (sessionId: string) => {
    if (isAdmin) {
      setSessionToDelete(sessionId);
      setShowDeleteModal(true);
    } else {
      setPasswordForSession(sessions.find(s => s.id === sessionId) || null);
      setShowPasswordModal(true);
    }
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      contextHandleDeleteSession(sessionToDelete);
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const handlePasswordConfirm = () => {
    if (passwordForSession && adminPassword === 'admin123') {
      contextHandleDeleteSession(passwordForSession.id);
      setShowPasswordModal(false);
      setAdminPassword('');
      setPasswordForSession(null);
    }
  };

  const onEditSession = (session: BilliardSession) => {
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
      contextHandleEditSession(editingSession.id, editForm);
      setEditingSession(null);
    }
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="space-y-12">
      {/* Table Cards - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(['A', 'B'] as const).map(tableId => {
          const active = getActiveSession(tableId);
          const tableColor = tableId === 'A' ? settings.tableAColor : settings.tableBColor;
          
          // Timer hook - 100% frontend
          const startTimestamp = parseDateTime(active?.startTime ?? null);
          const timer = useTimer(
            startTimestamp, 
            active !== undefined
          );
          
          // Prix en temps réel
          const livePrice = active ? calculateSessionPrice(timer.elapsed, settings) : 0;

          return (
            <div
              key={tableId}
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
                  TABLE {tableId}
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

              {/* Timer Display */}
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
                  {timer.formatted}
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
                    {formatPrice(Math.round(livePrice))}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/5 text-center">
                  <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">
                    DÉBUT
                  </p>
                  <p className="text-xl font-mono font-bold text-white">
                    {active ? formatStartTime(active.startTime) : '--:--'}
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
                    {calculateOccupationRate(tableId as 'A' | 'B')}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${calculateOccupationRate(tableId as 'A' | 'B')}%`,
                      backgroundColor: tableColor,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => onStartStopTable(tableId as 'A' | 'B')}
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

      {/* Session History Table */}
      <div className="mt-8 bg-zinc-900/30 rounded-[3rem] border border-white/5 p-8">
        <h3 className="text-lg font-black italic tracking-tighter uppercase text-white mb-6">
          Historique des Sessions
        </h3>
        
        {/* Filter Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              historyFilter === 'all' 
                ? 'bg-white text-black' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            TOUTES
          </button>
          <button
            onClick={() => setHistoryFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              historyFilter === 'paid' 
                ? 'bg-green-600 text-white' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            PAYÉES
          </button>
          <button
            onClick={() => setHistoryFilter('unpaid')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              historyFilter === 'unpaid' 
                ? 'bg-red-600 text-white' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            NON PAYÉES
          </button>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 text-xs font-black uppercase tracking-widest border-b border-white/10">
                <th className="pb-4 pl-2">DATE</th>
                <th className="pb-4">TABLE</th>
                <th className="pb-4">CLIENT</th>
                <th className="pb-4">DURÉE</th>
                <th className="pb-4">PRIX</th>
                <th className="pb-4">STATUT</th>
                <th className="pb-4 text-right pr-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Aucune session terminée
                  </td>
                </tr>
              ) : (
                filteredHistory.map((session) => (
                  <tr 
                    key={session.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 pl-2 text-white font-mono text-sm">
                      {session.date}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        session.tableId === 'A' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-blue-900/50 text-blue-400'
                      }`}>
                        TABLE {session.tableId}
                      </span>
                    </td>
                    <td className="py-4 text-white font-medium">
                      {session.clientName || 'Anonyme'}
                    </td>
                    <td className="py-4 text-white font-mono">
                      {formatDuration(session.durationMinutes * 60 * 1000)}
                    </td>
                    <td className="py-4">
                      <span className={`font-mono font-bold ${
                        session.isPaid ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPrice(session.price)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        session.isPaid 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {session.isPaid ? 'PAYÉ' : 'DÛ'}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => togglePayment(session.id)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            session.isPaid
                              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                              : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                          title={session.isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'}
                        >
                          {session.isPaid ? 'DÛ' : 'PAYÉ'}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSessionToDelete(session.id);
                              setShowDeleteModal(true);
                            }}
                            className="px-3 py-1 rounded text-xs font-bold bg-red-900/50 text-red-400 hover:bg-red-800 transition-all"
                            title="Supprimer"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-8 w-80 text-center">
            <h3 className="text-white text-xl font-bold mb-4">Confirmer la suppression ?</h3>
            <p className="text-zinc-400 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600"
              >
                ANNULER
              </button>
              <button 
                onClick={confirmDeleteSession}
                className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500"
              >
                SUPPRIMER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de mot de passe admin */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 w-80 text-center">
            <h3 className="text-white text-xl font-bold mb-4">Admin Required</h3>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Mot de passe admin"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white mb-4"
            />
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPassword('');
                  setPasswordForSession(null);
                }}
                className="px-6 py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600"
              >
                ANNULER
              </button>
              <button 
                onClick={handlePasswordConfirm}
                className="px-6 py-2 rounded-lg bg-yellow-600 text-white font-bold hover:bg-yellow-500"
              >
                VALIDER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
