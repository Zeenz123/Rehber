import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/core/sync/sync_engine.dart';
import 'package:rehber/data/database/app_database.dart';
import 'package:rehber/shared/protocol/sms_protocol.dart';

class DeveloperDemoPanel extends StatefulWidget {
  const DeveloperDemoPanel({super.key});

  @override
  State<DeveloperDemoPanel> createState() => _DeveloperDemoPanelState();
}

class _DeveloperDemoPanelState extends State<DeveloperDemoPanel> {
  List<Map<String, dynamic>> _queueRows = [];
  bool _isLoadingQueue = false;
  String _sampleSmsPreview = '';

  @override
  void initState() {
    super.initState();
    _loadQueue();
    _generateSampleSms();
  }

  Future<void> _loadQueue() async {
    setState(() => _isLoadingQueue = true);
    final db = await AppDatabase.instance.database;
    final rows = await db.query('sync_queue', orderBy: 'created_at DESC', limit: 15);
    setState(() {
      _queueRows = rows;
      _isLoadingQueue = false;
    });
  }

  void _generateSampleSms() {
    final sample = SmsProtocol.serializeAsk(
      studentId: 'STU101',
      query: 'What is photosynthesis?',
    );
    setState(() {
      _sampleSmsPreview = sample;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Judge Demo & Network Simulator'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Simulation Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFF59E0B)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.science, color: Color(0xFFB45309)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'SIMULATION MODE: Use this panel to force network conditions and inspect the underlying local SQLite, sync queue, and SMS message payloads.',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF92400E)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Network State Override Radio Selector
            const Text(
              '1. Active Network Transport Override',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 1,
              child: Consumer<NetworkStateManager>(
                builder: (context, netState, _) {
                  return Column(
                    children: RehberNetworkState.values.map((state) {
                      final isSelected = netState.currentState == state;
                      return RadioListTile<RehberNetworkState>(
                        value: state,
                        groupValue: netState.currentState,
                        title: Text(
                          state.code,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        subtitle: Text(state.label, style: const TextStyle(fontSize: 12)),
                        onChanged: (val) {
                          if (val != null) {
                            netState.setManualOverride(
                              val,
                              simulatedLatency: val == RehberNetworkState.online
                                  ? 120
                                  : (val == RehberNetworkState.lowBandwidth ? 3200 : 9999),
                            );
                          }
                        },
                      );
                    }).toList(),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // SMS Protocol Inspector
            const Text(
              '2. Low-Bandwidth Cellular / SMS Protocol',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Standard: [StudentID]#[ActionCode]#[PayloadData]',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0284C7)),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _sampleSmsPreview,
                        style: const TextStyle(fontFamily: 'monospace', color: Color(0xFF38BDF8), fontSize: 13),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Action Codes: REG (Register) • QZ (Quiz) • ASK (AI Query) • PGR (Progress)',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // SQLite Offline Sync Queue Inspector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '3. SQLite Sync Queue Status',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                TextButton.icon(
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Refresh', style: TextStyle(fontSize: 12)),
                  onPressed: _loadQueue,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Card(
              elevation: 1,
              child: _isLoadingQueue
                  ? const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  : _queueRows.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(
                            child: Text(
                              'Sync queue is clear. All actions are synchronized!',
                              style: TextStyle(color: Color(0xFF059669), fontSize: 13),
                            ),
                          ),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _queueRows.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final row = _queueRows[index];
                            final op = row['operation_type'];
                            final status = row['status'];
                            final retries = row['retry_count'];

                            return ListTile(
                              dense: true,
                              title: Text(
                                '$op • $status (Retries: $retries)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                              subtitle: Text(
                                row['payload_json'] as String,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                              ),
                              trailing: Text(
                                (row['created_at'] as String).substring(11, 19),
                                style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                              ),
                            );
                          },
                        ),
            ),
            const SizedBox(height: 20),

            // Manual Force Sync Button
            Consumer<SyncEngine>(
              builder: (context, syncEng, _) {
                return SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: syncEng.isSyncing
                        ? null
                        : () async {
                            await syncEng.attemptSync();
                            await _loadQueue();
                          },
                    icon: syncEng.isSyncing
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.sync),
                    label: Text(syncEng.isSyncing ? 'Synchronizing...' : 'Trigger Manual Sync to Backend'),
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
