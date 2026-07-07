import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';
import '../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  final Function(String)? onCategorySelected;
  const HomeScreen({super.key, this.onCategorySelected});

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
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'officer@ncfrmi.gov.ng';
    final displayName = user?.userMetadata?['display_name'] ?? 'Field Officer';

    final totalPending = _pendingSyncRegistrants + _pendingSyncInterventions;
    final totalSynced = _onlineToday;
    final double syncRatio = (totalPending + totalSynced) == 0 
        ? 1.0 
        : totalSynced / (totalPending + totalSynced);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadStats,
            color: AppTheme.primary,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              children: [
                const SizedBox(height: 24),
                // Top Profile Header Card (mimicking mockup style, color preserved)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.user300, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              email,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.refreshCw300, color: Colors.white),
                        onPressed: _loadStats,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                
                // Intake Channels Section Title
                const Text(
                  'REGISTRATION CHANNELS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.mutedForeground,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),

                // Grid actions (mimicking mockup cards, color preserved)
                Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildGridButton(
                            category: 'refugee',
                            title: 'Refugees',
                            subtitle: 'Protection Division',
                            icon: LucideIcons.globe300,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildGridButton(
                            category: 'idp',
                            title: 'IDPs',
                            subtitle: 'Camp Enrolment',
                            icon: LucideIcons.home300,
                            color: AppTheme.primaryGlow,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildGridButton(
                            category: 'migrant',
                            title: 'Migrants',
                            subtitle: 'Transit & Exit',
                            icon: LucideIcons.plane300,
                            color: const Color(0xFFC05A12), // chocolate/brown matching
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildGridButton(
                            category: 'returnee',
                            title: 'Returnees',
                            subtitle: 'Reintegration',
                            icon: LucideIcons.undo300,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Dynamic progress / metrics section
                const Text(
                  'DAILY SYNC PROGRESS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.mutedForeground,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Synced $totalSynced logs today',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '$totalPending pending offline',
                              style: const TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: syncRatio,
                            minHeight: 8,
                            color: AppTheme.primary,
                            backgroundColor: AppTheme.border,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Synchronization Rate: ${(syncRatio * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // Recent activities section (mimicking mockup style, color preserved)
                const Text(
                  'RECENT CAPTURES',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.mutedForeground,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_recentActivities.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Center(
                              child: Text(
                                'No recent captures on this device.',
                                style: TextStyle(color: AppTheme.mutedForeground, fontSize: 13),
                              ),
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _recentActivities.length,
                            separatorBuilder: (context, index) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final item = _recentActivities[index];
                              if (item is Registrant) {
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  leading: CircleAvatar(
                                    backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                                    child: const Icon(LucideIcons.user300, color: AppTheme.primary, size: 20),
                                  ),
                                  title: Text(
                                    item.fullName,
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                  ),
                                  subtitle: Text(
                                    '${item.category.toUpperCase()} • Ref: ${item.reference.substring(item.reference.length - 8)}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  trailing: const Icon(LucideIcons.checkCircle300, color: AppTheme.primary, size: 18),
                                );
                              } else if (item is Intervention) {
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  leading: CircleAvatar(
                                    backgroundColor: AppTheme.secondary.withValues(alpha: 0.1),
                                    child: const Icon(LucideIcons.handshake300, color: AppTheme.secondary, size: 20),
                                  ),
                                  title: Text(
                                    'Intervention: ${item.category}',
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                  ),
                                  subtitle: Text(
                                    '${item.camp} • Count: ${item.count}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  trailing: const Icon(LucideIcons.checkCircle300, color: AppTheme.primary, size: 18),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildGridButton({
    required String category,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return GestureDetector(
      onTap: () => widget.onCategorySelected?.call(category),
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border, width: 1.5),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                Icon(LucideIcons.arrowUpRight300, color: AppTheme.mutedForeground.withValues(alpha: 0.6), size: 16),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppTheme.foreground),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10, color: AppTheme.mutedForeground),
                ),
              ],
                ),
          ],
        ),
      ),
    );
  }
}
