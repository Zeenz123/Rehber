'use client';

import { useState, useEffect } from 'react';
import { fetchSyncRecords, SyncRecordApiItem } from '@/lib/api';
import { webEcosystemBridge, EcosystemEvent } from '@/lib/ecosystemBridge';

interface SyncBatchDisplay {
  batchId: string;
  studentId: string;
  school: string;
  recordsCount: number;
  transport: string;
  status: string;
  clientTimestamp: string;
  serverAck: string;
  items: Array<{ type: string; id: string; desc: string }>;
  isLive?: boolean;
}

export default function SyncMonitorPage() {
  const [syncBatches, setSyncBatches] = useState<SyncBatchDisplay[]>([
    {
      batchId: "sync-batch-8841",
      studentId: "STU101",
      school: "GCS Chak 42",
      recordsCount: 4,
      transport: "HTTPS_BATCH",
      status: "SYNCED",
      clientTimestamp: "12:15:30 PM",
      serverAck: "ACK_OK_2025.1",
      items: [
        { type: "PROGRESS", id: "rec-p1", desc: "MOD_MATH_01 Completed (Score: 85%)" },
        { type: "QUIZ", id: "rec-q1", desc: "QZ_MATH_01 (Score: 80%, Answers: 2)" },
        { type: "AI_CHAT", id: "rec-c1", desc: "Prompt: 'Explain 1/2 with roti' (Offline rules)" },
      ],
    },
    {
      batchId: "sync-batch-8842",
      studentId: "STU102",
      school: "GCS Chak 42",
      recordsCount: 2,
      transport: "SMS_FALLBACK",
      status: "SYNCED",
      clientTimestamp: "11:40:12 AM",
      serverAck: "ACK_OK_SMS",
      items: [
        { type: "QUIZ", id: "rec-q2", desc: "QZ_MATH_01 (Score: 40%, 1 Attempt)" },
        { type: "PROGRESS", id: "rec-p2", desc: "Checkpoint MOD_MATH_01 (Time: 720s)" },
      ],
    },
  ]);

  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  useEffect(() => {
    async function loadBackendRecords() {
      try {
        const records = await fetchSyncRecords(30);
        if (records && records.length > 0) {
          // Group records by student
          const groupedBatch: SyncBatchDisplay = {
            batchId: `sync-db-${Date.now().toString().slice(-4)}`,
            studentId: records[0].student_id || 'STU101',
            school: 'Rural Solar Learning Node #4',
            recordsCount: records.length,
            transport: 'STORE_AND_FORWARD',
            status: 'SYNCED',
            clientTimestamp: new Date(records[0].synced_at).toLocaleTimeString(),
            serverAck: 'ACK_SERVER_COMMITTED',
            items: records.slice(0, 5).map((r) => ({
              type: r.operation_type,
              id: r.client_record_id || r.id,
              desc: JSON.stringify(r.payload_json).slice(0, 75) + '...',
            })),
          };
          setSyncBatches((prev) => [groupedBatch, ...prev.slice(0, 3)]);
        }
      } catch (_) {}
    }

    loadBackendRecords();

    // Listen to live Ecosystem Bridge events
    const unsub = webEcosystemBridge.subscribe((ev: EcosystemEvent) => {
      if (ev.type === 'SYNC_BATCH_PUSHED' && ev.payload) {
        const p = ev.payload;
        const newBatch: SyncBatchDisplay = {
          batchId: `batch-live-${Date.now().toString().slice(-4)}`,
          studentId: ev.studentId || 'STU101',
          school: 'Live Tablet (Port 3000)',
          recordsCount: p.recordsCount || (p.records ? p.records.length : 1),
          transport: 'LIVE_BRIDGE_FASTAPI',
          status: p.status || 'SYNCED',
          clientTimestamp: new Date().toLocaleTimeString(),
          serverAck: 'ACK_OK_REALTIME',
          items: (p.records || []).slice(0, 4).map((r: any, idx: number) => ({
            type: r.type || 'SYNC_ITEM',
            id: r.id || `item-${idx}`,
            desc: r.data?.title || r.data?.topicId || 'Synchronized learning progress',
          })),
          isLive: true,
        };

        setSyncBatches((prev) => [newBatch, ...prev]);
        setLiveAlert(`⚡ Real-time Batch Received: ${newBatch.recordsCount} records synced from ${newBatch.studentId}!`);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      {/* Ecosystem Status Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-800 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-200"></span>
          </span>
          <div>
            <div className="font-bold text-sm tracking-wide flex items-center gap-2">
              SYNCHRONIZATION ENGINE: ACTIVE
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                Store-and-Forward + Conflict Free
              </span>
            </div>
            <div className="text-xs text-sky-100">
              Observing student tablet sync buffers, 2G slow net deferred queues, and Solar Community Hub relays.
            </div>
          </div>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5 w-fit"
        >
          Trigger Sync from App ↗
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Offline Synchronization Engine & Queue Monitor
        </h1>
        <p className="text-sm text-slate-500">
          Observability for incoming student tablets, batch idempotency, and conflict resolution logs.
        </p>
      </div>

      {liveAlert && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between animate-pulse font-mono">
          <span>{liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="text-sky-700 hover:text-sky-950 font-bold">✕</button>
        </div>
      )}

      {/* Sync Flow Diagram Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sync Lifecycle Pipeline</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border border-slate-200">
            1. Local IndexedDB / SQLite (PENDING)
          </span>
          <span className="text-slate-400 font-bold">→</span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-900 rounded-lg font-semibold border border-amber-300">
            2. Slow Net 2G Deferral & Optimization
          </span>
          <span className="text-slate-400 font-bold">→</span>
          <span className="px-3 py-1.5 bg-purple-50 text-purple-900 rounded-lg font-semibold border border-purple-300">
            3. Solar Hub Window / HTTPS Batch
          </span>
          <span className="text-slate-400 font-bold">→</span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-lg font-semibold border border-emerald-300">
            4. FastAPI Idempotency & DB Commit
          </span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="space-y-4">
        {syncBatches.map((batch) => (
          <div
            key={batch.batchId}
            className={`bg-white rounded-2xl border ${
              batch.isLive ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'
            } p-6 shadow-sm space-y-3`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-sky-700">{batch.batchId}</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    {batch.studentId}
                  </span>
                  <span className="text-xs text-slate-400">• {batch.school}</span>
                  {batch.isLive && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-600 text-white uppercase">
                      Live Arrived
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Client time: {batch.clientTimestamp} • Transport: <span className="font-semibold text-slate-700">{batch.transport}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded">
                  {batch.serverAck}
                </span>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {batch.status}
                </span>
              </div>
            </div>

            {/* Individual Records in Batch */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-semibold text-slate-500">
                Synchronized Records ({batch.recordsCount}):
              </div>
              {batch.items.map((item) => (
                <div
                  key={item.id}
                  className="text-xs text-slate-700 flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono"
                >
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold">
                    {item.type}
                  </span>
                  <span className="text-slate-500">{item.id}:</span>
                  <span className="truncate">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
