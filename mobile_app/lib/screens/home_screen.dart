import 'package:flutter/material.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';
import '../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _pendingSyncRegistrants = 0;
  int _pendingSyncInterventions = 0;
  int _onlineToday = 0;
  List<dynamic> _recentActivities = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
    offlineService.addListener(_onOfflineServiceChanged);
  }

  @override
  void dispose() {
    offlineService.removeListener(_onOfflineServiceChanged);
    super.dispose();
  }

  void _onOfflineServiceChanged() {
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    
    final registrants = await offlineService.getOfflineRegistrants();
    final interventions = await offlineService.getOfflineInterventions();
    final onlineToday = await supabaseSyncService.getOnlineRegistrantCountToday();

    final combined = <dynamic>[...registrants, ...interventions];
    combined.sort((a, b) {
      final aDate = DateTime.tryParse(a.createdAt) ?? DateTime(0);
      final bDate = DateTime.tryParse(b.createdAt) ?? DateTime(0);
      return bDate.compareTo(aDate);
    });

    if (mounted) {
      setState(() {
        _pendingSyncRegistrants = registrants.length;
        _pendingSyncInterventions = interventions.length;
        _onlineToday = onlineToday;
        _recentActivities = combined.take(5).toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStats,
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadStats,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildStatCard(
                  title: 'Synced Today',
                  value: _onlineToday.toString(),
                  icon: Icons.cloud_done,
                  color: AppTheme.primary,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  title: 'Pending Sync (Registrants)',
                  value: _pendingSyncRegistrants.toString(),
                  icon: Icons.sync_problem,
                  color: AppTheme.accent,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  title: 'Pending Sync (Interventions)',
                  value: _pendingSyncInterventions.toString(),
                  icon: Icons.sync_problem,
                  color: AppTheme.secondary,
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Recent Activity',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        if (_recentActivities.isEmpty)
                          const Text('No recent activity.', style: TextStyle(color: AppTheme.mutedForeground))
                        else
                          ..._recentActivities.map((item) {
                            if (item is Registrant) {
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const CircleAvatar(
                                  backgroundColor: AppTheme.primary,
                                  child: Icon(Icons.person, color: Colors.white, size: 18),
                                ),
                                title: Text(item.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Text('Enrolled ${item.category.toUpperCase()} • ${item.reference}', style: const TextStyle(fontSize: 12)),
                              );
                            } else if (item is Intervention) {
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const CircleAvatar(
                                  backgroundColor: AppTheme.secondary,
                                  child: Icon(Icons.handshake, color: Colors.white, size: 18),
                                ),
                                title: Text('Intervention: ${item.category}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Text('${item.camp} • Beneficiaries: ${item.count}', style: const TextStyle(fontSize: 12)),
                              );
                            }
                            return const SizedBox.shrink();
                          }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon, required Color color}) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 32, color: color),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 14, color: AppTheme.mutedForeground)),
                  const SizedBox(height: 4),
                  Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
