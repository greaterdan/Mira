# AI Agent Credit Optimization & Request Management

## Overview

The AI agent trading system is designed to **minimize API credit usage** through multiple layers of caching, intelligent request batching, and fallback mechanisms. This document explains exactly how the system prevents excessive API calls and credit consumption.

---

## 🎯 Core Strategy: Multi-Layer Caching

The system uses **three layers of caching** to prevent redundant API calls:

### Layer 1: AI Response Cache (5-minute TTL)
**Location:** `src/lib/agents/ai-cache.ts`

- **Cache Key:** `${agentId}:${marketId}`
- **TTL:** 5 minutes
- **Purpose:** Prevents calling the same AI API for the same market within 5 minutes

**How it works:**
```typescript
// Before calling AI API
const cached = getCachedAIDecision(agentId, market.id);
if (cached) {
  return cached; // No API call made!
}

// After getting AI response
setCachedAIDecision(agentId, market.id, decision); // Cache for 5 minutes
```

**Impact:** If the same agent analyzes the same market within 5 minutes, **zero API calls** are made.

### Layer 2: Agent Trade Cache (2-minute TTL)
**Location:** `src/lib/agents/cache.ts`

- **Cache Key:** `agentId`
- **TTL:** 2 minutes
- **Invalidation:** If market IDs change (new markets appear)
- **Purpose:** Prevents regenerating entire trade sets for an agent

**How it works:**
```typescript
// Before generating trades
const cached = getCachedAgentTrades(agentId, currentMarketIds);
if (cached !== null) {
  return cached; // No market fetching, no scoring, no AI calls!
}

// After generating trades
setCachedAgentTrades(agentId, trades, currentMarketIds);
```

**Impact:** If markets haven't changed and cache is fresh, **entire trade generation is skipped** (including all AI calls).

### Layer 3: Market Data Cache (60-second TTL)
**Location:** `src/lib/markets/polymarket.ts`

- **TTL:** 60 seconds
- **Purpose:** Prevents fetching the same market data repeatedly
- **API Structure:** Uses the **same** `fetchAllMarkets()` function as bubble maps
- **API Keys:** Uses the **same** environment variables:
  - `POLYMARKET_API_KEY`
  - `POLYMARKET_SECRET`
  - `POLYMARKET_PASSPHRASE`

**Impact:** Multiple agents can use the same cached market data without additional API calls. The trading engine shares the same Polymarket API structure as bubble maps, just with a separate cache to avoid conflicts.

---

## 🔄 Request Flow & Credit Usage

### Scenario 1: First Request (Cold Start)

```
1. User requests /api/agents/summary
2. System checks agent trade cache → MISS
3. Fetches markets (uses Polymarket cache if available)
4. Fetches news (uses news cache if available)
5. For each agent:
   a. Filters candidate markets
   b. Scores markets
   c. For top markets:
      - Checks AI response cache → MISS
      - Calls AI API (1 credit used)
      - Caches AI response (5 min TTL)
6. Caches agent trades (2 min TTL)
7. Returns results
```

**Credit Usage:** ~5-10 API calls per agent (depending on maxTrades)

### Scenario 2: Subsequent Request (Within 2 Minutes)

```
1. User requests /api/agents/summary
2. System checks agent trade cache → HIT
3. Returns cached trades immediately
```

**Credit Usage:** 0 API calls

### Scenario 3: Request After 2 Minutes (Markets Unchanged)

```
1. User requests /api/agents/summary
2. System checks agent trade cache → EXPIRED
3. Fetches markets (may use cache)
4. Checks if market IDs changed → NO
5. For each agent:
   a. For each market:
      - Checks AI response cache → HIT (still within 5 min)
      - Uses cached AI decision (no API call)
6. Regenerates trades with cached AI decisions
7. Caches agent trades
```

**Credit Usage:** 0 API calls (AI responses still cached)

### Scenario 4: Request After 5 Minutes (AI Cache Expired)

```
1. User requests /api/agents/summary
2. System checks agent trade cache → EXPIRED
3. Fetches markets
4. For each agent:
   a. For each market:
      - Checks AI response cache → EXPIRED
      - Calls AI API (1 credit used)
      - Caches new response
```

**Credit Usage:** ~5-10 API calls per agent (same as cold start)

---

## 💰 Credit Usage Calculation

### Per Agent Per Cycle

