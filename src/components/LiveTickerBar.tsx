import { motion } from "framer-motion";
import { Radio, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface TickerItem {
  id: string;
  text: string;
  type: 'trade' | 'update' | 'alert';
}

interface LiveTickerBarProps {
  items: TickerItem[];
}

export const LiveTickerBar = ({ items }: LiveTickerBarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trade': return 'text-accent';
      case 'alert': return 'text-terminal-red';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trade': return '▸';
      case 'alert': return '⚠';
      default: return '●';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b-2 border-accent/30 z-40">
      <div className="h-full flex items-center px-6 gap-6">
        {/* Logo/Title */}
        <div className="flex items-center gap-3 border-r-2 border-border/50 pr-6">
          <motion.div
            className="w-8 h-8 rounded-lg bg-accent/20 border-2 border-accent/40 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 10px rgba(133, 238, 170, 0.4)",
                "0 0 20px rgba(133, 238, 170, 0.8)",
                "0 0 10px rgba(133, 238, 170, 0.4)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Radio className="w-4 h-4 text-accent" />
          </motion.div>
          <div>
            <h1 className="font-display text-sm font-bold uppercase tracking-wider text-accent">
              {'> LIVE_FEED'}
            </h1>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-6 border-r-2 border-border/50 pr-6">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-trade-yes"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1],
                boxShadow: [
                  "0 0 5px rgba(133, 238, 170, 0.6)",
                  "0 0 15px rgba(133, 238, 170, 1)",
                  "0 0 5px rgba(133, 238, 170, 0.6)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-trade-yes uppercase tracking-wider font-bold">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {items.length} SIGNALS
            </span>
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: [0, -2000] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...items, ...items, ...items].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center gap-2"
              >
                <span className={`${getTypeColor(item.type)} font-bold`}>
                  {getTypeIcon(item.type)}
                </span>
                <span className="text-sm font-mono text-foreground/80">{item.text}</span>
                <span className="text-xs text-muted-foreground font-mono">|</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* System time */}
        <div className="border-l-2 border-border/50 pl-6">
          <div className="text-xs font-mono">
            <div className="text-muted-foreground">SYS_TIME</div>
            <div className="text-accent font-bold tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
