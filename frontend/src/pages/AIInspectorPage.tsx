import React from 'react';
import { AIExplainResponse } from '../types';
import { Sparkles, Shield, Clock, FileCode, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface AIInspectorPageProps {
  explanationData: AIExplainResponse | null;
  onGenerateExplanation: () => void;
  isLoading: boolean;
  aiStatus: 'ONLINE' | 'OFFLINE';
  modelName: string;
  evidence: Record<string, any> | null;
}

export const AIInspectorPage: React.FC<AIInspectorPageProps> = ({
  explanationData,
  onGenerateExplanation,
  isLoading,
  aiStatus,
  modelName,
  evidence
}) => {
  const currentEvidence = explanationData?.input_evidence || evidence || {
    notice: 'Run a forecast on the dashboard to populate live mathematical evidence.'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-white" />
            <span>AI Explainability Inspector</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Audit the strict boundary between Python mathematical calculations and Ollama Qwen3 8B
          </p>
        </div>

        <button
          onClick={onGenerateExplanation}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Processing Query...' : 'Generate Explanation'}</span>
        </button>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">
            Ollama Model Status
          </span>
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                aiStatus === 'ONLINE' ? 'bg-white live-dot' : 'bg-neutral-500'
              }`}
            />
            <span className="text-lg font-mono font-bold text-white">
              {aiStatus}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Target Model: <strong className="text-white font-mono">{modelName}</strong>
          </span>
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">
            Explainability Mode
          </span>
          <span className="text-lg font-mono font-bold text-white">
            {explanationData?.is_fallback ? 'Deterministic Fallback' : 'Local Ollama LLM'}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Zero Internet Cloud API Dependency
          </span>
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-4">
          <span className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">
            Inference Latency
          </span>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-xl font-mono font-bold text-white">
              {explanationData ? `${explanationData.response_time_ms.toFixed(0)} ms` : '--'}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Local CPU/GPU inference execution
          </span>
        </div>
      </div>

      {/* Split View: Input Evidence JSON vs AI Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Evidence JSON */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-neutral-300" />
              <h3 className="text-sm font-semibold text-white">Input Evidence Payload (Read-Only)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
              Immutable JSON
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            This structured JSON represents the exact numerical evidence calculated by Python and passed to Qwen.
            Raw datasets are omitted to optimize token budget and latency.
          </p>

          <pre className="p-4 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto max-h-96">
            {JSON.stringify(currentEvidence, null, 2)}
          </pre>

          <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
            🛡️ <strong>Integrity Guarantee:</strong> Frontend inputs cannot edit numerical calculations before prompting the LLM.
          </div>
        </div>

        {/* Right: AI Output & System Instructions */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-neutral-300" />
              <h3 className="text-sm font-semibold text-white">Synthesized Technical Explanation</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
              Max 150 Words
            </span>
          </div>

          <div className="p-4 bg-black border border-neutral-800 rounded-lg min-h-[140px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex items-center space-x-2 text-neutral-400 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Interrogating local model weights...</span>
              </div>
            ) : explanationData ? (
              <p className="text-sm text-neutral-200 leading-relaxed">
                {explanationData.explanation}
              </p>
            ) : (
              <span className="text-xs text-neutral-500">
                Awaiting interpretation request.
              </span>
            )}
          </div>

          {/* System Prompt Safeguards */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <span className="text-xs font-semibold text-neutral-300 block">
              Enforced System Prompt Constraints:
            </span>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>Must not perform or replace official numerical calculations.</li>
              <li>Must never invent measurements or hallucinate future actuals.</li>
              <li>Must strictly preserve Python-determined scaling recommendations.</li>
              <li>Never create new thresholds or claim guaranteed failures.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
