import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/core/sync/sync_engine.dart';
import 'package:rehber/core/speech/offline_stt_service.dart';
import 'package:rehber/core/speech/offline_tts_service.dart';
import 'package:rehber/presentation/screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NetworkStateManager()),
        ChangeNotifierProvider(create: (_) => SyncEngine.instance),
        ChangeNotifierProvider(create: (_) => OfflineSttService.instance),
        ChangeNotifierProvider(create: (_) => OfflineTtsService.instance),
      ],
      child: const RehberApp(),
    ),
  );
}

class RehberApp extends StatelessWidget {
  const RehberApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rehber',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
          surface: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'Roboto', // System typography without remote download
      ),
      home: const SplashScreen(),
    );
  }
}
