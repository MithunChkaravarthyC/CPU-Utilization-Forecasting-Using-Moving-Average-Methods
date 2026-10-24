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
    <header className="border-b border-slate-800/80 bg-[#090D16]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 p-0.5 shadow-md shadow-cyan-500/10 group-hover:shadow-cyan-500/25 transition">
              <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base tracking-tight font-sans">
                  CPU Pulse
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Smart Scaling
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-sm transition"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Machine</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            {/* Live CPU indicator */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <Radio
                className={`w-3.5 h-3.5 ${
                  isLiveRunning ? 'text-emerald-400 live-dot' : 'text-slate-500'
                }`}
              />
              <span className="text-slate-400">Workload:</span>
              <span className="font-mono font-bold text-white">
                {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
              </span>
            </div>

            {/* Mode badge */}
            <div
              className={`px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                mode === 'LIVE'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
              }`}
            >
              {mode === 'LIVE' ? 'LIVE STREAM' : 'DEMO TRAFFIC'}
            </div>

            {/* AI Status badge */}
            <div
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                aiStatus === 'ONLINE'
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>AI {aiStatus}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-3 border-t border-slate-800/80 overflow-x-auto py-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
