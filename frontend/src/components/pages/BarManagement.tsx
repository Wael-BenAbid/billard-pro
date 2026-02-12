import React, { useState, useEffect } from 'react';
import { InventoryItem, ConsumedItem, AppSettings } from '../../../types';
import { useAppContext } from '../../context/AppContext';

interface BarItem {
  id: string;
  clientName: string;
  items: ConsumedItem[];
  totalPrice: number;
  date: string;
  timestamp: number;
  isPaid: boolean;
}

const API_URL = 'http://localhost:8000/api';

export const BarManagement: React.FC = () => {
  const { settings, setSettings } = useAppContext();
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<{ name: string; items: ConsumedItem[] } | null>(null);
  const [showClientPrompt, setShowClientPrompt] = useState(false);
  const [pendingItem, setPendingItem] = useState<InventoryItem | null>(null);
  const [clientInput, setClientInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBarItems();
  }, []);

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

  const loadBarItems = async () => {
    try {
      const res = await fetch(`${API_URL}/bar-orders/`);
      if (res.ok) {
        const data = await res.json();
        setBarItems(data.map((i: any) => ({
          ...toCamelCase(i),
          timestamp: new Date(i.timestamp).getTime(),
        })));
      }
    } catch (error) {
      console.error('Error loading bar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBarItemToAPI = async (item: BarItem) => {
    try {
      const itemData = toSnakeCase(item);
      
      if (item.id.length < 20) {
        const res = await fetch(`${API_URL}/bar-orders/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (res.ok) {
          const created = await res.json();
          setBarItems(prev => [toCamelCase(created), ...prev.filter(i => i.id !== item.id)]);
        } else {
          const error = await res.json();
          console.error('Error creating bar item:', error);
        }
      } else {
        const res = await fetch(`${API_URL}/bar-orders/${item.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (res.ok) {
          const updated = await res.json();
          setBarItems(prev => prev.map(i => i.id === item.id ? toCamelCase(updated) : i));
        } else {
          const error = await res.json();
          console.error('Error updating bar item:', error);
        }
      }
    } catch (error) {
      console.error('Error saving bar item:', error);
    }
  };

  const formatPrice = (mil: number) => {
    if (mil < 10000) return `${Math.round(mil)} mil`;
    const dt = mil / 1000;
    return `${dt.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} DT`;
  };

  // Default inventory items
  const defaultInventory = [
    { id: '1', name: 'Café', price: 1000, icon: '☕' },
    { id: '2', name: 'Thé', price: 800, icon: '🍵' },
    { id: '3', name: 'Soda', price: 2000, icon: '🥤' },
    { id: '4', name: 'Eau', price: 1000, icon: '💧' },
    { id: '5', name: 'Chicha', price: 5000, icon: '💨' },
  ];

  const getInventory = () => settings.inventory?.length > 0 ? settings.inventory : defaultInventory;

  const handleItemClick = (item: InventoryItem) => {
    setPendingItem(item);
    setClientInput('');
    setShowClientPrompt(true);
  };

  const handleConfirmClient = () => {
    if (!pendingItem) return;
    const name = clientInput.trim() || 'Unknown';
    
    setCurrentOrder(prev => {
      if (prev && prev.name === name) {
        const existing = prev.items.find(i => i.itemId === pendingItem.id);
        let newItems;
        if (existing) {
          newItems = prev.items.map(i =>
            i.itemId === pendingItem.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          newItems = [
            ...prev.items,
            {
              id: Math.random().toString(36).substr(2, 5),
              itemId: pendingItem.id,
              name: pendingItem.name,
              price: pendingItem.price,
              quantity: 1,
            },
          ];
        }
        return { ...prev, items: newItems };
      } else {
        return {
          name,
          items: [
            {
              id: Math.random().toString(36).substr(2, 5),
              itemId: pendingItem.id,
              name: pendingItem.name,
              price: pendingItem.price,
              quantity: 1,
            },
          ],
        };
      }
    });
    
    setShowClientPrompt(false);
    setPendingItem(null);
    setClientInput('');
  };

  const handleCancelClient = () => {
    setShowClientPrompt(false);
    setPendingItem(null);
    setClientInput('');
  };

  const handleSaveOrder = () => {
    if (!currentOrder || currentOrder.items.length === 0) return;

    const totalPrice = currentOrder.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const newBarItem: BarItem = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: currentOrder.name,
      items: currentOrder.items,
      totalPrice,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      isPaid: false,
    };

    setBarItems(prev => [newBarItem, ...prev]);
    saveBarItemToAPI(newBarItem);
    setCurrentOrder(null);
  };

  const handleCancelOrder = () => {
    setCurrentOrder(null);
  };

  const handleTogglePayment = (item: BarItem) => {
    const updated = { ...item, isPaid: !item.isPaid };
    setBarItems(prev => prev.map(i => i.id === item.id ? updated : i));
    saveBarItemToAPI(updated);
  };

  const activeOrders = barItems.filter(i => !i.isPaid);
  const paidOrders = barItems.filter(i => i.isPaid);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: settings.themeColor }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Inventory Grid */}
      <section className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-10 shadow-2xl">
        <h2 className="text-4xl font-black italic text-white mb-8">Gestion des Consommations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {getInventory().map(item => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-all text-center group"
            >
              <span className="text-4xl block mb-3">{item.icon}</span>
              <p className="text-white font-bold mb-1">{item.name}</p>
              <p className="text-[10px] font-black text-zinc-500">{formatPrice(item.price)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Current Order Preview */}
      {currentOrder && currentOrder.items.length > 0 && (
        <section className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-black italic text-white">
              Commande: {currentOrder.name}
            </h2>
            <button
              onClick={handleCancelOrder}
              className="px-4 py-2 bg-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500/30"
            >
              Annuler
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {currentOrder.items.map(item => (
              <div key={item.id} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{item.name}</span>
                  <span className="text-[10px] text-zinc-500 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-black text-white">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveOrder}
              style={{ backgroundColor: settings.themeColor }}
              className="px-8 py-4 rounded-2xl font-black text-sm uppercase text-black hover:brightness-110"
            >
              Enregistrer la Commande
            </button>
          </div>
        </section>
      )}

      {/* Active Orders */}
      <section className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-10 shadow-2xl">
        <h2 className="text-4xl font-black italic text-white mb-8">Commandes en Cours</h2>
        {activeOrders.length === 0 ? (
          <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Aucune commande active</p>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-black/40 p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black italic text-white">{order.clientName}</h3>
                  <button
                    onClick={() => handleTogglePayment(order)}
                    className="px-4 py-2 bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-500 hover:bg-emerald-500/30"
                  >
                    Marquer Payé
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {order.items.map(item => (
                    <div key={item.id} className="bg-zinc-900/50 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-white text-sm">{item.name} x{item.quantity}</span>
                      <span className="font-black text-white text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                  <span className="text-2xl font-black text-white">
                    Total: {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paid Orders */}
      <section className="bg-zinc-900/30 rounded-[3rem] border border-white/5 p-10 shadow-2xl">
        <h2 className="text-4xl font-black italic text-white mb-8">Commandes Payées</h2>
        {paidOrders.length === 0 ? (
          <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Aucune commande payée</p>
        ) : (
          <div className="space-y-4">
            {paidOrders.map(order => (
              <div key={order.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 opacity-60">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black italic text-white">{order.clientName}</h3>
                  <button
                    onClick={() => handleTogglePayment(order)}
                    className="px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-white"
                  >
                    Marquer Non Payé
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {order.items.map(item => (
                    <div key={item.id} className="bg-zinc-900/50 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-white text-sm">{item.name} x{item.quantity}</span>
                      <span className="font-black text-white text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                  <span className="text-2xl font-black text-emerald-500">
                    Total: {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Client Name Prompt Modal */}
      {showClientPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-6xl block mb-4">{pendingItem?.icon}</span>
              <h2 className="text-3xl font-black italic text-white">
                {pendingItem?.name}
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">
                {pendingItem && formatPrice(pendingItem.price)}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Nom du Client
              </label>
              <input
                type="text"
                value={clientInput}
                onChange={e => setClientInput(e.target.value)}
                placeholder="Entrez le nom du client"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg mt-2"
                autoFocus
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancelClient}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-sm uppercase text-zinc-400 hover:bg-zinc-700"
              >
                Annuler
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

export default BarManagement;
