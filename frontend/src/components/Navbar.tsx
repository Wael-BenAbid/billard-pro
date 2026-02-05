import React from 'react';

interface NavbarProps {
  clubName: string;
  themeColor: string;
  activeTab: string;
  onTabChange: (tab: 'dashboard' | 'ps4' | 'bar' | 'analytics' | 'admin') => void;
  onLogout: () => void;
  currentTime: Date;
}

export const Navbar: React.FC<NavbarProps> = ({
  clubName,
  themeColor,
  activeTab,
  onTabChange,
  onLogout,
  currentTime,
}) => {
  const tabs: { id: string; label: string }[] = [
    { id: 'dashboard', label: 'Tables' },
    { id: 'ps4', label: 'PS4' },
    { id: 'bar', label: 'Bar' },
    { id: 'analytics', label: 'Stats' },
    { id: 'admin', label: 'Paramètres' },
  ];

  return (
    <nav className="sticky top-0 z-[60] bg-black/80 backdrop-blur-2xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h2
          style={{ color: themeColor }}
          className="font-black text-2xl italic tracking-tighter"
        >
          {clubName}
        </h2>
        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id as any)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === t.id
                  ? 'bg-zinc-800 text-white shadow-xl'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
        {currentTime.toLocaleTimeString('fr-FR')}
        <button
          onClick={onLogout}
          className="p-2.5 bg-zinc-900 rounded-xl hover:bg-red-500/20 text-zinc-500 hover:text-red-500 border border-white/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
