// Market Transformer - Server Side
// Transforms Polymarket markets to our prediction format

import { detectCategoryFromMarket } from '../utils/categoryMapper.js';

const MOCK_AGENTS = [
  { name: 'GROK 4' },
  { name: 'GPT-5' },
  { name: 'DEEPSEEK V3' },
  { name: 'GEMINI 2.5' },
  { name: 'CLAUDE 4.5' },
  { name: 'QWEN 2.5' },
];

// Filter and validate market
export function filterMarket(market) {
  const now = new Date();
  
  // Handle nested structures
  const actualMarket = market.market || market;
  
  // Check closed/archived
  const closed = actualMarket.closed ?? market.closed;
  const archived = actualMarket.archived ?? market.archived;
  const status = actualMarket.status ?? market.status;
  
  const isClosed = closed === true || closed === 'true' || closed === 1 ||
                   status === 'closed' || status === 'resolved' || status === 'finished' || status === 'settled';
  const isArchived = archived === true || archived === 'true' || archived === 1;
  
  if (isClosed || isArchived) {
    return false;
  }
  
  // Check end date
  const endDate = actualMarket.end_date_iso || actualMarket.end_date || market.end_date_iso || market.end_date;
  if (endDate) {
    try {
      const endDateObj = new Date(endDate);
      if (endDateObj < now) {
        return false; // Expired
      }
    } catch (e) {
      // Invalid date, skip check
    }
  }
  
  // Check if has question
  const question = actualMarket.question || actualMarket.title || actualMarket.name || market.question || market.title;
  if (!question || question.trim() === '') {
    return false;
  }
  
  return true;
}

