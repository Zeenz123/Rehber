export default function CurriculumPage() {
  const modules = [
    {
      id: "MOD_MATH_01",
      subject: "Mathematics (Class 6)",
      title: "Understanding Fractions & Equal Parts",
      difficulty: "EASY",
      lessonsCount: 3,
      questionsCount: 12,
      summary: "Visualizing parts of a whole using everyday local roti and farming land division examples.",
      audioScriptPreview: "Welcome to Rehber Mathematics. Imagine you have one flatbread, a roti, cut into two equal halves...",
    },
    {
      id: "MOD_MATH_02",
      subject: "Mathematics (Class 6)",
      title: "Fraction Addition and Subtraction",
      difficulty: "MEDIUM",
      lessonsCount: 4,
      questionsCount: 16,
      summary: "Finding common denominators and combining parts of quantities.",
      audioScriptPreview: "When denominators are equal, we simply combine the numerators...",
    },
    {
      id: "MOD_SCI_01",
      subject: "General Science (Class 6)",
      title: "Plant Life & Photosynthesis",
      difficulty: "EASY",
      lessonsCount: 3,
      questionsCount: 10,
      summary: "How green leaves absorb sunlight and carbon dioxide to make food and release oxygen.",
      audioScriptPreview: "Look at a green leaf in the sun. The leaf has tiny green particles called chlorophyll...",
    },
    {
      id: "MOD_SCI_02",
      subject: "General Science (Class 6)",
      title: "Cell Organelles & Respiration",
      difficulty: "HARD",
      lessonsCount: 4,
      questionsCount: 15,
      summary: "Microscopic building blocks of living organisms and cellular energy.",
      audioScriptPreview: "A cell is the fundamental building unit of all living things, like a single brick in a village house...",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Offline Curriculum & Audio Scripts
          </h1>
          <p className="text-sm text-slate-500">
            Review and author pre-installed curriculum modules, audio scripts for TTS, and IRT questions.
          </p>
        </div>
        <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow transition">
          + Add New Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">{mod.subject}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {mod.difficulty}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{mod.summary}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-xs font-semibold text-slate-700">Preinstalled Audio Script (TTS):</div>
              <p className="text-xs text-slate-500 italic line-clamp-2">
                &ldquo;{mod.audioScriptPreview}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{mod.lessonsCount} Lessons • {mod.questionsCount} Questions</span>
              <button className="text-sky-600 font-semibold hover:underline">
                Edit Questions & Audio →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
