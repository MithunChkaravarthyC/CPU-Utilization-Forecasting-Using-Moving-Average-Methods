import React, { useState } from 'react';
import { Play, Square, Trash2, Clock, CheckCircle2, AlertCircle, RefreshCw, Laptop } from 'lucide-react';
import { MonitorStatus } from '../types';

interface LiveMonitoringPanelProps {
  status: MonitorStatus | null;
  onStart: (intervalSeconds?: number) => Promise<void>;
  onStop: () => Promise<void>;
  onClear: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenConnectModal?: () => void;
  isLoading: boolean;
}

export const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  status,
  onStart,
  onStop,
  onClear,
  onRefresh,
  onOpenConnectModal,
  isLoading
}) => {
  const [intervalSec, setIntervalSec] = useState<number>(60);
  const isRunning = status?.is_running ?? false;

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">Live CPU Monitoring Engine</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium flex items-center space-x-1.5 ${
                isRunning
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-white live-dot' : 'bg-neutral-600'}`} />
              <span>{isRunning ? 'ACTIVE MONITORING' : 'STOPPED'}</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real hardware CPU telemetry streamed from your laptop or server via agent or CSV upload.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenConnectModal && (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-medium transition shadow-sm"
            >
              <Laptop className="w-3.5 h-3.5 text-neutral-400" />
              <span>Connect Laptop / Upload CSV</span>
            </button>
          )}

          {!isRunning ? (
            <button
              onClick={() => onStart(intervalSec)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold transition shadow disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Collector</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-semibold transition shadow disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Collector</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh monitor status"
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClear}
            disabled={isLoading}
            title="Clear Live Session Samples"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Session</span>
          </button>
        </div>
      </div>

      {/* Grid of Monitor Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
            Current CPU
          </span>
          <span className="text-xl font-mono font-bold text-white">
            {status?.current_cpu !== null && status?.current_cpu !== undefined
              ? `${status.current_cpu.toFixed(1)}%`
              : '--'}
          </span>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
            Sampling Interval
          </span>
          <div className="flex items-center space-x-1">
            <span className="text-lg font-mono font-semibold text-white">
              {status?.sampling_interval_seconds ?? intervalSec}s
            </span>
            <span className="text-[10px] text-neutral-500">(1 min)</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
            Samples Stored
          </span>
          <span className="text-xl font-mono font-bold text-white">
            {status?.samples_collected ?? 0}
          </span>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
            Uptime Duration
          </span>
          <span className="text-lg font-mono font-semibold text-neutral-200">
            {status?.duration_formatted || '0h 00m'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
            Last Updated
          </span>
          <span className="text-xs font-mono text-neutral-300 truncate block" title={status?.last_sample_time || 'N/A'}>
            {status?.last_sample_time ? status.last_sample_time.split(' ')[1] : '--:--:--'}
          </span>
        </div>
      </div>
    </div>
  );
};
