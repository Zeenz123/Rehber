/// Rehber Low-Bandwidth / SMS Communication Protocol in Dart.
///
/// Standard Message Structure:
///   [StudentID]#[ActionCode]#[PayloadData]
///
/// Action Codes:
///   REG: Student Registration (Payload: Name|Grade|Language)
///   QZ:  Quiz Submission (Payload: QuizID|AnsString)
///   ASK: AI Query (Payload: TextQuery)
///   PGR: Progress Checkpoint (Payload: ModuleID|Score|TimeSeconds)
library;

enum SmsActionCode {
  reg('REG'),
  qz('QZ'),
  ask('ASK'),
  pgr('PGR'),
  ack('ACK'),
  res('RES'),
  ans('ANS'),
  err('ERR');

  final String value;
  const SmsActionCode(this.value);

  static SmsActionCode fromString(String val) {
    for (final code in SmsActionCode.values) {
      if (code.value == val.toUpperCase()) return code;
    }
    throw FormatException('Unsupported action code: $val');
  }
}

class ParsedSmsMessage {
  final String studentId;
  final SmsActionCode actionCode;
  final String rawPayload;
  final Map<String, dynamic> parsedPayload;
  final bool isValid;
  final String? errorMessage;

  ParsedSmsMessage({
    required this.studentId,
    required this.actionCode,
    required this.rawPayload,
    required this.parsedPayload,
    this.isValid = true,
    this.errorMessage,
  });
}

class SmsProtocol {
  static const String segmentDelimiter = '#';
  static const String fieldDelimiter = '|';
  static const String subfieldDelimiter = ':';

  static final RegExp _messagePattern = RegExp(
    r'^([A-Za-z0-9_-]+)#([A-Z]{2,4})#(.*)$',
    dotAll: true,
  );

  static String escapeText(String text) {
    return text
        .replaceAll('\\', '\\\\')
        .replaceAll('#', r'\#')
        .replaceAll('|', r'\|');
  }

  static String unescapeText(String text) {
    return text
        .replaceAll(r'\#', '#')
        .replaceAll(r'\|', '|')
        .replaceAll(r'\\', '\\');
  }

  static String serializeRegistration({
    required String studentId,
    required String name,
    required dynamic grade,
    required String language,
  }) {
    final safeName = escapeText(name);
    final safeLang = escapeText(language);
    final payload = '$safeName$fieldDelimiter$grade$fieldDelimiter$safeLang';
    return '$studentId$segmentDelimiter${SmsActionCode.reg.value}$segmentDelimiter$payload';
  }

  static String serializeQuiz({
    required String studentId,
    required String quizId,
    required Map<String, String> answers,
  }) {
    final ansList = answers.entries.map((e) => '${e.key}:$e.value').join(',');
    final payload = '$quizId$fieldDelimiter$ansList';
    return '$studentId$segmentDelimiter${SmsActionCode.qz.value}$segmentDelimiter$payload';
  }

  static String serializeAsk({
    required String studentId,
    required String query,
  }) {
    final safeQuery = escapeText(query.trim());
    return '$studentId$segmentDelimiter${SmsActionCode.ask.value}$segmentDelimiter$safeQuery';
  }

  static String serializeProgress({
    required String studentId,
    required String moduleId,
    required num score,
    required int timeSeconds,
  }) {
    final payload = '$moduleId$fieldDelimiter$score$fieldDelimiter$timeSeconds';
    return '$studentId$segmentDelimiter${SmsActionCode.pgr.value}$segmentDelimiter$payload';
  }

  static ParsedSmsMessage parse(String rawMessage) {
    final trimmed = rawMessage.trim();
    if (trimmed.isEmpty) {
      throw const FormatException('Empty message payload');
    }

    final match = _messagePattern.firstMatch(trimmed);
    if (match == null) {
      throw FormatException('Message violates protocol pattern: $trimmed');
    }

    final studentId = match.group(1)!;
    final actionStr = match.group(2)!;
    final rawPayload = match.group(3)!;

    final actionCode = SmsActionCode.fromString(actionStr);
    final Map<String, dynamic> parsedPayload = {};

    switch (actionCode) {
      case SmsActionCode.reg:
        final parts = rawPayload.split(fieldDelimiter).map(unescapeText).toList();
        if (parts.length < 3) {
          throw const FormatException('REG requires Name|Grade|Language');
        }
        parsedPayload['name'] = parts[0];
        parsedPayload['grade'] = parts[1];
        parsedPayload['language'] = parts[2];
        break;

      case SmsActionCode.qz:
        final parts = rawPayload.split(fieldDelimiter);
        if (parts.length < 2) {
          throw const FormatException('QZ requires QuizID|AnsString');
        }
        final quizId = parts[0];
        final ansStr = parts[1];
        final Map<String, String> answers = {};
        if (ansStr.isNotEmpty) {
          for (final pair in ansStr.split(',')) {
            if (pair.contains(subfieldDelimiter)) {
              final subParts = pair.split(subfieldDelimiter);
              answers[subParts[0].trim()] = subParts[1].trim();
            }
          }
        }
        parsedPayload['quiz_id'] = quizId;
        parsedPayload['answers'] = answers;
        break;

      case SmsActionCode.ask:
        final query = unescapeText(rawPayload);
        if (query.isEmpty) {
          throw const FormatException('ASK query cannot be empty');
        }
        parsedPayload['query'] = query;
        break;

      case SmsActionCode.pgr:
        final parts = rawPayload.split(fieldDelimiter);
        if (parts.length < 3) {
          throw const FormatException('PGR requires ModuleID|Score|Time');
        }
        parsedPayload['module_id'] = parts[0];
        parsedPayload['score'] = num.tryParse(parts[1]) ?? 0;
        parsedPayload['time_seconds'] = int.tryParse(parts[2]) ?? 0;
        break;

      case SmsActionCode.ack:
      case SmsActionCode.res:
      case SmsActionCode.ans:
      case SmsActionCode.err:
        parsedPayload['raw'] = rawPayload;
        break;
    }

    return ParsedSmsMessage(
      studentId: studentId,
      actionCode: actionCode,
      rawPayload: rawPayload,
      parsedPayload: parsedPayload,
    );
  }
}
