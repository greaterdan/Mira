/**
 * Polymarket market data fetching
 * 
 * Fetches all markets from Polymarket API with in-memory caching.
 * Cache TTL: 60 seconds to balance freshness with API rate limits.
 */

import type { Market } from '../agents/domain';

/**
 * In-memory cache for Polymarket markets
 */
interface MarketCache {
  markets: Market[];
  cachedAt: number;
}

const MARKET_CACHE_TTL = 60 * 1000; // 60 seconds
let marketCache: MarketCache | null = null;

/**
 * Map Polymarket API response to our Market type
 * 
 * TODO: Adapt this to actual Polymarket API response structure
 * The interface is designed to make this mapping trivial once we have
 * the real API response format.
 * 
 * @param rawMarket - Raw market data from Polymarket API
 * @returns Market object
 */
function mapPolymarketMarket(rawMarket: any): Market {
  // TODO: Replace with actual Polymarket response mapping
  // This is a placeholder structure - adjust based on real API
  
  return {
    id: rawMarket.id || rawMarket.conditionId || String(rawMarket.slug),
    question: rawMarket.question || rawMarket.title || '',
    category: mapCategory(rawMarket.category || rawMarket.tags?.[0] || 'Other'),
    volumeUsd: parseFloat(rawMarket.volume || rawMarket.volume24h || '0'),
    liquidityUsd: parseFloat(rawMarket.liquidity || rawMarket.liquidityUsd || '0'),
    currentProbability: parseFloat(rawMarket.probability || rawMarket.currentPrice || '0.5'),
    priceChange24h: parseFloat(rawMarket.priceChange24h || rawMarket.change24h || '0'),
    raw: rawMarket, // Store raw for debugging
  };
}

/**
 * Map Polymarket category string to our Category type
 */
function mapCategory(category: string): Market['category'] {
  const normalized = category.trim();
  const categoryMap: Record<string, Market['category']> = {
    'crypto': 'Crypto',
    'cryptocurrency': 'Crypto',
    'technology': 'Tech',
    'tech': 'Tech',
    'finance': 'Finance',
    'financial': 'Finance',
    'politics': 'Politics',
    'political': 'Politics',
    'elections': 'Elections',
    'election': 'Elections',
    'sports': 'Sports',
    'entertainment': 'Entertainment',
    'world': 'World',
    'geopolitics': 'Geopolitics',
    'geopolitical': 'Geopolitics',
  };
  
  return categoryMap[normalized.toLowerCase()] || 'Other';
}

/**
 * Fetch all markets from Polymarket API
 * 
 * Uses in-memory cache with 60-second TTL.
 * If API fails, returns last cached copy if available.
 * 
 * @returns Array of Market objects
 * 
 * @throws Never throws - always returns array (empty on error)
 */
export async function fetchAllMarkets(): Promise<Market[]> {
  // Check cache first
  if (marketCache) {
    const age = Date.now() - marketCache.cachedAt;
    if (age < MARKET_CACHE_TTL) {
      return marketCache.markets;
    }
  }
  
  try {
    // Use the SAME API structure as bubble maps
    // Bubble maps use: /api/predictions -> server/services/polymarketService.js -> fetchAllMarkets()
    // Trading engine uses: This function -> server/services/polymarketService.js -> fetchAllMarkets()
    // Same API keys, same function, same structure - just different cache
    
    // Check if we're running server-side (Node.js environment)
    const isServerSide = typeof process !== 'undefined' && process.versions?.node;
    
    if (isServerSide) {
      // Server-side: Use the EXACT same function as bubble maps
      const { fetchAllMarkets } = await import('../../../server/services/polymarketService.js');
      
      // Fetch markets using the same function as bubble maps
      // Uses same API keys: POLYMARKET_API_KEY, POLYMARKET_SECRET, POLYMARKET_PASSPHRASE
      const rawMarkets = await fetchAllMarkets({
        category: null,
        active: true,
        maxPages: 5, // Get enough markets for trading (5 pages = ~5000 markets)
        limitPerPage: 1000,
      });
      
      // Map Polymarket response to trading engine Market format
      const markets = rawMarkets.map((rawMarket: any) => {
        const actualMarket = rawMarket.market || rawMarket;
        const conditionId = actualMarket.condition_id || actualMarket.conditionId || actualMarket.id;
        const question = actualMarket.question || actualMarket.title || '';
        const volume = parseFloat(actualMarket.volume || actualMarket.volume24h || '0');
        const liquidity = parseFloat(actualMarket.liquidity || actualMarket.liquidityUsd || '0');
        const probability = parseFloat(actualMarket.probability || actualMarket.currentPrice || '0.5');
        
        return {
          id: conditionId || String(actualMarket.slug || ''),
          question,
          category: mapCategory(actualMarket.category || actualMarket.tags?.[0] || 'Other'),
          volumeUsd: volume,
          liquidityUsd: liquidity,
          currentProbability: probability,
          priceChange24h: 0, // Will be calculated if needed
          raw: actualMarket,
        };
      }).filter((m: Market) => {
        return m.id && m.question && !isNaN(m.volumeUsd) && !isNaN(m.currentProbability);
      });
      
      // Update cache (separate cache from bubble maps to avoid conflicts)
      marketCache = {
        markets,
        cachedAt: Date.now(),
      };
      
      return markets;
    }
    
    // Client-side fallback (shouldn't happen for trading engine)
    // Use environment variables for URL and key
    const apiUrl = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com/markets';
    const apiKey = process.env.POLYMARKET_API_KEY;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const rawMarkets = Array.isArray(data) ? data : (data.markets || data.results || []);
    
    const markets = rawMarkets.map(mapPolymarketMarket).filter((m: Market) => {
      return m.id && m.question && !isNaN(m.volumeUsd) && !isNaN(m.currentProbability);
    });
    
    // Update cache
    marketCache = {
      markets,
      cachedAt: Date.now(),
    };
    
    return markets;
  } catch (error) {
    console.error('[Polymarket] Failed to fetch markets:', error);
    
    // Return cached data if available, even if expired
    if (marketCache) {
      console.warn('[Polymarket] Returning stale cache due to API error');
      return marketCache.markets;
    }
    
    // No cache available - return empty array
    return [];
  }
}

/**
 * Clear the market cache (useful for testing)
 */
export function clearMarketCache(): void {
  marketCache = null;
}






