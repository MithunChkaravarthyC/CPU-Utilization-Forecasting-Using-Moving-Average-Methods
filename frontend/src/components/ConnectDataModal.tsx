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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Connect Your Machine or Server</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700">
                  Telemetry Engine
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Stream live hardware metrics or import historical server CPU logs for forecasting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Status Banner */}
        <div className="px-6 py-3 bg-black border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-neutral-400">Your Session ID:</span>
            <code className="bg-neutral-900 text-white font-mono px-2 py-0.5 rounded border border-neutral-700 font-bold">
              {sessionId}
            </code>
            <button
              onClick={handleRegenerateSession}
              title="Generate new unique session"
              className="text-[11px] text-neutral-400 hover:text-white underline"
            >
              New ID
            </button>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center space-x-2">
            {sessionStatus?.is_connected ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-600 text-white font-mono">
                <span className="w-2 h-2 rounded-full bg-white live-dot animate-pulse" />
                <span>
                  Connected: {sessionStatus.device_name || 'Your Machine'} ({sessionStatus.current_cpu}% CPU)
                </span>
              </span>
            ) : sessionStatus?.total_samples && sessionStatus.total_samples > 0 ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono">
                <Radio className="w-3 h-3 text-neutral-400" />
                <span>{sessionStatus.total_samples} samples stored (Offline)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>Waiting for telemetry...</span>
              </span>
            )}
            <button
              onClick={() => checkSession(sessionId)}
              disabled={isPolling}
              className="p-1 rounded text-neutral-400 hover:text-white"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-black/30 px-6">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'agent'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1-Click Streaming Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Server CSV / Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'server'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
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
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">
                  🔒 Why an Agent is Needed:
                </span>
                Web browsers are strictly sandboxed for security and cannot directly read your laptop or server's hardware CPU utilization. Running this lightweight script reads real CPU metrics on your machine and streams them directly to your session dashboard!
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Step 1: Choose your environment and copy the 1-line command:
                  </label>
                  <div className="flex items-center space-x-1.5 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setOsType('windows')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'windows'
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Windows (PowerShell)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsType('mac-linux')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'mac-linux'
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Mac / Linux
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsType('local')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        osType === 'local'
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Local Repo
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <pre className="bg-black border border-neutral-800 text-neutral-200 font-mono text-xs p-3.5 rounded-xl overflow-x-auto selection:bg-neutral-800 break-all whitespace-pre-wrap">
                    {getAgentCliCommand(osType)}
                  </pre>
                  <button
                    onClick={handleCopyCommand}
                    className="absolute right-2.5 top-2.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center space-x-1.5 border border-neutral-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span className="text-white">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  {osType === 'windows' && 'Automatically downloads agent.py into your current folder and starts streaming.'}
                  {osType === 'mac-linux' && 'Fetches agent.py via curl and streams metrics every 5 seconds.'}
                  {osType === 'local' && 'Runs backend/agent.py directly from your cloned project directory.'}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-neutral-300 font-semibold block">
                    Don't have curl or prefer downloading?
                  </span>
                  <span className="text-neutral-400">
                    Download the standalone Python script (zero dependencies, auto-installs psutil).
                  </span>
                </div>
                <a
                  href={getAgentDownloadUrl()}
                  download="agent.py"
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium border border-neutral-700 transition whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download agent.py</span>
                </a>
              </div>

              {/* Live Preview / Status Card */}
              {sessionStatus?.is_connected ? (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-white live-dot animate-pulse" />
                    <div>
                      <p className="font-bold text-white text-xs">
                        Agent Active & Streaming Data!
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Device: {sessionStatus.device_name} • Last sample: {sessionStatus.last_sample_time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onDataIngested) onDataIngested();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow transition"
                  >
                    View Forecasts Now →
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex items-center space-x-2.5">
                  <Radio className="w-4 h-4 text-neutral-500 animate-pulse" />
                  <span>
                    Listening for telemetry on session <code className="text-white font-bold">{sessionId}</code>... Once you launch the command, metrics will reflect automatically.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CSV UPLOAD */}
          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300">
                <span className="font-bold text-white block mb-1">
                  📊 Zero-Install Instant Analysis
                </span>
                Upload server logs or CPU performance exports from Windows Task Manager, Linux <code>sar</code>, Prometheus, or any CSV with timestamp and CPU% columns.
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Machine or Server Label:
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., AWS EC2 Cluster / My Laptop"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Select CSV / Log File:
                </label>
                <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-6 text-center cursor-pointer bg-black/60 transition">
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
                    <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <span className="font-semibold text-white text-xs block">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-neutral-300 text-xs block">
                          Click to browse or drag & drop CSV file
                        </span>
                        <span className="text-[11px] text-neutral-500">
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
                      ? 'bg-neutral-900 border border-neutral-700 text-white'
                      : 'bg-neutral-900 border border-neutral-700 text-neutral-300'
                  }`}
                >
                  {uploadMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-bold text-xs transition shadow flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
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
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300">
                <span className="font-bold text-white block mb-1">
                  ⚙️ Production / Localhost Bridge
                </span>
                If you have deployed the FastAPI backend to Render, Railway, or are running it on your own server, enter the backend URL here. The Vercel frontend will connect to it directly.
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Backend API Base URL:
                </label>
                <input
                  type="text"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="https://your-api.onrender.com or http://localhost:8000"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Current active endpoint: <code>{getApiBaseUrl()}</code>
                </p>
              </div>

              {healthStatus && (
                <div className="p-3 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-neutral-200">
                  {healthStatus}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  disabled={isTestingHealth}
                  className="flex-1 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold transition disabled:opacity-50"
                >
                  {isTestingHealth ? 'Testing Connection...' : 'Save & Test Connection'}
                </button>
                <button
                  type="button"
                  onClick={handleResetServerUrl}
                  className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs transition border border-neutral-700"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-black/40 flex items-center justify-between text-xs text-neutral-400">
          <span>Dual Mode: Streaming Agent & CSV Ingestion</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium border border-neutral-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
