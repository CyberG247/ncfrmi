import 'package:flutter/material.dart';

class AppTheme {
  // Brand: NCFRMI Green #0B6E4F -> HSL(158, 81%, 24%)
  static const Color primary = Color(0xFF0B6E4F);
  static const Color primaryForeground = Colors.white;
  static const Color primaryGlow = Color(0xFF19936C); // HSL(158, 70%, 34%)
  
  // Chocolate brown #4E342E supporting -> HSL(16, 25%, 24%)
  static const Color secondary = Color(0xFF4E342E);
  static const Color secondaryForeground = Colors.white;

  // Background and surfaces
  static const Color background = Colors.white;
  static const Color foreground = Color(0xFF2A2422); // HSL(20, 18%, 14%)
  
  static const Color card = Colors.white;
  static const Color cardForeground = Color(0xFF2A2422);
  
  static const Color muted = Color(0xFFF7F5F0); // HSL(40, 20%, 96%)
  static const Color mutedForeground = Color(0xFF706762); // HSL(20, 10%, 40%)
  
  static const Color accent = Color(0xFFC03030); // HSL(0, 60%, 47%)
  static const Color destructive = Color(0xFFC91D1D); // HSL(0, 75%, 45%)
  
  static const Color border = Color(0xFFE6E1DC); // HSL(30, 15%, 88%)

  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: primary,
      onPrimary: primaryForeground,
      secondary: secondary,
      onSecondary: secondaryForeground,
      surface: background,
      onSurface: foreground,
      error: destructive,
      onError: Colors.white,
      outline: border,
    ),
    scaffoldBackgroundColor: background,
    fontFamily: 'Inter',
    appBarTheme: const AppBarTheme(
      backgroundColor: background,
      foregroundColor: foreground,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: border, width: 1),
      ),
      margin: EdgeInsets.zero,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: primaryForeground,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: foreground,
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: muted.withValues(alpha: 0.6),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: destructive, width: 1.5),
      ),
      labelStyle: const TextStyle(fontSize: 13, color: mutedForeground),
    ),
  );
}
