import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:sqflite/sqflite.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/data/database/app_database.dart';

enum SyncItemStatus {
  pending('PENDING'),
  queued('QUEUED'),
  syncing('SYNCING'),
  synced('SYNCED'),
  failed('FAILED'),
  retrying('RETRYING'),
  conflict('CONFLICT');

  final String value;
  const SyncItemStatus(this.value);
}

class SyncEngine extends ChangeNotifier {
  static final SyncEngine instance = SyncEngine._internal();
  factory SyncEngine() => instance;
  SyncEngine._internal();

  final _uuid = const Uuid();
  bool _isSyncing = false;
  int _pendingCount = 0;
  String? _lastSyncTimestamp;

  bool get isSyncing => _isSyncing;
  int get pendingCount => _pendingCount;
  String? get lastSyncTimestamp => _lastSyncTimestamp;

  String backendBaseUrl = 'http://10.0.2.2:8000/api'; // Standard Android emulator or localhost

  Future<void> initialize() async {
    await updatePendingCount();
    // Periodically trigger sync if online
    Timer.periodic(const Duration(seconds: 30), (_) {
      if (NetworkStateManager().currentState == RehberNetworkState.online) {
        attemptSync();
      }
    });
  }

  Future<void> updatePendingCount() async {
    final db = await AppDatabase.instance.database;
    final res = await db.rawQuery(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('PENDING', 'QUEUED', 'FAILED', 'RETRYING')"
    );
    _pendingCount = Sqflite.firstIntValue(res) ?? 0;
    notifyListeners();
  }

  /// Enqueue an optimistic offline action
  Future<String> enqueueAction({
    required String studentId,
    required String operationType, // REG, PROGRESS, QUIZ, AI_CHAT
    required Map<String, dynamic> payload,
  }) async {
    final db = await AppDatabase.instance.database;
    final clientRecordId = _uuid.v4();
    final now = DateTime.now().toIso8601String();

    await db.insert('sync_queue', {
      'id': _uuid.v4(),
      'client_record_id': clientRecordId,
      'student_id': studentId,
      'operation_type': operationType,
      'payload_json': jsonEncode(payload),
      'status': SyncItemStatus.pending.value,
      'retry_count': 0,
      'created_at': now,
    });

    await updatePendingCount();

    // Trigger sync attempt immediately if network is available
    if (NetworkStateManager().currentState == RehberNetworkState.online) {
      unawaited(attemptSync());
    }

    return clientRecordId;
  }

  /// Attempt synchronization of pending items
  Future<void> attemptSync() async {
    if (_isSyncing) return;
    _isSyncing = true;
    notifyListeners();

    try {
      final db = await AppDatabase.instance.database;
      final pendingRows = await db.query(
        'sync_queue',
        where: "status IN ('PENDING', 'QUEUED', 'RETRYING')",
        limit: 25,
      );

      if (pendingRows.isEmpty) {
        _isSyncing = false;
        notifyListeners();
        return;
      }

      // Mark as SYNCING
      final idsToSync = pendingRows.map((r) => r['id'] as String).toList();
      for (final id in idsToSync) {
        await db.update(
          'sync_queue',
          {'status': SyncItemStatus.syncing.value},
          where: 'id = ?',
          whereArgs: [id],
        );
      }

      final studentId = pendingRows.first['student_id'] as String;
      final syncBatch = {
        'student_id': studentId,
        'client_timestamp': DateTime.now().toIso8601String(),
        'records': pendingRows.map((r) => {
          'id': r['client_record_id'],
          'operation_type': r['operation_type'],
          'payload': jsonDecode(r['payload_json'] as String),
          'created_at': r['created_at'],
          'retry_count': r['retry_count'],
        }).toList(),
      };

      final response = await http.post(
        Uri.parse('$backendBaseUrl/sync/batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(syncBatch),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final processedClientIds = (body['processed_ids'] as List).cast<String>();

        for (final clientRecId in processedClientIds) {
          await db.update(
            'sync_queue',
            {
              'status': SyncItemStatus.synced.value,
              'server_ack': 'ACK_OK',
              'last_attempt': DateTime.now().toIso8601String(),
            },
            where: 'client_record_id = ?',
            whereArgs: [clientRecId],
          );
        }
        _lastSyncTimestamp = DateTime.now().toIso8601String();
      } else {
        // Increment retry count
        for (final id in idsToSync) {
          await db.rawUpdate(
            "UPDATE sync_queue SET status = 'RETRYING', retry_count = retry_count + 1 WHERE id = ?",
            [id],
          );
        }
      }
    } catch (e) {
      debugPrint('Sync attempt paused: $e');
    } finally {
      _isSyncing = false;
      await updatePendingCount();
      notifyListeners();
    }
  }
}
