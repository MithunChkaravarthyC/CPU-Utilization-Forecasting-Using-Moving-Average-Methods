import React from 'react';
import { Sparkles, Bot, AlertTriangle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { AIExplainResponse } from '../types';

interface AIExplanationCardProps {
  explanationData: AIExplainResponse | null;
  onGenerateExplanation: () => void;
  isLoading: boolean;
  aiStatus: 'ONLINE' | 'OFFLINE';
  modelName: string;
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({
  explanationData,
  onGenerateExplanation,
  isLoading,
  aiStatus,
  modelName
}) => {
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/50">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">AI Forecast Explanation</h3>
            <p className="text-xs text-gray-400">
              Technical interpretation of mathematical metrics by local Ollama ({modelName})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center space-x-1.5 ${
              aiStatus === 'ONLINE'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'bg-amber-950 text-amber-300 border border-amber-700/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus === 'ONLINE' ? 'bg-cyan-400 live-dot' : 'bg-amber-500'
              }`}
            />
            <span>AI {aiStatus}</span>
          </span>

          <button
            onClick={onGenerateExplanation}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? 'Interpreting...' : 'Generate Explanation'}</span>
          </button>
        </div>
      </div>

      {/* Response Box */}
      <div className="p-4 bg-gray-950/80 rounded-xl border border-gray-800 relative min-h-[100px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs font-mono">Synthesizing mathematical telemetry...</span>
          </div>
        ) : explanationData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-gray-800/80 pb-2">
              <span className="text-gray-400">
                Source: <span className="text-sky-300">{explanationData.model}</span>
                {explanationData.is_fallback && (
                  <span className="ml-2 text-amber-400 font-bold">(Deterministic Offline Fallback)</span>
                )}
              </span>
              <span className="text-gray-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>{explanationData.response_time_ms.toFixed(0)} ms</span>
              </span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed font-sans">
              {explanationData.explanation}
            </p>
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500 text-xs">
            Click <strong className="text-gray-300">Generate Explanation</strong> to produce a concise technical analysis from the active mathematical forecast data.
          </div>
        )}
      </div>

      {/* Regulatory & Safety Notice */}
      <div className="flex items-start space-x-2 text-[11px] text-gray-400 bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
        <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
        <span>
          <strong>AI Safety & Integrity Guardrail:</strong> AI explains mathematical results; it does <em>not</em> generate the official forecast, override thresholds, or alter numerical scaling decisions.
        </span>
      </div>
    </div>
  );
};
