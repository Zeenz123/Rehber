import { fetchDashboardAnalytics } from '@/lib/api';
import Link from 'next/link';

export default async function DashboardPage() {
  const data = await fetchDashboardAnalytics();
  const bands = data.band_distribution;

  const remedialPct = Math.round((bands.remedial_count / bands.total_students) * 100) || 0;
  const onTrackPct = Math.round((bands.on_track_count / bands.total_students) * 100) || 0;
  const advancedPct = Math.round((bands.advanced_count / bands.total_students) * 100) || 0;

  return (
    <div className="space-y-8">
      {/* Title & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Educator Learning Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time mastery tracking & offline synchronization supervision for rural classrooms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={process.env.NEXT_PUBLIC_STUDENT_APP_URL || "http://localhost:3000"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-sm text-xs font-bold rounded-lg transition"
          >
            Launch Student App
          </a>
          <Link
            href="/sms-gateway"
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 shadow-sm text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            SMS Gateway Feed
          </Link>
          <Link
            href="/interventions"
            className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            View Interventions
          </Link>
        </div>
      </div>

      {/* Unified Ecosystem Connectivity Bar (Web + SMS + Slow Net + Student App) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                Connected Rural Learning Ecosystem (Web + SMS + Student App)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-transport architecture seamlessly combining High-Speed HTTPS, Slow Net (2G Compact), Cellular SMS (160-char), and 100% Offline AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Web Portal (3001)
            </span>
            <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span>
              Student App (3000)
            </span>
            <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              Slow Net (2G)
            </span>
            <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-purple-400"></span>
              SMS Protocol
            </span>
          </div>
        </div>
      </div>


      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Enrolled Students</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{data.total_students}</div>
          <div className="mt-1 text-xs text-slate-400">Govt Community School Chak 42</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Today (Offline & Online)</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">{data.active_today}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">70.8% Daily engagement</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cohort Average Mastery</div>
          <div className="mt-2 text-3xl font-extrabold text-sky-600">{(data.average_mastery * 100).toFixed(0)}%</div>
          <div className="mt-1 text-xs text-slate-400">IRT 1PL Latent ability calibrated</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Offline Syncs</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">{data.pending_sync_count}</div>
          <div className="mt-1 text-xs text-amber-700">Records awaiting network window</div>
        </div>
      </div>

      {/* Learning Bands Distribution */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Learning Band Distribution</h2>
            <p className="text-xs text-slate-500">
              Note: Bands are pedagogical grouping classifications for teacher guidance, not judgments of student ability.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            3 Pedagogical Cohorts
          </span>
        </div>

        {/* Progress Bar Stack */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${remedialPct}%` }} className="bg-rose-500" title={`Remedial: ${remedialPct}%`} />
          <div style={{ width: `${onTrackPct}%` }} className="bg-sky-500" title={`On Track: ${onTrackPct}%`} />
          <div style={{ width: `${advancedPct}%` }} className="bg-emerald-500" title={`Advanced: ${advancedPct}%`} />
        </div>

        {/* Band Legend Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Remedial Support</span>
              <span className="text-base font-bold text-rose-900">{bands.remedial_count} ({remedialPct}%)</span>
            </div>
            <p className="mt-1 text-xs text-rose-700">
              Requires guided revision, simpler metaphors, and foundational practice.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">On Track</span>
              <span className="text-base font-bold text-sky-900">{bands.on_track_count} ({onTrackPct}%)</span>
            </div>
            <p className="mt-1 text-xs text-sky-700">
              Standard curriculum progression; steady conceptual comprehension.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Advanced Mastery</span>
              <span className="text-base font-bold text-emerald-900">{bands.advanced_count} ({advancedPct}%)</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Ready for deeper extension challenges and peer mentoring.
            </p>
          </div>
        </div>
      </div>

      {/* Struggling Topics & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Struggling Topics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Topics Needing Intervention</h2>
            <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Action Required
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Identifies conceptual bottlenecks where students score below 60%.
          </p>

          <div className="space-y-3 pt-2">
            {data.struggling_topics.map((topic) => (
              <div key={topic.module_id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-700 uppercase">{topic.subject_code} • {topic.module_id}</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{topic.module_title}</div>
                  <div className="text-xs text-rose-600 mt-1">
                    {topic.struggling_students_count} students struggling (Avg score: {topic.average_score}%)
                  </div>
                </div>
                <Link
                  href={`/interventions?module=${topic.module_id}`}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Review Group
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Sync & Quiz Activity</h2>
            <Link href="/sync-monitor" className="text-xs text-sky-600 hover:underline">
              View all syncs →
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            Latest incoming quizzes and progress records across HTTPS and cellular SMS fallbacks.
          </p>

          <div className="space-y-3 pt-2">
            {data.recent_activity.map((act) => (
              <div key={act.id} className="p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    act.transport === 'SMS' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {act.transport === 'SMS' ? 'SMS' : 'HTTP'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{act.student_id} • {act.quiz_id}</div>
                    <div className="text-xs text-slate-400">Score: {act.score}% • Transport: {act.transport}</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
