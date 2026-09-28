import { fetchStudents } from '@/lib/api';

export default async function StudentsPage() {
  const students = await fetchStudents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Roster & Mastery Records
          </h1>
          <p className="text-sm text-slate-500">
            Detailed view of rural learners, latent abilities, topic mastery, and synchronization states.
          </p>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Grade & Language</th>
                <th className="px-6 py-4">Learning Band</th>
                <th className="px-6 py-4">Overall Mastery</th>
                <th className="px-6 py-4">IRT Ability (θ)</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu) => {
                const masteryPct = Math.round(stu.overall_mastery * 100);
                const isRemedial = stu.learning_band === 'REMEDIAL';
                const isAdvanced = stu.learning_band === 'ADVANCED';

                return (
                  <tr key={stu.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{stu.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{stu.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">Class {stu.grade}</div>
                      <div className="text-xs text-slate-400 capitalize">{stu.language}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isRemedial
                            ? 'bg-rose-100 text-rose-800'
                            : isAdvanced
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {stu.learning_band}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isRemedial ? 'bg-rose-500' : isAdvanced ? 'bg-emerald-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${masteryPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{masteryPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {stu.theta_ability > 0 ? `+${stu.theta_ability.toFixed(2)}` : stu.theta_ability.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(stu.last_active_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-semibold text-sky-600 hover:text-sky-800">
                        View Profile →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
