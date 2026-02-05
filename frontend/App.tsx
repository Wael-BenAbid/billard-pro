import React, { useState, useEffect, useMemo } from 'react';
import {
  BilliardSession,
  User,
  AppSettings,
  InventoryItem,
  PS4Game,
  PS4Session,
} from './types';
import { Navbar } from './src/components/Navbar';
import { Dashboard } from './src/components/pages/Dashboard';
import { PS4Management } from './src/components/pages/PS4Management';
import { BarManagement } from './src/components/pages/BarManagement';
import { Analytics } from './src/components/pages/Analytics';
import { Admin } from './src/components/pages/Admin';

const API_URL = 'http://localhost:8000/api';

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

const App: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'ps4' | 'bar' | 'analytics' | 'admin'
  >('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewingClientHistory, setViewingClientHistory] = useState<string | null>(null);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data conversion helpers
  const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => toSnakeCase(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = toSnakeCase(obj[key]);
      }
      return result;
    }
    return obj;
  };

  const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => toCamelCase(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        result[camelKey] = toCamelCase(obj[key]);
      }
      return result;
    }
    return obj;
  };

  // Load data from API on mount
  useEffect(() => {
    const loadAuth = () => {
      const savedAuth = localStorage.getItem('billard_auth');
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('billard_auth');
        }
      }
    };
    
    loadAuth();
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load sessions
        const sessionsRes = await fetch(`${API_URL}/sessions/`);
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData.map((s: any) => ({
            ...toCamelCase(s),
            timestamp: new Date(s.timestamp).getTime(),
          })));
        }

        // Load PS4 sessions
        const ps4Res = await fetch(`${API_URL}/ps4-sessions/`);
        if (ps4Res.ok) {
          const ps4Data = await ps4Res.json();
          setPs4Sessions(ps4Data.map((s: any) => ({
            ...toCamelCase(s),
            timestamp: new Date(s.timestamp).getTime(),
          })));
        }

        // Load settings
        const settingsRes = await fetch(`${API_URL}/settings/`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData) {
            // Merge with defaults to preserve inventory and ps4Games
            setSettings(prev => ({
              ...prev,
              ...toCamelCase(settingsData),
              inventory: prev.inventory,
              ps4Games: prev.ps4Games,
            }));
          }
        }

        // Load inventory
        const inventoryRes = await fetch(`${API_URL}/inventory/`);
        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          if (inventoryData && inventoryData.length > 0) {
            setSettings(prev => ({ ...prev, inventory: inventoryData.map((i: any) => toCamelCase(i)) }));
          }
        }

        // Load PS4 games
        const gamesRes = await fetch(`${API_URL}/ps4-games/`);
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          if (gamesData && gamesData.length > 0) {
            setSettings(prev => ({ ...prev, ps4Games: gamesData.map((g: any) => toCamelCase(g)) }));
          }
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
      // Prepare session data with proper datetime format
      const prepareSessionData = (s: BilliardSession) => {
        const data: any = {
          id: s.id,
          table_id: s.tableId,
          duration_minutes: Number(s.durationMinutes) || 0,
          price: Number(s.price) || 0,
          client_name: s.clientName || '',
          is_paid: s.isPaid,
          timestamp: s.timestamp,
        };
        
        // Convert start_time to ISO format
        if (s.startTime) {
          const startTime = s.startTime as string;
          if (startTime.includes('T')) {
            data.start_time = startTime;
          } else {
            const dateStr = s.date || new Date().toISOString().split('T')[0];
            data.start_time = `${dateStr}T${startTime}:00`;
          }
        }
        
        // Convert stop_time to ISO format
        if (s.stopTime) {
          const stopTime = s.stopTime as string;
          if (stopTime.includes('T')) {
            data.stop_time = stopTime;
          } else {
            const dateStr = s.date || new Date().toISOString().split('T')[0];
            data.stop_time = `${dateStr}T${stopTime}:00`;
          }
        } else {
          data.stop_time = null;
        }
        
        // Convert date to YYYY-MM-DD format
        if (s.date) {
          if (typeof s.date === 'string' && s.date.includes('T')) {
            data.date = s.date.split('T')[0];
          } else {
            data.date = s.date;
          }
        }
        
        return data;
      };
      
      const sessionData = prepareSessionData(session);
      
      if (session.id.length < 20) {
        // New session - create
        const res = await fetch(`${API_URL}/sessions/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (res.ok) {
          const created = await res.json();
          setSessions(prev => prev.map(s => s.id === session.id ? toCamelCase(created) : s));
        } else {
          const error = await res.json();
          console.error('Error creating session:', error);
        }
      } else {
        // Existing session - update
        const res = await fetch(`${API_URL}/sessions/${session.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (res.ok) {
          const updated = await res.json();
          setSessions(prev => prev.map(s => s.id === session.id ? toCamelCase(updated) : s));
        } else {
          const error = await res.json();
          console.error('Error updating session:', error);
          console.error('Session data sent:', JSON.stringify(sessionData, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const savePS4SessionToAPI = async (session: PS4Session) => {
    try {
      const sessionData = toSnakeCase(session);
      
      if (session.id.length < 20) {
        const res = await fetch(`${API_URL}/ps4-sessions/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (res.ok) {
          const created = await res.json();
          setPs4Sessions(prev => [toCamelCase(created), ...prev.filter(s => s.id !== session.id)]);
        } else {
          const error = await res.json();
          console.error('Error creating PS4 session:', error);
        }
      }
    } catch (error) {
      console.error('Error saving PS4 session:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'admin123') {
      const u: User = { username: 'admin', role: 'admin' };
      setUser(u);
      localStorage.setItem('billard_auth', JSON.stringify(u));
    } else {
      alert('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('billard_auth');
  };

  const handleStartStop = (tableId: 'A' | 'B') => {
    const now = new Date();
    const nowISO = now.toISOString();
    const dateStr = nowISO.split('T')[0];
    const activeIdx = sessions.findIndex(s => s.tableId === tableId && !s.stopTime);

    if (activeIdx === -1) {
      // Start new session
      const newSession: BilliardSession = {
        id: Math.random().toString(36).substr(2, 9),
        tableId,
        startTime: nowISO,
        stopTime: null,
        durationMinutes: 0,
        price: 0,
        items: [],
        clientName: '',
        isPaid: false,
        nextPlayer: '',
        date: dateStr,
        timestamp: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      saveSessionToAPI(newSession);
    } else {
      // Stop session - calculate duration
      const s = sessions[activeIdx];
      const startTime = new Date(s.startTime);
      const stopTime = now;
      const diffMs = stopTime.getTime() - startTime.getTime();
      const mins = Math.round(diffMs / 60000);
      
      const finishedSession: BilliardSession = {
        ...s,
        startTime: s.startTime,
        stopTime: stopTime.toISOString(),
        durationMinutes: mins,
      };
      finishedSession.price = calculateSessionPrice(finishedSession);
      
      setSessions(prev => prev.map(session => 
        session.id === s.id ? finishedSession : session
      ));
      saveSessionToAPI(finishedSession);
    }
  };

  const handleNameSession = (sessionId: string, name: string, existingSession?: BilliardSession) => {
    // Use the existing session if provided, otherwise find from current state
    const sessionToUpdate = existingSession || sessions.find(s => s.id === sessionId);
    if (sessionToUpdate) {
      const updated = { ...sessionToUpdate, clientName: name };
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      saveSessionToAPI(updated);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        console.error('Error deleting session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const calculateSessionPrice = (session: BilliardSession) => {
    let timePrice = 0;
    const mins = session.durationMinutes;
    if (mins <= settings.thresholdMins) {
      timePrice = mins * settings.rateBase;
    } else {
      timePrice =
        settings.thresholdMins * settings.rateBase +
        (mins - settings.thresholdMins) * settings.rateReduced;
    }
    let finalTimePrice = timePrice;
    if (timePrice < settings.floorMin) finalTimePrice = settings.floorMin;
    else if (timePrice > settings.floorMin && timePrice < settings.floorMid)
      finalTimePrice = settings.floorMid;
    const itemsPrice = (session.items || []).reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    return finalTimePrice + itemsPrice;
  };

  const togglePayment = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      const updated = { ...session, isPaid: !session.isPaid };
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
      saveSessionToAPI(updated);
    }
  };

  const removeItem = (id: string) => {
    setSettings({ ...settings, inventory: settings.inventory.filter(i => i.id !== id) });
  };

  // Computed values
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

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-zinc-900/50 rounded-[3rem] border border-white/5 p-12 shadow-2xl backdrop-blur-xl text-center">
          <h1
            style={{ color: settings.themeColor }}
            className="text-5xl font-black italic tracking-tighter mb-2"
          >
            {settings.clubName}
          </h1>
          <form onSubmit={handleLogin} className="space-y-6 mt-10">
            <input
              type="text"
              placeholder="Admin ID"
              value={loginUsername}
              onChange={e => setLoginUsername(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none"
            />
            <button
              type="submit"
              style={{ backgroundColor: settings.themeColor }}
              className="w-full text-black font-black py-5 rounded-2xl hover:brightness-110 uppercase text-sm tracking-widest"
            >
              Entrer
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: settings.themeColor }}></div>
          <p className="text-white font-bold">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans">
      <Navbar
        clubName={settings.clubName}
        themeColor={settings.themeColor}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        currentTime={currentTime}
      />

      <main className="p-8 max-w-[1600px] mx-auto space-y-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            sessions={sessions}
            currentTime={currentTime}
            settings={settings}
            onStartStop={handleStartStop}
            onTogglePayment={togglePayment}
            onNameSession={handleNameSession}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {activeTab === 'ps4' && (
          <PS4Management
            ps4Sessions={ps4Sessions}
            settings={settings}
            onAddPS4Session={(timeOpt, game, players) => {
              const newSess: PS4Session = {
                id: Math.random().toString(36).substr(2, 9),
                gameId: game.id,
                gameName: game.name,
                players,
                durationMinutes: timeOpt.minutes,
                price: timeOpt.price,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
              };
              setPs4Sessions([newSess, ...ps4Sessions]);
              savePS4SessionToAPI(newSess);
            }}
            onSaveGame={(game) => {
              const exists = settings.ps4Games.find(g => g.id === game.id);
              if (exists) {
                setSettings({
                  ...settings,
                  ps4Games: settings.ps4Games.map(g => (g.id === game.id ? game : g)),
                });
              } else {
                setSettings({ ...settings, ps4Games: [...settings.ps4Games, game] });
              }
            }}
            onDeleteGame={(id) => {
              if (window.confirm('Supprimer ce jeu ?')) {
                setSettings({
                  ...settings,
                  ps4Games: settings.ps4Games.filter(g => g.id !== id),
                });
              }
            }}
            onUpdateSettings={setSettings}
          />
        )}

        {activeTab === 'bar' && (
          <BarManagement
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            sessions={sessions}
            ps4Sessions={ps4Sessions}
            settings={settings}
            onViewClientHistory={setViewingClientHistory}
            clientHistory={clientHistory}
            viewingClientHistory={viewingClientHistory}
          />
        )}

        {activeTab === 'admin' && (
          <Admin
            settings={settings}
            onUpdateSettings={setSettings}
            onAddGame={(game) => {
              setSettings({ ...settings, ps4Games: [...settings.ps4Games, game] });
            }}
            onUpdateGame={(game) => {
              setSettings({
                ...settings,
                ps4Games: settings.ps4Games.map(g => (g.id === game.id ? game : g)),
              });
            }}
            onDeleteGame={(id) => {
              if (window.confirm('Supprimer ce jeu ?')) {
                setSettings({
                  ...settings,
                  ps4Games: settings.ps4Games.filter(g => g.id !== id),
                });
              }
            }}
            onRemoveItem={removeItem}
          />
        )}
      </main>

      <style>{`
        @keyframes pulse-glow {
          from {
            box-shadow: 0 0 20px var(--glow-color, currentColor);
          }
          to {
            box-shadow: 0 0 40px var(--glow-color, currentColor),
              0 0 60px var(--glow-color, currentColor);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
