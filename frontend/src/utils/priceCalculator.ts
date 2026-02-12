import { AppSettings } from '../../types';

/**
 * Price Calculator Utility
 * 
 * IMPORTANT: This utility is used for DISPLAY/ESTIMATION purposes only.
 * The FINAL price calculation is always done on the backend.
 * 
 * This function estimates the current price for an active session
 * to show the user while they are playing.
 */

/**
 * Calculate estimated price based on duration and settings
 * @param durationMinutes - Duration in minutes
 * @param settings - App settings containing rate configuration
 * @returns Estimated price in millimes
 */
export const calculateSessionPrice = (
  durationMinutes: number, 
  settings: AppSettings
): number => {
  // Default values if settings not loaded
  const rateBase = Number(settings.rateBase) || 150;
  const rateReduced = Number(settings.rateReduced) || 135;
  const thresholdMins = settings.thresholdMins || 15;
  const floorMin = Number(settings.floorMin) || 1000;
  const floorMid = Number(settings.floorMid) || 1500;

  // Calculate price based on duration
  let timePrice: number;
  
  if (durationMinutes <= thresholdMins) {
    // Normal rate for first threshold minutes
    timePrice = durationMinutes * rateBase;
  } else {
    // Reduced rate after threshold
    timePrice = (thresholdMins * rateBase) + ((durationMinutes - thresholdMins) * rateReduced);
  }

  // Apply floor rules (minimum charges)
  let finalPrice: number;
  
  if (timePrice < floorMin) {
    finalPrice = floorMin;
  } else if (floorMin <= timePrice && timePrice < floorMid) {
    finalPrice = floorMid;
  } else {
    finalPrice = timePrice;
  }

  return finalPrice;
};

/**
 * Alias for calculateSessionPrice - for backward compatibility
 * @deprecated Use calculateSessionPrice instead
 */
export const calculateLivePrice = (
  durationMinutes: number, 
  settings: AppSettings
): number => {
  return calculateSessionPrice(durationMinutes, settings);
};

/**
 * Format price from millimes to DT display format
 * @param priceInMillimes - Price in millimes
 * @returns Formatted string like "1.500 DT"
 */
export const formatPrice = (priceInMillimes: number): string => {
  return (priceInMillimes / 1000).toFixed(3) + ' DT';
};

/**
 * Get current rate information for display
 * @param settings - App settings
 * @returns Rate information object
 */
export const getRateInfo = (settings: AppSettings) => {
  return {
    baseRate: Number(settings.rateBase) || 150,
    reducedRate: Number(settings.rateReduced) || 135,
    thresholdMinutes: settings.thresholdMins || 15,
    minimumCharge: Number(settings.floorMin) || 1000,
    midCharge: Number(settings.floorMid) || 1500,
  };
};
