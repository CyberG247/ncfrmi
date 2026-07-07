import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_service.dart';

class SupabaseSyncService {
  final _supabase = Supabase.instance.client;

  Future<String?> syncAll() async {
    try {
      // Sync Registrants
      final registrants = await offlineService.getOfflineRegistrants();
      if (registrants.isNotEmpty) {
        final List<Map<String, dynamic>> records = registrants.map((e) => e.toJson()).toList();
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
