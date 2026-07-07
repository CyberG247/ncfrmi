import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_service.dart';

class SupabaseSyncService {
  final _supabase = Supabase.instance.client;

  String _sanitizeDob(String dateStr) {
    final clean = dateStr.trim();
    try {
      final parsed = DateTime.parse(clean);
      if (parsed.year >= 1900 && parsed.year <= DateTime.now().year) {
        return "${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}";
      }
    } catch (_) {}

    final digits = clean.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length == 8) {
      final day = digits.substring(0, 2);
      final month = digits.substring(2, 4);
      final year = digits.substring(4, 8);
      return "$year-$month-$day";
    } else if (digits.length == 7) {
      final day = digits.substring(0, 2);
      final month = digits.substring(2, 4);
      final year = "${digits.substring(4, 7)}0";
      return "$year-$month-$day";
    }
    return "2000-01-01";
  }

  Future<String?> syncAll() async {
    try {
      // Sync Registrants
      final registrants = await offlineService.getOfflineRegistrants();
      if (registrants.isNotEmpty) {
        final List<Map<String, dynamic>> records = registrants.map((e) {
          final json = e.toJson();
          if (json['dob'] != null) {
            json['dob'] = _sanitizeDob(json['dob'].toString());
          }
          return json;
        }).toList();
        await _supabase.from('registrants').insert(records);
        await offlineService.clearOfflineRegistrants();
      }

      // Sync Interventions
      final interventions = await offlineService.getOfflineInterventions();
      if (interventions.isNotEmpty) {
        final List<Map<String, dynamic>> records = interventions.map((e) => e.toJson()).toList();
        await _supabase.from('interventions').insert(records);
        await offlineService.clearOfflineInterventions();
      }

      return null;
    } catch (e) {
      debugPrint('Sync Error: $e');
      return e.toString();
    }
  }

  Future<int> getOnlineRegistrantCountToday() async {
    try {
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day).toIso8601String();
      
      final response = await _supabase
          .from('registrants')
          .select('id')
          .gte('created_at', startOfDay);
      
      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }
}

final supabaseSyncService = SupabaseSyncService();
