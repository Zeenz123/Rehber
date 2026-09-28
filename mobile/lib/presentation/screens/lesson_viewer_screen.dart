import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/speech/offline_tts_service.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/data/repositories/curriculum_repository.dart';
import 'package:rehber/presentation/widgets/network_status_badge.dart';
import 'package:rehber/presentation/screens/mcq_assessment_screen.dart';

class LessonViewerScreen extends StatefulWidget {
  final String lessonId;
  final LocalStudent student;

  const LessonViewerScreen({
    super.key,
    required this.lessonId,
    required this.student,
  });

  @override
  State<LessonViewerScreen> createState() => _LessonViewerScreenState();
}

class _LessonViewerScreenState extends State<LessonViewerScreen> {
  final CurriculumRepository _curriculumRepo = CurriculumRepository();
  LocalLesson? _lesson;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLesson();
  }

  Future<void> _loadLesson() async {
    final moduleId = widget.lessonId.contains('MATH') ? 'MOD_MATH_01' : 'MOD_SCI_01';
    final lessons = await _curriculumRepo.getLessons(moduleId);
    setState(() {
      _lesson = lessons.firstWhere(
        (l) => l.id == widget.lessonId,
        orElse: () => lessons.first,
      );
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    OfflineTtsService.instance.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _lesson == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final lesson = _lesson!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(lesson.title),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: Center(child: NetworkStatusBadge()),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Audio Player Bar using Native Android TTS
            Consumer<OfflineTtsService>(
              builder: (context, tts, _) {
                final isPlaying = tts.isPlaying;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: const Color(0xFF0284C7),
                        radius: 20,
                        child: IconButton(
                          icon: Icon(isPlaying ? Icons.stop : Icons.volume_up, color: Colors.white, size: 20),
                          onPressed: () {
                            if (isPlaying) {
                              tts.stop();
                            } else {
                              tts.speak(
                                lesson.audioScript,
                                languageCode: widget.student.language.startsWith('ur') ? 'ur-PK' : 'en-US',
                              );
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isPlaying ? 'Playing Offline Voice Lesson...' : 'Listen Offline Audio / سنیں',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0369A1)),
                            ),
                            const Text(
                              'Native Android TTS (No internet needed)',
                              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 20),

            // Concept Summary Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lightbulb_outline, color: Color(0xFFF59E0B)),
                        SizedBox(width: 8),
                        Text(
                          'Concept Summary / خلاصہ',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Text(
                      lesson.conceptSummary,
                      style: const TextStyle(fontSize: 15, height: 1.5, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Audio Script / سبق کی عبارت:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF475569)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            lesson.audioScript,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontStyle: FontStyle.italic),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Start Practice Quiz Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => McqAssessmentScreen(
                        lessonId: lesson.id,
                        student: widget.student,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.quiz),
                label: const Text('Start Practice Test (MCQ)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
