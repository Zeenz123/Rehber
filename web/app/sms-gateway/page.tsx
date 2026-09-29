'use client';

import { useState, useEffect } from 'react';
import { fetchSmsLogs, sendTeacherSms, SmsLogApiItem, API_BASE_URL } from '@/lib/api';
import { webEcosystemBridge, EcosystemEvent } from '@/lib/ecosystemBridge';

interface SmsLogItem {
  id: string;
  sender: string;
  studentId: string;
  actionCode: string;
  rawInbound: string;
  rawOutbound: string;
  status: string;
  timestamp: string;
  isLive?: boolean;
}

export default function SmsGatewayPage() {
  const [testPayload, setTestPayload] = useState('GOV-SCH-001-STU-0001#ASK#Why do plants need sunlight?');
  const [teacherTargetStudent, setTeacherTargetStudent] = useState('GOV-SCH-001-STU-0001');
  const [teacherMessage, setTeacherMessage] = useState('Great progress on Fractions! Practice Module 2 next.');
  const [teacherSending, setTeacherSending] = useState(false);
  const [ecosystemConnected, setEcosystemConnected] = useState(true);
  const [lastEventReceived, setLastEventReceived] = useState<string | null>(null);

  const [logs, setLogs] = useState<SmsLogItem[]>([
    {
      id: 'sms-001',
      sender: '+923011111101',
      studentId: 'STU101',
      actionCode: 'ASK',
      rawInbound: 'GOV-SCH-001-STU-0001#ASK#What is photosynthesis?',
      rawOutbound: 'STU101#ANS#Plants make food using sunlight, water, and CO2, releasing oxygen.',
      status: 'PROCESSED',
      timestamp: '12:45:10 PM',
    },
    {
      id: 'sms-002',
      sender: '+923011111102',
      studentId: 'STU102',
      actionCode: 'QZ',
      rawInbound: 'GOV-SCH-001-STU-0001#QZ#QZ_MATH_01|Q_MATH_001:A,Q_MATH_002:B',
      rawOutbound: 'STU102#RES#QZ|Score:100%|Mastery:+0.16|Next:MOD_MATH_02',
      status: 'PROCESSED',
      timestamp: '12:30:05 PM',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Hydrate logs from backend API and listen to live Ecosystem Bridge
  useEffect(() => {
    async function loadApiLogs() {
      try {
        const apiLogs = await fetchSmsLogs(25);
        if (apiLogs && apiLogs.length > 0) {
          const mapped: SmsLogItem[] = apiLogs.map((l) => ({
            id: l.id,
            sender: l.sender_number || '+923001234567',
            studentId: l.student_id || 'STU101',
            actionCode: l.action_code || 'SMS',
            rawInbound: l.raw_text,
            rawOutbound: l.response_text || 'Acknowledged by Gateway',
            status: l.status,
            timestamp: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          }));
          setLogs(mapped);
        }
      } catch (_) {}
    }

    loadApiLogs();

    // Subscribe to live Cross-App Ecosystem Bridge
    const unsub = webEcosystemBridge.subscribe((ev: EcosystemEvent) => {
      setEcosystemConnected(true);
      if (ev.type === 'SMS_DISPATCHED' && ev.payload) {
        const p = ev.payload;
        const newLog: SmsLogItem = {
          id: p.id || `sms-live-${Date.now()}`,
          sender: ev.source === 'student_app' ? 'Student App (Port 3000)' : 'Gateway',
          studentId: ev.studentId || p.studentId || 'STU101',
          actionCode: p.actionCode || 'ASK',
          rawInbound: p.rawPayload || `${ev.studentId}#${p.actionCode}#Query`,
          rawOutbound: p.decodedText ? `${ev.studentId}#ANS#${p.decodedText}` : 'Processing on gateway...',
          status: 'LIVE_RECEIVED',
          timestamp: new Date().toLocaleTimeString(),
          isLive: true,
        };
        setLogs((prev) => [newLog, ...prev]);
        setLastEventReceived(`Received ${p.actionCode} from ${ev.studentId} via ${ev.source}`);
      }
    });

    return () => unsub();
  }, []);

  async function handleSendTeacherSms() {
    if (!teacherMessage.trim()) return;
    setTeacherSending(true);

    try {
      const result = await sendTeacherSms(teacherTargetStudent, teacherMessage.trim());

      // Broadcast to student app via Ecosystem Bridge
      webEcosystemBridge.emit(
        'TEACHER_INTERVENTION',
        teacherTargetStudent,
        {
          text: teacherMessage,
          actionCode: 'TCH',
          rawPayload: `${teacherTargetStudent}#TCH#${teacherMessage}`,
        },
        'web_portal'
      );

      const newLog: SmsLogItem = {
        id: result?.id || `sms-teacher-${Date.now()}`,
        sender: 'Teacher Web Portal',
        studentId: teacherTargetStudent,
        actionCode: 'TCH',
        rawInbound: `${teacherTargetStudent}#TCH#${teacherMessage}`,
        rawOutbound: 'Delivered to Student App',
        status: 'DELIVERED',
        timestamp: new Date().toLocaleTimeString(),
        isLive: true,
      };

      setLogs((prev) => [newLog, ...prev]);
      setFeedback(`Sent SMS to ${teacherTargetStudent}: "${teacherMessage}"`);
      setTeacherMessage('');
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setTeacherSending(false);
    }
  }

  async function handleSendSimulatedSms() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/sms/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: '+923001234567',
          message: testPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newLog: SmsLogItem = {
          id: `sms-${Date.now()}`,
          sender: '+923001234567',
          studentId: data.student_id || 'UNKNOWN',
          actionCode: data.action_code || 'RAW',
          rawInbound: testPayload,
          rawOutbound: data.reply_sms,
          status: data.status,
          timestamp: new Date().toLocaleTimeString(),
          isLive: true,
        };
        setLogs([newLog, ...logs]);
        setFeedback(`Success! Reply SMS: ${data.reply_sms}`);

        // Emit to Ecosystem Bridge
        webEcosystemBridge.emit(
          'SMS_DISPATCHED',
          data.student_id || 'STU101',
          { id: newLog.id, actionCode: data.action_code, rawPayload: testPayload },
          'sms_gateway'
        );
      } else {
        setFeedback(`Server returned status: ${res.status}`);
      }
    } catch (e: any) {
      // In offline/demo mode, simulate client-side
      const newLog: SmsLogItem = {
        id: `sms-${Date.now()}`,
        sender: '+923001234567',
        studentId: 'STU101',
        actionCode: 'ASK',
        rawInbound: testPayload,
        rawOutbound: 'STU101#ANS#Plants make food using sunlight, water and CO2 (Simulated Gateway)',
        status: 'SIMULATED',
        timestamp: new Date().toLocaleTimeString(),
        isLive: true,
      };
      setLogs([newLog, ...logs]);
      setFeedback('Simulated local processing (backend endpoint not reached).');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Ecosystem Interconnect Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200"></span>
          </span>
          <div>
            <div className="font-bold text-sm tracking-wide flex items-center gap-2">
              ECOSYSTEM BRIDGE ACTIVE
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                Port 3000 (Student) ↔ FastAPI 8000 ↔ Port 3001 (Web)
              </span>
            </div>
            <div className="text-xs text-emerald-100">
              Real-time synchronization for Slow Net (2G), Cellular SMS fallback, and store-and-forward telemetry.
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg font-bold shadow-sm transition flex items-center gap-1.5"
          >
            Open Student App ↗
          </a>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cellular SMS Gateway Monitor & Live Message Hub
        </h1>
        <p className="text-sm text-slate-500">
          Supervise low-bandwidth message-embedded AI learning traffic. Protocol standard: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800">[StudentID]#[ActionCode]#[PayloadData]</code>
        </p>
      </div>

      {lastEventReceived && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-pulse">
          <span className="font-medium font-mono">⚡ Live Broadcast: {lastEventReceived}</span>
          <button onClick={() => setLastEventReceived(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Grid: Teacher SMS Dispatcher & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Teacher Direct SMS Intervention */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💬</span> Send SMS Intervention to Student App
            </h2>
            <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">
              Action: TCH
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dispatches an SMS message directly to the student tablet or feature phone over the cellular protocol.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Student:</label>
              <select
                value={teacherTargetStudent}
                onChange={(e) => setTeacherTargetStudent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="STU101">STU101 - Rahul Kumar (Class 7)</option>
                <option value="STU102">STU102 - Priya Sharma (Class 7)</option>
                <option value="STU103">STU103 - Anita Devi (Class 7)</option>
                <option value="STU104">STU104 - Arun Patel (Class 7)</option>
                <option value="STU105">STU105 - Sunita Meena (Class 7)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message Content (Max 160 chars):</label>
              <textarea
                rows={2}
                maxLength={160}
                value={teacherMessage}
                onChange={(e) => setTeacherMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="text-[11px] text-slate-400 text-right">
                {teacherMessage.length} / 160 chars ({Math.ceil(teacherMessage.length / 160) || 1} SMS segment)
              </div>
            </div>

            <button
              onClick={handleSendTeacherSms}
              disabled={teacherSending || !teacherMessage.trim()}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              {teacherSending ? 'Transmitting Cellular SMS...' : 'Dispatch SMS to Student App'}
            </button>
          </div>
        </div>

        {/* Card 2: Interactive Webhook Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📡</span> Simulate Incoming Cellular SMS Packet
            </h2>
            <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-semibold">
              POST /api/sms/webhook
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dispatches raw delimited packets to test backend IRT evaluation and AI response builder.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
            />

            <button
              onClick={handleSendSimulatedSms}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching to Webhook...' : 'Dispatch Packet to Gateway Webhook'}
            </button>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-medium">Presets:</span>
              <button
                onClick={() => setTestPayload('GOV-SCH-001-STU-0001#ASK#Why is gravity important?')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px]"
              >
                ASK: Gravity
              </button>
              <button
                onClick={() => setTestPayload('GOV-SCH-001-STU-0001#QZ#QZ_MATH_01|Q_MATH_001:A,Q_MATH_002:B')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px]"
              >
                QZ: Math Quiz
              </button>
              <button
                onClick={() => setTestPayload('GOV-SCH-001-STU-0001#REG#Anita Devi|7|urdu')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px]"
              >
                REG: Register
              </button>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 font-mono">
          {feedback}
        </div>
      )}

      {/* Message Traffic Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live Cellular SMS Packet Log ({logs.length})
            </h2>
            <p className="text-xs text-slate-500">Live incoming student requests & outgoing educational answers</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Listening on Ecosystem Bus
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-xl border transition-all ${
                log.isLive
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                  : 'border-slate-200 bg-slate-50'
              } space-y-2 font-mono text-xs`}
            >
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-xs bg-slate-200 text-slate-800">
                    {log.studentId}
                  </span>
                  • Action: <span className="text-sky-700 font-mono font-semibold">{log.actionCode}</span>
                  {log.isLive && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                      Live
                    </span>
                  )}
                </span>
                <span className="text-slate-400 text-xs font-mono">{log.timestamp}</span>
              </div>

              <div className="text-slate-700">
                <span className="text-purple-700 font-bold font-sans">Inbound SMS: </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{log.rawInbound}</span>
              </div>

              <div className="text-emerald-800">
                <span className="text-emerald-700 font-bold font-sans">Gateway Reply: </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{log.rawOutbound}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

