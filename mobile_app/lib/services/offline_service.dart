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

  Future<String> _getWebKey(String fileName) async {
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
      final currentUser = Supabase.instance.client.auth.currentUser;
      if (currentUser != null) {
        suffix = '_${currentUser.id}';
      }
    }
    return 'offline_${fileName}_$suffix';
  }

  Future<void> _writeToStorage(String fileName, String content) async {
    if (kIsWeb) {
      final key = await _getWebKey(fileName);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, content);
    } else {
      final file = await _getFile(fileName);
      await file.writeAsString(content);
    }
  }

  Future<String?> _readFromStorage(String fileName) async {
    if (kIsWeb) {
      final key = await _getWebKey(fileName);
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    } else {
      final file = await _getFile(fileName);
      if (!await file.exists()) return null;
      return await file.readAsString();
    }
  }

  Future<List<Registrant>> getOfflineRegistrants() async {
    try {
      final String? contents = await _readFromStorage(_registrantsFile);
      if (contents == null || contents.isEmpty) return [];
      final List<dynamic> jsonList = jsonDecode(contents);
      return jsonList.map((e) => Registrant.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> saveRegistrant(Registrant registrant) async {
    final list = await getOfflineRegistrants();
    list.add(registrant);
    await _writeToStorage(_registrantsFile, jsonEncode(list.map((e) => e.toJson()).toList()));
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
    await _writeToStorage(_registrantsFile, jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> deleteRegistrant(String id) async {
    final list = await getOfflineRegistrants();
    list.removeWhere((r) => r.id == id);
    await _writeToStorage(_registrantsFile, jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> clearOfflineRegistrants() async {
    await _writeToStorage(_registrantsFile, '[]');
    notifyListeners();
  }

  Future<List<Intervention>> getOfflineInterventions() async {
    try {
      final String? contents = await _readFromStorage(_interventionsFile);
      if (contents == null || contents.isEmpty) return [];
      final List<dynamic> jsonList = jsonDecode(contents);
      return jsonList.map((e) => Intervention.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> saveIntervention(Intervention intervention) async {
    final list = await getOfflineInterventions();
    list.add(intervention);
    await _writeToStorage(_interventionsFile, jsonEncode(list.map((e) => e.toJson()).toList()));
    notifyListeners();
  }

  Future<void> clearOfflineInterventions() async {
    await _writeToStorage(_interventionsFile, '[]');
    notifyListeners();
  }
}

final offlineService = OfflineService();
