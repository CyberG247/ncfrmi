import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class ContentManagementModule extends StatefulWidget {
  const ContentManagementModule({super.key});

  @override
  State<ContentManagementModule> createState() => _ContentManagementModuleState();
}

class _ContentManagementModuleState extends State<ContentManagementModule> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<Map<String, dynamic>> _newsList = [];

  // Form Controllers
  final _titleController = TextEditingController();
  final _tagController = TextEditingController();
  final _excerptController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  Future<void> _fetchNews() async {
    setState(() => _isLoading = true);
    try {
      final response = await _supabase.from('news').select().order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _newsList = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _publishNews() async {
    if (_titleController.text.isEmpty || _tagController.text.isEmpty || _excerptController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _supabase.from('news').insert({
        'title': _titleController.text,
        'tag': _tagController.text,
        'excerpt': _excerptController.text,
        'date': DateFormat('MMM dd, yyyy').format(DateTime.now()),
      });
      
      _titleController.clear();
      _tagController.clear();
      _excerptController.clear();
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('News published successfully!')));
      Navigator.pop(context); // Close dialog
      _fetchNews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to publish: $e'), backgroundColor: AppTheme.destructive));
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteNews(String id) async {
    try {
      await _supabase.from('news').delete().eq('id', id);
      _fetchNews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e'), backgroundColor: AppTheme.destructive));
    }
  }

  Future<void> _exportData() async {
    if (_newsList.isEmpty) return;

    try {
      String? outputFile = await FilePicker.saveFile(
        dialogTitle: 'Export Content Logs to CSV',
        fileName: 'ncfrmi_content_logs_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv',
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (outputFile != null) {
        List<List<dynamic>> rows = [];
        rows.add(['ID', 'Date', 'Tag', 'Title', 'Created At']);
        for (var n in _newsList) {
          rows.add([n['id'], n['date'], n['tag'], n['title'], n['created_at']]);
        }
        String csvString = csv.encode(rows);
        final file = File(outputFile);
        await file.writeAsString(csvString);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported to $outputFile')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e'), backgroundColor: AppTheme.destructive));
    }
  }

  void _showAddNewsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Publish New Update'),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'Title')),
              const SizedBox(height: 16),
              TextField(controller: _tagController, decoration: const InputDecoration(labelText: 'Tag (e.g. Press Release)')),
              const SizedBox(height: 16),
              TextField(controller: _excerptController, decoration: const InputDecoration(labelText: 'Excerpt'), maxLines: 3),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: _publishNews, child: const Text('Publish')),
        ],
      ),
    );
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
              const Text('Content Management', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: _exportData,
                    icon: const Icon(LucideIcons.download300),
                    label: const Text('Export Logs'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: _showAddNewsDialog,
                    icon: const Icon(LucideIcons.plus300),
                    label: const Text('Create Post'),
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
                    itemCount: _newsList.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final news = _newsList[index];
                      return ListTile(
                        leading: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                          child: Text(news['tag'] ?? '', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                        title: Text(news['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(news['excerpt'] ?? ''),
                        trailing: IconButton(
                          icon: const Icon(LucideIcons.trash2300, color: AppTheme.destructive),
                          onPressed: () => _deleteNews(news['id']),
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
