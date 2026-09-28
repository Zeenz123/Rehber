import 'package:rehber/data/database/app_database.dart';

class LocalSubject {
  final String id;
  final String code;
  final String name;
  final int grade;
  final String description;
  final String icon;

  LocalSubject({
    required this.id,
    required this.code,
    required this.name,
    required this.grade,
    required this.description,
    required this.icon,
  });

  factory LocalSubject.fromMap(Map<String, dynamic> map) => LocalSubject(
    id: map['id'],
    code: map['code'],
    name: map['name'],
    grade: map['grade'],
    description: map['description'] ?? '',
    icon: map['icon'] ?? 'book',
  );
}

class LocalModule {
  final String id;
  final String subjectId;
  final String title;
  final int orderIndex;
  final String difficultyLevel;
  final String description;

  LocalModule({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.orderIndex,
    required this.difficultyLevel,
    required this.description,
  });

  factory LocalModule.fromMap(Map<String, dynamic> map) => LocalModule(
    id: map['id'],
    subjectId: map['subjectId'] ?? map['subject_id'],
    title: map['title'],
    orderIndex: map['orderIndex'] ?? map['order_index'] ?? 1,
    difficultyLevel: map['difficultyLevel'] ?? map['difficulty_level'] ?? 'MEDIUM',
    description: map['description'] ?? '',
  );
}

class LocalLesson {
  final String id;
  final String moduleId;
  final String title;
  final String conceptSummary;
  final String audioScript;
  final int orderIndex;

  LocalLesson({
    required this.id,
    required this.moduleId,
    required this.title,
    required this.conceptSummary,
    required this.audioScript,
    required this.orderIndex,
  });

  factory LocalLesson.fromMap(Map<String, dynamic> map) => LocalLesson(
    id: map['id'],
    moduleId: map['moduleId'] ?? map['module_id'],
    title: map['title'],
    conceptSummary: map['conceptSummary'] ?? map['concept_summary'] ?? '',
    audioScript: map['audioScript'] ?? map['audio_script'] ?? '',
    orderIndex: map['orderIndex'] ?? map['order_index'] ?? 1,
  );
}

class LocalQuestion {
  final String id;
  final String lessonId;
  final String prompt;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctOption;
  final String explanation;
  final String difficulty;
  final double irtB;

  LocalQuestion({
    required this.id,
    required this.lessonId,
    required this.prompt,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.correctOption,
    required this.explanation,
    required this.difficulty,
    required this.irtB,
  });

  factory LocalQuestion.fromMap(Map<String, dynamic> map) => LocalQuestion(
    id: map['id'],
    lessonId: map['lessonId'] ?? map['lesson_id'],
    prompt: map['prompt'],
    optionA: map['optionA'] ?? map['option_a'],
    optionB: map['optionB'] ?? map['option_b'],
    optionC: map['optionC'] ?? map['option_c'],
    optionD: map['optionD'] ?? map['option_d'],
    correctOption: map['correctOption'] ?? map['correct_option'],
    explanation: map['explanation'],
    difficulty: map['difficulty'] ?? 'MEDIUM',
    irtB: (map['irtB'] ?? map['irt_b'] ?? 0.0).toDouble(),
  );
}

class CurriculumRepository {
  Future<List<LocalSubject>> getSubjects() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('subjects', orderBy: 'name ASC');
    return rows.map(LocalSubject.fromMap).toList();
  }

  Future<List<LocalModule>> getModules(String subjectId) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'modules',
      where: 'subject_id = ?',
      whereArgs: [subjectId],
      orderBy: 'order_index ASC',
    );
    return rows.map(LocalModule.fromMap).toList();
  }

  Future<List<LocalLesson>> getLessons(String moduleId) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'lessons',
      where: 'module_id = ?',
      whereArgs: [moduleId],
      orderBy: 'order_index ASC',
    );
    return rows.map(LocalLesson.fromMap).toList();
  }

  Future<List<LocalQuestion>> getQuestions(String lessonId) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'questions',
      where: 'lesson_id = ?',
      whereArgs: [lessonId],
    );
    return rows.map(LocalQuestion.fromMap).toList();
  }
}
