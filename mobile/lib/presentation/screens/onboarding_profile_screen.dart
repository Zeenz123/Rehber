import 'package:flutter/material.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/presentation/screens/diagnostic_assessment_screen.dart';

class OnboardingProfileScreen extends StatefulWidget {
  final LocalStudent student;

  const OnboardingProfileScreen({super.key, required this.student});

  @override
  State<OnboardingProfileScreen> createState() => _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState extends State<OnboardingProfileScreen> {
  late TextEditingController _nameController;
  late int _selectedGrade;
  late String _selectedLanguage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.student.name);
    _selectedGrade = widget.student.grade;
    _selectedLanguage = widget.student.language;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _saveAndProceed() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    await StudentRepository().updateProfile(
      studentId: widget.student.id,
      name: name,
      grade: _selectedGrade,
      language: _selectedLanguage,
    );

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DiagnosticAssessmentScreen(
            studentId: widget.student.id,
            language: _selectedLanguage,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Profile / طالب علم کی معلومات'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set Up Your Offline Learning Profile',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Your learning data will be saved directly on this device.',
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 20),

            // Student ID Display
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.badge, color: Color(0xFF475569)),
                  const SizedBox(width: 10),
                  Text('Student ID: ${widget.student.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Name Field
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name / پورا نام',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 16),

            // Grade Dropdown
            DropdownButtonFormField<int>(
              value: _selectedGrade,
              decoration: const InputDecoration(
                labelText: 'Grade / جماعت',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.grade),
              ),
              items: const [
                DropdownMenuItem(value: 6, child: Text('Class 6 (ششم)')),
                DropdownMenuItem(value: 7, child: Text('Class 7 (ہفتم)')),
                DropdownMenuItem(value: 8, child: Text('Class 8 (ہشتم)')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _selectedGrade = val);
              },
            ),
            const SizedBox(height: 16),

            // Language Dropdown
            DropdownButtonFormField<String>(
              value: _selectedLanguage,
              decoration: const InputDecoration(
                labelText: 'Learning Language / تدریسی زبان',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.translate),
              ),
              items: const [
                DropdownMenuItem(value: 'urdu', child: Text('Urdu (اردو)')),
                DropdownMenuItem(value: 'english', child: Text('English')),
                DropdownMenuItem(value: 'sindhi', child: Text('Sindhi (سنڌي)')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _selectedLanguage = val);
              },
            ),
            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: _saveAndProceed,
                icon: const Icon(Icons.arrow_forward),
                label: const Text('Save & Start Diagnostic Test', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
