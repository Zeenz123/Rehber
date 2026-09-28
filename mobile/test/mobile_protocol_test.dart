import 'package:flutter_test/flutter_test.dart';
import 'package:rehber/shared/protocol/sms_protocol.dart';
import 'package:rehber/domain/adaptive/mobile_irt_calculator.dart';

void main() {
  group('Mobile SMS Protocol Tests', () {
    test('Serializes and parses REG action', () {
      final msg = SmsProtocol.serializeRegistration(
        studentId: 'STU101',
        name: 'Amina Khan',
        grade: 6,
        language: 'urdu',
      );
      expect(msg, equals('STU101#REG#Amina Khan|6|urdu'));

      final parsed = SmsProtocol.parse(msg);
      expect(parsed.studentId, equals('STU101'));
      expect(parsed.actionCode, equals(SmsActionCode.reg));
      expect(parsed.parsedPayload['name'], equals('Amina Khan'));
    });

    test('Serializes and parses QZ action', () {
      final msg = SmsProtocol.serializeQuiz(
        studentId: 'STU102',
        quizId: 'QZ_MATH_01',
        answers: {'Q1': 'A', 'Q2': 'C'},
      );
      expect(msg, contains('STU102#QZ#QZ_MATH_01|'));

      final parsed = SmsProtocol.parse(msg);
      expect(parsed.parsedPayload['quiz_id'], equals('QZ_MATH_01'));
      expect(parsed.parsedPayload['answers']['Q1'], equals('A'));
    });

    test('Serializes and parses ASK query', () {
      final msg = SmsProtocol.serializeAsk(
        studentId: 'STU103',
        query: 'What is photosynthesis?',
      );
      expect(msg, equals('STU103#ASK#What is photosynthesis?'));

      final parsed = SmsProtocol.parse(msg);
      expect(parsed.parsedPayload['query'], equals('What is photosynthesis?'));
    });
  });

  group('Mobile IRT Adaptive Calculator Tests', () {
    test('Calculates probability of correct response', () {
      final prob = MobileIrtCalculator.probabilityCorrect(0.0, 0.0);
      expect((prob - 0.5).abs() < 1e-4, isTrue);
    });

    test('Updates ability theta and classifies learning band', () {
      final res = MobileIrtCalculator.updateAbility(
        currentTheta: 0.0,
        responses: [
          (difficulty: 0.5, isCorrect: true),
          (difficulty: 1.0, isCorrect: true),
        ],
      );
      expect(res.theta > 0.0, isTrue);
      expect(res.mastery > 0.5, isTrue);
      expect(res.band, anyOf('ON_TRACK', 'ADVANCED'));
    });
  });
}
