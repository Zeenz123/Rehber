import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;

class AppDatabase {
  static final AppDatabase instance = AppDatabase._internal();
  static Database? _database;

  AppDatabase._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'rehber_local.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // 1. Students Table
    await db.execute('''
      CREATE TABLE students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL,
        language TEXT NOT NULL,
        school_id TEXT DEFAULT 'SCH-001',
        learning_band TEXT DEFAULT 'ON_TRACK',
        overall_mastery REAL DEFAULT 0.5,
        theta_ability REAL DEFAULT 0.0,
        last_active_at TEXT NOT NULL
      )
    ''');

    // 2. Subjects Table
    await db.execute('''
      CREATE TABLE subjects (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'book'
      )
    ''');

    // 3. Modules Table
    await db.execute('''
      CREATE TABLE modules (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        order_index INTEGER DEFAULT 1,
        difficulty_level TEXT DEFAULT 'MEDIUM',
        description TEXT,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      )
    ''');

    // 4. Lessons Table
    await db.execute('''
      CREATE TABLE lessons (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL,
        title TEXT NOT NULL,
        concept_summary TEXT NOT NULL,
        audio_script TEXT NOT NULL,
        order_index INTEGER DEFAULT 1,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
      )
    ''');

    // 5. Questions Table
    await db.execute('''
      CREATE TABLE questions (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL,
        explanation TEXT NOT NULL,
        difficulty TEXT DEFAULT 'MEDIUM',
        irt_b REAL DEFAULT 0.0,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
      )
    ''');

    // 6. Quiz Attempts Table
    await db.execute('''
      CREATE TABLE quiz_attempts (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        score REAL NOT NULL,
        answers_json TEXT NOT NULL,
        transport TEXT DEFAULT 'LOCAL',
        is_synced INTEGER DEFAULT 0,
        completed_at TEXT NOT NULL
      )
    ''');

    // 7. Student Progress Table
    await db.execute('''
      CREATE TABLE student_progress (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        module_id TEXT NOT NULL,
        lesson_id TEXT,
        status TEXT DEFAULT 'IN_PROGRESS',
        score REAL DEFAULT 0.0,
        time_spent_sec INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    ''');

