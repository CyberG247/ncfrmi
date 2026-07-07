import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../services/offline_service.dart';
import '../services/supabase_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  int _pendingRegistrants = 0;
  int _pendingInterventions = 0;
  int _syncedToday = 0;
  
  // Category counts
  int _refugeesCount = 0;
  int _idpsCount = 0;
  int _migrantsCount = 0;
  int _returneesCount = 0;

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);

    final registrants = await offlineService.getOfflineRegistrants();
    final interventions = await offlineService.getOfflineInterventions();
    final onlineToday = await supabaseSyncService.getOnlineRegistrantCountToday();

    int refugees = 0;
    int idps = 0;
    int migrants = 0;
    int returnees = 0;

    for (var r in registrants) {
      final cat = r.category.toLowerCase();
      if (cat == 'refugee') refugees++;
      if (cat == 'idp') idps++;
      if (cat == 'migrant') migrants++;
      if (cat == 'returnee') returnees++;
    }

    if (mounted) {
      setState(() {
        _pendingRegistrants = registrants.length;
        _pendingInterventions = interventions.length;
        _syncedToday = onlineToday;
        _refugeesCount = refugees;
        _idpsCount = idps;
        _migrantsCount = migrants;
        _returneesCount = returnees;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalPending = _pendingRegistrants + _pendingInterventions;
    final totalLocalLogs = totalPending + _syncedToday;
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Field Analytics'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw300),
            onPressed: _loadStats,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadStats,
              color: AppTheme.primary,
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  // Sync Progress Summary Card
                  _buildSyncCard(totalPending, totalLocalLogs),
                  const SizedBox(height: 24),

                  // Category breakdown section
                  const Text(
                    'REGISTRATIONS BY CATEGORY',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.mutedForeground,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildCategoryProgress('Refugees', _refugeesCount, _pendingRegistrants, AppTheme.primary),
                  _buildCategoryProgress('IDPs', _idpsCount, _pendingRegistrants, AppTheme.primaryGlow),
                  _buildCategoryProgress('Migrants', _migrantsCount, _pendingRegistrants, const Color(0xFFC05A12)),
                  _buildCategoryProgress('Returnees', _returneesCount, _pendingRegistrants, AppTheme.secondary),
                  
                  const SizedBox(height: 24),
                  
                  // Device details / info card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(LucideIcons.smartphone300, color: AppTheme.primary, size: 20),
                              SizedBox(width: 10),
                              Text(
                                'Offline Synced Status',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ],
                          ),
                          const Divider(height: 24),
                          _buildDetailRow('Pending Registrants', '$_pendingRegistrants logs'),
                          const SizedBox(height: 8),
                          _buildDetailRow('Pending Interventions', '$_pendingInterventions logs'),
                          const SizedBox(height: 8),
                          _buildDetailRow('Total Synced Today', '$_syncedToday logs'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSyncCard(int totalPending, int totalLocalLogs) {
    final double syncRatio = totalLocalLogs == 0 ? 1.0 : _syncedToday / totalLocalLogs;
    return Card(
      color: AppTheme.primary,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sync Overview',
              style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${(syncRatio * 100).toStringAsFixed(0)}% Synced',
                  style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                ),
                Icon(
                  totalPending == 0 ? LucideIcons.cloudLightning300 : LucideIcons.cloudOff300,
                  color: Colors.white70,
                  size: 28,
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: syncRatio,
                minHeight: 6,
                color: Colors.white,
                backgroundColor: Colors.white24,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '$_syncedToday synced today • $totalPending pending offline',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryProgress(String title, int count, int total, Color color) {
    final double progress = total == 0 ? 0.0 : count / total;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '$count logs',
                  style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                color: color,
                backgroundColor: AppTheme.border,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.mutedForeground, fontSize: 13)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
