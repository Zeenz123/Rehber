import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/core/sync/sync_engine.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/data/repositories/curriculum_repository.dart';
import 'package:rehber/presentation/widgets/network_status_badge.dart';
import 'package:rehber/presentation/screens/lesson_viewer_screen.dart';
import 'package:rehber/presentation/screens/ai_chat_screen.dart';
import 'package:rehber/presentation/screens/developer_demo_panel.dart';

class HomeDashboardScreen extends StatefulWidget {
  final LocalStudent student;

  const HomeDashboardScreen({super.key, required this.student});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  final CurriculumRepository _curriculumRepo = CurriculumRepository();
  List<LocalSubject> _subjects = [];
  List<LocalModule> _mathModules = [];
  List<LocalModule> _sciModules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCurriculum();
  }

  Future<void> _loadCurriculum() async {
    final subs = await _curriculumRepo.getSubjects();
    final mathMods = await _curriculumRepo.getModules('SUB_MATH');
    final sciMods = await _curriculumRepo.getModules('SUB_SCI');

    setState(() {
      _subjects = subs;
      _mathModules = mathMods;
      _sciModules = sciMods;
      _isLoading = false;
    });
  }

  void _openDeveloperPanel() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const DeveloperDemoPanel()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final student = widget.student;
    final masteryPct = (student.overallMastery * 100).toInt();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'REHBER',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
            ),
            Text(
              '${student.name} • Class ${student.grade}',
              style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          // Network State Badge in Header
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Center(
              child: NetworkStatusBadge(onTap: _openDeveloperPanel),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.tune, color: Colors.white70),
            tooltip: 'Judge Demo Control',
            onPressed: _openDeveloperPanel,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadCurriculum,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Offline Sync Queue Banner
                    Consumer<SyncEngine>(
                      builder: (context, syncEng, _) {
                        if (syncEng.pendingCount == 0) return const SizedBox.shrink();
                        return Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.cloud_upload_outlined, color: Color(0xFF2563EB), size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '${syncEng.pendingCount} offline progress record(s) queued. Will auto-sync when online.',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF1E40AF)),
                                ),
                              ),
                              if (syncEng.isSyncing)
                                const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              else
                                TextButton(
                                  onPressed: () => syncEng.attemptSync(),
                                  child: const Text('Sync Now', style: TextStyle(fontSize: 12)),
                                ),
                            ],
                          ),
                        );
                      },
                    ),

                    // Learner Mastery & Band Card
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      color: Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                SizedBox(
                                  width: 64,
                                  height: 64,
                                  child: CircularProgressIndicator(
                                    value: student.overallMastery,
                                    backgroundColor: const Color(0xFFE2E8F0),
                                    color: const Color(0xFF0284C7),
                                    strokeWidth: 7,
                                  ),
                                ),
                                Text(
                                  '$masteryPct%',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ],
                            ),
                            const SizedBox(width: 18),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: student.learningBand == 'ADVANCED'
                                          ? const Color(0xFFDCFCE7)
                                          : (student.learningBand == 'REMEDIAL'
                                              ? const Color(0xFFFEE2E2)
                                              : const Color(0xFFE0F2FE)),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'Band: ${student.learningBand}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: student.learningBand == 'ADVANCED'
                                            ? const Color(0xFF166534)
                                            : (student.learningBand == 'REMEDIAL'
                                                ? const Color(0xFF991B1B)
                                                : const Color(0xFF0369A1)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Adaptive Learning Status',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const Text(
                                    'Pacing adapted to student performance.',
                                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Next Recommended Concept Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white24,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'NEXT RECOMMENDED / اگلا سبق',
                                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const Spacer(),
                              const Icon(Icons.offline_bolt, color: Color(0xFFFDE047), size: 18),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'What is a Fraction? (کسر کیا ہے؟)',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Learn equal parts using everyday roti examples with full offline audio.',
                            style: TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF0369A1),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => LessonViewerScreen(
                                    lessonId: 'LES_MATH_101',
                                    student: student,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.play_circle_fill),
                            label: const Text('Start Lesson Offline', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Subjects & Curriculum Section
                    const Text(
                      'Preinstalled Curriculum / نصاب',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 12),

                    // Math Modules
                    _buildSubjectSection(
                      title: 'Mathematics (ریاضی)',
                      icon: Icons.calculate,
                      color: const Color(0xFF2563EB),
                      modules: _mathModules,
                      student: student,
                    ),
                    const SizedBox(height: 16),

                    // Science Modules
                    _buildSubjectSection(
                      title: 'General Science (سائنس)',
                      icon: Icons.science,
                      color: const Color(0xFF059669),
                      modules: _sciModules,
                      student: student,
                    ),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.chat_bubble_outline),
        label: const Text('Rehber AI Tutor', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => AiChatScreen(student: student),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSubjectSection({
    required String title,
    required IconData icon,
    required Color color,
    required List<LocalModule> modules,
    required LocalStudent student,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ],
        ),
        const SizedBox(height: 8),
        ...modules.map((mod) => Card(
              elevation: 1,
              margin: const EdgeInsets.only(bottom: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: ListTile(
                title: Text(mod.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text(mod.description, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  final lessonId = mod.id.contains('MATH') ? 'LES_MATH_101' : 'LES_SCI_101';
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => LessonViewerScreen(
                        lessonId: lessonId,
                        student: student,
                      ),
                    ),
                  );
                },
              ),
            )),
      ],
    );
  }
}
