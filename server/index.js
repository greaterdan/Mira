// Express proxy server for Polymarket API
// All market processing happens server-side

import express from 'express';
import cors from 'cors';
import { fetchAllMarkets } from './services/polymarketService.js';
import { transformMarkets } from './services/marketTransformer.js';
import { mapCategoryToPolymarket } from './utils/categoryMapper.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Polymarket proxy server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Polymarket proxy server is running', timestamp: new Date().toISOString() });
});

// Main endpoint: Get predictions (ready-to-use format)
app.get('/api/predictions', async (req, res) => {
  console.log(`📥 Received request: ${req.method} ${req.path}`, {
    query: req.query,
  });
  
  try {
    const { category = 'All Markets', limit = 10000 } = req.query;
    
    // Map category to Polymarket category
    let polymarketCategory = null;
    if (category !== 'All Markets' && category !== 'Trending' && category !== 'Breaking' && category !== 'New') {
      polymarketCategory = mapCategoryToPolymarket(category);
    }
    
    console.log(`🔍 Fetching markets for category: ${category} (Polymarket: ${polymarketCategory || 'all'})`);
    
    // Fetch markets from Polymarket - limit to 100 for "All Markets" to reduce glitchiness
    const maxMarkets = category === 'All Markets' ? 100 : 1000;
    const markets = await fetchAllMarkets({
      category: polymarketCategory,
      active: true,
      maxPages: Math.ceil(maxMarkets / 1000) + 1, // Only fetch enough pages
      limitPerPage: 1000,
    });
    
    // Limit markets for "All Markets" category
    const limitedMarkets = category === 'All Markets' ? markets.slice(0, 100) : markets;
    
    console.log(`✅ Fetched ${markets.length} raw markets from Polymarket`);
    
    // Transform markets to predictions (server-side filtering and transformation)
    const predictions = transformMarkets(limitedMarkets);
    
    console.log(`✅ Transformed to ${predictions.length} predictions`);
    
    // Filter by category if needed (client-side category filtering)
    let filteredPredictions = predictions;
    if (category !== 'All Markets') {
      filteredPredictions = predictions.filter(p => {
        if (category === 'Trending' || category === 'Breaking' || category === 'New') {
          // For these, show all (or implement specific logic)
          return true;
        }
        return (p.category || 'World') === category;
      });
      console.log(`✅ Filtered to ${filteredPredictions.length} predictions for category: ${category}`);
    }
    
    // Apply limit if specified
    if (limit && parseInt(limit) > 0) {
      filteredPredictions = filteredPredictions.slice(0, parseInt(limit));
    }
    
    res.json({
      predictions: filteredPredictions,
      count: filteredPredictions.length,
      totalFetched: markets.length,
      totalTransformed: predictions.length,
    });
  } catch (error) {
    console.error('❌ Error in /api/predictions:', error);
    res.status(500).json({ 
      error: error.message,
      predictions: [],
      count: 0,
    });
  }
});

// Legacy endpoint for backwards compatibility
app.get('/api/polymarket/markets', async (req, res) => {
  console.log(`📥 Legacy endpoint called: ${req.method} ${req.path}`);
  
  try {
    const { limit = 50, active = 'true', category, offset = 0 } = req.query;
    
    // Map category
    let polymarketCategory = null;
    if (category) {
      polymarketCategory = mapCategoryToPolymarket(category);
    }
    
    // Fetch markets
    const markets = await fetchAllMarkets({
      category: polymarketCategory,
      active: active === 'true',
      maxPages: Math.ceil((parseInt(limit) || 50) / 1000) + 1,
      limitPerPage: 1000,
    });
    
    // Apply offset and limit
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 50;
    const paginatedMarkets = markets.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      markets: paginatedMarkets,
      count: paginatedMarkets.length,
      total: markets.length,
    });
  } catch (error) {
    console.error('❌ Error in legacy endpoint:', error);
    res.status(500).json({
      error: error.message,
      markets: [],
      count: 0,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Polymarket proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET /api/predictions - Get ready-to-use predictions`);
  console.log(`   GET /api/polymarket/markets - Legacy endpoint (raw markets)`);
});

