import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './src/context/AppContext';
import { Navbar } from './src/components/pages/Navbar';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { Dashboard } from './src/components/pages/Dashboard';
import { PS4Management } from './src/components/pages/PS4Management';
import { BarManagement } from './src/components/pages/BarManagement';
import { Analytics } from './src/components/pages/Analytics';
import { Admin } from './src/components/pages/Admin';
import { Settings } from './src/components/pages/Settings';
import { Login } from './src/components/pages/Login';
import { useAppContext } from './src/context/AppContext';

const AppContent: React.FC = () => {
  const { user, loading, settings, currentTime, setUser, error } = useAppContext();

  // Login Screen
  if (!user) {
    return <Login />;
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
      {/* Error Alert */}
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-xl animate-in slide-in-from-right">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">{error}</p>
          </div>
        </div>
      )}

      <Navbar
        clubName={settings.clubName}
        themeColor={settings.themeColor}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem('billard_auth');
        }}
        currentTime={currentTime}
      />

      <main className="p-8 max-w-[1600px] mx-auto space-y-12">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ps4" element={<PS4Management />} />
          <Route path="/bar" element={<BarManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

const App: React.FC = () => {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App;
