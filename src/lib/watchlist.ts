import { PredictionNodeData } from "@/components/PredictionNode";

const WATCHLIST_STORAGE_KEY = 'probly_watchlist';

/**
 * Get watchlist from localStorage
 */
export function getWatchlist(): PredictionNodeData[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

/**
 * Save watchlist to localStorage
 */
export function saveWatchlist(watchlist: PredictionNodeData[]): void {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist:', error);
  }
}

/**
 * Add market to watchlist
 */
export function addToWatchlist(market: PredictionNodeData): void {
  const watchlist = getWatchlist();
  // Check if already in watchlist
  if (watchlist.some(m => m.id === market.id)) {
    return; // Already in watchlist
  }
  watchlist.push(market);
  saveWatchlist(watchlist);
}

/**
 * Remove market from watchlist
 */
export function removeFromWatchlist(marketId: string): void {
  const watchlist = getWatchlist();
  const filtered = watchlist.filter(m => m.id !== marketId);
  saveWatchlist(filtered);
}

/**
 * Check if market is in watchlist
 */
export function isInWatchlist(marketId: string): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(m => m.id === marketId);
}

/**
 * Clear entire watchlist
 */
export function clearWatchlist(): void {
  localStorage.removeItem(WATCHLIST_STORAGE_KEY);
}