**Maximum (worst case):**
- Number of trades per agent: `maxTrades` (typically 8-12)
- AI calls per cycle: `maxTrades` calls
- **Per agent:** 8-12 credits per cycle

**Typical (with caching):**
- First cycle: 8-12 credits
- Subsequent cycles (within 5 min): 0 credits
- After 5 min: 8-12 credits again

### All 6 Agents Per Cycle

**Maximum:** 6 agents × 12 trades = **72 credits per cycle**

**Typical (with 5-min cache):**
- If requests come within 5 minutes: **0 credits**
- If requests come after 5 minutes: **72 credits**

### Daily Credit Usage Estimate

**Assumptions:**
- Trading cycle runs every 2 minutes
- AI cache TTL: 5 minutes
- 6 agents, 10 trades each

**Calculation:**
- Cycles per hour: 30
- Cycles with cache hit: ~25 (within 5 min window)
- Cycles with cache miss: ~5 (after 5 min window)
- Credits per cache miss: 60 (6 agents × 10 trades)
- **Credits per hour:** 5 × 60 = **300 credits/hour**
- **Credits per day:** 300 × 24 = **7,200 credits/day**

**With 2-minute agent cache:**
- If markets don't change, entire cycles are skipped
- **Actual usage:** Much lower (depends on market volatility)

---

## 🛡️ Fallback Mechanisms (Zero Credit Usage)

### 1. API Key Not Configured

```typescript
if (!isAIConfigured(agent.id)) {
  // Uses deterministic logic - NO API CALL
  side = getDeterministicSide(scored, agent);
  confidence = getDeterministicConfidence(scored, agent, seed);
  reasoning = getDeterministicReasoning(scored, newsRelevance);
}
```

**Credit Usage:** 0 (uses algorithm instead)

### 2. API Call Fails

```typescript
try {
  const aiDecision = await getAITradeDecision(agent.id, scored, newsArticles);
  // Use AI decision
} catch (error) {
  console.warn(`[AI] Failed to get AI decision, using fallback`);
  // Falls back to deterministic logic - NO RETRY
  side = getDeterministicSide(scored, agent);
  // ...
}
```

**Credit Usage:** 0 (no retries, immediate fallback)

### 3. Rate Limiting

If an API returns rate limit errors:
- System catches the error
- Falls back to deterministic logic
- **No retries** (prevents credit waste)
- Next request will try again (after cache expires)

---

## ⚙️ Configuration & Tuning

### Cache TTLs (Current Settings)

| Cache Layer | TTL | File Location |
|-------------|-----|---------------|
| AI Response Cache | 5 minutes | `src/lib/agents/ai-cache.ts` |
| Agent Trade Cache | 2 minutes | `src/lib/agents/cache.ts` |
| Market Data Cache | 60 seconds | `src/lib/markets/polymarket.ts` |
| News Cache | 5 minutes | `src/lib/news/aggregator.ts` |

### Adjusting Cache TTLs

**To reduce credit usage further:**
- Increase AI cache TTL (e.g., 10 minutes instead of 5)
- Increase agent trade cache TTL (e.g., 5 minutes instead of 2)

**Trade-off:** Longer cache = less real-time updates

**To increase real-time accuracy:**
- Decrease AI cache TTL (e.g., 2 minutes instead of 5)
- Decrease agent trade cache TTL (e.g., 1 minute instead of 2)

**Trade-off:** Shorter cache = more API calls

### Example: 10-Minute AI Cache

```typescript
// In src/lib/agents/ai-cache.ts
const AI_CACHE_TTL = 10 * 60 * 1000; // 10 minutes instead of 5
```

**Impact:** Reduces credit usage by ~50% (fewer cache misses)

---

## 📊 Request Patterns

### Normal Operation

```
Time 0:00 - User requests summary
  → Cache miss → 72 credits used (6 agents × 12 trades)

Time 0:02 - User requests summary (2 min later)
  → Agent cache hit → 0 credits used

Time 0:05 - User requests summary (5 min later)
  → Agent cache expired, AI cache still valid
  → 0 credits used (AI responses cached)

Time 0:07 - User requests summary (7 min later)
  → Agent cache expired, AI cache expired
  → 72 credits used (regenerate all)

Time 0:09 - User requests summary (9 min later)
  → Agent cache hit → 0 credits used
```

### High Traffic Scenario

