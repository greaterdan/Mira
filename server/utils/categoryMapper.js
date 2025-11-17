// Category Mapping Utility
// Maps Polymarket categories/tags to our category system

export function mapCategoryToPolymarket(category) {
  const categoryMap = {
    'Politics': 'politics',
    'Elections': 'politics',
    'Sports': 'sports',
    'Crypto': 'crypto',
    'Finance': 'finance',
    'Tech': 'tech',
    'Geopolitics': 'politics',
    'Earnings': 'finance',
    'World': null,
    'Breaking': null,
    'Trending': null,
    'New': null,
  };
  return categoryMap[category] || null;
}

export function detectCategoryFromMarket(market) {
  const category = market.category?.toLowerCase() || '';
  const tags = (market.tags || []).map(t => String(t || '').toLowerCase()).filter(t => t);
  const question = (market.question || market.title || '').toLowerCase();

  // Politics
  if (category.includes('politics') || category.includes('election') ||
      tags.some(t => t.includes('politics') || t.includes('election') || t.includes('trump') || t.includes('biden')) ||
      question.includes('election') || question.includes('president') || question.includes('trump') || question.includes('biden') ||
      question.includes('congress') || question.includes('senate') || question.includes('house') || question.includes('government')) {
    return 'Politics';
  }

  // Elections
  if (category === 'elections' || tags.some(t => t.includes('election') && !t.includes('politics'))) {
    return 'Elections';
  }

  // Sports
  if (category.includes('sports') ||
      tags.some(t => t.includes('sports') || t.includes('football') || t.includes('basketball') || t.includes('soccer') || t.includes('nfl') || t.includes('nba')) ||
      question.includes('super bowl') || question.includes('nfl') || question.includes('nba') ||
      question.includes('football') || question.includes('basketball') || question.includes('soccer') ||
      question.includes('baseball') || question.includes('hockey') || question.includes('tennis') ||
      question.includes('championship') || question.includes('playoff') || question.includes('world cup') ||
      question.includes('olympics') || question.includes('ncaa') || question.includes('ufc')) {
    return 'Sports';
  }

  // Crypto
  if (category.includes('crypto') || category.includes('cryptocurrency') ||
      tags.some(t => t.includes('crypto') || t.includes('bitcoin') || t.includes('ethereum') || t.includes('btc') || t.includes('eth') || t.includes('solana')) ||
      question.includes('bitcoin') || question.includes('ethereum') || question.includes('crypto') ||
      question.includes('btc') || question.includes('eth') || question.includes('solana') ||
      question.includes('blockchain') || question.includes('defi') || question.includes('nft')) {
    return 'Crypto';
  }

  // Finance
  if (category.includes('finance') || category.includes('earnings') || category.includes('stocks') ||
      tags.some(t => t.includes('finance') || t.includes('earnings') || t.includes('stock') || t.includes('trading')) ||
      question.includes('stock') || question.includes('earnings') || question.includes('revenue') ||
      question.includes('profit') || question.includes('dow') || question.includes('s&p') ||
      question.includes('nasdaq') || question.includes('fed') || question.includes('interest rate')) {
    return 'Finance';
  }

  // Earnings
  if (category.includes('earnings') || tags.some(t => t.includes('earnings') && !t.includes('finance'))) {
    return 'Earnings';
  }

  // Tech - be specific, don't just match company names
  if (category.includes('tech') || category.includes('technology') ||
      tags.some(t => t.includes('tech') || t.includes('ai') || t.includes('artificial intelligence') || t.includes('software')) ||
      question.includes('artificial intelligence') || question.includes('chatgpt') ||
      question.includes('gpt') || question.includes('openai') ||
      question.includes('software') || question.includes('algorithm') ||
      question.includes('machine learning') || question.includes('neural network')) {
    return 'Tech';
  }

  // Geopolitics
  if (category.includes('geopolitics') || category.includes('geopolitical') ||
      tags.some(t => t.includes('geopolitics') || t.includes('war') || t.includes('conflict') || t.includes('ukraine') || t.includes('russia'))) {
    return 'Geopolitics';
  }

  // Default
  return 'World';
}

