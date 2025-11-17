// Polymarket API Service - Server Side
// Handles all API communication with Polymarket

import crypto from 'crypto';
import fetch from 'node-fetch';

const POLYMARKET_CONFIG = {
  apiKey: '019a8eb8-78da-7dc7-bc81-afd6c293cbf0',
  secret: 'kVZU2m32xOU0P2QFhP6nBWxLCe0KbFj7J1griqUjH3U=',
  passphrase: '31e9ccd9d23c4b7df528e7e450816c8d1be2e776238c2087f477a8b87e8708f1',
};

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';
const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';
const POLYMARKET_BASE = 'https://clob.polymarket.com';

// Create HMAC signature for authenticated requests
function createSignature(timestamp, method, path, body) {
  const message = timestamp + method + path + (body || '');
  const hmac = crypto.createHmac('sha256', Buffer.from(POLYMARKET_CONFIG.secret, 'base64'));
  return hmac.update(message).digest('base64');
}

// Fetch markets from Polymarket Gamma API
export async function fetchMarketsFromPolymarket({
  limit = 1000,
  offset = 0,
  category = null,
  active = true,
  order = 'volume',
  ascending = false,
}) {
  const gammaParams = new URLSearchParams({
    active: active.toString(),
    closed: 'false',
    archived: 'false',
    limit: Math.min(limit, 1000).toString(),
    offset: offset.toString(),
    order: order,
    ascending: ascending.toString(),
  });

  // Add category/topic filter if provided
  if (category) {
    gammaParams.set('topic', category);
    gammaParams.set('category', category);
  }

  // Try /events endpoint first
  let gammaPath = `/events?${gammaParams.toString()}`;
  let gammaUrl = `${POLYMARKET_GAMMA_API}${gammaPath}`;
  
  const timestamp = Date.now().toString();
  let signature = createSignature(timestamp, 'GET', gammaPath, '');
  let authHeaders = {
    'POLY_API_KEY': POLYMARKET_CONFIG.apiKey,
    'POLY_SIGNATURE': signature,
    'POLY_TIMESTAMP': timestamp,
    'POLY_PASSPHRASE': POLYMARKET_CONFIG.passphrase,
  };

  console.log(`🔍 Fetching from Gamma API: ${gammaUrl}`);

  let response = await fetch(gammaUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });

  // If /events fails, try /public-search
  if (!response.ok) {
    console.log(`⚠️ /events failed (${response.status}), trying /public-search...`);
    gammaPath = `/public-search?${gammaParams.toString()}`;
    gammaUrl = `${POLYMARKET_GAMMA_API}${gammaPath}`;
    signature = createSignature(timestamp, 'GET', gammaPath, '');
    authHeaders = {
      'POLY_API_KEY': POLYMARKET_CONFIG.apiKey,
      'POLY_SIGNATURE': signature,
      'POLY_TIMESTAMP': timestamp,
      'POLY_PASSPHRASE': POLYMARKET_CONFIG.passphrase,
    };

    response = await fetch(gammaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polymarket API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  
  // Extract markets from response (handle different structures)
  let markets = [];
  
  if (data.results && Array.isArray(data.results)) {
    // Results are events with markets inside, or markets directly
    for (const item of data.results) {
      if (item.markets && Array.isArray(item.markets) && item.markets.length > 0) {
        // Event with markets array - extract ALL markets from the array
        // Each market in the array is a separate prediction market
        for (const market of item.markets) {
          // Add the market with its parent event data for context
          markets.push({
            ...market,
            eventId: item.id,
            eventTitle: item.title || item.question,
          });
        }
      } else if (item.market) {
        // Event with single market
        markets.push(item.market);
      } else if (item.question || item.condition_id || item.title) {
        // Direct market object (could be event or market)
        // If it has markets array, extract those
        if (item.markets && Array.isArray(item.markets) && item.markets.length > 0) {
          for (const market of item.markets) {
            markets.push({
              ...market,
              eventId: item.id,
              eventTitle: item.title || item.question,
            });
          }
        } else {
          // It's a direct market
          markets.push(item);
        }
      }
    }
  } else if (Array.isArray(data)) {
    markets = data;
  } else if (data.data && Array.isArray(data.data)) {
    markets = data.data;
  } else if (data.markets && Array.isArray(data.markets)) {
    markets = data.markets;
  }

  console.log(`✅ Fetched ${markets.length} markets from Polymarket API`);
  
  // Log first market structure for debugging (only once per fetch)
  if (markets.length > 0) {
    const firstMarket = markets[0];
    console.log('🔍 Sample market structure:', {
      keys: Object.keys(firstMarket),
      hasTokens: !!firstMarket.tokens,
      tokenCount: firstMarket.tokens?.length || 0,
      hasOutcomePrices: !!firstMarket.outcome_prices,
      hasCurrentPrice: firstMarket.current_price !== undefined,
      question: firstMarket.question || firstMarket.title || 'NO QUESTION',
    });
    if (firstMarket.tokens && firstMarket.tokens.length > 0) {
      console.log('🔍 First token keys:', Object.keys(firstMarket.tokens[0]));
      console.log('🔍 First token:', JSON.stringify(firstMarket.tokens[0], null, 2).substring(0, 500));
    }
  }
  
  return markets;
}

// Fetch markets with pagination
export async function fetchAllMarkets({
  category = null,
  active = true,
  maxPages = 50,
  limitPerPage = 1000,
}) {
  let allMarkets = [];
  const seenIds = new Set();

  for (let page = 0; page < maxPages; page++) {
    const offset = page * limitPerPage;
    
    try {
      const markets = await fetchMarketsFromPolymarket({
        limit: limitPerPage,
        offset,
        category,
        active,
      });

      if (markets.length === 0) {
        console.log(`📄 No more markets at offset ${offset}`);
        break;
      }

      // Filter out duplicates - use more reliable ID detection
      const newMarkets = markets.filter(m => {
        // Try multiple ID sources, with fallback to question hash
        const actualMarket = m.market || m;
        let id = actualMarket.condition_id || 
                 actualMarket.question_id || 
                 actualMarket.id ||
                 actualMarket.market_id ||
                 m.condition_id || 
                 m.question_id || 
                 m.id;
        
        // If no ID, create one from question
        if (!id) {
          const question = actualMarket.question || actualMarket.title || actualMarket.name || m.question || m.title || '';
          if (question) {
            // Create hash from question
            id = question.split('').reduce((acc, char) => {
              return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0).toString(36);
          } else {
            // No question either, skip this market
            return false;
          }
        }
        
        if (seenIds.has(id)) {
          return false;
        }
        seenIds.add(id);
        return true;
      });

      // Continue even if all are duplicates - API might return same markets on multiple pages
      // but different markets on later pages
      if (newMarkets.length === 0) {
        console.log(`⚠️ All markets are duplicates at offset ${offset}, but continuing to next page...`);
        // Don't break - continue to next page in case API returns different markets
        // Only break if we've had many consecutive pages with no new markets
        if (page > 10 && allMarkets.length > 0) {
          // After page 10, if we still have no new markets, likely API is repeating
          console.log(`🛑 Stopping pagination after ${page + 1} pages with no new markets`);
          break;
        }
      } else {
        allMarkets = allMarkets.concat(newMarkets);
        console.log(`📄 Page ${page + 1} (offset: ${offset}): ${newMarkets.length} new markets (total: ${allMarkets.length})`);
      }

      // Stop if we got fewer than requested (end of data)
      // But continue for at least a few pages to ensure we get all markets
      if (markets.length < limitPerPage && page > 2) {
        console.log(`📄 Got ${markets.length} < ${limitPerPage} markets, reached end of data`);
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error fetching page ${page + 1}:`, error.message);
      if (page === 0) {
        throw error;
      }
      break;
    }
  }

  return allMarkets;
}

