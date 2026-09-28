import 'package:flutter/material.dart';
import 'package:rehber/data/repositories/curriculum_repository.dart';

class PreinstalledMcqCard extends StatelessWidget {
  final LocalQuestion question;
  final String? selectedOption;
  final bool isSubmitted;
  final Function(String option) onOptionSelected;

  const PreinstalledMcqCard({
    super.key,
    required this.question,
    required this.selectedOption,
    required this.isSubmitted,
    required this.onOptionSelected,
  });

  @override
  Widget build(BuildContext context) {
    final options = [
      {'key': 'A', 'text': question.optionA},
      {'key': 'B', 'text': question.optionB},
      {'key': 'C', 'text': question.optionC},
      {'key': 'D', 'text': question.optionD},
    ];

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question prompt
            Text(
              question.prompt,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 16),

            // Pre-compiled static MCQ Options template
            ...options.map((opt) {
              final key = opt['key']!;
              final text = opt['text']!;
              final isSelected = selectedOption == key;
              final isCorrect = question.correctOption.toUpperCase() == key;

              Color borderCol = const Color(0xFFCBD5E1);
              Color fillCol = Colors.white;
              Color textCol = const Color(0xFF334155);

              if (isSubmitted) {
                if (isCorrect) {
                  borderCol = const Color(0xFF10B981);
                  fillCol = const Color(0xFFECFDF5);
                  textCol = const Color(0xFF065F46);
                } else if (isSelected) {
                  borderCol = const Color(0xFFEF4444);
                  fillCol = const Color(0xFFFEF2F2);
                  textCol = const Color(0xFF991B1B);
                }
              } else if (isSelected) {
                borderCol = const Color(0xFF2563EB);
                fillCol = const Color(0xFFEFF6FF);
                textCol = const Color(0xFF1E40AF);
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 10.0),
                child: InkWell(
                  onTap: isSubmitted ? null : () => onOptionSelected(key),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: fillCol,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderCol, width: 1.5),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? borderCol : const Color(0xFFF1F5F9),
                          ),
                          child: Text(
                            key,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: isSelected ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            text,
                            style: TextStyle(
                              fontSize: 14,
                              color: textCol,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                        if (isSubmitted && isCorrect)
                          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20)
                        else if (isSubmitted && isSelected && !isCorrect)
                          const Icon(Icons.cancel, color: Color(0xFFEF4444), size: 20),
                      ],
                    ),
                  ),
                ),
              );
            }),

            // Explanation box when submitted
            if (isSubmitted) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Explanation / وضاحت:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF475569)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      question.explanation,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
