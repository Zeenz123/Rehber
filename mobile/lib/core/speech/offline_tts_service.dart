import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

enum TtsState { playing, stopped, paused }

class OfflineTtsService extends ChangeNotifier {
  static final OfflineTtsService instance = OfflineTtsService._internal();
  factory OfflineTtsService() => instance;
  OfflineTtsService._internal();

  final FlutterTts _flutterTts = FlutterTts();
  TtsState _ttsState = TtsState.stopped;
  bool _isInitialized = false;
  List<dynamic> _availableVoices = [];
  String? _errorMessage;

  TtsState get ttsState => _ttsState;
  bool get isPlaying => _ttsState == TtsState.playing;
  bool get isInitialized => _isInitialized;
  String? get errorMessage => _errorMessage;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _flutterTts.setSpeechRate(0.85); // Slower pacing for rural education clarity
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      _flutterTts.setStartHandler(() {
        _ttsState = TtsState.playing;
        notifyListeners();
      });

      _flutterTts.setCompletionHandler(() {
        _ttsState = TtsState.stopped;
        notifyListeners();
      });

      _flutterTts.setErrorHandler((msg) {
        _ttsState = TtsState.stopped;
        _errorMessage = msg.toString();
        notifyListeners();
      });

      final voices = await _flutterTts.getVoices;
      if (voices is List) {
        _availableVoices = voices;
      }

      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'TTS init failure: $e';
      notifyListeners();
    }
  }

  Future<void> speak(String text, {String languageCode = 'ur-PK'}) async {
    if (!_isInitialized) await initialize();

    try {
      // Set language/voice
      await _flutterTts.setLanguage(languageCode);
      _ttsState = TtsState.playing;
      notifyListeners();

      await _flutterTts.speak(text);
    } catch (e) {
      _ttsState = TtsState.stopped;
      _errorMessage = 'TTS speak error: $e';
      notifyListeners();
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
      _ttsState = TtsState.stopped;
      notifyListeners();
    } catch (e) {
      debugPrint('TTS stop error: $e');
    }
  }
}