// Transform market to prediction format
export function transformMarket(market, index = 0) {
  const actualMarket = market.market || market;
  
  // Get question
  const question = (actualMarket.question || actualMarket.title || actualMarket.name || '').trim();
  if (!question) {
    return null;
  }
  
  // Extract prices - try multiple possible field locations
  let yesPrice = null;
  let noPrice = null;
  
  // Try outcomePrices FIRST (this is the format we see in the API response)
  // outcomePrices is a JSON string like "[\"0.0035\", \"0.9965\"]"
  if (actualMarket.outcomePrices) {
    try {
      let prices = actualMarket.outcomePrices;
      // If it's a string, parse it as JSON
      if (typeof prices === 'string') {
        prices = JSON.parse(prices);
      }
      // Handle array format: ["0.0035", "0.9965"] - first is YES, second is NO
      if (Array.isArray(prices) && prices.length >= 2) {
        const yesVal = parseFloat(String(prices[0]));
        const noVal = parseFloat(String(prices[1]));
        if (!isNaN(yesVal) && yesVal >= 0 && yesVal <= 1) {
          yesPrice = yesVal;
        }
        if (!isNaN(noVal) && noVal >= 0 && noVal <= 1) {
          noPrice = noVal;
        }
        // Log success for first market
        if (index === 0 && yesPrice !== null && noPrice !== null) {
          console.log(`✅ Parsed outcomePrices: "${actualMarket.outcomePrices}" → YES=${yesPrice}, NO=${noPrice}`);
        }
      }
    } catch (e) {
      if (index === 0) {
        console.log('⚠️ Failed to parse outcomePrices:', actualMarket.outcomePrices, 'Error:', e.message);
      }
    }
  } else if (index === 0) {
    console.log('⚠️ No outcomePrices field found. Market keys:', Object.keys(actualMarket).slice(0, 20));
  }
  
  // Try tokens array (alternative structure)
  if (actualMarket.tokens && Array.isArray(actualMarket.tokens) && actualMarket.tokens.length >= 2) {
    // Try to find YES/NO tokens by multiple methods
    let yesToken = actualMarket.tokens.find(t => 
      (t.outcome === 'Yes' || t.outcome === 'YES' || (t.outcome && t.outcome.toLowerCase().includes('yes'))) ||
      (t.side === 'yes' || t.side === 'YES') ||
      t.token_id === '0' ||
      t.outcome === '0'
    );
    
    let noToken = actualMarket.tokens.find(t => 
      (t.outcome === 'No' || t.outcome === 'NO' || (t.outcome && t.outcome.toLowerCase().includes('no'))) ||
      (t.side === 'no' || t.side === 'NO') ||
      t.token_id === '1' ||
      t.outcome === '1'
    );
    
    // Fallback: use first two tokens if we can't identify YES/NO
    if (!yesToken) yesToken = actualMarket.tokens[0];
    if (!noToken) noToken = actualMarket.tokens.find(t => t !== yesToken) || actualMarket.tokens[1];
    
    // Try ALL possible price field names - Polymarket API uses various formats
    const priceFields = ['price', 'lastPrice', 'currentPrice', 'last_price', 'current_price', 
                         'lastPriceUsd', 'priceUsd', 'value', 'usdPrice', 'usd_price',
                         'lastPriceUSD', 'priceUSD', 'lastPriceUsdc', 'priceUsdc'];
    
    for (const field of priceFields) {
      if (yesPrice === null && yesToken && yesToken[field] !== undefined && yesToken[field] !== null) {
        yesPrice = parseFloat(String(yesToken[field]));
        if (!isNaN(yesPrice)) break;
      }
    }
    
    for (const field of priceFields) {
      if (noPrice === null && noToken && noToken[field] !== undefined && noToken[field] !== null) {
        noPrice = parseFloat(String(noToken[field]));
        if (!isNaN(noPrice)) break;
      }
    }
  }
  
  // Try outcomePrices (can be string JSON array or object)
  if ((yesPrice === null || noPrice === null) && actualMarket.outcomePrices) {
    try {
      let prices = actualMarket.outcomePrices;
      // If it's a string, parse it
      if (typeof prices === 'string') {
        prices = JSON.parse(prices);
      }
      // Handle array format: ["0.0035", "0.9965"] or [0.0035, 0.9965]
      if (Array.isArray(prices) && prices.length >= 2) {
        if (yesPrice === null) {
          yesPrice = parseFloat(String(prices[0]));
        }
        if (noPrice === null) {
          noPrice = parseFloat(String(prices[1]));
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Try outcome_prices object (various formats)
  if ((yesPrice === null || noPrice === null) && actualMarket.outcome_prices) {
    // Try numeric keys
    if (yesPrice === null) {
      yesPrice = actualMarket.outcome_prices['0'] ?? actualMarket.outcome_prices[0] ?? 
                 actualMarket.outcome_prices['yes'] ?? actualMarket.outcome_prices['YES'];
      if (yesPrice !== undefined && yesPrice !== null) {
        yesPrice = parseFloat(String(yesPrice));
      } else {
        yesPrice = null;
      }
    }
    if (noPrice === null) {
      noPrice = actualMarket.outcome_prices['1'] ?? actualMarket.outcome_prices[1] ?? 
                actualMarket.outcome_prices['no'] ?? actualMarket.outcome_prices['NO'];
      if (noPrice !== undefined && noPrice !== null) {
        noPrice = parseFloat(String(noPrice));
      } else {
        noPrice = null;
      }
    }
  }
  
  // Try prices object (alternative format)
  if ((yesPrice === null || noPrice === null) && actualMarket.prices) {
    if (yesPrice === null && actualMarket.prices['0'] !== undefined) {
      yesPrice = parseFloat(String(actualMarket.prices['0']));
    }
    if (noPrice === null && actualMarket.prices['1'] !== undefined) {
      noPrice = parseFloat(String(actualMarket.prices['1']));
    }
  }
  
  // Try current_price (single value, calculate other)
  if (yesPrice === null && actualMarket.current_price !== undefined) {
    yesPrice = parseFloat(String(actualMarket.current_price));
    noPrice = 1 - yesPrice;
  }
  
  // Try price field directly
  if (yesPrice === null && actualMarket.price !== undefined) {
    yesPrice = parseFloat(String(actualMarket.price));
    noPrice = 1 - yesPrice;
  }
  
  // Try market data fields
  if (yesPrice === null && actualMarket.market) {
    const marketData = actualMarket.market;
    if (marketData.outcome_prices) {
      if (marketData.outcome_prices['0'] !== undefined) {
        yesPrice = parseFloat(String(marketData.outcome_prices['0']));
      }
      if (marketData.outcome_prices['1'] !== undefined) {
        noPrice = parseFloat(String(marketData.outcome_prices['1']));
      }
    }
    if (yesPrice === null && marketData.current_price !== undefined) {
      yesPrice = parseFloat(String(marketData.current_price));
      noPrice = 1 - yesPrice;
    }
  }
  
  // If we have one price but not the other, calculate it
  if (yesPrice !== null && noPrice === null) {
    noPrice = 1 - yesPrice;
  } else if (noPrice !== null && yesPrice === null) {
    yesPrice = 1 - noPrice;
  }
  
  // Final fallback - only if we have NO price data
  if (yesPrice === null || noPrice === null) {
    // Log FULL market structure for debugging - first market only
    if (index === 0) {
      console.warn(`⚠️ No price data found for market: ${question.substring(0, 50)}`);
      console.log('🔍 Market keys:', Object.keys(actualMarket));
      console.log('🔍 Full market structure:', JSON.stringify(actualMarket, null, 2).substring(0, 3000));
    }
    // Default to 50/50 if no price data
    yesPrice = 0.5;
    noPrice = 0.5;
  } else {
    // Log success for first market
    if (index === 0) {
      console.log(`✅ Successfully extracted prices: YES=${yesPrice.toFixed(3)}, NO=${noPrice.toFixed(3)}`);
    }
  }
  
  // Validate and normalize prices
  if (isNaN(yesPrice) || yesPrice < 0 || yesPrice > 1) {
    yesPrice = 0.5;
  }
  if (isNaN(noPrice) || noPrice < 0 || noPrice > 1) {
    noPrice = 0.5;
  }
  
  // Normalize to sum to 1
  const total = yesPrice + noPrice;
  if (total > 0 && total !== 1) {
    yesPrice = yesPrice / total;
    noPrice = noPrice / total;
  }
  
  // Determine position - which side has the HIGHER price
  // YES position if YES price >= NO price, NO position if NO price > YES price
  // This way: if NO is higher, show NO. If YES is higher or equal, show YES.
  const position = noPrice > yesPrice ? 'NO' : 'YES';
  // Use the price of the winning side (the one with higher price)
  const currentPrice = position === 'YES' ? yesPrice : noPrice;
  
  // Log for debugging (first market only)
  if (index === 0) {
    console.log(`💰 Price check: YES=${yesPrice.toFixed(3)}, NO=${noPrice.toFixed(3)}, Position=${position}, Price=${currentPrice.toFixed(3)}`);
  }
  const probability = Math.max(1, Math.min(99, Math.round(currentPrice * 100)));
  
  // Get market ID
  let marketId = actualMarket.condition_id || 
                 actualMarket.question_id || 
                 actualMarket.slug || 
                 actualMarket.id ||
                 actualMarket.market_id;
  
  if (!marketId) {
    const questionHash = question.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    marketId = `market-${question.substring(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}-${Math.abs(questionHash).toString(36)}`;
  }
  
  // Get slug and condition ID for Polymarket links
  const marketSlug = actualMarket.market_slug || actualMarket.slug || actualMarket.event?.slug;
  const conditionId = actualMarket.condition_id || actualMarket.event?.condition_id;
  
  // Get image from market metadata
  const imageUrl = actualMarket.image || 
                   actualMarket.imageUrl || 
                   actualMarket.image_url ||
                   actualMarket.thumbnail ||
                   actualMarket.thumbnailUrl ||
                   actualMarket.thumbnail_url ||
                   actualMarket.event?.image ||
                   actualMarket.event?.imageUrl ||
                   market.image ||
                   market.imageUrl ||
                   market.thumbnail;
  
  // Detect category
  const category = detectCategoryFromMarket(actualMarket);
  
  // Assign agent
  const agent = MOCK_AGENTS[index % MOCK_AGENTS.length];
  
  return {
    id: String(marketId),
    question,
    probability,
    position,
    price: currentPrice,
    change: parseFloat((Math.random() * 10 - 5).toFixed(1)), // Mock change for now
    agentName: agent.name,
    agentEmoji: '',
    reasoning: actualMarket.description || actualMarket.summary || `Market analysis based on ${category} category.`,
    category,
    marketSlug: marketSlug ? String(marketSlug) : undefined,
    conditionId: conditionId ? String(conditionId) : undefined,
    imageUrl: imageUrl ? String(imageUrl) : undefined,
  };
}

// Transform multiple markets
export function transformMarkets(markets) {
  const transformed = [];
  const seenIds = new Set();
  let filteredCount = 0;
  let noQuestionCount = 0;
  let expiredCount = 0;
  let closedCount = 0;
  
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    
    // Filter out invalid markets
    if (!filterMarket(market)) {
      filteredCount++;
      // Log first few filtered markets for debugging
      if (filteredCount <= 5) {
        const actualMarket = market.market || market;
        const question = actualMarket.question || actualMarket.title || actualMarket.name || 'NO QUESTION';
        const closed = actualMarket.closed ?? market.closed;
        const archived = actualMarket.archived ?? market.archived;
        const endDate = actualMarket.end_date_iso || actualMarket.end_date || market.end_date_iso || market.end_date;
        const now = new Date();
        
        if (closed || archived) closedCount++;
        if (endDate && new Date(endDate) < now) expiredCount++;
        if (!question || question.trim() === '') noQuestionCount++;
        
        console.log(`⚠️ Filtered market ${i + 1}: ${question.substring(0, 50)} - closed:${closed}, archived:${archived}, expired:${endDate && new Date(endDate) < now}`);
      }
      continue;
    }
    
    const prediction = transformMarket(market, i);
    if (!prediction) {
      continue;
    }
    
    // Check for duplicates
    if (seenIds.has(prediction.id)) {
      prediction.id = `${prediction.id}-${i}`;
    }
    seenIds.add(prediction.id);
    
    transformed.push(prediction);
  }
  
  console.log(`📊 Transformation stats: ${transformed.length} transformed, ${filteredCount} filtered (${closedCount} closed/archived, ${expiredCount} expired, ${noQuestionCount} no question)`);
  return transformed;
}

