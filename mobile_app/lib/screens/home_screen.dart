import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../models/registrant.dart';
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

    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          // 1. Scrollable Content
          SafeArea(
            top: false,
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadStats,
                  color: AppTheme.primary,
                  child: ListView(
                    padding: EdgeInsets.only(
                      left: 20,
                      right: 20,
                      top: kToolbarHeight + topPadding + 16,
                      bottom: 24,
                    ),
                    children: [
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

                      // Grid actions
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
                                  color: const Color(0xFFC05A12),
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
                                '${(syncRatio * 100).toStringAsFixed(0)}% database synchronization rate',
                                style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Recent activity logs
                      const Text(
                        'RECENT LOCAL ACTIVITIES',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.mutedForeground,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      if (_recentActivities.isEmpty)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(24.0),
                            child: Center(
                              child: Text(
                                'No recent local capture logs.',
                                style: TextStyle(color: AppTheme.mutedForeground, fontSize: 13),
                              ),
                            ),
                          ),
                        )
                      else
                        Card(
                          child: ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _recentActivities.length,
                            separatorBuilder: (context, index) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final item = _recentActivities[index];
                              final isReg = item is Registrant;
                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: (isReg ? AppTheme.primary : AppTheme.secondary).withValues(alpha: 0.1),
                                  backgroundImage: isReg && item.photoBase64 != null ? MemoryImage(base64Decode(item.photoBase64!.split(',').last)) : null,
                                  child: (!isReg || item.photoBase64 == null) ? Icon(
                                    isReg ? LucideIcons.user300 : LucideIcons.handshake300,
                                    color: isReg ? AppTheme.primary : AppTheme.secondary,
                                    size: 18,
                                  ) : null,
                                ),
                                title: Text(
                                  isReg ? item.fullName : 'Intervention: ${item.category}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                subtitle: Text(
                                  isReg ? '${item.category.toUpperCase()} • Ref: ${item.reference}' : '${item.camp} • Beneficiaries: ${item.count}',
                                  style: const TextStyle(fontSize: 11),
                                ),
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                ),
          ),
          
          // 2. Fixed Translucent Glassy Header Overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                child: Container(
                  height: kToolbarHeight + topPadding,
                  padding: EdgeInsets.only(top: topPadding, left: 20, right: 10),
                  color: Colors.white.withValues(alpha: 0.75),
                  alignment: Alignment.center,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'NCFRMI Portal',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.foreground),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.refreshCw300, color: AppTheme.foreground),
                        onPressed: _loadStats,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
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
      onTap: () {
        if (widget.onCategorySelected != null) {
          widget.onCategorySelected!(category);
        }
      },
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: AppTheme.border.withValues(alpha: 0.5), width: 1),
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
