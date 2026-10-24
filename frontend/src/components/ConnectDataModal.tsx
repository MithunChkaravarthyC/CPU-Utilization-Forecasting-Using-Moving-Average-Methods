import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Upload,
  Server,
  Copy,
  Check,
  Download,
  RefreshCw,
  Cpu,
  AlertCircle,
  FileText,
  Radio,
  ExternalLink,
  Laptop
} from 'lucide-react';
import {
  getSessionId,
  setSessionId,
  getApiBaseUrl,
  setApiBaseUrl,
  getRawServerUrl,
  getAgentCliCommand,
  getAgentDownloadUrl,
  fetchSessionStatus,
  uploadCsvTelemetry,
  fetchHealth
} from '../services/api';
import { SessionStatus } from '../types';

interface ConnectDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataIngested?: () => void;
}

export const ConnectDataModal: React.FC<ConnectDataModalProps> = ({
  isOpen,
  onClose,
  onDataIngested
}) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'upload' | 'server'>('agent');
  const [osType, setOsType] = useState<'windows' | 'mac-linux' | 'local'>('windows');
  const [sessionId, setSessionIdState] = useState<string>(getSessionId());
  const [copied, setCopied] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // CSV Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deviceName, setDeviceName] = useState<string>('Production Server');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Server URL State
  const [customServerUrl, setCustomServerUrl] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSess = getSessionId();
      setSessionIdState(currentSess);
      checkSession(currentSess);
      setCustomServerUrl(localStorage.getItem('cpu_forecast_api_url') || '');
    }
  }, [isOpen]);

  // Periodic status poll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      checkSession(sessionId);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  const checkSession = async (sess: string) => {
    try {
      setIsPolling(true);
      const status = await fetchSessionStatus(sess);
      setSessionStatus(status);
    } catch {
      // Ignore background poll errors
    } finally {
      setIsPolling(false);
    }
  };

  const handleCopyCommand = () => {
    const cmd = getAgentCliCommand(osType);
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateSession = () => {
    const newId = 'client_' + Math.random().toString(36).substring(2, 10);
    setSessionId(newId);
    setSessionIdState(newId);
    checkSession(newId);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await uploadCsvTelemetry(selectedFile, deviceName, true);
      setUploadMessage({
        type: 'success',
        text: `Success! ${res.imported_count} measurements ingested from ${selectedFile.name}. Detected CPU column: "${res.detected_cpu_column}".`
      });
      setSelectedFile(null);
      checkSession(sessionId);
      if (onDataIngested) onDataIngested();
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err.message || 'Failed to parse and upload CSV.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setIsTestingHealth(true);
    setHealthStatus(null);
    try {
      setApiBaseUrl(customServerUrl);
      const health = await fetchHealth();
      setHealthStatus(`Connected! Server: ${health.app_name || 'Online'}`);
    } catch (err: any) {
      setHealthStatus(`Error: Unable to connect (${err.message}). Check URL & CORS.`);
    } finally {
      setIsTestingHealth(false);
    }
  };

  const handleResetServerUrl = () => {
    setApiBaseUrl('');
    setCustomServerUrl('');
    setHealthStatus('Reset to default API proxy.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e131f] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-600/50 flex items-center justify-center text-sky-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Connect Your Machine or Server</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  Telemetry Engine
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Stream live hardware metrics or import historical server CPU logs for forecasting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Status Banner */}
        <div className="px-6 py-3 bg-gray-950/70 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Your Session ID:</span>
            <code className="bg-gray-900 text-sky-300 font-mono px-2 py-0.5 rounded border border-gray-700 font-bold">
              {sessionId}
            </code>
            <button
              onClick={handleRegenerateSession}
              title="Generate new unique session"
              className="text-[11px] text-gray-400 hover:text-sky-300 underline"
            >
              New ID
            </button>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center space-x-2">
            {sessionStatus?.is_connected ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot animate-pulse" />
                <span>
                  Connected: {sessionStatus.device_name || 'Your Machine'} ({sessionStatus.current_cpu}% CPU)
                </span>
              </span>
            ) : sessionStatus?.total_samples && sessionStatus.total_samples > 0 ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono">
                <Radio className="w-3 h-3 text-amber-400" />
                <span>{sessionStatus.total_samples} samples stored (Offline)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-gray-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Waiting for telemetry...</span>
              </span>
            )}
            <button
              onClick={() => checkSession(sessionId)}
              disabled={isPolling}
              className="p-1 rounded text-gray-400 hover:text-white"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/20 px-6">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'agent'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1-Click Streaming Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Server CSV / Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'server'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Backend API Settings</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* TAB 1: STREAMING AGENT */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4 text-xs text-sky-200/90 leading-relaxed">
                <span className="font-semibold text-sky-300 block mb-1">
                  🔒 Why an Agent is Needed:
                </span>
                Web browsers are strictly sandboxed for security and cannot directly read your laptop or server's hardware CPU utilization. Running this lightweight script reads real CPU metrics on your machine and streams them directly to your session dashboard!
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-gray-300">
                    Step 1: Choose your environment and copy the 1-line command:
                  </label>
                  <div className="flex items-center space-x-1.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOsType('windows')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'windows'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Windows (PowerShell)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsType('mac-linux')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'mac-linux'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mac / Linux
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsType('local')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'local'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Local Repo
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <pre className="bg-black/80 border border-gray-800 text-emerald-400 font-mono text-xs p-3.5 rounded-xl overflow-x-auto selection:bg-emerald-900 break-all whitespace-pre-wrap">
                    {getAgentCliCommand(osType)}
                  </pre>
                  <button
                    onClick={handleCopyCommand}
                    className="absolute right-2.5 top-2.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium flex items-center space-x-1.5 border border-gray-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {osType === 'windows' && 'Automatically downloads agent.py into your current folder and starts streaming.'}
                  {osType === 'mac-linux' && 'Fetches agent.py via curl and streams metrics every 5 seconds.'}
                  {osType === 'local' && 'Runs backend/agent.py directly from your cloned project directory.'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-300 font-semibold block">
                    Don't have curl or prefer downloading?
                  </span>
                  <span className="text-gray-400">
                    Download the standalone Python script (zero dependencies, auto-installs psutil).
                  </span>
                </div>
                <a
                  href={getAgentDownloadUrl()}
                  download="agent.py"
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-700 transition whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download agent.py</span>
                </a>
              </div>

              {/* Live Preview / Status Card */}
              {sessionStatus?.is_connected ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 live-dot animate-pulse" />
                    <div>
                      <p className="font-semibold text-emerald-300 text-xs">
                        Agent Active & Streaming Data!
                      </p>
                      <p className="text-[11px] text-emerald-400/80">
                        Device: {sessionStatus.device_name} • Last sample: {sessionStatus.last_sample_time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onDataIngested) onDataIngested();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                  >
                    View Forecasts Now →
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 flex items-center space-x-2.5">
                  <Radio className="w-4 h-4 text-gray-500 animate-pulse" />
                  <span>
                    Listening for telemetry on session <code className="text-gray-300 font-bold">{sessionId}</code>... Once you launch the command, metrics will reflect automatically.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CSV UPLOAD */}
          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-300">
                <span className="font-semibold text-white block mb-1">
                  📊 Zero-Install Instant Analysis
                </span>
                Upload server logs or CPU performance exports from Windows Task Manager, Linux <code>sar</code>, Prometheus, or any CSV with timestamp and CPU% columns.
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Machine or Server Label:
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., AWS EC2 Cluster / My Laptop"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Select CSV / Log File:
                </label>
                <div className="border-2 border-dashed border-gray-800 hover:border-gray-700 rounded-xl p-6 text-center cursor-pointer bg-gray-950/40 transition">
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv,.log"
                    id="csv-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <FileText className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <span className="font-semibold text-white text-xs block">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-gray-300 text-xs block">
                          Click to browse or drag & drop CSV file
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Accepts .csv, .txt, .tsv, .log with timestamp & cpu columns
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {uploadMessage && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                      : 'bg-rose-950/70 border border-rose-700/60 text-rose-300'
                  }`}
                >
                  {uploadMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing & Ingesting Dataset...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Ingest File into Session {sessionId}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: BACKEND SETTINGS */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-300">
                <span className="font-semibold text-white block mb-1">
                  ⚙️ Production / Localhost Bridge
                </span>
                If you have deployed the FastAPI backend to Render, Railway, or are running it on your own server, enter the backend URL here. The Vercel frontend will connect to it directly.
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Backend API Base URL:
                </label>
                <input
                  type="text"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="https://your-api.onrender.com or http://localhost:8000"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Current active endpoint: <code>{getApiBaseUrl()}</code>
                </p>
              </div>

              {healthStatus && (
                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-sky-300">
                  {healthStatus}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  disabled={isTestingHealth}
                  className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                >
                  {isTestingHealth ? 'Testing Connection...' : 'Save & Test Connection'}
                </button>
                <button
                  type="button"
                  onClick={handleResetServerUrl}
                  className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition border border-gray-700"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 bg-gray-900/40 flex items-center justify-between text-xs text-gray-400">
          <span>Dual Mode: Streaming Agent & CSV Ingestion</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
