import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { BilliardSession, User, AppSettings, PS4Game, PS4Session, InventoryItem } from '../../types';
import { authService, billiardService, ps4Service, settingsService } from '../services/apiService';

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Café', price: 1000, icon: '☕' },
  { id: '2', name: 'Thé', price: 800, icon: '🍵' },
  { id: '3', name: 'Soda', price: 2000, icon: '🥤' },
  { id: '4', name: 'Eau', price: 1000, icon: '💧' },
  { id: '5', name: 'Chicha', price: 5000, icon: '💨' },
];

const DEFAULT_PS4_GAMES: PS4Game[] = [
  {
    id: 'pes',
    name: 'PES',
    icon: '⚽',
    playerOptions: [1, 2, 3, 4],
    timeOptions: [
      { id: 'p1', label: '10 min', minutes: 10, price: 1500, players: 1 },
      { id: 'p2', label: '15 min', minutes: 15, price: 2000, players: 1 },
      { id: 'p3', label: '20 min', minutes: 20, price: 2500, players: 1 },
      { id: 'p4', label: '10 min', minutes: 10, price: 2000, players: 2 },
      { id: 'p5', label: '15 min', minutes: 15, price: 2500, players: 2 },
      { id: 'p6', label: '20 min', minutes: 20, price: 3000, players: 2 },
      { id: 'p7', label: '10 min', minutes: 10, price: 2500, players: 3 },
      { id: 'p8', label: '15 min', minutes: 15, price: 3000, players: 3 },
      { id: 'p9', label: '20 min', minutes: 20, price: 3500, players: 3 },
      { id: 'p10', label: '10 min', minutes: 10, price: 3000, players: 4 },
      { id: 'p11', label: '15 min', minutes: 15, price: 3500, players: 4 },
      { id: 'p12', label: '20 min', minutes: 20, price: 4000, players: 4 },
    ],
  },
  {
    id: 'fc',
    name: 'FC',
    icon: '🎮',
    playerOptions: [1, 2, 3, 4],
    timeOptions: [
      { id: 'f1', label: '8 min', minutes: 8, price: 1500, players: 1 },
      { id: 'f2', label: '10 min', minutes: 10, price: 2000, players: 1 },
      { id: 'f3', label: '15 min', minutes: 15, price: 2500, players: 1 },
      { id: 'f4', label: '8 min', minutes: 8, price: 2000, players: 2 },
      { id: 'f5', label: '10 min', minutes: 10, price: 2500, players: 2 },
      { id: 'f6', label: '15 min', minutes: 15, price: 3000, players: 2 },
      { id: 'f7', label: '8 min', minutes: 8, price: 2500, players: 3 },
      { id: 'f8', label: '10 min', minutes: 10, price: 3000, players: 3 },
      { id: 'f9', label: '15 min', minutes: 15, price: 3500, players: 3 },
      { id: 'f10', label: '8 min', minutes: 8, price: 3000, players: 4 },
      { id: 'f11', label: '10 min', minutes: 10, price: 3500, players: 4 },
      { id: 'f12', label: '15 min', minutes: 15, price: 4000, players: 4 },
    ],
  },
  {
    id: 'gta',
    name: 'GTA',
    icon: '🚗',
    playerOptions: [1, 2, 3, 4],
    timeOptions: [
      { id: 'g1', label: '15 min', minutes: 15, price: 1000, players: 1 },
      { id: 'g2', label: '30 min', minutes: 30, price: 2000, players: 1 },
      { id: 'g3', label: '45 min', minutes: 45, price: 3000, players: 1 },
      { id: 'g4', label: '1h', minutes: 60, price: 4000, players: 1 },
      { id: 'g5', label: '15 min', minutes: 15, price: 1500, players: 2 },
      { id: 'g6', label: '30 min', minutes: 30, price: 2500, players: 2 },
      { id: 'g7', label: '45 min', minutes: 45, price: 3500, players: 2 },
      { id: 'g8', label: '1h', minutes: 60, price: 4500, players: 2 },
      { id: 'g9', label: '15 min', minutes: 15, price: 2000, players: 3 },
      { id: 'g10', label: '30 min', minutes: 30, price: 3000, players: 3 },
      { id: 'g11', label: '45 min', minutes: 45, price: 4000, players: 3 },
      { id: 'g12', label: '1h', minutes: 60, price: 5000, players: 3 },
      { id: 'g13', label: '15 min', minutes: 15, price: 2500, players: 4 },
      { id: 'g14', label: '30 min', minutes: 30, price: 3500, players: 4 },
      { id: 'g15', label: '45 min', minutes: 45, price: 4500, players: 4 },
      { id: 'g16', label: '1h', minutes: 60, price: 5500, players: 4 },
    ],
  },
];

