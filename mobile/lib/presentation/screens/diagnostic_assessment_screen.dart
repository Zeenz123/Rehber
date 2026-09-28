import 'package:flutter/material.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/data/repositories/curriculum_repository.dart';
import 'package:rehber/domain/adaptive/mobile_irt_calculator.dart';
import 'package:rehber/presentation/widgets/preinstalled_mcq_card.dart';
import 'package:rehber/presentation/screens/home_dashboard_screen.dart';

class DiagnosticAssessmentScreen extends StatefulWidget {
  final String studentId;
  final String language;

  const DiagnosticAssessmentScreen({
    super.key,
    required this.studentId,
    required this.language,
  });

  @override
  State<DiagnosticAssessmentScreen> createState() => _DiagnosticAssessmentScreenState();
}

class _DiagnosticAssessmentScreenState extends State<DiagnosticAssessmentScreen> {
  final CurriculumRepository _curriculumRepo = CurriculumRepository();
  List<LocalQuestion> _questions = [];
  final Map<String, String> _answers = {};
  int _currentIndex = 0;
  bool _isLoading = true;
  bool _isEvaluating = false;

  @override
  void initState() {
    super.initState();
    _loadDiagnosticQuestions();
  }

  Future<void> _loadDiagnosticQuestions() async {
    // Load foundational questions across Math and Science
    final q1 = await _curriculumRepo.getQuestions('LES_MATH_101');
    final q2 = await _curriculumRepo.getQuestions('LES_SCI_101');
    setState(() {
      _questions = [...q1, ...q2];
      _isLoading = false;
    });
  }

  void _onOptionSelected(String option) {
    if (_questions.isEmpty) return;
    final currentQ = _questions[_currentIndex];
    setState(() {
      _answers[currentQ.id] = option;
    });
  }

  Future<void> _submitDiagnostic() async {
    setState(() => _isEvaluating = true);

    int correct = 0;
    final List<({double difficulty, bool isCorrect})> irtResponses = [];

    for (final q in _questions) {
      final chosen = _answers[q.id];
      final isCorr = chosen?.toUpperCase() == q.correctOption.toUpperCase();
      if (isCorr) correct++;
      irtResponses.add((difficulty: q.irtB, isCorrect: isCorr));
    }

    final score = _questions.isEmpty ? 0.0 : (correct / _questions.length) * 100.0;

    // Run client-side IRT 1PL estimation
    final result = MobileIrtCalculator.updateAbility(
      currentTheta: 0.0,
      responses: irtResponses,
    );

    // Save locally and queue for background sync
    await StudentRepository().saveQuizAttempt(
      studentId: widget.studentId,
      quiz_id: 'DIAGNOSTIC_INIT',
      score: score,
      answers: _answers,
      newTheta: result.theta,
      newMastery: result.mastery,
      newBand: result.band,
    );

    final updatedStudent = await StudentRepository().getOrInitStudent();

    if (mounted) {
      _showResultDialog(score, result.band, updatedStudent);
    }
  }

  void _showResultDialog(double score, String band, LocalStudent student) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('Diagnostic Complete! / تشخیصی مکمل'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Baseline Score: ${score.toStringAsFixed(0)}%'),
            const SizedBox(height: 6),
            Text('Estimated Learning Band: $band', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0284C7))),
            const SizedBox(height: 12),
            const Text(
              'Rehber has tailored your lesson recommendations based on your responses. You can now learn completely offline.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7)),
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => HomeDashboardScreen(student: student)),
              );
            },
            child: const Text('Go to Learning Dashboard', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Diagnostic Assessment')),
        body: const Center(child: Text('No diagnostic questions found.')),
      );
    }

    final currentQ = _questions[_currentIndex];
    final selected = _answers[currentQ.id];

    return Scaffold(
      appBar: AppBar(
        title: Text('Diagnostic Question ${_currentIndex + 1}/${_questions.length}'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            LinearProgressIndicator(
              value: (_currentIndex + 1) / _questions.length,
              backgroundColor: const Color(0xFFE2E8F0),
              color: const Color(0xFF0284C7),
            ),
            const SizedBox(height: 16),
            PreinstalledMcqCard(
              question: currentQ,
              selectedOption: selected,
              isSubmitted: false,
              onOptionSelected: _onOptionSelected,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentIndex--),
                      child: const Text('Previous'),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: selected == null
                        ? null
                        : () {
                            if (_currentIndex < _questions.length - 1) {
                              setState(() => _currentIndex++);
                            } else {
                              _submitDiagnostic();
                            }
                          },
                    child: Text(_currentIndex == _questions.length - 1 ? 'Finish & Calibrate' : 'Next Question'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
