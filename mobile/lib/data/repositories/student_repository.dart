import 'dart:convert';
import 'dart:math';
import 'package:uuid/uuid.dart';
import 'package:rehber/data/database/app_database.dart';
import 'package:rehber/core/sync/sync_engine.dart';
import 'package:rehber/core/network/network_state_manager.dart';

class LocalStudent {
  final String id;
  final String name;
  final int grade;
  final String language;
  final String schoolId;
  final String learningBand;
  final double overallMastery;
  final double thetaAbility;
  final String lastActiveAt;

  LocalStudent({
    required this.id,
    required this.name,
    required this.grade,
    required this.language,
    required this.schoolId,
    required this.learningBand,
    required this.overallMastery,
    required this.thetaAbility,
    required this.lastActiveAt,
  });

  factory LocalStudent.fromMap(Map<String, dynamic> map) => LocalStudent(
    id: map['id'],
    name: map['name'],
    grade: map['grade'],
    language: map['language'],
    schoolId: map['school_id'] ?? 'SCH-001',
    learningBand: map['learning_band'] ?? 'ON_TRACK',
    overallMastery: (map['overall_mastery'] ?? 0.5).toDouble(),
    thetaAbility: (map['theta_ability'] ?? 0.0).toDouble(),
    lastActiveAt: map['last_active_at'] ?? DateTime.now().toIso8601String(),
  );
}

class StudentRepository {
  final _uuid = const Uuid();

  Future<LocalStudent> getOrInitStudent() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('students', limit: 1);

    if (rows.isNotEmpty) {
      return LocalStudent.fromMap(rows.first);
    }

    // Default initial offline profile for rural learner
    final initialStudent = LocalStudent(
      id: 'STU101',
      name: 'Amina Khan',
      grade: 6,
      language: 'urdu',
      schoolId: 'SCH-001',
      learningBand: 'ON_TRACK',
      overallMastery: 0.65,
      thetaAbility: 0.35,
      lastActiveAt: DateTime.now().toIso8601String(),
    );

    await db.insert('students', {
      'id': initialStudent.id,
      'name': initialStudent.name,
      'grade': initialStudent.grade,
      'language': initialStudent.language,
      'school_id': initialStudent.schoolId,
      'learning_band': initialStudent.learningBand,
      'overall_mastery': initialStudent.overallMastery,
      'theta_ability': initialStudent.thetaAbility,
      'last_active_at': initialStudent.lastActiveAt,
    });

    return initialStudent;
  }

  Future<void> updateProfile({
    required String studentId,
    required String name,
    required int grade,
    required String language,
  }) async {
    final db = await AppDatabase.instance.database;
    final now = DateTime.now().toIso8601String();

    await db.update(
      'students',
      {
        'name': name,
        'grade': grade,
        'language': language,
        'last_active_at': now,
      },
      where: 'id = ?',
      whereArgs: [studentId],
    );

    // Optimistic sync queue enqueue
    await SyncEngine.instance.enqueueAction(
      studentId: studentId,
      operationType: 'REG',
      payload: {
        'name': name,
        'grade': grade,
        'language': language,
      },
    );
  }

  Future<void> saveQuizAttempt({
    required String studentId,
    required String quizId,
    required double score,
    required Map<String, String> answers,
    required double newTheta,
    required double newMastery,
    required String newBand,
  }) async {
    final db = await AppDatabase.instance.database;
    final now = DateTime.now().toIso8601String();
    final transport = NetworkStateManager().currentState.code;

    // 1. Save local quiz attempt
    await db.insert('quiz_attempts', {
      'id': _uuid.v4(),
      'student_id': studentId,
      'quiz_id': quizId,
      'score': score,
      'answers_json': jsonEncode(answers),
      'transport': transport,
      'is_synced': 0,
      'completed_at': now,
    });

    // 2. Update student ability and band locally
    await db.update(
      'students',
      {
        'theta_ability': newTheta,
        'overall_mastery': newMastery,
        'learning_band': newBand,
        'last_active_at': now,
      },
      where: 'id = ?',
      whereArgs: [studentId],
    );

    // 3. Optimistic Sync Queue
    await SyncEngine.instance.enqueueAction(
      studentId: studentId,
      operationType: 'QUIZ',
      payload: {
        'quiz_id': quizId,
        'score': score,
        'answers': answers,
        'theta_ability': newTheta,
        'learning_band': newBand,
      },
    );
  }

  Future<void> saveProgress({
    required String studentId,
    required String moduleId,
    String? lessonId,
    required double score,
    required int timeSpentSec,
  }) async {
    final db = await AppDatabase.instance.database;
    final now = DateTime.now().toIso8601String();

    await db.insert('student_progress', {
      'id': _uuid.v4(),
      'student_id': studentId,
      'module_id': moduleId,
      'lesson_id': lessonId,
      'status': score >= 60.0 ? 'COMPLETED' : 'IN_PROGRESS',
      'score': score,
      'time_spent_sec': timeSpentSec,
      'updated_at': now,
    });

    // Optimistic sync queue
    await SyncEngine.instance.enqueueAction(
      studentId: studentId,
      operationType: 'PROGRESS',
      payload: {
        'module_id': moduleId,
        'lesson_id': lessonId,
        'score': score,
        'time_spent_sec': timeSpentSec,
        'status': score >= 60.0 ? 'COMPLETED' : 'IN_PROGRESS',
      },
    );
  }
}
