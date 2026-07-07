import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'modules/analytics_module.dart';
import 'modules/user_management_module.dart';
import 'modules/content_management_module.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _modules = const [
    AnalyticsModule(),
    UserManagementModule(),
    ContentManagementModule(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Side Navigation
          Container(
            width: 280,
            color: AppTheme.card,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  width: double.infinity,
                  color: AppTheme.primary,
                  child: Row(
                    children: [
                      Image.asset('assets/images/ncfrmi-logo.png', width: 40, height: 40),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('NCFRMI', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          Text('Command Center', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    children: [
                      _buildNavItem(0, 'Analytics', Icons.analytics),
                      _buildNavItem(1, 'User Management', Icons.people),
                      _buildNavItem(2, 'Content Management', Icons.article),
                    ],
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: AppTheme.destructive),
                  title: const Text('Sign Out', style: TextStyle(color: AppTheme.destructive)),
                  onTap: () async {
                    await Supabase.instance.client.auth.signOut();
                    if (context.mounted) {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    }
                  },
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          // Main Content Area
          Expanded(
            child: Container(
              color: AppTheme.background,
              child: IndexedStack(
                index: _selectedIndex,
                children: _modules,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, String title, IconData icon) {
    final isSelected = _selectedIndex == index;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primary.withValues(alpha: 0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? AppTheme.primary : AppTheme.mutedForeground),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? AppTheme.primary : AppTheme.foreground,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () => setState(() => _selectedIndex = index),
      ),
    );
  }
}
