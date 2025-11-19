/**
 * Agent trade generator
 * 
 * Main entry point for generating trades for an agent.
 * Orchestrates market fetching, news aggregation, scoring, and trade generation.
 */

import type { AgentId, AgentTrade, Market, NewsArticle } from './domain';
import { getAgentProfile } from './domain';
// Use the same market fetching as bubble maps
// The trading engine will use markets from the server's /api/predictions endpoint
// This ensures we use the SAME API keys and data source
import { fetchAllMarkets } from '../markets/polymarket';
import { fetchLatestNews } from '../news/aggregator';
import { filterCandidateMarkets, scoreMarketForAgent, computeNewsRelevance } from './scoring';
import { generateTradeForMarket } from './engine';
import { getCachedAgentTrades, setCachedAgentTrades } from './cache';

/**
 * Generate trades for a specific agent
 * 
 * Pipeline:
 * 1. Fetch all markets (cached 60s)
 * 2. Fetch all news (cached 5min)
 * 3. Filter candidate markets for agent
 * 4. Score each candidate
 * 5. Sort by score and take top N
 * 6. Generate trades
 * 7. Cache results
 * 
 * @param agentId - Agent identifier
 * @returns Array of agent trades
 */
export async function generateAgentTrades(agentId: AgentId): Promise<AgentTrade[]> {
  const agent = getAgentProfile(agentId);
  
  // Fetch data sources
  const [markets, newsArticles] = await Promise.all([
    fetchAllMarkets(),
    fetchLatestNews(),
  ]);
  
  // Check cache before computing
  const currentMarketIds = markets.map(m => m.id).sort();
  const cached = getCachedAgentTrades(agentId, currentMarketIds);
  if (cached !== null) {
    return cached;
  }
  
  // Filter candidate markets
  const candidates = filterCandidateMarkets(agent, markets);
  
  if (candidates.length === 0) {
    return [];
  }
  
  // Score all candidates with agent-specific weights and recency-aware news
  const now = new Date();
  const scoredMarkets = candidates.map(market => {
    // Use agent-specific weighted scoring with recency-aware news
    return scoreMarketForAgent(market, newsArticles, agent, now);
  });
  
  // Sort by weighted score descending
  scoredMarkets.sort((a, b) => b.score - a.score);
  
  // Take top markets (2x maxTrades for safety, then filter)
  const topMarkets = scoredMarkets.slice(0, agent.maxTrades * 2);
  
  // Generate trades (now async due to AI API calls)
  const nowMs = Date.now();
  const trades: AgentTrade[] = [];
  
  for (let i = 0; i < topMarkets.length; i++) {
    const scored = topMarkets[i];
    // News relevance still computed for reasoning (legacy compatibility)
    const newsRelevance = computeNewsRelevance(scored, newsArticles);
    
    try {
      const trade = await generateTradeForMarket(
        agent,
        scored,
        newsRelevance,
        newsArticles,
        i,
        nowMs
      );
      
      if (trade) {
        trades.push(trade);
      }
    } catch (error) {
      console.error(`[Generator] Failed to generate trade for market ${scored.id}:`, error);
      // Continue to next market
    }
    
    // Stop once we have enough trades
    if (trades.length >= agent.maxTrades) {
      break;
    }
  }
  
  // Cache results
  setCachedAgentTrades(agentId, trades, currentMarketIds);
  
  return trades;
}





