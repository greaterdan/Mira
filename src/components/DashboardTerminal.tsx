import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, TrendingUp, TrendingDown, ArrowUpDown, Zap } from "lucide-react";
import { useState } from "react";

export interface TerminalTrade {
  id: string;
  question: string;
  agent: string;
  agentEmoji: string;
  position: "YES" | "NO";
  buyPrice: number;
  currentPrice: number;
  profitLoss: number;
  timestamp: string;
  confidence: number;
}

interface DashboardTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TerminalTrade[];
}

export const DashboardTerminal = ({ isOpen, onClose, trades }: DashboardTerminalProps) => {
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'confidence'>('date');

  const sortedTrades = [...trades].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.profitLoss - a.profitLoss;
      case 'confidence':
        return b.confidence - a.confidence;
      case 'date':
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });

  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const winRate = (trades.filter(t => t.profitLoss > 0).length / trades.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed right-0 top-0 h-full w-[600px] bg-card/95 backdrop-blur-xl border-l-2 border-accent/40 shadow-2xl z-50 overflow-hidden"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="h-full flex flex-col">
            {/* Terminal header */}
            <div className="bg-accent/10 border-b-2 border-accent/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Terminal className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-accent uppercase tracking-wider">
                      {'> TRADE_TERMINAL'}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">System.Live.Trading.History</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 rounded-lg bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive/40 flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-destructive" />
                </motion.button>
              </div>

              {/* Stats panel */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background/50 rounded-lg p-3 border-2 border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL_TRADES</div>
                  <div className="text-2xl font-display font-bold text-foreground">{trades.length}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border-2 border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">WIN_RATE</div>
                  <div className="text-2xl font-display font-bold text-trade-yes">
                    {winRate.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border-2 border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">NET_P/L</div>
                  <div className={`text-2xl font-display font-bold ${totalProfitLoss >= 0 ? 'text-trade-yes' : 'text-trade-no'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sort controls */}
            <div className="px-6 py-3 border-b border-border/50 bg-background/30 flex items-center gap-3">
              <ArrowUpDown className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">SORT_BY:</span>
              <div className="flex gap-2">
                {(['date', 'profit', 'confidence'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all uppercase ${
                      sortBy === sort
                        ? 'bg-accent/20 text-accent border-2 border-accent/40'
                        : 'bg-muted/50 text-muted-foreground border-2 border-border/40 hover:border-accent/30'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            {/* Trades list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {sortedTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-background/50 border-2 border-border/50 hover:border-accent/40 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{trade.agentEmoji}</span>
                        <span className="text-xs font-display font-bold text-accent uppercase">
                          {trade.agent}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-display font-bold border ${
                          trade.position === 'YES' 
                            ? 'bg-trade-yes/20 text-trade-yes border-trade-yes' 
                            : 'bg-trade-no/20 text-trade-no border-trade-no'
                        }`}>
                          {trade.position}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono ml-auto">{trade.timestamp}</span>
                      </div>
                      <h4 className="font-medium text-sm leading-tight mb-3 text-foreground/90">{trade.question}</h4>
                    </div>
                    <div className={`ml-4 flex items-center gap-2 font-display font-bold text-lg ${
                      trade.profitLoss >= 0 ? 'text-trade-yes' : 'text-trade-no'
                    }`}>
                      {trade.profitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span>{trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-card/50 rounded p-2 border border-border/50">
                      <div className="text-muted-foreground mb-0.5">BUY_PRICE</div>
                      <div className="font-bold text-foreground">${trade.buyPrice.toFixed(3)}</div>
                    </div>
                    <div className="bg-card/50 rounded p-2 border border-border/50">
                      <div className="text-muted-foreground mb-0.5">CURRENT</div>
                      <div className="font-bold text-foreground">${trade.currentPrice.toFixed(3)}</div>
                    </div>
                    <div className="bg-card/50 rounded p-2 border border-border/50">
                      <div className="text-muted-foreground mb-0.5">CONFIDENCE</div>
                      <div className="font-bold text-accent">{trade.confidence}%</div>
                    </div>
                    <div className="bg-card/50 rounded p-2 border border-border/50">
                      <div className="text-muted-foreground mb-0.5">DELTA</div>
                      <div className={`font-bold ${trade.profitLoss >= 0 ? 'text-trade-yes' : 'text-trade-no'}`}>
                        {((trade.currentPrice - trade.buyPrice) / trade.buyPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Performance sparkline */}
                  <div className="mt-3 h-1 bg-background/70 rounded-full overflow-hidden border border-border/50">
                    <motion.div
                      className={`h-full ${trade.profitLoss >= 0 ? 'bg-trade-yes' : 'bg-trade-no'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(Math.abs(trade.profitLoss) * 5, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{
                        boxShadow: trade.profitLoss >= 0
                          ? '0 0 10px rgba(133, 238, 170, 0.6)'
                          : '0 0 10px rgba(239, 68, 68, 0.6)',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Terminal footer */}
            <div className="bg-accent/10 border-t-2 border-accent/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono text-muted-foreground">LIVE_FEED_ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <motion.div
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{
                    opacity: [1, 0.3, 1],
                    scale: [1, 0.8, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-accent">SYSTEM_ONLINE</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
