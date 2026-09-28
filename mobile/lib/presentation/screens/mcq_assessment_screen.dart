import 'package:flutter/material.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/data/repositories/curriculum_repository.dart';
import 'package:rehber/domain/adaptive/mobile_irt_calculator.dart';
import 'package:rehber/presentation/widgets/preinstalled_mcq_card.dart';
import 'package:rehber/presentation/widgets/network_status_badge.dart';

class McqAssessmentScreen extends StatefulWidget {
  final String lessonId;
  final LocalStudent student;

  const McqAssessmentScreen({
    super.key,
    required this.lessonId,
    required this.student,
  });

  @override
  State<McqAssessmentScreen> createState() => _McqAssessmentScreenState();
}

class _McqAssessmentScreenState extends State<McqAssessmentScreen> {
  final CurriculumRepository _curriculumRepo = CurriculumRepository();
  List<LocalQuestion> _questions = [];
  final Map<String, String> _answers = {};
  bool _isLoading = true;
  bool _isSubmitted = false;
  double _score = 0.0;
  String _newBand = 'ON_TRACK';

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final list = await _curriculumRepo.getQuestions(widget.lessonId);
    setState(() {
      _questions = list;
      _isLoading = false;
    });
  }

  void _onOptionSelected(String qId, String option) {
    if (_isSubmitted) return;
    setState(() {
      _answers[qId] = option;
    });
  }

  Future<void> _submitAssessment() async {
    int correctCount = 0;
    final List<({double difficulty, bool isCorrect})> irtResponses = [];

    for (final q in _questions) {
      final chosen = _answers[q.id];
      final isCorr = chosen?.toUpperCase() == q.correctOption.toUpperCase();
      if (isCorr) correctCount++;
      irtResponses.add((difficulty: q.irtB, isCorrect: isCorr));
    }

    final score = _questions.isEmpty ? 0.0 : (correctCount / _questions.length) * 100.0;

    // Local adaptive IRT calculation
    final result = MobileIrtCalculator.updateAbility(
      currentTheta: widget.student.thetaAbility,
      responses: irtResponses,
    );

    // Immediate local optimistic save to SQLite and sync queue
    await StudentRepository().saveQuizAttempt(
      studentId: widget.student.id,
      quizId: 'QZ_${widget.lessonId}',
      score: score,
      answers: _answers,
      newTheta: result.theta,
      newMastery: result.mastery,
      newBand: result.band,
    );

    setState(() {
      _score = score;
      _newBand = result.band;
      _isSubmitted = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Practice Test / پریکٹس ٹیسٹ'),
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
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Score Banner when submitted
            if (_isSubmitted) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _score >= 60 ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _score >= 60 ? const Color(0xFF6EE7B7) : const Color(0xFFFCA5A5),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _score >= 60 ? Icons.check_circle : Icons.info,
                      color: _score >= 60 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                      size: 36,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Score: ${_score.toStringAsFixed(0)}% • Band: $_newBand',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: _score >= 60 ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Saved locally in SQLite. Queued for background synchronization.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Preinstalled MCQ Questions list
            ..._questions.map((q) => Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: PreinstalledMcqCard(
                    question: q,
                    selectedOption: _answers[q.id],
                    isSubmitted: _isSubmitted,
                    onOptionSelected: (opt) => _onOptionSelected(q.id, opt),
                  ),
                )),

            const SizedBox(height: 16),
            if (!_isSubmitted)
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: _answers.length == _questions.length ? _submitAssessment : null,
                  icon: const Icon(Icons.send),
                  label: const Text('Submit Answers (Offline)', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Back to Dashboard'),
                ),
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
