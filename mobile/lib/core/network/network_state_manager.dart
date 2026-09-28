import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';

enum RehberNetworkState {
  online('ONLINE', 'Connected (<3000ms)'),
  lowBandwidth('LOW_BANDWIDTH', 'High Latency (>=3000ms)'),
  offline('OFFLINE', 'Offline (Local DB)'),
  messageFallback('MESSAGE_FALLBACK', 'Cellular / SMS Fallback');

  final String code;
  final String label;
  const RehberNetworkState(this.code, this.label);
}

class NetworkStateManager extends ChangeNotifier {
  static final NetworkStateManager _instance = NetworkStateManager._internal();
  factory NetworkStateManager() => _instance;
  NetworkStateManager._internal();

  RehberNetworkState _currentState = RehberNetworkState.online;
  int _lastLatencyMs = 240;
  bool _isManualOverride = false;
  String? _lastTransportUsed;
  Timer? _heartbeatTimer;

  RehberNetworkState get currentState => _currentState;
  int get lastLatencyMs => _lastLatencyMs;
  bool get isManualOverride => _isManualOverride;
  String? get lastTransportUsed => _lastTransportUsed;

  void initialize({String pingEndpoint = 'http://10.0.2.2:8000/health'}) {
    // Monitor connectivity changes
    Connectivity().onConnectivityChanged.listen((results) {
      if (!_isManualOverride) {
        if (results.contains(ConnectivityResult.none)) {
          _updateState(RehberNetworkState.offline, 9999);
        } else {
          checkLatency(pingEndpoint);
        }
      }
    });

    // Periodic heartbeat check
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (!_isManualOverride && _currentState != RehberNetworkState.offline) {
        checkLatency(pingEndpoint);
      }
    });
  }

  Future<void> checkLatency(String endpoint) async {
    if (_isManualOverride) return;

    final stopwatch = Stopwatch()..start();
    try {
      final response = await http
          .get(Uri.parse(endpoint))
          .timeout(const Duration(milliseconds: 5000));
      stopwatch.stop();
      final latency = stopwatch.elapsedMilliseconds;
      _lastLatencyMs = latency;

      if (response.statusCode == 200) {
        if (latency < 3000) {
          _updateState(RehberNetworkState.online, latency);
        } else {
          _updateState(RehberNetworkState.lowBandwidth, latency);
        }
      } else {
        _updateState(RehberNetworkState.lowBandwidth, latency);
      }
    } catch (_) {
      // Unreachable or timeout exceeded 5000ms
      _updateState(RehberNetworkState.offline, 9999);
    }
  }

  void _updateState(RehberNetworkState newState, int latency) {
    _currentState = newState;
    _lastLatencyMs = latency;
    notifyListeners();
  }

  /// Developer / Judges Demo Control: Force a specific state to demonstrate functionality
  void setManualOverride(RehberNetworkState state, {int simulatedLatency = 150}) {
    _isManualOverride = true;
    _currentState = state;
    _lastLatencyMs = simulatedLatency;
    notifyListeners();
  }

  void clearManualOverride() {
    _isManualOverride = false;
    notifyListeners();
  }

  void recordTransport(String transportName) {
    _lastTransportUsed = transportName;
    notifyListeners();
  }

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    super.dispose();
  }
}
