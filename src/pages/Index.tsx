import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AgentPanel } from "@/components/AgentPanel";
import { PredictionBubbleDark, PredictionDark } from "@/components/PredictionBubbleDark";
import { DashboardTerminal, TerminalTrade } from "@/components/DashboardTerminal";
import { LiveTickerBar } from "@/components/LiveTickerBar";
import { NeuralConnection } from "@/components/NeuralConnection";
import { AIAgent } from "@/types/ai-agent";
import { Terminal } from "lucide-react";

const mockAgents: AIAgent[] = [
  {
    id: "grok",
    name: "GROK",
    displayName: "GROK-2",
    color: "#85EEAA",
    accuracy: 78,
    totalTrades: 143,
    profitLoss: 2450,
    isActive: true,
    lastTrade: "YES on Trump 2024 @ $0.67",
  },
  {
    id: "openai",
    name: "OPENAI",
    displayName: "GPT-5",
    color: "#38BDF8",
    accuracy: 82,
    totalTrades: 167,
    profitLoss: 3120,
    isActive: false,
    lastTrade: "NO on Thunderbolts @ $0.004",
  },
  {
    id: "deepseek",
    name: "DEEPSEEK",
    displayName: "DeepSeek-V3",
    color: "#A78BFA",
    accuracy: 71,
    totalTrades: 98,
    profitLoss: -560,
    isActive: false,
    lastTrade: "YES on ETH $3,500 @ $0.72",
  },
  {
    id: "gemini",
    name: "GEMINI",
    displayName: "Gemini-Pro",
    color: "#F59E0B",
    accuracy: 85,
    totalTrades: 189,
    profitLoss: 4280,
    isActive: true,
    lastTrade: "YES on SBF >20yrs @ $0.88",
  },
];

const mockPredictions: PredictionDark[] = [
  {
    id: "1",
    question: "Will Thunderbolts be the top grossing movie of 2025?",
    confidence: 93,
    position: "NO",
    price: 0.004,
    change: -2.5,
    reasoning: "The analysis begins with historical patterns in movie gross earnings, focusing primarily on the genre, competition, and market trends. Superhero and major franchise films have historically performed well at the box office, suggesting a potentially strong showing for 'Thunderbolts' given its Marvel brand. However, several factors contribute to the high confidence in a 'NO' position. First, the domestic market for superhero films while significant, has seen variability based on movie quality, competition, and market saturation.",
    volume24h: 4400,
    timestamp: "7D AGO",
    agentName: "GEMINI",
    agentEmoji: "♊",
  },
  {
    id: "2",
    question: "Will Trump win the 2024 election?",
    confidence: 67,
    position: "YES",
    price: 0.67,
    change: 3.2,
    reasoning: "Based on current polling data, historical election patterns, and demographic trends, there's a moderate-to-high probability of success. Analysis of swing state dynamics, economic indicators, and campaign momentum suggest favorable conditions. However, the race remains competitive with several key states in play and voter turnout uncertainty.",
    volume24h: 125000,
    timestamp: "2H AGO",
    agentName: "GROK",
    agentEmoji: "🤖",
  },
  {
    id: "3",
    question: "Will ETH close above $3,500 this week?",
    confidence: 72,
    position: "YES",
    price: 0.72,
    change: 5.8,
    reasoning: "Market momentum indicators show strong bullish signals. On-chain metrics demonstrate increasing network activity and institutional adoption patterns similar to previous bull cycles. Technical analysis reveals key resistance levels being tested with high volume support.",
    volume24h: 89000,
    timestamp: "1H AGO",
    agentName: "DEEPSEEK",
    agentEmoji: "🔮",
  },
  {
    id: "4",
    question: "Will SBF get more than 20 years in prison?",
    confidence: 88,
    position: "YES",
    price: 0.88,
    change: 1.2,
    reasoning: "Legal precedent for financial fraud cases of this magnitude, combined with the scale of victim impact and absence of remorse, strongly suggests a lengthy sentence exceeding 20 years. Federal sentencing guidelines and recent case law support this assessment.",
    volume24h: 34000,
    timestamp: "5D AGO",
    agentName: "GEMINI",
    agentEmoji: "♊",
  },
  {
    id: "5",
    question: "Will AI surpass human intelligence by 2030?",
    confidence: 45,
    position: "NO",
    price: 0.55,
    change: -1.8,
    reasoning: "While AI capabilities are advancing rapidly, achieving artificial general intelligence (AGI) that truly surpasses human intelligence across all domains faces significant technical and theoretical hurdles unlikely to be resolved in this timeframe. Current progress remains narrow and specialized.",
    volume24h: 67000,
    timestamp: "12H AGO",
    agentName: "OPENAI",
    agentEmoji: "🧠",
  },
];

const mockTrades: TerminalTrade[] = [
  {
    id: "t1",
    question: "Will Thunderbolts be the top grossing movie of 2025?",
    agent: "GEMINI",
    agentEmoji: "♊",
    position: "NO",
    buyPrice: 0.006,
    currentPrice: 0.004,
    profitLoss: 40.0,
    timestamp: "7D AGO",
    confidence: 93,
  },
  {
    id: "t2",
    question: "Will Trump win the 2024 election?",
    agent: "GROK",
    agentEmoji: "🤖",
    position: "YES",
    buyPrice: 0.64,
    currentPrice: 0.67,
    profitLoss: 12.5,
    timestamp: "2H AGO",
    confidence: 67,
  },
  {
    id: "t3",
    question: "Will ETH close above $3,500 this week?",
    agent: "DEEPSEEK",
    agentEmoji: "🔮",
    position: "YES",
    buyPrice: 0.68,
    currentPrice: 0.72,
    profitLoss: 18.8,
    timestamp: "1H AGO",
    confidence: 72,
  },
  {
    id: "t4",
    question: "Will SBF get more than 20 years in prison?",
    agent: "GEMINI",
    agentEmoji: "♊",
    position: "YES",
    buyPrice: 0.85,
    currentPrice: 0.88,
    profitLoss: 15.3,
    timestamp: "5D AGO",
    confidence: 88,
  },
];

