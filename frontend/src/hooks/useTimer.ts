import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ============================================
 * HOOK TIMER - TEMPS RÉEL 100% FRONTEND
 * ============================================
 * 
 * Caractéristiques :
 * - Timer tourne en continu (setInterval jamais détruit)
 * - Pas de race condition
 * - Pas de fermeture de state
 * - Re-render chaque seconde
 */

interface TimerResult {
  now: number;           // Timestamp actuel
  elapsed: number;       // Temps écoulé depuis startTime
  formatted: string;     // Format HH:MM:SS
  isRunning: boolean;    // Si le timer est actif
}

/**
 * Hook principal pour le timer
 */
export function useTimer(
  startTime: number | null,
  enabled: boolean = true
): TimerResult {
  // State pour forcer le re-render
  const [, setTick] = useState(0);
  
  // Ref pour stocker le startTime sans dépendances
  const startTimeRef = useRef<number | null>(startTime);
  
  // Mettre à jour la ref quand startTime change
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  
  // Timer qui tourne en continu
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    
    // Cleanup uniquement au unmount du composant
    return () => clearInterval(interval);
  }, [enabled]);
  
  // Calculer elapsed
  const now = Date.now();
  const elapsed = startTimeRef.current 
    ? Math.max(0, now - startTimeRef.current) 
    : 0;
  
  const formatted = formatDuration(elapsed);
  
  return {
    now,
    elapsed,
    formatted,
    isRunning: enabled && startTime !== null
  };
}

/**
 * Hook pour afficher l'heure actuelle (secondes)
 */
export function useCurrentTime(): Date {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return time;
}

/**
 * Format duration helper
 */
function formatDuration(ms: number): string {
  if (ms < 0) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
