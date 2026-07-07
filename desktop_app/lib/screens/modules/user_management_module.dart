import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class UserManagementModule extends StatefulWidget {
  const UserManagementModule({super.key});

  @override
  State<UserManagementModule> createState() => _UserManagementModuleState();
}

class _UserManagementModuleState extends State<UserManagementModule> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<Map<String, dynamic>> _profiles = [];

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoading = true);
    try {
      final response = await _supabase.from('profiles').select().order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _profiles = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _exportData() async {
    if (_profiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No users to export')));
      return;
    }

    try {
      String? outputFile = await FilePicker.saveFile(
        dialogTitle: 'Export Users to CSV',
        fileName: 'ncfrmi_users_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv',
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (outputFile != null) {
        List<List<dynamic>> rows = [];
        // Headers
        rows.add(['User ID', 'Full Name', 'Phone', 'Created At', 'Last Updated']);
        
        for (var p in _profiles) {
          rows.add([
            p['id'],
            p['full_name'] ?? 'N/A',
            p['phone'] ?? 'N/A',
            p['created_at'],
            p['updated_at'],
          ]);
        }

        String csvString = csv.encode(rows);
        final file = File(outputFile);
        await file.writeAsString(csvString);
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported successfully to $outputFile')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e'), backgroundColor: AppTheme.destructive));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('User Management', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: _exportData,
                    icon: const Icon(LucideIcons.download300),
                    label: const Text('Export CSV'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: _fetchUsers,
                    icon: const Icon(LucideIcons.refreshCw300),
                    label: const Text('Refresh'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 32),
          Expanded(
            child: Card(
              child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _profiles.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final p = _profiles[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primary,
                          child: Text((p['full_name'] ?? '?')[0].toUpperCase(), style: const TextStyle(color: Colors.white)),
                        ),
                        title: Text(p['full_name'] ?? 'Unknown User', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('ID: ${p['id']} • Phone: ${p['phone'] ?? 'N/A'}'),
                        trailing: IconButton(
                          icon: const Icon(LucideIcons.moreVertical300),
                          onPressed: () {},
                        ),
                      );
                    },
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
