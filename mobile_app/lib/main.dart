import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://kbchfzawnkvppibakkst.supabase.co',
    publishableKey: 'sb_publishable_1mEoHkQX3WR_h2-DVgCHEg_OmA6ogkd',
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NCFRMI AGENT',
      theme: AppTheme.lightTheme,
      home: const LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
