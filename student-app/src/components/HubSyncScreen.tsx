import React, { useState, useEffect } from 'react';
import {
  Sun,
  BatteryCharging,
  HardDrive,
  Tablet,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Database,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FolderLock,
  MessageSquare,
  GraduationCap,
  Download,
  Upload,
  Radio,
  Share2,
  Check,
  Zap,
} from 'lucide-react';
import { localDb } from '../services/localDb';
import { syncService } from '../services/syncService';
import { messageService } from '../services/messageService';
import { NetworkStatus, SolarHubStatus, SyncRecord, SmsMessageLog } from '../types';

interface HubSyncScreenProps {
  networkStatus: NetworkStatus;
  onSync: () => void;
}

export const HubSyncScreen: React.FC<HubSyncScreenProps> = ({
  networkStatus,
  onSync,
}) => {
  const hub = localDb.getHubStatus();
  const queue = localDb.getSyncQueue();
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isPrecaching, setIsPrecaching] = useState<boolean>(false);
  const [precacheSummary, setPrecacheSummary] = useState<string | null>(null);
  const [bundleCopied, setBundleCopied] = useState<boolean>(false);
  const [p2pStatus, setP2pStatus] = useState<string | null>(null);
  const [offlineReadiness, setOfflineReadiness] = useState(localDb.getOfflineReadinessStatus());
  const [diagnostics, setDiagnostics] = useState<{
    idbAvailable: boolean;
    idbInitialized: boolean;
    chatMessagesCount: number;
    quizAttemptsCount: number;
    hasCachedProfile: boolean;
    pendingSyncCount: number;
  }>({
    idbAvailable: localDb.isIndexedDBAvailable(),
    idbInitialized: localDb.isIndexedDBReady(),
    chatMessagesCount: localDb.getChatHistory().length,
    quizAttemptsCount: localDb.getQuizAttempts().length,
    hasCachedProfile: !!localDb.getProfile(),
    pendingSyncCount: queue.length,
  });

  const [smsLogs, setSmsLogs] = useState<SmsMessageLog[]>(() => messageService.getLogs());
  const [smsTestPayload, setSmsTestPayload] = useState<string>('STU101#ASK#Why is photosynthesis important?');
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubSms = messageService.subscribe(setSmsLogs);
    return () => unsubSms();
  }, []);

  const handleSendSimulatedSms = async () => {
    if (!smsTestPayload.trim() || isSendingSms) return;
    setIsSendingSms(true);
    setSmsFeedback(null);
    try {
      const reply = await messageService.dispatchSms(smsTestPayload.trim());
      setSmsFeedback(`✓ Gateway Reply Received: ${reply}`);
    } catch (e: any) {
      setSmsFeedback(`Error: ${e.message}`);
    } finally {
      setIsSendingSms(false);
    }
  };

  useEffect(() => {
    const loadDiagnostics = async () => {
      const diag = await localDb.getStorageDiagnostics();
      setDiagnostics(diag);
      setOfflineReadiness(localDb.getOfflineReadinessStatus());
    };
    loadDiagnostics();
    const unsubscribe = localDb.subscribe(loadDiagnostics);
    return () => unsubscribe();
  }, []);

  const handlePrecacheAll = async () => {
    setIsPrecaching(true);
    setPrecacheSummary('Pre-caching all curriculum modules, lessons, and AI heuristic weights...');
    setTimeout(async () => {
      const res = await localDb.precacheAllOfflineContent();
      setIsPrecaching(false);
      setPrecacheSummary(
        `✓ All ${res.lessonsCount} lessons, ${res.questionsCount} questions, and ${res.topicsCount} topics cached into IndexedDB & Service Worker!`
      );
      setOfflineReadiness(localDb.getOfflineReadinessStatus());
    }, 800);
  };

  const handleExportBundle = () => {
    const bundleStr = localDb.exportOfflineBundle();
    try {
      const blob = new Blob([bundleStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rurallearn-offline-pack-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 3000);
    } catch {
      navigator.clipboard?.writeText(bundleStr);
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 3000);
    }
  };

  const handleSimulateP2P = () => {
    setP2pStatus('Searching for nearby peer tablets over Bluetooth Low Energy / Wi-Fi Direct...');
    setTimeout(() => {
      setP2pStatus('Found: Tablet #2 (Priya) & Tablet #5 (Sunita). Exchanging lesson sync records...');
      setTimeout(() => {
        setP2pStatus('✓ Peer sync completed! 2 new practice quiz attempts mirrored.');
        setTimeout(() => setP2pStatus(null), 4000);
      }, 1200);
    }, 1200);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatusMsg('Contacting Rampur Solar Community Node...');

    const res = await syncService.syncNow();
    setSyncing(false);
    setSyncStatusMsg(res.message);
  };

  const toggleNetwork = () => {
    syncService.toggleOfflineMode();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Solar Hub Hardware Node Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Solar Learning Node #4
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">{hub.hubName}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{hub.location}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  networkStatus === 'online'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : networkStatus === 'syncing'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {networkStatus === 'online'
                  ? 'Connected to Hub'
                  : networkStatus === 'syncing'
                  ? 'Syncing In Progress'
                  : 'Offline (Local Cache Active)'}
              </span>
            </div>
          </div>

          {/* Node Hardware Diagnostics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <BatteryCharging className="w-4 h-4" />
                <span>Solar Battery</span>
              </div>
              <span className="text-xl font-black">{hub.batteryPercentage}%</span>
              <span className="text-[10px] text-slate-400 block">+240W Input</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
                <Tablet className="w-4 h-4" />
                <span>Connected Tablets</span>
              </div>
              <span className="text-xl font-black">{hub.connectedTabletsCount}</span>
              <span className="text-[10px] text-slate-400 block">Class 7 Cohort</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                <HardDrive className="w-4 h-4" />
                <span>Hub Storage</span>
              </div>
              <span className="text-xl font-black">{hub.storageRemainingGb} GB</span>
              <span className="text-[10px] text-slate-400 block">Offline Cache</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Last Cloud Sync</span>
              </div>
              <span className="text-xs font-black block mt-1">{hub.lastCloudSync}</span>
              <span className="text-[10px] text-slate-400 block">Weekly Schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sync Trigger Action & Network Simulation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              Synchronization Control
            </h2>
            <p className="text-xs text-slate-500">
              Transfer student quiz records, speed adaptation, and lesson progress to the Hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleNetwork}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                networkStatus === 'offline'
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {networkStatus === 'offline' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Switch to Online</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Switch to Offline</span>
                </>
              )}
            </button>

            <button
              onClick={handleManualSync}
              disabled={syncing || networkStatus === 'offline'}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-transform active:scale-[0.98] ${
                networkStatus === 'offline'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now with Hub'}</span>
            </button>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-medium">
            {syncStatusMsg}
          </div>
        )}
      </div>

      {/* Cellular SMS Gateway & Message Protocol Feed */}
      <div className="bg-white rounded-3xl p-6 border border-purple-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Cellular SMS Protocol & Message Gateway
                </h2>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Rehber Pillar #2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Low-bandwidth cellular fallback: serializes questions, quizzes, and checkpoints into compact SMS strings (<code className="font-mono text-purple-700">[StudentID]#[ActionCode]#[PayloadData]</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-xl font-bold">
              {smsLogs.length} Total Messages Logged
            </span>
          </div>
        </div>

        {/* Interactive SMS Simulator Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>⚡ Cellular Message Test Console</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({smsTestPayload.length} / 160 characters • {Math.max(1, Math.ceil(smsTestPayload.length / 160))} SMS segment)
              </span>
            </span>

            {/* Quick Sample Action Chips */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setSmsTestPayload('STU101#ASK#Why is 1/2 bigger than 1/4?')}
                className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg"
              >
                ASK Query
              </button>
              <button
                onClick={() => setSmsTestPayload('STU102#QZ#math-fractions|Q1:A,Q2:B')}
                className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg"
              >
                QZ Submit
              </button>
              <button
                onClick={() => setSmsTestPayload('STU101#PGR#mod-frac|85|600')}
                className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg"
              >
                PGR Progress
              </button>
              <button
                onClick={() => setSmsTestPayload('STU103#REG#Amina Khan|7|urdu')}
                className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg"
              >
                REG Register
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={smsTestPayload}
              onChange={(e) => setSmsTestPayload(e.target.value)}
              placeholder="e.g. STU101#ASK#What is photosynthesis?"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendSimulatedSms}
              disabled={isSendingSms}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              {isSendingSms ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <span>📡 Transmit SMS</span>
                </>
              )}
            </button>
          </div>

          {smsFeedback && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs text-purple-900 font-mono break-all font-semibold">
              {smsFeedback}
            </div>
          )}
        </div>

        {/* Live Message Transaction Log Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Recent Cellular SMS Transmission Log</span>
            <button
              onClick={() => messageService.clearLogs()}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-normal transition"
            >
              Clear Logs
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
            {smsLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No cellular messages logged yet. Use the simulator above or ask a question in SMS mode!
              </div>
            ) : (
              smsLogs.map((log) => {
                const isInbound = log.direction === 'inbound';
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                      isInbound
                        ? 'bg-sky-50/60 border-sky-200/80 text-sky-950'
                        : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-[10px] px-2 py-0.5 rounded-md uppercase ${
                            isInbound ? 'bg-sky-200 text-sky-800' : 'bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {isInbound ? '↗ OUTBOUND (Student)' : '↙ INBOUND (Gateway Reply)'}
                        </span>
                        <span className="font-bold text-[11px] text-slate-700">
                          {log.studentId} • [{log.actionCode}]
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.charCount} chars • {log.segments} seg
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{log.timestamp}</span>
                    </div>

                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/70 font-mono text-[11px] break-all select-all font-semibold">
                      {log.rawPayload}
                    </div>

                    {log.decodedText && log.decodedText !== log.rawPayload && (
                      <div className="text-[11px] text-slate-600 italic px-1">
                        Decoded: {log.decodedText}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. On-Device IndexedDB Persistence Diagnostics */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                IndexedDB Local Persistence Layer
              </h2>
              <p className="text-xs text-slate-500">
                Guarantees zero-network local caching for learning progress and tutor conversation history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {diagnostics.idbAvailable ? 'IndexedDB Active' : 'Fallback Active'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Card 1: Learning Progress */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <GraduationCap className="w-4 h-4 text-orange-600" />
                <span>Learning Progress</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Persisted
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Topic masteries, adaptive pace & XP
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Store: learning_progress (key: profile)
            </span>
          </div>

          {/* Card 2: AI Tutor Chat */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Tutor Chat History</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {diagnostics.chatMessagesCount} Cached
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              All multi-turn voice & text queries
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Store: tutor_chat (indexed by timestamp)
            </span>
          </div>

          {/* Card 3: Quiz Attempts & Sync */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Quiz & Sync Queue</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {diagnostics.quizAttemptsCount} Attempts
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Offline quiz scoring & sync queue
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Database: rurallearn_offline_db
            </span>
          </div>
        </div>
      </div>

      {/* 4. Complete 100% Offline Readiness Engine & Air-Gap Toolkit */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-800 tracking-tight">
                  100% Offline Readiness Engine
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {offlineReadiness.overallReadinessPercent}% Offline Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                All curriculum lessons, quizzes, AI tutor, voice feedback, and teacher analytics function with zero internet.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrecacheAll}
              disabled={isPrecaching}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Zap className={`w-3.5 h-3.5 ${isPrecaching ? 'animate-spin' : ''}`} />
              <span>{isPrecaching ? 'Caching Everything...' : 'Precache All Content'}</span>
            </button>

            <button
              onClick={handleExportBundle}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
              title="Download offline backup bundle"
            >
              {bundleCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Downloaded ✓</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Pack</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateP2P}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5 transition-colors"
              title="Simulate Bluetooth/Wi-Fi Direct peer sync between village tablets"
            >
              <Radio className="w-3.5 h-3.5 text-amber-700" />
              <span>Peer Tablet Sync</span>
            </button>
          </div>
        </div>

        {precacheSummary && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold animate-in fade-in">
            {precacheSummary}
          </div>
        )}

        {p2pStatus && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium animate-in fade-in flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span>{p2pStatus}</span>
          </div>
        )}

        {/* Subsystem Readiness Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {offlineReadiness.subsystems.map((sub, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{sub.name}</span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {sub.percentage}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{sub.details}</p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${sub.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Sync Queue Inspector (Prompt Section 9) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              On-Device Sync Queue ({queue.length} Records)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Stored in Local Storage SQLite / IndexedDB
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-800">
              All Records Synchronized!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your device has no pending records. Every lesson and quiz completed offline has been verified by the Hub.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {queue.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 uppercase">
                      {rec.type.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        rec.status === 'synced'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ID: {rec.id} • {new Date(rec.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  {rec.data?.score !== undefined ? `Score: ${rec.data.score}%` : 'Profile Update'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
