import { motion } from "framer-motion";
import { Bot, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { AIAgent } from "@/types/ai-agent";

interface AgentPanelProps {
  agents: AIAgent[];
  onAgentClick: (agentId: string) => void;
  selectedAgent: string | null;
}

const agentIcons: Record<string, string> = {
  GROK: "🤖",
  OPENAI: "🧠",
  DEEPSEEK: "🔮",
  GEMINI: "♊",
};

export const AgentPanel = ({ agents, onAgentClick, selectedAgent }: AgentPanelProps) => {
  return (
    <motion.div
      className="fixed left-6 bottom-6 w-80 bg-card/90 backdrop-blur-xl border-2 border-accent/30 rounded-xl overflow-hidden shadow-2xl"
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Header */}
      <div className="bg-accent/10 border-b-2 border-accent/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-accent">
              AI Agents
            </h2>
            <p className="text-xs text-muted-foreground">Live Trading Network</p>
          </div>
        </div>
      </div>

      {/* Agents list */}
      <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
        {agents.map((agent, index) => (
          <motion.button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              selectedAgent === agent.id
                ? 'border-accent/60 bg-accent/20'
                : 'border-border/40 bg-card/50 hover:border-accent/40 hover:bg-accent/10'
            }`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{agentIcons[agent.name]}</span>
                <div className="text-left">
                  <div className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                    {agent.displayName}
                    {agent.isActive && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-accent"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.5, 1],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {agent.totalTrades} trades
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${
                agent.profitLoss >= 0 ? 'text-trade-yes' : 'text-trade-no'
              }`}>
                {agent.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{agent.profitLoss >= 0 ? '+' : ''}${agent.profitLoss.toFixed(0)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background/50 rounded p-2">
                <div className="text-muted-foreground mb-0.5">Accuracy</div>
                <div className="font-bold text-foreground">{agent.accuracy}%</div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-muted-foreground mb-0.5">Status</div>
                <div className={`font-bold ${agent.isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                  {agent.isActive ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            </div>

            {/* Last trade */}
            {agent.lastTrade && (
              <motion.div
                className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" />
                  <span className="truncate">{agent.lastTrade}</span>
                </div>
              </motion.div>
            )}

            {/* Performance bar */}
            <div className="mt-2 h-1 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${agent.accuracy >= 70 ? 'bg-trade-yes' : agent.accuracy >= 50 ? 'bg-trade-neutral' : 'bg-trade-no'}`}
                initial={{ width: 0 }}
                animate={{ width: `${agent.accuracy}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-accent/10 border-t-2 border-accent/30 p-3">
        <div className="text-xs text-center text-muted-foreground font-mono">
          <span className="text-accent">●</span> NEURAL NETWORK ACTIVE
        </div>
      </div>
    </motion.div>
  );
};
