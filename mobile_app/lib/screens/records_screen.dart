import 'package:flutter/material.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';
import '../services/supabase_service.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  List<Registrant> _registrants = [];
  List<Intervention> _interventions = [];
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadRecords();
    offlineService.addListener(_onOfflineServiceChanged);
  }

  @override
  void dispose() {
    offlineService.removeListener(_onOfflineServiceChanged);
    super.dispose();
  }

  void _onOfflineServiceChanged() {
    _loadRecords();
  }

  Future<void> _loadRecords() async {
    setState(() => _isLoading = true);
    final regs = await offlineService.getOfflineRegistrants();
    final ints = await offlineService.getOfflineInterventions();
    
    if (mounted) {
      setState(() {
        _registrants = regs;
        _interventions = ints;
        _isLoading = false;
      });
    }
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);
    
    final errorMsg = await supabaseSyncService.syncAll();
    
    if (mounted) {
      setState(() => _isSyncing = false);
      if (errorMsg == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sync completed successfully!')),
        );
        _loadRecords();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sync failed: $errorMsg'),
            backgroundColor: AppTheme.destructive,
            duration: const Duration(seconds: 6),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Records'),
        actions: [
          if (_isSyncing)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: SizedBox(
                  width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.sync),
              tooltip: 'Sync Now',
              onPressed: (_registrants.isEmpty && _interventions.isEmpty) ? null : _syncNow,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : (_registrants.isEmpty && _interventions.isEmpty)
              ? const Center(child: Text('No offline records.', style: TextStyle(color: AppTheme.mutedForeground)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_registrants.isNotEmpty) ...[
                      const Text('Registrants Pending Sync', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      ..._registrants.map((r) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const CircleAvatar(backgroundColor: AppTheme.primary, child: Icon(Icons.person, color: Colors.white, size: 20)),
                              title: Text(r.fullName),
                              subtitle: Text('${r.category.toUpperCase()} • ${r.reference}'),
                            ),
                          )),
                      const SizedBox(height: 24),
                    ],
                    if (_interventions.isNotEmpty) ...[
                      const Text('Interventions Pending Sync', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      ..._interventions.map((i) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const CircleAvatar(backgroundColor: AppTheme.secondary, child: Icon(Icons.handshake, color: Colors.white, size: 20)),
                              title: Text(i.category),
                              subtitle: Text('${i.camp} • Beneficiaries: ${i.count}'),
                            ),
                          )),
                    ],
                  ],
                ),
      floatingActionButton: (_registrants.isNotEmpty || _interventions.isNotEmpty) && !_isSyncing
          ? FloatingActionButton.extended(
              onPressed: _syncNow,
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.cloud_upload),
              label: const Text('Sync All'),
            )
          : null,
    );
  }
}
