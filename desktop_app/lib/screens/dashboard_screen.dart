import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'modules/analytics_module.dart';
import 'modules/user_management_module.dart';
import 'modules/content_management_module.dart';
import 'modules/geopolitical_map_module.dart';
import 'modules/zonal_management_module.dart';
import 'modules/reports_module.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _modules = const [
    AnalyticsModule(),
    GeopoliticalMapModule(),
    ZonalManagementModule(),
    ReportsModule(),
    UserManagementModule(),
    ContentManagementModule(),
  ];

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'commissioner@ncfrmi.gov.ng';
    final displayName = user?.userMetadata?['display_name'] ?? 'Commissioner';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Row(
        children: [
          // 1. Compact Sidebar Navigation (mimicking fitness mockup layout, color preserved)
          Container(
            width: 80,
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(right: BorderSide(color: AppTheme.border, width: 1.5)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 24),
                // Top Brand Icon
                Image.asset('assets/images/ncfrmi-logo.png', width: 36, height: 36),
                const SizedBox(height: 32),
                
                // Navigation Items
                Expanded(
                  child: Column(
                    children: [
                      _buildNavItem(0, 'Overview Dashboard', LucideIcons.layoutDashboard300),
                      _buildNavItem(1, 'Geopolitical Map', LucideIcons.map300),
                      _buildNavItem(2, 'Zonal Registry', LucideIcons.mapPin300),
                      _buildNavItem(3, 'Audits & Reports', LucideIcons.fileText300),
                      _buildNavItem(4, 'User Management', LucideIcons.users300),
                      _buildNavItem(5, 'Content Management', LucideIcons.newspaper300),
                    ],
                  ),
                ),
                
                // Bottom Profile & Sign Out
                Tooltip(
                  message: 'Sign Out ($email)',
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    decoration: const BoxDecoration(
                      color: AppTheme.muted,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(LucideIcons.logOut300, color: AppTheme.destructive, size: 20),
                      onPressed: () async {
                        await Supabase.instance.client.auth.signOut();
                        if (context.mounted) {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                          );
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          
          // 2. Main Area (mimicking mockup style header and layout, color preserved)
          Expanded(
            child: Column(
              children: [
                // Shared Top Header Bar
                Container(
                  height: 80,
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: AppTheme.border)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // User Greeting info
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Hello, $displayName!',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.foreground,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Welcome to the NCFRMI Command Center',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.mutedForeground,
                            ),
                          ),
                        ],
                      ),
                      
                      // Search field
                      SizedBox(
                        width: 320,
                        height: 44,
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Search operations...',
                            hintStyle: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground),
                            prefixIcon: const Icon(LucideIcons.search300, size: 18, color: AppTheme.mutedForeground),
                            filled: true,
                            fillColor: AppTheme.muted.withValues(alpha: 0.6),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                            ),
                          ),
                        ),
                      ),
                      
                      // Action buttons
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                            ),
                            child: const Row(
                              children: [
                                CircleAvatar(
                                  radius: 4,
                                  backgroundColor: AppTheme.primary,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'System Online',
                                  style: TextStyle(
                                    color: AppTheme.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Module Content Stack
                Expanded(
                  child: Container(
                    color: AppTheme.muted.withValues(alpha: 0.5),
                    child: IndexedStack(
                      index: _selectedIndex,
                      children: _modules,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, String title, IconData icon) {
    final isSelected = _selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Tooltip(
        message: title,
        child: GestureDetector(
          onTap: () => setState(() => _selectedIndex = index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.primary.withValues(alpha: 0.12) : Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isSelected ? AppTheme.primary : AppTheme.mutedForeground,
              size: 20,
            ),
          ),
        ),
      ),
    );
  }
}
