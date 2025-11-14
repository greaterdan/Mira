import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { ReasoningModalDark } from "./ReasoningModalDark";

export interface PredictionDark {
  id: string;
  question: string;
  confidence: number;
  position: "YES" | "NO";
  price: number;
  change: number;
  reasoning: string;
  volume24h: number;
  timestamp: string;
  agentName: string;
  agentEmoji: string;
}

interface PredictionBubbleDarkProps {
  prediction: PredictionDark;
  position: { x: number; y: number };
  isHighlighted?: boolean;
}

export const PredictionBubbleDark = ({ prediction, position, isHighlighted = false }: PredictionBubbleDarkProps) => {
  const [showReasoning, setShowReasoning] = useState(false);

  const isYes = prediction.position === "YES";
  const glowColor = isYes 
    ? "rgba(133, 238, 170, 0.6)" 
    : "rgba(239, 68, 68, 0.6)";

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isHighlighted ? 1.1 : 1, 
          opacity: 1,
        }}
        whileHover={{ scale: isHighlighted ? 1.15 : 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="absolute cursor-grab active:cursor-grabbing"
        style={{ left: position.x, top: position.y }}
        onHoverStart={() => setShowReasoning(true)}
        onHoverEnd={() => setShowReasoning(false)}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ 
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Main bubble */}
        <motion.div
          className="relative w-72 h-72 rounded-full bg-card/80 backdrop-blur-sm border-2 overflow-hidden"
          style={{
            borderColor: isYes ? 'hsl(var(--trade-yes))' : 'hsl(var(--trade-no))',
            boxShadow: isYes 
              ? '0 0 30px rgba(133, 238, 170, 0.4), inset 0 0 20px rgba(133, 238, 170, 0.1)'
              : '0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1)',
          }}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <motion.div
              className="w-full h-1 bg-gradient-to-r from-transparent via-foreground to-transparent"
              animate={{ y: [0, 288] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="relative p-6 h-full flex flex-col items-center justify-center text-center space-y-3">
            {/* Agent badge */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border border-accent/40"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-lg">{prediction.agentEmoji}</span>
              <span className="text-xs font-display font-bold text-accent uppercase tracking-wider">
                {prediction.agentName}
              </span>
            </motion.div>

            {/* Position badge */}
            <motion.div
              className={`px-5 py-2 rounded-lg font-display font-bold text-sm border-2 ${
                isYes 
                  ? 'bg-trade-yes/20 border-trade-yes text-trade-yes text-glow-green' 
                  : 'bg-trade-no/20 border-trade-no text-trade-no text-glow-red'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {prediction.position}
            </motion.div>

            {/* Confidence */}
            <motion.div
              className={`text-6xl font-display font-black ${
                isYes ? 'text-trade-yes text-glow-green' : 'text-trade-no text-glow-red'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {prediction.confidence}%
            </motion.div>

            {/* Question */}
            <p className="text-sm font-medium leading-tight line-clamp-3 text-foreground/90">
              {prediction.question}
            </p>

            {/* Market data */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">$</span>
                <span className="font-bold text-foreground">{prediction.price.toFixed(3)}</span>
              </div>
              <div className={`flex items-center gap-1 font-bold ${prediction.change >= 0 ? 'text-trade-yes' : 'text-trade-no'}`}>
                {prediction.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{prediction.change >= 0 ? '+' : ''}{prediction.change.toFixed(2)}%</span>
              </div>
            </div>

            {/* Volume */}
            <div className="text-xs text-muted-foreground font-mono">
              VOL: ${prediction.volume24h.toLocaleString()}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider border-t border-border/50 pt-2">
              {prediction.timestamp}
            </div>

            {/* Hover hint */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100"
              whileHover={{ opacity: 1 }}
            >
              <div className="flex items-center gap-1 text-xs text-accent">
                <Eye className="w-3 h-3" />
                <span className="font-mono">HOVER FOR REASONING</span>
              </div>
            </motion.div>
          </div>

          {/* Rotating border effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${isYes ? 'hsl(var(--trade-yes))' : 'hsl(var(--trade-no))'} 10%, transparent 20%)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.div>

      {showReasoning && (
        <ReasoningModalDark
          prediction={prediction}
          position={{ x: position.x + 300, y: position.y }}
        />
      )}
    </>
  );
};
