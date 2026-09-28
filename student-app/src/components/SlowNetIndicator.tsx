import React, { useState, useEffect } from 'react';
import { slowNetService } from '../services/slowNetService';
import { syncService } from '../services/syncService';
import { SlowNetMetrics, NetworkStatus } from '../types';
import { Zap, Wifi, Signal, AlertTriangle, ArrowRight, ShieldCheck, Database } from 'lucide-react';

export const SlowNetIndicator: React.FC = () => {
  const [metrics, setMetrics] = useState<SlowNetMetrics>(slowNetService.getMetrics());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(syncService.getNetworkStatus());
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  useEffect(() => {
    const unsubSlow = slowNetService.subscribe(setMetrics);
    const unsubSync = syncService.subscribe((status) => setNetworkStatus(status));
    return () => {
      unsubSlow();
      unsubSync();
    };
  }, []);

  if (networkStatus !== 'low_bandwidth') {
    return null;
  }

  return (
    <>
      {/* Top Banner Indicator */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-3 py-1.5 text-xs flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
          </span>
          <span className="font-semibold tracking-wide flex items-center gap-1">
            <Signal className="w-3.5 h-3.5" />
            2G / Slow Net Data Saver
          </span>
          <span className="hidden sm:inline bg-amber-800/80 border border-amber-500/50 px-2 py-0.5 rounded font-mono text-[11px]">
            {metrics.compressionRatioPercent}% compressed • {metrics.bytesSavedKb} KB saved
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {metrics.autoFallbackToSms && (
            <span className="hidden md:inline text-[11px] bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded">
              Auto-SMS Failover Active
            </span>
          )}
          <button
            onClick={() => setShowDrawer(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded font-medium text-[11px] transition backdrop-blur-sm"
          >
            Data Saver Telemetry ⚙️
          </button>
        </div>
      </div>

      {/* Slide-out Diagnostic Modal / Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Rural Slow Net & 2G Optimizer</h3>
                  <p className="text-xs text-slate-500">Autonomous bandwidth conservation & failover engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-amber-700 font-medium">Accumulated Data Saved</div>
                <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                  {metrics.bytesSavedKb} <span className="text-sm font-sans font-normal">KB</span>
                </div>
                <div className="text-[10px] text-amber-600 mt-1">Via token pruning & header stripping</div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                <div className="text-sky-700 font-medium">Payload Compression</div>
                <div className="text-2xl font-bold font-mono text-sky-900 mt-1">
                  ~{metrics.compressionRatioPercent}%
                </div>
                <div className="text-[10px] text-sky-600 mt-1">Reduced to &lt;250 bytes per query</div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-emerald-700 font-medium">Link Latency Budget</div>
                <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                  {metrics.latencyMs} <span className="text-sm font-sans font-normal">ms</span>
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">Simulated 2G/EDGE cellular ping</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-purple-700 font-medium">Deferred Telemetry Queue</div>
                <div className="text-2xl font-bold font-mono text-purple-900 mt-1">
                  {metrics.queuedTelemetryCount} <span className="text-sm font-sans font-normal">items</span>
                </div>
                <div className="text-[10px] text-purple-600 mt-1">Non-critical telemetry paused</div>
              </div>
            </div>

            {/* Failover Pipeline Overview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Autonomous 3-Tier Failover Pipeline
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-amber-800">1. 2G Compressed</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-purple-800">2. Cellular SMS</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-emerald-800">3. On-Device AI</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                If the 2G radio link experiences packet loss or stalls past 3.4 seconds, Rehber instantly packages
                the student question into a single 160-character cellular SMS without interrupting the learner.
              </p>
            </div>

            {/* Controls */}
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                <div>
                  <span className="font-semibold text-slate-800">Automatic Cellular SMS Failover</span>
                  <p className="text-[11px] text-slate-500">Auto-convert timed-out queries to GSM protocol</p>
                </div>
                <button
                  onClick={() => slowNetService.toggleAutoSmsFallback()}
                  className={`px-3 py-1 rounded-full font-bold text-xs transition ${
                    metrics.autoFallbackToSms
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {metrics.autoFallbackToSms ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Simulate Network Latency: <span className="font-mono font-bold text-slate-900">{metrics.latencyMs}ms</span>
                </label>
                <input
                  type="range"
                  min="400"
                  max="4500"
                  step="200"
                  value={metrics.latencyMs}
                  onChange={(e) => slowNetService.setSimulatedLatency(parseInt(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Fast 3G (400ms)</span>
                  <span>Rural 2G (1800ms)</span>
                  <span>Stalled Link (4500ms)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDrawer(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