interface AppContextType {
  sessions: BilliardSession[];
  setSessions: React.Dispatch<React.SetStateAction<BilliardSession[]>>;
  ps4Sessions: PS4Session[];
  setPs4Sessions: React.Dispatch<React.SetStateAction<PS4Session[]>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentTime: Date;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleStartStop: (tableId: 'A' | 'B', clientName?: string) => Promise<void>;
  handleNameSession: (sessionId: string, name: string) => void;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  togglePayment: (id: string) => void;
  handleEditSession: (sessionId: string, updates: Partial<BilliardSession>) => void;
  savePS4SessionToAPI: (session: PS4Session) => Promise<void>;
  viewingClientHistory: string | null;
  setViewingClientHistory: React.Dispatch<React.SetStateAction<string | null>>;
  clientHistory: BilliardSession[];
  zTicket: {
    totalRevenue: number;
    pendingPayment: number;
    sessionCount: number;
    avgSessionPrice: number;
  };
  currentDayBilliardSessions: BilliardSession[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<BilliardSession[]>([]);
  const [ps4Sessions, setPs4Sessions] = useState<PS4Session[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    clubName: 'B-CLUB',
    logoUrl: '',
    themeColor: '#eab308',
    tableAColor: '#10b981',
    tableBColor: '#3b82f6',
    inventory: DEFAULT_INVENTORY,
    rateBase: 150,
    rateReduced: 135,
    thresholdMins: 15,
    floorMin: 1000,
    floorMid: 1500,
    ps4Games: DEFAULT_PS4_GAMES,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewingClientHistory, setViewingClientHistory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data from API on mount
  useEffect(() => {
    // Load auth
    const savedAuth = authService.getAuth();
    if (savedAuth) {
      setUser(savedAuth);
    }
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load sessions
        let sessionsData = await billiardService.getSessions();
        
        // Auto-close orphaned sessions
        const today = new Date().toISOString().split('T')[0];
        const sessionsToAutoClose = sessionsData.filter((s: any) => 
          !s.stop_time && s.start_time && !s.start_time.startsWith(today)
        );
        
        for (const s of sessionsToAutoClose) {
          try {
            await billiardService.updateSession(s.id, {
              ...s,
              stop_time: `${today}T23:59:59`,
            });
          } catch (e) {
            console.error('Error auto-closing session:', e);
          }
        }
        
        // Refresh sessions
        sessionsData = await billiardService.getSessions();
        setSessions(billiardService.transformSessions(sessionsData));

        // Load PS4 sessions
        const ps4Data = await ps4Service.getSessions();
        setPs4Sessions(ps4Service.transformSessions(ps4Data));

        // Load settings
        const settingsData = await settingsService.getSettings();
        if (settingsData) {
          setSettings(prev => ({
            ...prev,
            ...settingsData,
            inventory: prev.inventory,
            ps4Games: prev.ps4Games,
          }));
        }

        // Load inventory
        const inventoryData = await settingsService.getInventory();
        if (inventoryData && inventoryData.length > 0) {
          setSettings(prev => ({ ...prev, inventory: inventoryData }));
        }

        // Load PS4 games
        const gamesData = await settingsService.getGames();
        if (gamesData && gamesData.length > 0) {
          setSettings(prev => ({ ...prev, ps4Games: gamesData }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const saveSessionToAPI = async (session: BilliardSession) => {
    try {
      const sessionData = billiardService.prepareSessionData(session);
      
      if (session.id.length < 20) {
        const created = await billiardService.createSession(sessionData);
        setSessions(prev => prev.map(s => s.id === session.id ? created : s));
      } else {
        const updated = await billiardService.updateSession(session.id, sessionData);
        setSessions(prev => prev.map(s => s.id === session.id ? updated : s));
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

   const handleStartStop = async (tableId: 'A' | 'B', clientName?: string) => {
    const now = new Date();
    const nowISO = now.toISOString();
    const dateStr = nowISO.split('T')[0];
    const activeIdx = sessions.findIndex(s => s.tableId === tableId && !s.stopTime);

    if (activeIdx === -1) {
      // START: Backend vérifie verrous (anti double START)
      try {
        const newSession = await billiardService.startSession(tableId, clientName || 'Anonyme');
        setSessions(prev => [newSession, ...prev]);
      } catch (error) {
        console.error('Error starting session:', error);
        // Fallback local si API indisponible
        createLocalSession(tableId, nowISO, dateStr, clientName);
      }
    } else {
      // STOP: Backend calcule duration et prix automatiquement
      try {
        const updatedSession = await billiardService.stopSession(tableId);
        setSessions(prev => prev.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        ));
      } catch (error) {
        console.error('Error stopping session:', error);
        // Fallback local SEULEMENT si API indisponible (prix non sécurisé)
        stopLocalSession(activeIdx, now, nowISO, dateStr);
      }
    }
  };

  const createLocalSession = (tableId: 'A' | 'B', nowISO: string, dateStr: string, clientName?: string) => {
    const newSession: BilliardSession = {
      id: Math.random().toString(36).substr(2, 9),
      tableId,
      startTime: nowISO,
      stopTime: null,
      durationMinutes: 0,
      price: 0,
      items: [],
      clientName: clientName || 'Anonyme',
      isPaid: false,
      nextPlayer: '',
      date: dateStr,
      timestamp: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    saveSessionToAPI(newSession);
  };

  const stopLocalSession = (activeIdx: number, stopTime: Date, nowISO: string, dateStr: string) => {
    const s = sessions[activeIdx];
    const startTime = new Date(s.startTime);
    const diffMs = stopTime.getTime() - startTime.getTime();
    const mins = Math.round(diffMs / 60000);
    
    const finishedSession: BilliardSession = {
      ...s,
      startTime: s.startTime,
      stopTime: nowISO,
      durationMinutes: mins,
    };
    
    setSessions(prev => prev.map(session => 
      session.id === s.id ? finishedSession : session
    ));
    saveSessionToAPI(finishedSession);
  };

  const handleNameSession = (sessionId: string, name: string) => {
    const sessionToUpdate = sessions.find(s => s.id === sessionId);
    if (sessionToUpdate) {
      const updated = { ...sessionToUpdate, clientName: name };
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      saveSessionToAPI(updated);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await billiardService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const togglePayment = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      const updated = { ...session, isPaid: !session.isPaid };
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
      saveSessionToAPI(updated);
    }
  };

  const handleEditSession = (sessionId: string, updates: Partial<BilliardSession>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const updated = { ...session, ...updates };
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      saveSessionToAPI(updated);
    }
  };

  const savePS4SessionToAPI = async (session: PS4Session) => {
    try {
      if (session.id.length < 20) {
        await ps4Service.createSession(session);
        setPs4Sessions(prev => [session, ...prev.filter(s => s.id !== session.id)]);
      }
    } catch (error) {
      console.error('Error saving PS4 session:', error);
    }
  };

  const clearError = () => setError(null);

  const currentDayBilliardSessions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions
      .filter(s => s.date === today)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);

  const clientHistory = useMemo(() => {
    if (!viewingClientHistory) return [];
    return sessions.filter(
      s =>
        s.clientName.trim().toLowerCase() === viewingClientHistory.trim().toLowerCase() &&
        s.stopTime !== null
    );
  }, [sessions, viewingClientHistory]);

  const zTicket = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today && s.stopTime !== null);
    
    const totalRevenue = todaySessions.reduce((sum, s) => sum + (s.isPaid ? s.price : 0), 0);
    const pendingPayment = todaySessions.reduce((sum, s) => sum + (!s.isPaid ? s.price : 0), 0);
    const sessionCount = todaySessions.length;
    const avgSessionPrice = sessionCount > 0 ? Math.round(totalRevenue / sessionCount) : 0;
    
    return {
      totalRevenue,
      pendingPayment,
      sessionCount,
      avgSessionPrice,
    };
  }, [sessions]);

  return (
    <AppContext.Provider
      value={{
        sessions,
        setSessions,
        ps4Sessions,
        setPs4Sessions,
        user,
        setUser,
        settings,
        setSettings,
        currentTime,
        loading,
        error,
        setError,
        clearError,
        handleStartStop,
        handleNameSession,
        handleDeleteSession,
        togglePayment,
        handleEditSession,
        savePS4SessionToAPI,
        viewingClientHistory,
        setViewingClientHistory,
        clientHistory,
        zTicket,
        currentDayBilliardSessions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
