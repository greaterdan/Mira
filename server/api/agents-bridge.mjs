/**
 * Bridge to load TypeScript agent trading modules
 * Uses tsx to dynamically import TypeScript files
 * 
 * NOTE: This requires the server to be run with: node --import tsx server/index.js
 * Or use tsx directly: tsx server/index.js
 */

// CRITICAL: Register tsx BEFORE any TypeScript imports
// This MUST happen synchronously at module load time
let tsxRegistered = false;
try {
  // Method 1: Try tsx/esm/api register (for tsx v4+)
  const tsxApi = await import('tsx/esm/api').catch(() => null);
  if (tsxApi?.register) {
    tsxApi.register();
    tsxRegistered = true;
    console.log('[API] ✅ tsx/esm/api registered');
  }
} catch (e) {
  // Continue to next method
}

// If Method 1 failed, try Method 2: Use createRequire
if (!tsxRegistered) {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    require('tsx/esm/api');
    tsxRegistered = true;
    console.log('[API] ✅ tsx registered via require');
  } catch (e) {
    console.warn('[API] ⚠️ tsx require failed:', e.message);
  }
}

// If still not registered, log warning but continue
// The --import tsx flag should handle it
if (!tsxRegistered) {
  console.warn('[API] ⚠️ tsx not registered in bridge - relying on --import tsx flag');
  console.warn('[API] ⚠️ If you see "Unexpected token" errors, ensure server starts with: node --import tsx server/index.js');
}

let generateAgentTrades, getAgentProfile, isValidAgentId, ALL_AGENT_IDS, buildAgentSummary, computeSummaryStats, calculateAllAgentStats, getCachedTradesQuick, getAgentResearch;

try {
  // CRITICAL: Wait a moment to ensure tsx is fully registered
  if (!tsxRegistered) {
    console.log('[API] ⏳ Waiting for tsx registration...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Import TypeScript modules (tsx will handle .ts extension)
  console.log('[API] Attempting to load TypeScript modules...');
  console.log('[API] tsx registered:', tsxRegistered);
  
  // Try importing with explicit .ts extension first
  let agentsModule;
  try {
    agentsModule = await import('../../src/lib/agents/generator.ts');
  } catch (importError) {
    // If that fails, try without extension (tsx should add it)
    console.warn('[API] ⚠️ Import with .ts failed, trying without extension:', importError.message);
    agentsModule = await import('../../src/lib/agents/generator');
  }
  
  console.log('[API] generator.ts loaded, exports:', Object.keys(agentsModule));
  
  const domainModule = await import('../../src/lib/agents/domain.ts');
  console.log('[API] domain.ts loaded, exports:', Object.keys(domainModule));
  
  const summaryModule = await import('../../src/lib/agents/summary.ts');
  console.log('[API] summary.ts loaded, exports:', Object.keys(summaryModule));
  
  const statsModule = await import('../../src/lib/agents/stats.ts');
  console.log('[API] stats.ts loaded, exports:', Object.keys(statsModule));
  
  const cacheModule = await import('../../src/lib/agents/cache.ts');
  console.log('[API] cache.ts loaded, exports:', Object.keys(cacheModule));
  
  // Verify exports exist
  if (!agentsModule.generateAgentTrades) {
    throw new Error('generateAgentTrades not found in generator.ts');
  }
  if (!domainModule.getAgentProfile) {
    throw new Error('getAgentProfile not found in domain.ts');
  }
  if (!domainModule.isValidAgentId) {
    throw new Error('isValidAgentId not found in domain.ts');
  }
  if (!domainModule.ALL_AGENT_IDS) {
    throw new Error('ALL_AGENT_IDS not found in domain.ts');
  }
  if (!summaryModule.buildAgentSummary) {
    throw new Error('buildAgentSummary not found in summary.ts');
  }
  if (!summaryModule.computeSummaryStats) {
    throw new Error('computeSummaryStats not found in summary.ts');
  }
  if (!statsModule.calculateAllAgentStats) {
    throw new Error('calculateAllAgentStats not found in stats.ts');
  }
  
  generateAgentTrades = agentsModule.generateAgentTrades;
  getAgentResearch = agentsModule.getAgentResearch;
  getAgentProfile = domainModule.getAgentProfile;
  isValidAgentId = domainModule.isValidAgentId;
  ALL_AGENT_IDS = domainModule.ALL_AGENT_IDS;
  buildAgentSummary = summaryModule.buildAgentSummary;
  computeSummaryStats = summaryModule.computeSummaryStats;
  calculateAllAgentStats = statsModule.calculateAllAgentStats;
  getCachedTradesQuick = cacheModule.getCachedTradesQuick;
  
  console.log('[API] ✅ Successfully loaded TypeScript trading engine modules');
  console.log('[API] generateAgentTrades type:', typeof generateAgentTrades);
} catch (error) {
  console.error('[API] ❌ Failed to load TypeScript modules:', error.message);
  console.error('[API] Stack:', error.stack);
  console.error('[API] Make sure server is run with: node --import tsx server/index.js');
  throw error;
}

export {
  generateAgentTrades,
  getAgentResearch,
  getAgentProfile,
  isValidAgentId,
  ALL_AGENT_IDS,
  buildAgentSummary,
  computeSummaryStats,
  calculateAllAgentStats,
  getCachedTradesQuick,
};
