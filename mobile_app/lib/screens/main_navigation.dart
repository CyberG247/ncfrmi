import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';
import 'capture_screen.dart';
import 'records_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  String? _selectedCategory;
  bool _isFabExpanded = false;

  void _handleCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
      _currentIndex = 5; // CaptureScreen is at index 5 in screens list
    });
  }

  void _clearSelectedCategory() {
    _selectedCategory = null;
  }

  Widget _buildNavItem(int index, IconData icon) {
    final isSelected = _currentIndex == index;
    final isCenterButton = index == 2;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          // Unfocus keyboard when tapping any nav button to prevent layout overlay issues
          FocusScope.of(context).unfocus();
          debugPrint('Tapped nav item $index. isCenter: $isCenterButton. CurrentIndex: $_currentIndex');

          if (isCenterButton) {
            setState(() {
              _isFabExpanded = !_isFabExpanded;
            });
          } else {
            setState(() {
              _isFabExpanded = false;
              _currentIndex = index;
            });
          }
        },
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (isCenterButton && _isFabExpanded)
                  ? AppTheme.primary.withValues(alpha: 0.15)
                  : (isSelected ? AppTheme.primary.withValues(alpha: 0.12) : Colors.transparent),
              shape: BoxShape.circle,
            ),
            child: isCenterButton
                ? AnimatedRotation(
                    turns: _isFabExpanded ? 0.125 : 0.0, // Rotate 45 degrees (0.125 of a full turn)
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeInOut,
                    child: Icon(
                      LucideIcons.plus300,
                      color: _isFabExpanded ? AppTheme.primary : AppTheme.mutedForeground,
                      size: 24,
                    ),
                  )
                : Icon(
                    icon,
                    color: isSelected ? AppTheme.primary : AppTheme.mutedForeground,
                    size: 24,
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpeedDialItem({
    required String category,
    required String title,
    required IconData icon,
    required Color color,
  }) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _isFabExpanded = false;
        });
        _handleCategorySelected(category);
      },
      child: Container(
        width: 150, // Fixed uniform width for all speed dial options
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: color.withValues(alpha: 0.2), width: 1),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center, // Center both icon and text within the fixed width
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onCategorySelected: _handleCategorySelected),
      const SearchScreen(),
      const SizedBox.shrink(), // Placeholder for the '+' index which doesn't open a tab
      const RecordsScreen(),
      const ProfileScreen(),
      CaptureScreen(
        initialCategory: _selectedCategory,
        onCategoryHandled: _clearSelectedCategory,
      ),
    ];

    // Keep speed dial widgets globally accessible on all screens, including Enrolment Terminal (index 5)
    final hideSpeedDial = false;

    return Scaffold(
      body: Stack(
        children: [
          // 1. Bottom Nav Screens Stack
          IndexedStack(
            index: _currentIndex,
            children: screens,
          ),
          
          // 2. Global Speed Dial Backdrop Blur Overlay (Animated transition)
          IgnorePointer(
            ignoring: !_isFabExpanded || hideSpeedDial,
            child: AnimatedOpacity(
              opacity: (_isFabExpanded && !hideSpeedDial) ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              child: GestureDetector(
                onTap: () => setState(() => _isFabExpanded = false),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                  child: Container(
                    color: Colors.black.withValues(alpha: 0.4),
                  ),
                ),
              ),
            ),
          ),
          
          // 3. Floating Action Button Speed Dial Menu (Navbar Docked Centered Above '+')
          if (!hideSpeedDial)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutBack,
              left: 0,
              right: 0,
              bottom: _isFabExpanded ? (76 - 20) : (76 - 200), // Slide down further for a stacked visual layout
              child: IgnorePointer(
                ignoring: !_isFabExpanded,
                child: AnimatedOpacity(
                  opacity: _isFabExpanded ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildSpeedDialItem(
                        category: 'returnee',
                        title: 'RETURNEE',
                        icon: LucideIcons.undo300,
                        color: AppTheme.secondary,
                      ),
                      const SizedBox(height: 12),
                      _buildSpeedDialItem(
                        category: 'migrant',
                        title: 'MIGRANT',
                        icon: LucideIcons.plane300,
                        color: const Color(0xFFC05A12),
                      ),
                      const SizedBox(height: 12),
                      _buildSpeedDialItem(
                        category: 'idp',
                        title: 'IDP',
                        icon: LucideIcons.home300,
                        color: AppTheme.primaryGlow,
                      ),
                      const SizedBox(height: 12),
                      _buildSpeedDialItem(
                        category: 'refugee',
                        title: 'REFUGEE',
                        icon: LucideIcons.globe300,
                        color: AppTheme.primary,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
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
              _buildNavItem(2, LucideIcons.plus300), // "+" button is back in the navbar!
              _buildNavItem(3, LucideIcons.clock300),
              _buildNavItem(4, LucideIcons.user300),
            ],
          ),
        ),
      ),
    );
  }
}
