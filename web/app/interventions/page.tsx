import { fetchStudents } from '@/lib/api';

export default async function InterventionsPage() {
  const students = await fetchStudents();
  const remedialStudents = students.filter(s => s.learning_band === 'REMEDIAL');
  const advancedStudents = students.filter(s => s.learning_band === 'ADVANCED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Teacher Intervention Hub
        </h1>
        <p className="text-sm text-slate-500">
          Pedagogical recommendations to support teachers. The system supports educators—it does not replace teachers.
        </p>
      </div>

      {/* Philosophy Banner */}
      <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          !
        </div>
        <div className="text-xs text-sky-900 space-y-1">
          <div className="font-bold">Human-in-the-Loop Pedagogical Principle</div>
          <p>
            Rehber provides automated diagnostics from student offline quizzes, but real learning breakthroughs in rural classrooms happen through direct teacher-student interaction. Use these groupings to conduct targeted small-group activities during class time.
          </p>
        </div>
      </div>

      {/* Two Columns: Remedial Support vs Advanced Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Remedial Group */}
        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              Students Requiring Additional Support
            </h2>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded">
              {remedialStudents.length} Students
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Students whose recent diagnostic or quiz responses indicate persistent misconceptions in foundational concepts.
          </p>

          <div className="space-y-3 pt-2">
            {remedialStudents.map((stu) => (
              <div key={stu.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{stu.name}</div>
                  <span className="text-xs font-mono text-slate-400">{stu.id}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Current Mastery: <span className="font-bold text-rose-600">{(stu.overall_mastery * 100).toFixed(0)}%</span> • Language: {stu.language}
                </div>
                <div className="p-2.5 bg-rose-50 rounded border border-rose-100 text-xs text-rose-900">
                  <span className="font-semibold">Recommended Intervention:</span> Pair with physical manipulatives (e.g. cutting paper flatbreads or using grain seeds) to solidify denominator concepts before moving to symbolic fractions.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Extension Group */}
        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Students Progressing Rapidly
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              {advancedStudents.length} Students
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Students who consistently solve medium-to-hard items quickly and are ready for enrichment challenges.
          </p>

          <div className="space-y-3 pt-2">
            {advancedStudents.map((stu) => (
              <div key={stu.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{stu.name}</div>
                  <span className="text-xs font-mono text-slate-400">{stu.id}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Current Mastery: <span className="font-bold text-emerald-600">{(stu.overall_mastery * 100).toFixed(0)}%</span> • Latent Ability (θ): +{stu.theta_ability.toFixed(2)}
                </div>
                <div className="p-2.5 bg-emerald-50 rounded border border-emerald-100 text-xs text-emerald-900">
                  <span className="font-semibold">Recommended Extension:</span> Assign peer mentoring role or unlock Class 7 introductory pre-algebra modules.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
