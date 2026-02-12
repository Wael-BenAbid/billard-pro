const API_URL = 'http://localhost:8000/api';

// Helper functions for API calls
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

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  saveAuth: (user: { username: string; role: string }) => {
    localStorage.setItem('billard_auth', JSON.stringify(user));
  },
  
  getAuth: (): { username: string; role: string } | null => {
    const savedAuth = localStorage.getItem('billard_auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth);
      } catch {
        return null;
      }
    }
    return null;
  },
  
  clearAuth: () => {
    localStorage.removeItem('billard_auth');
  },
};

// ============================================
// BILLIARD SERVICE
// ============================================

export const billiardService = {
  async getSessions(): Promise<any[]> {
    const res = await fetch(`${API_URL}/sessions/`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async createSession(sessionData: any): Promise<any> {
    const res = await fetch(`${API_URL}/sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeCase(sessionData)),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async updateSession(id: string, sessionData: any): Promise<any> {
    const res = await fetch(`${API_URL}/sessions/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeCase(sessionData)),
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },

  async deleteSession(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/sessions/${id}/`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete session');
  },

  async startSession(tableId: string, clientName: string): Promise<any> {
    // Backend vérifie verrous (anti double START)
    // Retourne 400 si table déjà active
    const res = await fetch(`${API_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: tableId, client_name: clientName }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async stopSession(tableId: string): Promise<any> {
    // Backend calcule automatiquement duration_minutes et price
    // Frontend envoie SEULEMENT table_id
    const res = await fetch(`${API_URL}/sessions/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: tableId }),
    });
    if (!res.ok) throw new Error('Failed to stop session');
    return res.json();
  },

  transformSessions(sessionsData: any[]): any[] {
    return sessionsData.map(s => ({
      ...toCamelCase(s),
      startTime: s.start_time ? (s.start_time.includes('T') ? s.start_time : null) : null,
      stopTime: s.stop_time ? (s.stop_time.includes('T') ? s.stop_time : null) : null,
      timestamp: new Date(s.timestamp).getTime(),
    }));
  },

  prepareSessionData(session: any): any {
    const data: any = {
      id: session.id,
      table_id: session.tableId,
      duration_minutes: Number(session.durationMinutes) || 0,
      price: Number(session.price) || 0,
      client_name: session.clientName || '',
      is_paid: session.isPaid,
      timestamp: session.timestamp,
    };
    
    if (session.startTime) {
      const startTime = session.startTime;
      if (startTime.includes('T')) {
        data.start_time = startTime;
      } else {
        const dateStr = session.date || new Date().toISOString().split('T')[0];
        data.start_time = `${dateStr}T${startTime}:00`;
      }
    }
    
    if (session.stopTime) {
      const stopTime = session.stopTime;
      if (stopTime.includes('T')) {
        data.stop_time = stopTime;
      } else {
        const dateStr = session.date || new Date().toISOString().split('T')[0];
        data.stop_time = `${dateStr}T${stopTime}:00`;
      }
    } else {
      data.stop_time = null;
    }
    
    if (session.date) {
      if (typeof session.date === 'string' && session.date.includes('T')) {
        data.date = session.date.split('T')[0];
      } else {
        data.date = session.date;
      }
    }
    
    return data;
  },
};

// ============================================
// PS4 SERVICE
// ============================================

export const ps4Service = {
  async getSessions(): Promise<any[]> {
    const res = await fetch(`${API_URL}/ps4-sessions/`);
    if (!res.ok) throw new Error('Failed to fetch PS4 sessions');
    return res.json();
  },

  async createSession(sessionData: any): Promise<any> {
    const res = await fetch(`${API_URL}/ps4-sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeCase(sessionData)),
    });
    if (!res.ok) throw new Error('Failed to create PS4 session');
    return res.json();
  },

  transformSessions(sessionsData: any[]): any[] {
    return sessionsData.map(s => ({
      ...toCamelCase(s),
      timestamp: new Date(s.timestamp).getTime(),
    }));
  },
};

// ============================================
// SETTINGS SERVICE
// ============================================

export const settingsService = {
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_URL}/settings/`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settingsData: any): Promise<any> {
    const res = await fetch(`${API_URL}/settings/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeCase(settingsData)),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getInventory(): Promise<any[]> {
    const res = await fetch(`${API_URL}/inventory/`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async getGames(): Promise<any[]> {
    const res = await fetch(`${API_URL}/ps4-games/`);
    if (!res.ok) throw new Error('Failed to fetch PS4 games');
    return res.json();
  },
};
