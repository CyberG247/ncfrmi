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
  bool _showCapturePopup = false;

  void _handleCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
      _currentIndex = 5; // CaptureScreen is at index 5 in screens list
    });
  }

  void _clearSelectedCategory() {
    _selectedCategory = null;
  }

  void _showGlobalCaptureChannelsPopup() {
    setState(() {
      _showCapturePopup = true;
    });
  }

  Widget _buildNavItem(int index, IconData icon) {
    final isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (index == 2) {
            _showGlobalCaptureChannelsPopup();
          } else {
            setState(() {
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
              color: (index == 2)
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : (isSelected ? AppTheme.primary.withValues(alpha: 0.12) : Colors.transparent),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: (index == 2) ? AppTheme.primary : (isSelected ? AppTheme.primary : AppTheme.mutedForeground),
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPopupChannelOption({
    required String category,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return InkWell(
      onTap: () {
        setState(() {
          _showCapturePopup = false;
        });
        _handleCategorySelected(category);
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.border),
          borderRadius: BorderRadius.circular(16),
          color: Colors.white,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: color),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: AppTheme.mutedForeground),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight300, color: AppTheme.mutedForeground, size: 16),
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

    return Scaffold(
      body: Stack(
        children: [
          // 1. Bottom Nav Screens Stack
          IndexedStack(
            index: _currentIndex,
            children: screens,
          ),
          
          // 2. Global Tooltip Popup Blur Overlay
          if (_showCapturePopup) ...[
            GestureDetector(
              onTap: () => setState(() => _showCapturePopup = false),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: Container(
                  color: Colors.black.withValues(alpha: 0.4),
                ),
              ),
            ),
            Center(
              child: Container(
                width: MediaQuery.of(context).size.width * 0.85,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Registration Channel',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.foreground),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Select a category below to launch the capture form.',
                      style: TextStyle(color: AppTheme.mutedForeground, fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    
                    _buildPopupChannelOption(
                      category: 'refugee',
                      title: 'REFUGEE',
                      subtitle: 'Cross-border protection filings',
                      icon: LucideIcons.globe300,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(height: 12),
                    _buildPopupChannelOption(
                      category: 'idp',
                      title: 'IDP',
                      subtitle: 'Internally displaced camp enrollees',
                      icon: LucideIcons.home300,
                      color: AppTheme.primaryGlow,
                    ),
                    const SizedBox(height: 12),
                    _buildPopupChannelOption(
                      category: 'migrant',
                      title: 'MIGRANT',
                      subtitle: 'Socioeconomic border transit logs',
                      icon: LucideIcons.plane300,
                      color: const Color(0xFFC05A12),
                    ),
                    const SizedBox(height: 12),
                    _buildPopupChannelOption(
                      category: 'returnee',
                      title: 'RETURNEE',
                      subtitle: 'National reintegration programs',
                      icon: LucideIcons.undo300,
                      color: AppTheme.secondary,
                    ),
                    
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => setState(() => _showCapturePopup = false),
                        child: const Text('Cancel'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
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
              _buildNavItem(2, LucideIcons.plus300), // "+" button at index 2
              _buildNavItem(3, LucideIcons.clock300),
              _buildNavItem(4, LucideIcons.user300), // maps to profile index (4 in IndexedStack screens array)
            ],
          ),
        ),
      ),
    );
  }
}
