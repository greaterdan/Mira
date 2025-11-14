import { motion } from "framer-motion";
import { useState } from "react";

export interface PredictionNodeData {
  id: string;
  question: string;
  probability: number;
  position: "YES" | "NO";
  price: number;
  change: number;
  agentName: string;
  agentEmoji: string;
  reasoning: string;
}

interface PredictionNodeProps {
  data: PredictionNodeData;
  position: { x: number; y: number };
  isHighlighted?: boolean;
  onClick?: () => void;
}

export const PredictionNode = ({ data, position, isHighlighted, onClick }: PredictionNodeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const borderColor = data.position === "YES" 
    ? "border-trade-yes" 
    : data.position === "NO" 
    ? "border-trade-no" 
    : "border-terminal-gray";

  const accentColor = data.position === "YES" 
    ? "text-trade-yes" 
    : "text-trade-no";

  return (
    <>
      <motion.div
        className={`absolute cursor-pointer select-none`}
        style={{ left: position.x, top: position.y }}
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={isHighlighted ? { 
          borderColor: data.position === "YES" ? "#6b9e7d" : "#ba6b6b",
          boxShadow: "0 0 8px rgba(134, 239, 172, 0.3)"
        } : {}}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
      >
        <div className={`w-64 bg-card border ${borderColor} p-4 rounded-full ${isHighlighted ? 'opacity-100' : 'opacity-90'}`}>
          {/* Market Title */}
          <div className="text-xs text-foreground mb-2 leading-tight font-medium">
            {data.question}
          </div>

          {/* Probability & Position */}
          <div className="flex items-baseline justify-between mb-2">
            <div className={`text-2xl font-bold ${accentColor} tracking-tight`}>
              {data.probability}%
            </div>
            <div className={`text-xs px-2 py-0.5 border ${borderColor} ${accentColor} font-mono rounded-full`}>
              {data.position}
            </div>
          </div>

          {/* Agent & Price Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>{data.agentEmoji}</span>
              <span className="font-mono">{data.agentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-mono">${data.price.toFixed(2)}</span>
              <span className={data.change >= 0 ? 'text-trade-yes' : 'text-trade-no'}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Pulse animation on highlight */}
        {isHighlighted && (
          <motion.div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none rounded-full`}
            animate={{
              opacity: [0.5, 0, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Hover Tooltip */}
      {showTooltip && (
        <motion.div
          className="fixed z-50 w-80 bg-card border border-border p-3 shadow-lg rounded-xl"
          style={{ 
            left: position.x + 280, 
            top: position.y,
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-xs text-terminal-accent font-mono mb-2">
            &gt; AI_REASONING
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed mb-3">
            {data.reasoning}
          </div>
          <div className="text-xs text-foreground mb-2">
            Current odds: <span className={accentColor}>{data.probability}%</span>
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <button className="text-xs px-2 py-1 border border-border hover:bg-muted transition-colors">
              Open in Chart
            </button>
            <button className="text-xs px-2 py-1 border border-border hover:bg-muted transition-colors">
              Show Trades
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};
