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
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'forecast', label: 'Forecast Analysis', icon: Cpu },
    { id: 'accuracy', label: 'Accuracy & Windows', icon: Activity },
    { id: 'scaling', label: 'Cloud Scaling', icon: Server },
    { id: 'ai-inspector', label: 'AI Inspector', icon: Sparkles },
    { id: 'about', label: 'Mathematics & About', icon: BookOpen }
  ];

  return (
    <header className="border-b border-gray-800 bg-[#0B0F17]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-wide">
                  CPU FORECASTING ENGINE
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-900/50 text-sky-300 border border-sky-700/50">
                  Math v1.0
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Moving Average Methods for Cloud Resource Management
              </p>
            </div>
          </div>

          {/* Status Badges & Connect Button */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Connect Machine / Ingest Data Button */}
            {onOpenConnectModal && (
              <button
                onClick={onOpenConnectModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-600/50 font-medium text-xs transition shadow-sm"
              >
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Connect Machine / Data</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            {/* Live CPU indicator */}
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded bg-gray-900 border border-gray-800">
              <Radio className={`w-3.5 h-3.5 ${isLiveRunning ? 'text-emerald-400 live-dot' : 'text-gray-500'}`} />
              <span className="text-gray-400">Live CPU:</span>
              <span className="font-mono font-semibold text-white">
                {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
              </span>
            </div>

            {/* Mode badge */}
            <div className={`px-2.5 py-1 rounded border font-mono font-medium ${
              mode === 'LIVE'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
            }`}>
              {mode} MODE
            </div>

            {/* AI Status badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-mono font-medium ${
              aiStatus === 'ONLINE'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
            }`}>
              <Sparkles className="w-3 h-3" />
              <span>AI: {aiStatus}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-gray-800/80 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-950/70 text-sky-300 border border-sky-700/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
