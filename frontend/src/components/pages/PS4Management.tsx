import React, { useState } from 'react';
import { PS4Game, PS4Session, PS4TimeOption, AppSettings } from '../../../types';

interface PS4ManagementProps {
  ps4Sessions: PS4Session[];
  settings: AppSettings;
  onAddPS4Session: (timeOpt: PS4TimeOption, game: PS4Game, players: number) => void;
  onSaveGame: (game: PS4Game) => void;
  onDeleteGame: (id: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const PS4Management: React.FC<PS4ManagementProps> = ({
  ps4Sessions,
  settings,
  onAddPS4Session,
  onSaveGame,
  onDeleteGame,
  onUpdateSettings,
}) => {
  const [ps4Step, setPs4Step] = useState<'game' | 'players' | 'time'>('game');
  const [selectedPs4Game, setSelectedPs4Game] = useState<PS4Game | null>(null);
  const [selectedPs4Players, setSelectedPs4Players] = useState<number | null>(null);
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [editingGame, setEditingGame] = useState<PS4Game | null>(null);

  const formatPrice = (mil: number) => {
    if (mil < 10000) return `${Math.round(mil)} mil`;
    const dt = mil / 1000;
    return `${dt.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} DT`;
  };

  const todaySessions = ps4Sessions.filter(s => s.date === new Date().toISOString().split('T')[0]);

  const openEditGame = (game: PS4Game | null) => {
    if (game) {
      setEditingGame({ ...game, timeOptions: [...game.timeOptions] });
    } else {
      setEditingGame({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        icon: '🎮',
        playerOptions: [1, 2, 3, 4],
        timeOptions: [],
      });
    }
    setIsEditingGame(true);
  };

  const saveEditedGame = () => {
    if (!editingGame || !editingGame.name) return;
    onSaveGame(editingGame);
    setIsEditingGame(false);
    setEditingGame(null);
  };

  const deleteTimeOption = (gameId: string, timeOptId: string) => {
    if (window.confirm('Supprimer cette option de temps ?')) {
      onUpdateSettings({
        ...settings,
        ps4Games: settings.ps4Games.map(g => {
          if (g.id === gameId) {
            return {
              ...g,
              timeOptions: g.timeOptions.filter(o => o.id !== timeOptId),
            };
          }
          return g;
        }),
      });
    }
  };

  const updateTimeOption = (gameId: string, timeOptId: string, field: 'label' | 'minutes' | 'price', value: string | number) => {
    onUpdateSettings({
      ...settings,
      ps4Games: settings.ps4Games.map(g => {
        if (g.id === gameId) {
          return {
            ...g,
            timeOptions: g.timeOptions.map(o => {
              if (o.id === timeOptId) {
                return { ...o, [field]: value };
              }
              return o;
            }),
          };
        }
        return g;
      }),
    });
  };

  const addTimeOption = (gameId: string) => {
    const players = parseInt(prompt('Nombre de joueurs (1-4):') || '1');
    const label = prompt('Label (ex: 10 min):') || '10 min';
    const minutes = parseInt(prompt('Durée en minutes:') || '10');
    const price = parseInt(prompt('Prix:') || '1500');

    if (players && minutes && price) {
      onUpdateSettings({
        ...settings,
        ps4Games: settings.ps4Games.map(g => {
          if (g.id === gameId) {
            const newPlayerOptions = g.playerOptions.includes(players)
              ? g.playerOptions
              : [...g.playerOptions, players].sort();

            return {
              ...g,
              playerOptions: newPlayerOptions,
              timeOptions: [
                ...g.timeOptions,
                {
                  id: `${gameId}_${Date.now()}`,
                  label,
                  minutes,
                  price,
                  players,
                },
              ],
            };
          }
          return g;
        }),
      });
    }
  };

  return (
    <section className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-10 shadow-2xl animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-black italic text-white">PS4 - Sélectionnez un Jeu</h2>
        <button
          onClick={() => openEditGame(null)}
          className="px-6 py-3 bg-zinc-800 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-700"
        >
          + Nouveau Jeu
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {settings.ps4Games.map(game => (
          <div
            key={game.id}
            className="bg-black/40 p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="text-6xl mb-6">{game.icon}</div>
            <h3 className="text-2xl font-black italic text-white mb-4">{game.name}</h3>
            <div className="flex gap-2 mb-6">
              {game.playerOptions.map(p => (
                <span key={p} className="px-3 py-1 bg-zinc-800 rounded-lg text-[9px] font-black text-zinc-400">
                  {p}P
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPs4Game(game);
                  setPs4Step('players');
                }}
                className="flex-1 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-black hover:brightness-110 transition-all"
                style={{ backgroundColor: settings.themeColor }}
              >
                Jouer
              </button>
              <button
                onClick={() => openEditGame(game)}
                className="px-4 py-4 bg-zinc-800 rounded-[1.5rem] text-zinc-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDeleteGame(game.id)}
                className="px-4 py-4 bg-red-500/10 rounded-[1.5rem] text-red-500 hover:bg-red-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Players Selection Modal */}
      {ps4Step === 'players' && selectedPs4Game && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic text-white">
                {selectedPs4Game.icon} {selectedPs4Game.name}
              </h2>
              <button onClick={() => setPs4Step('game')} className="text-zinc-500 hover:text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6">
              Nombre de Joueurs
            </p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              {selectedPs4Game.playerOptions.map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPs4Players(p);
                    setPs4Step('time');
                  }}
                  className="py-8 bg-zinc-800/50 rounded-[2rem] border border-white/5 hover:bg-white hover:text-black transition-all active:scale-95 group"
                >
                  <span className="text-4xl font-black italic block mb-2">{p}</span>
                  <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-black">Joueurs</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Selection Modal */}
      {ps4Step === 'time' && selectedPs4Game && selectedPs4Players !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic text-white">
                {selectedPs4Game.icon} {selectedPs4Game.name} - {selectedPs4Players}P
              </h2>
              <button onClick={() => setPs4Step('players')} className="text-zinc-500 hover:text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setPs4Step('players')}
                className="px-6 py-2 bg-zinc-800 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
              >
                Retour
              </button>
            </div>
            <h2 className="text-4xl font-black italic text-white text-center mt-6 mb-8">Durée de la Partie</h2>
            <div className="grid grid-cols-2 gap-6">
              {selectedPs4Game.timeOptions
                .filter(opt => opt.players === selectedPs4Players)
                .map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onAddPS4Session(opt, selectedPs4Game, selectedPs4Players)}
                    style={{ backgroundColor: settings.themeColor }}
                    className="p-8 rounded-[2.5rem] border border-white/5 hover:bg-white hover:text-black transition-all group active:scale-95"
                  >
                    <p className="text-3xl font-black mb-2">{opt.label}</p>
                    <p className="text-lg font-bold opacity-60">{formatPrice(opt.price)}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Game Modal */}
      {isEditingGame && editingGame && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black italic text-white">Configuration: {editingGame.name}</h2>
              <button onClick={() => setIsEditingGame(false)} className="text-zinc-500 hover:text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nom du Jeu</label>
                <input
                  type="text"
                  value={editingGame.name}
                  onChange={e => setEditingGame({ ...editingGame, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold mt-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Icône</label>
                <input
                  type="text"
                  value={editingGame.icon}
                  onChange={e => setEditingGame({ ...editingGame, icon: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold mt-2"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">
                Options Joueurs
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      const opts = editingGame.playerOptions.includes(p)
                        ? editingGame.playerOptions.filter(o => o !== p)
                        : [...editingGame.playerOptions, p].sort();
                      setEditingGame({ ...editingGame, playerOptions: opts });
                    }}
                    className={`flex-1 py-3 rounded-xl font-black text-sm ${
                      editingGame.playerOptions.includes(p) ? 'bg-zinc-700 text-white' : 'bg-black/30 text-zinc-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black italic text-white">Options de Temps et Prix</h3>
                <button
                  onClick={() => addTimeOption(editingGame.id)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-zinc-600"
                >
                  + Ajouter Option
                </button>
              </div>

              {editingGame.timeOptions.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {editingGame.timeOptions
                    .sort((a, b) => a.players - b.players || a.minutes - b.minutes)
                    .map(opt => (
                      <div key={opt.id} className="flex items-center gap-4 bg-black/30 p-4 rounded-xl">
                        <span className="text-white font-bold w-16">{opt.players}P</span>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={e => updateTimeOption(editingGame.id, opt.id, 'label', e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm"
                        />
                        <input
                          type="number"
                          value={opt.minutes}
                          onChange={e =>
                            updateTimeOption(editingGame.id, opt.id, 'minutes', parseInt(e.target.value) || 0)
                          }
                          className="w-20 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm text-center"
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={opt.price}
                          onChange={e =>
                            updateTimeOption(editingGame.id, opt.id, 'price', parseInt(e.target.value) || 0)
                          }
                          className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm text-center"
                          placeholder="Prix"
                        />
                        <button
                          onClick={() => deleteTimeOption(editingGame.id, opt.id)}
                          className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg text-xs font-black uppercase hover:bg-red-500/30"
                        >
                          X
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">
                  Aucune option de temps configurée
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={saveEditedGame}
                style={{ backgroundColor: settings.themeColor }}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setIsEditingGame(false);
                  setEditingGame(null);
                }}
                className="px-8 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      <div className="pt-10 border-t border-white/5">
        <h3 className="text-2xl font-black italic text-white mb-6">Sessions PS4 Aujourd'hui</h3>
        {todaySessions.length === 0 ? (
          <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Aucune session aujourd'hui</p>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {todaySessions.map(s => (
              <div
                key={s.id}
                className="bg-black/40 p-6 rounded-3xl border border-white/5 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-black text-white">
                    {s.gameName} <span className="text-zinc-500">({s.players}P)</span>
                  </p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase">{s.durationMinutes} mins</p>
                </div>
                <p className="text-lg font-black" style={{ color: settings.themeColor }}>
                  {formatPrice(s.price)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/5">
        <p className="text-[10px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Recette PS4 Aujourd'hui</p>
        <p className="text-3xl font-black text-white">
          {formatPrice(todaySessions.reduce((acc, s) => acc + s.price, 0))}
        </p>
      </div>
    </section>
  );
};
