import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/core/speech/offline_stt_service.dart';
import 'package:rehber/core/speech/offline_tts_service.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/data/repositories/ai_chat_repository.dart';
import 'package:rehber/presentation/widgets/network_status_badge.dart';
import 'package:rehber/presentation/screens/developer_demo_panel.dart';

class AiChatScreen extends StatefulWidget {
  final LocalStudent student;

  const AiChatScreen({super.key, required this.student});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final AiChatRepository _chatRepo = AiChatRepository();
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<ChatMessage> _messages = [];
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    final list = await _chatRepo.getMessages(widget.student.id);
    setState(() {
      _messages = list;
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text, {bool isAudio = false}) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    _textController.clear();
    setState(() => _isSending = true);

    // Optimistically show student query
    final tempMsg = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      studentId: widget.student.id,
      sender: 'student',
      text: trimmed,
      transport: NetworkStateManager().currentState.code,
      timestamp: DateTime.now().toIso8601String(),
      isAudio: isAudio,
    );
    setState(() {
      _messages.add(tempMsg);
    });
    _scrollToBottom();

    try {
      final aiReply = await _chatRepo.sendLearningQuery(
        studentId: widget.student.id,
        query: trimmed,
        studentLanguage: widget.student.language,
        isAudio: isAudio,
      );

      setState(() {
        _messages.add(aiReply);
      });
      _scrollToBottom();

      // Read reply aloud if speech was used
      if (isAudio) {
        OfflineTtsService.instance.speak(
          aiReply.text,
          languageCode: widget.student.language.startsWith('ur') ? 'ur-PK' : 'en-US',
        );
      }
    } catch (e) {
      debugPrint('Error sending query: $e');
    } finally {
      setState(() => _isSending = false);
    }
  }

  void _toggleVoiceRecognition() {
    final stt = OfflineSttService.instance;
    if (stt.isListening) {
      stt.stopListening();
    } else {
      stt.startListening(
        languageCode: widget.student.language.startsWith('ur') ? 'ur_PK' : 'en_US',
        onResult: (words) {
          _textController.text = words;
          if (!stt.isListening && words.isNotEmpty) {
            _sendMessage(words, isAudio: true);
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rehber AI Tutor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text('Multi-transport educational assistant', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Center(
              child: NetworkStatusBadge(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const DeveloperDemoPanel()),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Transport description strip
          Consumer<NetworkStateManager>(
            builder: (context, netState, _) {
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                color: const Color(0xFFE2E8F0),
                child: Text(
                  'Transport: ${netState.currentState.code} (${netState.currentState.label})',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                ),
              );
            },
          ),

          // Chat Messages View
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.smart_toy_outlined, size: 54, color: Colors.blueGrey.shade300),
                        const SizedBox(height: 12),
                        const Text(
                          'Ask any question from your lesson!',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Supports voice, offline rules, or message fallback.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe = msg.sender == 'student';
                      return _buildMessageBubble(msg, isMe);
                    },
                  ),
          ),

          if (_isSending)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: [
                  SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 8),
                  Text('Rehber is routing your question...', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ],
              ),
            ),

          // Bottom Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  // Microphone Button (Vosk Offline STT)
                  Consumer<OfflineSttService>(
                    builder: (context, stt, _) {
                      return IconButton(
                        icon: Icon(
                          stt.isListening ? Icons.mic : Icons.mic_none,
                          color: stt.isListening ? Colors.red : const Color(0xFF0284C7),
                        ),
                        tooltip: 'Offline Speech Recognition',
                        onPressed: _toggleVoiceRecognition,
                      );
                    },
                  ),

                  // Text input
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Ask a question / سوال پوچھیں...',
                        hintStyle: TextStyle(fontSize: 14),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (val) => _sendMessage(val),
                    ),
                  ),

                  // Send button
                  IconButton(
                    icon: const Icon(Icons.send, color: Color(0xFF0284C7)),
                    onPressed: () => _sendMessage(_textController.text),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF0284C7) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMe ? 12 : 2),
            bottomRight: Radius.circular(isMe ? 2 : 12),
          ),
          border: isMe ? null : Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 3,
              offset: const Offset(0, 1),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              msg.text,
              style: TextStyle(
                color: isMe ? Colors.white : const Color(0xFF1E293B),
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Transport tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isMe ? Colors.white24 : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    msg.transport,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: isMe ? Colors.white : const Color(0xFF64748B),
                    ),
                  ),
                ),
                if (!isMe) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      OfflineTtsService.instance.speak(
                        msg.text,
                        languageCode: widget.student.language.startsWith('ur') ? 'ur-PK' : 'en-US',
                      );
                    },
                    child: const Icon(Icons.volume_up, size: 16, color: Color(0xFF0284C7)),
                  ),
                ],
              ],
            ),
            // If message was transmitted via SMS, show compact raw encoded string for judges
            if (msg.encodedPayload != null) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Payload: ${msg.encodedPayload}',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: Color(0xFF38BDF8),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
