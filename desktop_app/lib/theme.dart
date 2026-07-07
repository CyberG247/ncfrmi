import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF0B6E4F);
  static const Color primaryForeground = Colors.white;
  static const Color primaryGlow = Color(0xFF19936C);
  
  static const Color secondary = Color(0xFF4E342E);
  static const Color secondaryForeground = Colors.white;

  static const Color background = Colors.white;
  static const Color foreground = Color(0xFF2A2422);
  
  static const Color card = Colors.white;
  static const Color cardForeground = Color(0xFF2A2422);
  
  static const Color muted = Color(0xFFF7F5F0);
  static const Color mutedForeground = Color(0xFF706762);
  
  static const Color accent = Color(0xFFC03030);
  static const Color destructive = Color(0xFFC91D1D);
  
  static const Color border = Color(0xFFE6E1DC);

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
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: border, width: 1),
      ),
      margin: EdgeInsets.zero,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: primaryForeground,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: background,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: destructive),
      ),
    ),
  );
}
