import React from 'react';
import {
  Activity,
  Cpu,
  BarChart3,
  Server,
  Sparkles,
  BookOpen,
  Radio,
  Laptop
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mode: 'LIVE' | 'SIMULATION';
  isLiveRunning: boolean;
  aiStatus: 'ONLINE' | 'OFFLINE';
  currentCpu: number | null;
  onOpenConnectModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mode,
  isLiveRunning,
  aiStatus,
  currentCpu,
  onOpenConnectModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'forecast', label: 'Workload Predictor', icon: Cpu },
    { id: 'accuracy', label: 'Model Reliability', icon: Activity },
    { id: 'scaling', label: 'Auto-Scaling Rules', icon: Server },
    { id: 'ai-inspector', label: 'AI Assistant', icon: Sparkles },
    { id: 'about', label: 'How It Works', icon: BookOpen }
  ];

  return (
    <header className="border-b border-neutral-800 bg-black/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-white text-black p-0.5 shadow-md flex items-center justify-center transition group-hover:scale-105">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center text-white">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base tracking-tight font-sans">
                  CPU Pulse
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700">
                  Smart Scaling
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Proactive Cloud Capacity & Workload Forecasting
              </p>
            </div>
          </div>

          {/* Right Header Status & Action Buttons */}
          <div className="flex items-center space-x-2.5 text-xs">
            {/* Connect Machine / Ingest Data Button */}
            {onOpenConnectModal && (
              <button
                onClick={onOpenConnectModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-sm transition"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Machine</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            {/* Live CPU indicator */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <Radio
                className={`w-3.5 h-3.5 ${
                  isLiveRunning ? 'text-white live-dot' : 'text-neutral-500'
                }`}
              />
              <span className="text-neutral-400">Workload:</span>
              <span className="font-mono font-bold text-white">
                {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
              </span>
            </div>

            {/* Mode badge */}
            <div
              className={`px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                mode === 'LIVE'
                  ? 'bg-neutral-900 text-white border-neutral-700'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800'
              }`}
            >
              {mode === 'LIVE' ? 'LIVE STREAM' : 'DEMO TRAFFIC'}
            </div>

            {/* AI Status badge */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                aiStatus === 'ONLINE'
                  ? 'bg-neutral-900 text-white border-neutral-700'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>AI {aiStatus}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-neutral-800 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black border border-white font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
