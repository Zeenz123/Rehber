import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/data/database/app_database.dart';
import 'package:rehber/shared/protocol/sms_protocol.dart';

class ChatMessage {
  final String id;
  final String studentId;
  final String sender; // 'student' or 'ai'
  final String text;
  final String transport; // 'ONLINE_HTTPS', 'LOW_BW_COMPACT', 'LOCAL_RULES', 'SMS_FALLBACK'
  final String timestamp;
  final bool isAudio;
  final String? encodedPayload; // Raw SMS string shown in developer panel

  ChatMessage({
    required this.id,
    required this.studentId,
    required this.sender,
    required this.text,
    required this.transport,
    required this.timestamp,
    this.isAudio = false,
    this.encodedPayload,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> map) => ChatMessage(
    id: map['id'],
    studentId: map['student_id'],
    sender: map['sender'],
    text: map['text'],
    transport: map['transport'],
    timestamp: map['timestamp'],
    isAudio: (map['is_audio'] ?? 0) == 1,
  );
}

class AiChatRepository {
  static const MethodChannel _smsChannel = MethodChannel('com.rehber.app/sms_transport');
  final _uuid = const Uuid();
  String backendBaseUrl = 'http://10.0.2.2:8000/api';

  Future<List<ChatMessage>> getMessages(String studentId) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'ai_chat_history',
      where: 'student_id = ?',
      whereArgs: [studentId],
      orderBy: 'timestamp ASC',
    );
    return rows.map(ChatMessage.fromMap).toList();
  }

  Future<ChatMessage> sendLearningQuery({
    required String studentId,
    required String query,
    required String studentLanguage,
    bool isAudio = false,
  }) async {
    final now = DateTime.now().toIso8601String();
    final db = await AppDatabase.instance.database;
    final state = NetworkStateManager().currentState;

    // 1. Save student question locally first
    await db.insert('ai_chat_history', {
      'id': _uuid.v4(),
      'student_id': studentId,
      'sender': 'student',
      'text': query,
      'transport': state.code,
      'timestamp': now,
      'is_audio': isAudio ? 1 : 0,
    });

    String answer = '';
    String transportUsed = '';
    String? rawSmsEncoded;

    // 2. Route by network state
    if (state == RehberNetworkState.online) {
      transportUsed = 'ONLINE_HTTPS';
      try {
        final resp = await http.post(
          Uri.parse('$backendBaseUrl/ai/ask'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'student_id': studentId,
            'prompt': query,
            'transport': 'HTTPS',
          }),
        ).timeout(const Duration(milliseconds: 3500));

        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body);
          answer = data['response'];
        } else {
          // Fallback to local rule
          answer = _localOfflineAnswer(query, studentLanguage);
          transportUsed = 'LOCAL_RULES';
        }
      } catch (_) {
        answer = _localOfflineAnswer(query, studentLanguage);
        transportUsed = 'LOCAL_RULES';
      }

    } else if (state == RehberNetworkState.lowBandwidth) {
      transportUsed = 'LOW_BW_COMPACT';
      try {
        final resp = await http.post(
          Uri.parse('$backendBaseUrl/ai/ask'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'student_id': studentId,
            'prompt': query.trim(),
            'transport': 'LOW_BW_COMPACT',
          }),
        ).timeout(const Duration(milliseconds: 4000));

        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body);
          answer = data['response'];
        } else {
          answer = _localOfflineAnswer(query, studentLanguage);
        }
      } catch (_) {
        answer = _localOfflineAnswer(query, studentLanguage);
      }

    } else if (state == RehberNetworkState.messageFallback) {
      transportUsed = 'SMS_FALLBACK';
      // Compact protocol: [StudentID]#[ActionCode]#[PayloadData]
      final compactSms = SmsProtocol.serializeAsk(
        studentId: studentId,
        query: query,
      );
      rawSmsEncoded = compactSms;

      // In real device, try native SMS channel; in demo/emulator, call SMS gateway webhook
      try {
        final resp = await http.post(
          Uri.parse('$backendBaseUrl/sms/webhook'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'from_number': '+923001234567',
            'body': compactSms,
          }),
        ).timeout(const Duration(milliseconds: 3000));

        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body);
          final replySms = data['reply_sms'] as String;
          // Parse compact answer: STU101#ANS#Text
          final parsed = SmsProtocol.parse(replySms);
          answer = parsed.rawPayload;
        } else {
          answer = _localOfflineAnswer(query, studentLanguage);
        }
      } catch (_) {
        // Fallback simulation when backend is disconnected
        answer = _localOfflineAnswer(query, studentLanguage);
      }

    } else {
      // OFFLINE
      transportUsed = 'LOCAL_RULES';
      answer = _localOfflineAnswer(query, studentLanguage);
    }

    // 3. Save AI response locally
    final aiMessageId = _uuid.v4();
    final responseTime = DateTime.now().toIso8601String();
    await db.insert('ai_chat_history', {
      'id': aiMessageId,
      'student_id': studentId,
      'sender': 'ai',
      'text': answer,
      'transport': transportUsed,
      'timestamp': responseTime,
      'is_audio': 0,
    });

    NetworkStateManager().recordTransport(transportUsed);

    return ChatMessage(
      id: aiMessageId,
      studentId: studentId,
      sender: 'ai',
      text: answer,
      transport: transportUsed,
      timestamp: responseTime,
      encodedPayload: rawSmsEncoded,
    );
  }

  /// Local offline rules engine embedded in Dart
  String _localOfflineAnswer(String query, String language) {
    final q = query.toLowerCase();
    final isUrdu = language.toLowerCase().contains('urdu');

    if (q.contains('photosynthesis') || q.contains('food') || q.contains('sunlight') || q.contains('پودے')) {
      return isUrdu
          ? 'پودے سورج کی روشنی، مٹی کے پانی اور ہوا کی کاربن ڈائی آکسائیڈ سے اپنی خوراک (گلوکوز) بناتے ہیں اور آکسیجن خارج کرتے ہیں۔'
          : 'Photosynthesis is the process where green leaves absorb sunlight and water to make food (glucose) and release oxygen.';
    }
    if (q.contains('fraction') || q.contains('کسر') || q.contains('half') || q.contains('roti')) {
      return isUrdu
          ? 'کسر کسی پوری چیز کا ایک حصہ ہوتی ہے۔ جیسے آدھی روٹی یعنی 1/2، جس میں 2 کل حصے اور 1 آپ کا حصہ ہے۔'
          : 'A fraction represents parts of a whole. For example, half a roti is 1/2 (1 part out of 2 equal parts).';
    }
    if (q.contains('gravity') || q.contains('زمین') || q.contains('fall')) {
      return isUrdu
          ? 'زمین کی کششِ ثقل (Gravity) ہر چیز کو نیچے کی طرف کھینچتی ہے، اسی لیے درخت سے گرا ہوا سیب زمین پر گرتا ہے۔'
          : 'Gravity is the invisible pulling force of Earth that pulls falling objects toward the ground.';
    }

    return isUrdu
        ? 'رہبر آف لائن استاد: آپ کے سوال پر رہنمائی آپ کے سبق کے نوٹس میں موجود ہے۔ کوئز پریکٹس سے اپنا تصور مضبوط کریں۔'
        : 'Rehber Offline Tutor: Check your lesson summary for this concept or try the practice MCQ test.';
  }
}
