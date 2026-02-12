/**
 * ============================================
 * UTILITAIRES DATETIME - PARSEUR ROBUSTE
 * ============================================
 * 
 * Gère tous les formats de date possibles :
 * - ISO 8601 : "2024-01-15T17:58:31.000Z"
 * - ISO court : "2024-01-15T17:58:31"
 * - Space-separated : "2024-01-15 17:58:31"
 * - Timestamp number : 1705341511000
 */

/**
 * Parse n'importe quelle date/string/timestamp vers timestamp number
 * @returns Timestamp en millisecondes ou null si invalide
 */
export function parseDateTime(
  value: string | number | null | undefined
): number | null {
  // Retourner null pour valeurs falsy
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Si c'est déjà un nombre (timestamp), le retourner
  if (typeof value === 'number') {
    return value > 0 ? value : null;
  }
  
  // Si c'est une chaîne
  if (typeof value === 'string') {
    // Format ISO avec 'T' (2024-01-15T17:58:31.000Z)
    if (value.includes('T')) {
      const parsed = new Date(value).getTime();
      return isNaN(parsed) ? null : parsed;
    }
    
    // Format space-separated (2024-01-15 17:58:31)
    if (value.includes(' ')) {
      const normalized = value.replace(' ', 'T');
      const parsed = new Date(normalized).getTime();
      return isNaN(parsed) ? null : parsed;
    }
    
    // Format time-only (17:58:31) - ne peut pas calculer elapsed
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return null;
    }
    
    // Dernière tentative : parser directement
    const parsed = new Date(value).getTime();
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Formate un timestamp vers durée HH:MM:SS
 */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Formate un timestamp vers temps HH:MM:SS
 */
export function formatTime(ms: number): string {
  if (!ms || ms < 0) {
    return '--:--:--';
  }
  
  const date = new Date(ms);
  return date.toLocaleTimeString('fr-FR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Formate un timestamp vers date lisible
 */
export function formatDate(ms: number): string {
  if (!ms || ms < 0) {
    return '--/--/----';
  }
  
  return new Date(ms).toLocaleDateString('fr-FR');
}

/**
 * Formate les millimes en chaîne lisible
 */
export function formatPrice(millimes: number): string {
  // Protection contre valeurs invalides
  if (millimes === null || millimes === undefined || isNaN(millimes)) {
    return '0 DT';
  }
  
  if (millimes < 1000) {
    // Arrondir et afficher en millimes
    return `${Math.round(millimes)} mil`;
  }
  
  // Convertir millimes en DT
  const dt = millimes / 1000;
  // Formatter sans notation scientifique
  const dtStr = Number(dt.toFixed(3)).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return `${dtStr} DT`;
}
