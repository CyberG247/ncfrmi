import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';

class OfflineService extends ChangeNotifier {
  static const String _registrantsFile = 'offline_registrants.json';
  static const String _interventionsFile = 'offline_interventions.json';

  Future<File> _getFile(String fileName) async {
    final dir = await getApplicationDocumentsDirectory();
    String suffix = '_bypassed';
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedEmail = prefs.getString('last_logged_in_email');
      if (savedEmail != null && savedEmail.isNotEmpty) {
        suffix = '_${savedEmail.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}';
      } else {
        final currentUser = Supabase.instance.client.auth.currentUser;
        if (currentUser != null) {
          suffix = '_${currentUser.id}';
        }
      }
    } catch (e) {
      debugPrint('Error getting SharedPreferences in _getFile: $e');
      final currentUser = Supabase.instance.client.auth.currentUser;
      if (currentUser != null) {
        suffix = '_${currentUser.id}';
      }
    }
    final dotIndex = fileName.lastIndexOf('.');
    final nameWithUser = fileName.substring(0, dotIndex) + suffix + fileName.substring(dotIndex);
    return File('${dir.path}/$nameWithUser');
  }

  Future<List<Registrant>> getOfflineRegistrants() async {
    try {
      final file = await _getFile(_registrantsFile);
      if (!await file.exists()) return [];
      final String contents = await file.readAsString();
      final List<dynamic> jsonList = jsonDecode(contents);
      return jsonList.map((e) => Registrant.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> saveRegistrant(Registrant registrant) async {
    final list = await getOfflineRegistrants();
    list.add(registrant);
    final file = await _getFile(_registrantsFile);
    await file.writeAsString(jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> updateRegistrant(Registrant registrant) async {
    final list = await getOfflineRegistrants();
    final idx = list.indexWhere((r) => r.id == registrant.id);
    if (idx != -1) {
      list[idx] = registrant;
    } else {
      list.add(registrant);
    }
    final file = await _getFile(_registrantsFile);
    await file.writeAsString(jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> deleteRegistrant(String id) async {
    final list = await getOfflineRegistrants();
    list.removeWhere((r) => r.id == id);
    final file = await _getFile(_registrantsFile);
    await file.writeAsString(jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> clearOfflineRegistrants() async {
    final file = await _getFile(_registrantsFile);
    if (await file.exists()) {
      await file.writeAsString('[]');
    }
    notifyListeners();
  }

  Future<List<Intervention>> getOfflineInterventions() async {
    try {
      final file = await _getFile(_interventionsFile);
      if (!await file.exists()) return [];
      final String contents = await file.readAsString();
      final List<dynamic> jsonList = jsonDecode(contents);
      return jsonList.map((e) => Intervention.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> saveIntervention(Intervention intervention) async {
    final list = await getOfflineInterventions();
    list.add(intervention);
    final file = await _getFile(_interventionsFile);
    await file.writeAsString(jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> clearOfflineInterventions() async {
    final file = await _getFile(_interventionsFile);
    if (await file.exists()) {
      await file.writeAsString('[]');
    }
    notifyListeners();
  }
}

final offlineService = OfflineService();
