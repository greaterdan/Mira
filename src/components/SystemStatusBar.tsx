import { useEffect, useState } from "react";

interface FeedItem {
  id: string;
  text: string;
}

const feedItems: FeedItem[] = [
  { id: "1", text: "GROK bought YES on Trump 2024 @ 0.67" },
  { id: "2", text: "DEEPSEEK flipped to NO on AGI 2030" },
  { id: "3", text: "GEMINI decreased confidence on ETH > $4k" },
  { id: "4", text: "OPENAI executed: NO on Thunderbolts @ 0.004" },
  { id: "5", text: "GROK analyzing: SBF sentencing outcomes" },
];

export const SystemStatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className="h-8 bg-bg-elevated border-b border-border flex items-center px-4 text-xs font-mono hover:bg-bg-card transition-colors">
      {/* Left: Status */}
      <div className="flex items-center gap-2 min-w-32">
        <span className="text-text-secondary uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>&gt; LIVE_FEED</span>
        <div className="w-1.5 h-1.5 rounded-full bg-trade-yes animate-pulse" />
      </div>

      {/* Center: Scrolling Feed */}
      <div className="flex-1 overflow-hidden mx-4">
        <div className="animate-marquee whitespace-nowrap text-text-secondary">
          {feedItems.map((item, index) => (
            <span key={item.id}>
              {item.text}
              {index < feedItems.length - 1 && " | "}
            </span>
          ))}
        </div>
      </div>

      {/* Right: System Time */}
      <div className="text-text-muted min-w-40 text-right">
        SYS_TIME {formatTime(currentTime)}
      </div>
    </div>
  );
};
