import 'package:flutter/material.dart';
import 'package:rehber/data/database/app_database.dart';
import 'package:rehber/data/repositories/student_repository.dart';
import 'package:rehber/core/network/network_state_manager.dart';
import 'package:rehber/core/sync/sync_engine.dart';
import 'package:rehber/presentation/screens/home_dashboard_screen.dart';
import 'package:rehber/presentation/screens/onboarding_profile_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // 1. Initialize local SQLite Database & seed curriculum
    await AppDatabase.instance.database;

    // 2. Initialize network & sync engines
    NetworkStateManager().initialize();
    await SyncEngine.instance.initialize();

    // 3. Check student profile
    final student = await StudentRepository().getOrInitStudent();

    await Future.delayed(const Duration(milliseconds: 900));

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeDashboardScreen(student: student)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF0F172A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.school, size: 72, color: Color(0xFF38BDF8)),
            SizedBox(height: 16),
            Text(
              'REHBER',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 2.0,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'AI Personalized Learning for Rural Communities',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
            SizedBox(height: 24),
            CircularProgressIndicator(color: Color(0xFF38BDF8), strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