    // 8. Offline Sync Queue Table
    await db.execute('''
      CREATE TABLE sync_queue (
        id TEXT PRIMARY KEY,
        client_record_id TEXT UNIQUE NOT NULL,
        student_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        last_attempt TEXT,
        server_ack TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    // 9. AI Chat History Table
    await db.execute('''
      CREATE TABLE ai_chat_history (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        transport TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_audio INTEGER DEFAULT 0
      )
    ''');

    // 10. Speech Models Metadata Table
    await db.execute('''
      CREATE TABLE speech_models (
        id TEXT PRIMARY KEY,
        language_code TEXT NOT NULL,
        model_name TEXT NOT NULL,
        local_path TEXT,
        is_downloaded INTEGER DEFAULT 0,
        size_bytes INTEGER DEFAULT 0
      )
    ''');

    // Seed default offline curriculum & speech models
    await _seedInitialData(db);
  }

  Future<void> _seedInitialData(Database db) async {
    // Seed speech models metadata
    await db.insert('speech_models', {
      'id': 'vosk-urdu-small',
      'language_code': 'ur',
      'model_name': 'Vosk Urdu Small Mobile Acoustic Model',
      'local_path': 'assets/models/vosk-model-small-ur',
      'is_downloaded': 1,
      'size_bytes': 45000000,
    });
    await db.insert('speech_models', {
      'id': 'vosk-english-small',
      'language_code': 'en',
      'model_name': 'Vosk Indian-English Small Acoustic Model',
      'local_path': 'assets/models/vosk-model-small-en-in',
      'is_downloaded': 1,
      'size_bytes': 42000000,
    });

    // Seed subjects
    await db.insert('subjects', {
      'id': 'SUB_MATH',
      'code': 'MATH',
      'name': 'Mathematics',
      'grade': 6,
      'description': 'Fractions, basic arithmetic, and algebra.',
      'icon': 'calculator'
    });
    await db.insert('subjects', {
      'id': 'SUB_SCI',
      'code': 'SCI',
      'name': 'General Science',
      'grade': 6,
      'description': 'Living things, photosynthesis, and natural science.',
      'icon': 'beaker'
    });

    // Seed modules
    await db.insert('modules', {
      'id': 'MOD_MATH_01',
      'subject_id': 'SUB_MATH',
      'title': 'Understanding Fractions & Equal Parts',
      'order_index': 1,
      'difficulty_level': 'EASY',
      'description': 'Parts of a whole, numerators, and denominators.'
    });
    await db.insert('modules', {
      'id': 'MOD_SCI_01',
      'subject_id': 'SUB_SCI',
      'title': 'Plant Life & Photosynthesis',
      'order_index': 1,
      'difficulty_level': 'EASY',
      'description': 'Sunlight, chlorophyll, and plant nutrition.'
    });

    // Seed lessons
    await db.insert('lessons', {
      'id': 'LES_MATH_101',
      'module_id': 'MOD_MATH_01',
      'title': 'What is a Fraction?',
      'concept_summary': 'A fraction represents a part of a whole. The bottom number is the denominator (total parts), and the top number is the numerator (parts you have).',
      'audio_script': 'Welcome to Rehber Mathematics. Imagine you have one flatbread, a roti, cut into two equal halves. If you eat one piece, you have eaten one out of two parts, written as one over two.',
      'order_index': 1
    });
    await db.insert('lessons', {
      'id': 'LES_SCI_101',
      'module_id': 'MOD_SCI_01',
      'title': 'How Leaves Make Food',
      'concept_summary': 'Plants are living solar factories. Leaves contain chlorophyll which absorbs sunlight. They absorb water from roots and carbon dioxide from the air to make glucose.',
      'audio_script': 'Welcome to Rehber Science. Look at a green leaf in the sun. The leaf has tiny green particles called chlorophyll. Using sunlight, the leaf turns water from the soil and gas from the air into sweet food.',
      'order_index': 1
    });

    // Seed questions
    await db.insert('questions', {
      'id': 'Q_MATH_001',
      'lesson_id': 'LES_MATH_101',
      'prompt': 'In the fraction 3/4, what does the number 4 represent?',
      'option_a': 'The total number of equal parts the whole is divided into',
      'option_b': 'The number of parts you selected',
      'option_c': 'The result of multiplication',
      'option_d': 'The leftover remainder',
      'correct_option': 'A',
      'explanation': 'The denominator (4) always indicates the total equal parts comprising one whole object.',
      'difficulty': 'EASY',
      'irt_b': -0.60
    });
    await db.insert('questions', {
      'id': 'Q_MATH_002',
      'lesson_id': 'LES_MATH_101',
      'prompt': 'If a farmer divides an acre into 5 equal plots and plants wheat in 2 plots, what fraction has wheat?',
      'option_a': '5/2',
      'option_b': '2/5',
      'option_c': '3/5',
      'option_d': '1/5',
      'correct_option': 'B',
      'explanation': 'There are 2 parts planted out of 5 equal total parts, so the fraction is 2/5.',
      'difficulty': 'EASY',
      'irt_b': -0.40
    });
    await db.insert('questions', {
      'id': 'Q_SCI_001',
      'lesson_id': 'LES_SCI_101',
      'prompt': 'Which green pigment in leaves captures solar energy for photosynthesis?',
      'option_a': 'Hemoglobin',
      'option_b': 'Chlorophyll',
      'option_c': 'Melanin',
      'option_d': 'Carotene',
      'correct_option': 'B',
      'explanation': 'Chlorophyll is the green pigment in chloroplasts that absorbs sunlight energy.',
      'difficulty': 'EASY',
      'irt_b': -0.50
    });
  }
}
