import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';
import 'capture_screen.dart';
import 'records_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'analytics_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  String? _selectedCategory;

  void _handleCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
      _currentIndex = 5; // Capture tab index in screens list (hidden from bar)
    });
  }

  void _clearSelectedCategory() {
    _selectedCategory = null;
  }

  Widget _buildNavItem(int index, IconData icon) {
    final isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _currentIndex = index;
          });
        },
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primary.withValues(alpha: 0.12)
                  : Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isSelected ? AppTheme.primary : AppTheme.mutedForeground,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onCategorySelected: _handleCategorySelected),
      const SearchScreen(),
      const AnalyticsScreen(),
      const RecordsScreen(),
      const ProfileScreen(),
      CaptureScreen(
        initialCategory: _selectedCategory,
        onCategoryHandled: _clearSelectedCategory,
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        height: 76,
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
          border: const Border(
            top: BorderSide(color: AppTheme.border, width: 1),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, LucideIcons.home300),
              _buildNavItem(1, LucideIcons.search300),
              _buildNavItem(2, LucideIcons.pieChart300),
              _buildNavItem(3, LucideIcons.clock300),
              _buildNavItem(4, LucideIcons.user300),
            ],
          ),
        ),
      ),
    );
  }
}