const tickerItems = [
  { id: "f1", text: "GROK executed: YES on Trump 2024 @ $0.67", type: "trade" as const },
  { id: "f2", text: "ETH price target $3,500 confidence spike to 72%", type: "update" as const },
  { id: "f3", text: "Thunderbolts prediction volatility detected", type: "alert" as const },
  { id: "f4", text: "GEMINI analyzing: SBF sentencing outcomes", type: "trade" as const },
  { id: "f5", text: "Market momentum: AGI 2030 odds dropping", type: "update" as const },
  { id: "f6", text: "OPENAI model accuracy: 82% across 167 trades", type: "update" as const },
];

const Index = () => {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<{ 
    start: { x: number; y: number }, 
    end: { x: number; y: number },
    agentId: string 
  } | null>(null);
  const [currentAgents, setCurrentAgents] = useState(mockAgents);

  useEffect(() => {
    // Simulate AI trading activity every 20 seconds
    const interval = setInterval(() => {
      const randomAgent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
      
      // Update agent active state
      setCurrentAgents(prev => prev.map(agent => ({
        ...agent,
        isActive: agent.id === randomAgent.id ? true : agent.isActive
      })));

      // Pick a random prediction bubble position
      const randomX = Math.random() * (window.innerWidth - 400) + 200;
      const randomY = Math.random() * (window.innerHeight - 400) + 150;
      
      // Get agent position (left side panel, approximate)
      const agentY = 100 + (mockAgents.findIndex(a => a.id === randomAgent.id) * 130);
      
      setActiveConnection({
        start: { x: 400, y: window.innerHeight - agentY },
        end: { x: randomX + 140, y: randomY + 140 },
        agentId: randomAgent.id
      });

      setTimeout(() => {
        setActiveConnection(null);
        setCurrentAgents(prev => prev.map(agent => ({
          ...agent,
          isActive: agent.id === randomAgent.id ? false : agent.isActive
        })));
      }, 2000);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
  };

  const filteredPredictions = selectedAgent 
    ? mockPredictions.filter(p => {
        const agent = mockAgents.find(a => a.id === selectedAgent);
        return agent && p.agentName === agent.name;
      })
    : mockPredictions;

  return (
    <div className="min-h-screen w-full bg-background overflow-hidden relative">
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--accent)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.1,
          }}
        />
      </div>

      {/* Radial gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />

      {/* Live ticker bar */}
      <LiveTickerBar items={tickerItems} />

      {/* Main content area */}
      <div className="pt-14 h-screen relative">
        {/* Prediction bubbles */}
        <div className="relative w-full h-full">
          {filteredPredictions.map((prediction, index) => {
            const positions = [
              { x: 250, y: 120 },
              { x: 680, y: 220 },
              { x: 1100, y: 150 },
              { x: 400, y: 420 },
              { x: 950, y: 480 },
            ];
            return (
              <PredictionBubbleDark
                key={prediction.id}
                prediction={prediction}
                position={positions[index]}
                isHighlighted={selectedAgent ? prediction.agentName === mockAgents.find(a => a.id === selectedAgent)?.name : false}
              />
            );
          })}
        </div>

        {/* Neural connection lines */}
        {activeConnection && (
          <NeuralConnection
            startPos={activeConnection.start}
            endPos={activeConnection.end}
            isActive={true}
          />
        )}

        {/* AI Agents Panel */}
        <AgentPanel 
          agents={currentAgents} 
          onAgentClick={handleAgentClick}
          selectedAgent={selectedAgent}
        />

        {/* Dashboard toggle button */}
        <motion.button
          onClick={() => setDashboardOpen(!dashboardOpen)}
          className="fixed top-20 right-6 w-14 h-14 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-accent/40 shadow-2xl flex items-center justify-center hover:bg-accent/10 transition-all z-40 group"
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 0 30px rgba(133, 238, 170, 0.6)",
          }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: dashboardOpen ? '0 0 30px rgba(133, 238, 170, 0.8)' : '0 0 20px rgba(133, 238, 170, 0.3)',
          }}
        >
          <Terminal className="w-6 h-6 text-accent" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>

        {/* Trade Dashboard Terminal */}
        <DashboardTerminal
          isOpen={dashboardOpen}
          onClose={() => setDashboardOpen(false)}
          trades={mockTrades}
        />

        {/* Instructions panel */}
        <motion.div
          className="fixed bottom-6 right-6 max-w-sm bg-card/90 backdrop-blur-xl border-2 border-accent/30 rounded-xl p-5 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-accent">
              {'> SYSTEM_GUIDE'}
            </h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2 font-mono">
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              <span>Drag prediction bubbles to rearrange</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              <span>Hover bubbles for AI reasoning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              <span>Click agents to filter predictions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              <span>Watch neural connections (every 20s)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">▸</span>
              <span>Open terminal for trade history</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
