import { motion } from "framer-motion";
import { PredictionDark } from "./PredictionBubbleDark";
import { Terminal, Cpu } from "lucide-react";

interface ReasoningModalDarkProps {
  prediction: PredictionDark;
  position: { x: number; y: number };
}

export const ReasoningModalDark = ({ prediction, position }: ReasoningModalDarkProps) => {
  return (
    <motion.div
      className="absolute z-50 w-[420px]"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, x: -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-card/95 backdrop-blur-xl border-2 border-accent/40 rounded-xl overflow-hidden shadow-2xl">
        {/* Terminal header */}
        <div className="bg-accent/10 border-b-2 border-accent/30 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-accent">
                  AI REASONING
                </h3>
                <motion.div
                  className="flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-accent"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{prediction.agentEmoji}</span>
                <p className="text-xs text-muted-foreground font-mono">
                  Model: {prediction.agentName}
                </p>
              </div>
            </div>
            <Cpu className="w-5 h-5 text-accent/60" />
          </div>
        </div>

        {/* Terminal content */}
        <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
          {/* Reasoning text with terminal effect */}
          <div className="relative">
            <div className="absolute top-0 left-0 text-xs text-accent/40 font-mono">
              {'> ANALYSIS_OUTPUT'}
            </div>
            <motion.div
              className="mt-6 p-4 bg-background/50 rounded-lg border border-border/50 font-mono text-sm leading-relaxed text-foreground/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {prediction.reasoning}
            </motion.div>
          </div>

          {/* Confidence meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">CONFIDENCE_LEVEL</span>
              <span className="font-bold text-accent">{prediction.confidence}%</span>
            </div>
            <div className="h-2 bg-background/50 rounded-full overflow-hidden border border-border/50">
              <motion.div
                className={`h-full ${
                  prediction.position === "YES" ? 'bg-trade-yes' : 'bg-trade-no'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${prediction.confidence}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                  boxShadow: prediction.position === "YES"
                    ? '0 0 10px rgba(133, 238, 170, 0.6)'
                    : '0 0 10px rgba(239, 68, 68, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
            <div className="bg-background/50 rounded p-2 border border-border/50">
              <div className="text-xs text-muted-foreground font-mono mb-1">POSITION</div>
              <div className={`text-sm font-display font-bold ${
                prediction.position === "YES" ? 'text-trade-yes' : 'text-trade-no'
              }`}>
                {prediction.position}
              </div>
            </div>
            <div className="bg-background/50 rounded p-2 border border-border/50">
              <div className="text-xs text-muted-foreground font-mono mb-1">PRICE</div>
              <div className="text-sm font-bold font-mono text-foreground">
                ${prediction.price.toFixed(3)}
              </div>
            </div>
            <div className="bg-background/50 rounded p-2 border border-border/50">
              <div className="text-xs text-muted-foreground font-mono mb-1">24H CHG</div>
              <div className={`text-sm font-bold font-mono ${
                prediction.change >= 0 ? 'text-trade-yes' : 'text-trade-no'
              }`}>
                {prediction.change >= 0 ? '+' : ''}{prediction.change.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Action button */}
          <motion.button
            className="w-full mt-4 px-4 py-3 bg-accent/20 hover:bg-accent/30 border-2 border-accent/40 text-accent font-display font-bold rounded-lg text-sm transition-all uppercase tracking-wider"
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(133, 238, 170, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            {'> VIEW_TRADE_DASHBOARD'}
          </motion.button>
        </div>

        {/* Terminal footer */}
        <div className="bg-accent/10 border-t-2 border-accent/30 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">SYS_STATUS</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-accent"
              animate={{
                opacity: [1, 0.3, 1],
                scale: [1, 0.8, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-accent">ONLINE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