```
Multiple users requesting simultaneously:
  → All requests share the same cache
  → Only first request makes API calls
  → Subsequent requests use cached data
  → Credit usage: Same as single user
```

---

## 🚨 Credit Protection Features

### 1. No Retries on Failure

If an API call fails, the system:
- Logs the error
- Falls back to deterministic logic
- **Does not retry** (prevents credit waste)

### 2. Timeout Protection

All AI API calls have a 30-second timeout:
```typescript
signal: AbortSignal.timeout(30000)
```

If an API is slow/unresponsive:
- Request is cancelled after 30 seconds
- Falls back to deterministic logic
- **No credit charged** for failed requests

### 3. Partial Configuration Support

You can configure only some agents:
- Configured agents: Use AI APIs
- Unconfigured agents: Use deterministic logic (0 credits)

**Example:**
```bash
# Only configure 2 agents
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Other 4 agents use deterministic logic (0 credits)
```

---

## 📈 Monitoring Credit Usage

### Check Cache Hit Rates

Add logging to see cache effectiveness:

```typescript
// In ai-clients.ts
const cached = getCachedAIDecision(agentId, market.id);
if (cached) {
  console.log(`[Cache] HIT for ${agentId}:${market.id}`);
  return cached;
}
console.log(`[Cache] MISS for ${agentId}:${market.id}`);
```

### Track API Calls

Monitor server logs for:
- `[AI] Failed to get AI decision` - API failures (fallback used)
- `[Cache] HIT/MISS` - Cache effectiveness

---

## 🎛️ Recommended Settings

### For Development/Testing

```typescript
// Longer cache TTLs to save credits
AI_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
AGENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

**Credit Usage:** ~3,600 credits/day (50% reduction)

### For Production (Balanced)

```typescript
// Current settings (good balance)
AI_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
AGENT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
```

**Credit Usage:** ~7,200 credits/day

### For Real-Time (Higher Cost)

```typescript
// Shorter cache TTLs for more updates
AI_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
AGENT_CACHE_TTL = 1 * 60 * 1000; // 1 minute
```

**Credit Usage:** ~18,000 credits/day

---

## 🔍 How to Verify Credit Usage

### 1. Check API Provider Dashboards

- **OpenAI:** https://platform.openai.com/usage
- **Anthropic:** https://console.anthropic.com/settings/usage
- **xAI:** Check your xAI dashboard
- **Google AI:** Check Google Cloud Console
- **DeepSeek:** Check DeepSeek dashboard

### 2. Monitor Server Logs

Look for:
```
[AI] Failed to get AI decision for GPT_5: ...
[Cache] HIT for GROK_4:market-123
```

### 3. Test Cache Effectiveness

```bash
# Request 1: Should use credits
curl http://localhost:3002/api/agents/summary

# Request 2 (within 2 min): Should use 0 credits (cache hit)
curl http://localhost:3002/api/agents/summary

# Request 3 (after 5 min): Should use credits again (cache expired)
curl http://localhost:3002/api/agents/summary
```

---

## 💡 Best Practices

### 1. Start with Partial Configuration

Configure only 1-2 agents initially to test:
- Verify API keys work
- Monitor credit usage
- Gradually add more agents

### 2. Monitor Cache Hit Rates

If cache hit rate is low:
- Increase cache TTLs
- Check if markets are changing too frequently
- Consider reducing `maxTrades` per agent

### 3. Set Up Alerts

Monitor credit usage and set alerts:
- Daily credit limit alerts
- Unusual spike detection
- API failure rate monitoring

### 4. Use Deterministic Fallback

If credits are running low:
- Remove API keys temporarily
- System will use deterministic logic
- **Zero credits used**

---

## 📝 Summary

**Key Points:**

1. **Multi-layer caching** prevents redundant API calls
2. **5-minute AI cache** means same market analyzed within 5 min = 0 credits
3. **2-minute agent cache** means unchanged markets = 0 credits
4. **Automatic fallback** to deterministic logic on any failure (0 credits)
5. **No retries** prevent credit waste on failures
6. **Timeout protection** prevents hanging requests

**Typical Credit Usage:**
- **With caching:** ~7,200 credits/day (6 agents, 2-min cycles)
- **Without caching:** ~86,400 credits/day (same scenario)
- **Savings:** ~92% reduction through caching

**The system is designed to be credit-efficient while maintaining real-time accuracy!**

