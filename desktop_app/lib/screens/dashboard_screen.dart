import 'dart:convert';
import 'dart:typed_data';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'modules/analytics_module.dart';
import 'modules/registrants_module.dart';
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
    RegistrantsModule(),
    GeopoliticalMapModule(),
    ZonalManagementModule(),
    ReportsModule(),
    UserManagementModule(),
    ContentManagementModule(),
  ];

  // --- Universal Search State & Helpers ---
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  Timer? _debounce;
  bool _isSearching = false;

  // Cached matched results
  List<Map<String, dynamic>> _matchedModules = [];
  List<Map<String, dynamic>> _matchedCamps = [];
  List<Map<String, dynamic>> _matchedRegistrants = [];
  List<Map<String, dynamic>> _matchedUsers = [];

  // Navigation module routes
  final List<Map<String, dynamic>> _navigationShortcuts = [
    {'index': 0, 'title': 'Overview Dashboard', 'icon': LucideIcons.layoutDashboard300},
    {'index': 1, 'title': 'Registrant Management', 'icon': LucideIcons.users300},
    {'index': 2, 'title': 'Geopolitical Map', 'icon': LucideIcons.map300},
    {'index': 3, 'title': 'Zonal Registry', 'icon': LucideIcons.mapPin300},
    {'index': 4, 'title': 'Audits & Reports', 'icon': LucideIcons.fileText300},
    {'index': 5, 'title': 'User Management', 'icon': LucideIcons.shield300},
    {'index': 6, 'title': 'Content Management', 'icon': LucideIcons.newspaper300},
  ];

  // Zonal camps directory
  final List<Map<String, dynamic>> _campsList = const [
    {
      'id': 'c1',
      'name': 'Abuja Municipal Camp',
      'state': 'Abuja FCT',
      'capacity': 5000,
      'occupancy': 3200,
    },
    {
      'id': 'c2',
      'name': 'Custom House Camp',
      'state': 'Borno State',
      'capacity': 15000,
      'occupancy': 12450,
    },
    {
      'id': 'c3',
      'name': 'Seme Border Transit Camp',
      'state': 'Lagos State',
      'capacity': 2000,
      'occupancy': 1520,
    },
    {
      'id': 'c4',
      'name': 'Daudu Camp 1 & 2',
      'state': 'Benue State',
      'capacity': 6000,
      'occupancy': 4120,
    },
    {
      'id': 'c5',
      'name': 'Uhogua Camp',
      'state': 'Edo State',
      'capacity': 3000,
      'occupancy': 2150,
    },
    {
      'id': 'c6',
      'name': 'Adagom Refugee Settlement',
      'state': 'Cross River State',
      'capacity': 8000,
      'occupancy': 5820,
    },
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _searchFocusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _searchFocusNode.removeListener(_onFocusChanged);
    _searchFocusNode.dispose();
    _debounce?.cancel();
    _hideOverlay();
    super.dispose();
  }

  void _onFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _showOverlay();
    } else {
      // Delay slightly to let tap events inside overlay process before we hide it
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted && !_searchFocusNode.hasFocus) {
          _hideOverlay();
        }
      });
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();
    setState(() {}); // Rebuild to update clear button suffixIcon immediately
    
    // Ensure overlay is showing
    _showOverlay();

    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _matchedModules = [];
        _matchedCamps = [];
        _matchedRegistrants = [];
        _matchedUsers = [];
      });
      _updateOverlay();
      return;
    }

    // Show loading spinner immediately in the overlay
    setState(() {
      _isSearching = true;
    });
    _updateOverlay();

    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        _performSearch(query);
      }
    });
  }

  Future<void> _performSearch(String query) async {
    if (!mounted) return;
    setState(() {
      _isSearching = true;
    });
    _updateOverlay();

    // 1. Search modules locally
    final matchedModules = _navigationShortcuts.where((m) {
      final title = m['title'].toString().toLowerCase();
      return title.contains(query.toLowerCase());
    }).toList();

    // 2. Search camps locally
    final matchedCamps = _campsList.where((c) {
      final name = c['name'].toString().toLowerCase();
      final state = c['state'].toString().toLowerCase();
      return name.contains(query.toLowerCase()) || state.contains(query.toLowerCase());
    }).toList();

    List<Map<String, dynamic>> matchedRegistrants = [];
    List<Map<String, dynamic>> matchedUsers = [];

    try {
      final supabase = Supabase.instance.client;

      // 3. Search registrants in Supabase
      final regResponse = await supabase
          .from('registrants')
          .select()
          .or('full_name.ilike.%$query%,reference.ilike.%$query%,phone.ilike.%$query%')
          .limit(5);
      
      matchedRegistrants = List<Map<String, dynamic>>.from(regResponse);

      // 4. Search users in Supabase profiles
      final profilesResponse = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', '%$query%')
          .limit(5);

      final rolesResponse = await supabase.from('user_roles').select('*');
      final rolesMap = <String, String>{};
      for (var item in rolesResponse) {
        final userId = item['user_id']?.toString();
        final role = item['role']?.toString();
        if (userId != null && role != null) {
          rolesMap[userId] = role;
        }
      }

      matchedUsers = [];
      for (var item in profilesResponse) {
        final joinedItem = Map<String, dynamic>.from(item as Map);
        final userId = joinedItem['id']?.toString();
        joinedItem['role'] = rolesMap[userId] ?? 'applicant';
        matchedUsers.add(joinedItem);
      }
    } catch (e) {
      debugPrint('Universal search query error: $e');
    }

    if (mounted) {
      setState(() {
        _isSearching = false;
        _matchedModules = matchedModules;
        _matchedCamps = matchedCamps;
        _matchedRegistrants = matchedRegistrants;
        _matchedUsers = matchedUsers;
      });
      _updateOverlay();
    }
  }

  void _showOverlay() {
    if (_overlayEntry != null) return;
    _overlayEntry = _buildOverlayEntry();
    Overlay.of(context).insert(_overlayEntry!);
  }

  void _hideOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _updateOverlay() {
    _overlayEntry?.markNeedsBuild();
  }

  OverlayEntry _buildOverlayEntry() {
    return OverlayEntry(
      builder: (context) {
        final query = _searchController.text.trim();
        final hasResults = _matchedModules.isNotEmpty ||
            _matchedCamps.isNotEmpty ||
            _matchedRegistrants.isNotEmpty ||
            _matchedUsers.isNotEmpty;

        return Stack(
          children: [
            // Full screen transparent barrier to close overlay on outside click
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onTap: () {
                  _searchFocusNode.unfocus();
                  _hideOverlay();
                },
              ),
            ),
            
            // Dropdown menu content
            Positioned(
              width: 320,
              child: CompositedTransformFollower(
                link: _layerLink,
                showWhenUnlinked: false,
                targetAnchor: Alignment.bottomLeft,
                followerAnchor: Alignment.topLeft,
                offset: const Offset(0, 4),
                child: Material(
                  elevation: 8,
                  shadowColor: Colors.black.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.white,
                  clipBehavior: Clip.antiAlias,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.border, width: 1.5),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    constraints: const BoxConstraints(maxHeight: 400),
                    child: _isSearching
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                                ),
                              ),
                            ),
                          )
                        : (query.isEmpty
                            ? _buildEmptyOrSuggestionsList()
                            : (!hasResults
                                ? const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                                    child: Center(
                                      child: Text(
                                        'No matching results found.',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: AppTheme.mutedForeground,
                                        ),
                                      ),
                                    ),
                                  )
                                : ListView(
                                    shrinkWrap: true,
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    children: [
                                      if (_matchedModules.isNotEmpty)
                                        _buildCategoryHeader('Navigation Shortcuts'),
                                      ..._matchedModules.map((m) => _buildModuleResultItem(m)),
                                      
                                      if (_matchedCamps.isNotEmpty)
                                        _buildCategoryHeader('Transit Camps'),
                                      ..._matchedCamps.map((c) => _buildCampResultItem(c)),
                                      
                                      if (_matchedRegistrants.isNotEmpty)
                                        _buildCategoryHeader('Registrants'),
                                      ..._matchedRegistrants.map((r) => _buildRegistrantResultItem(r)),
                                      
                                      if (_matchedUsers.isNotEmpty)
                                        _buildCategoryHeader('Staff & Administrators'),
                                      ..._matchedUsers.map((u) => _buildUserResultItem(u)),
                                    ],
                                  ))),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyOrSuggestionsList() {
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 6),
          child: Text(
            'QUICK ACTIONS / SHORTCUTS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: AppTheme.mutedForeground,
            ),
          ),
        ),
        ..._navigationShortcuts.map((m) => _buildModuleResultItem(m)),
      ],
    );
  }

  Widget _buildCategoryHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Divider(
              color: AppTheme.border,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModuleResultItem(Map<String, dynamic> m) {
    return _buildHoverResultItem(
      icon: m['icon'] as IconData,
      title: m['title'] as String,
      subtitle: 'Jump to screen',
      onTap: () {
        setState(() {
          _selectedIndex = m['index'] as int;
        });
        _searchController.clear();
        _searchFocusNode.unfocus();
        _hideOverlay();
      },
    );
  }

  Widget _buildCampResultItem(Map<String, dynamic> c) {
    return _buildHoverResultItem(
      icon: LucideIcons.mapPin300,
      title: c['name'] as String,
      subtitle: 'Camp in ${c['state']} • Capacity: ${c['capacity']}',
      onTap: () {
        setState(() {
          _selectedIndex = 3; // Zonal Registry index
        });
        _searchController.clear();
        _searchFocusNode.unfocus();
        _hideOverlay();
      },
    );
  }

  Widget _buildRegistrantResultItem(Map<String, dynamic> r) {
    final ref = r['reference'] ?? 'N/A';
    final category = (r['category']?.toString() ?? 'N/A').toUpperCase();
    return _buildHoverResultItem(
      icon: LucideIcons.user300,
      title: r['full_name'] ?? 'Unknown Registrant',
      subtitle: 'Ref: $ref • $category',
      onTap: () {
        _searchController.clear();
        _searchFocusNode.unfocus();
        _hideOverlay();
        _showRegistrantDetailsDialog(r);
      },
    );
  }

  Widget _buildUserResultItem(Map<String, dynamic> u) {
    final role = (u['role']?.toString() ?? 'officer').toUpperCase();
    return _buildHoverResultItem(
      icon: LucideIcons.shield300,
      title: u['full_name'] ?? 'System User',
      subtitle: 'Role: $role • ${u['phone'] ?? 'No Phone'}',
      onTap: () {
        setState(() {
          _selectedIndex = 5; // User Management index
        });
        _searchController.clear();
        _searchFocusNode.unfocus();
        _hideOverlay();
      },
    );
  }

  Widget _buildHoverResultItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      hoverColor: AppTheme.muted,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.muted,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                size: 16,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.foreground,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.mutedForeground,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight300,
              size: 14,
              color: AppTheme.mutedForeground,
            ),
          ],
        ),
      ),
    );
  }

  // --- Registrant Details Dialog Helpers ---
  String _cleanPhotoBase64(String raw) {
    String clean = raw.trim();
    if (clean.startsWith('data:image')) {
      final commaIndex = clean.indexOf(',');
      if (commaIndex != -1) {
        clean = clean.substring(commaIndex + 1);
      }
    }
    return clean.trim();
  }

  String _getPhotoBase64(String? circumstances) {
    if (circumstances == null) return '';
    final parts = circumstances.split('===PHOTO_BASE64===');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return '';
  }

  String _cleanCircumstances(String? circumstances) {
    if (circumstances == null) return 'No circumstances registered.';
    final parts = circumstances.split('===PHOTO_BASE64===');
    return parts[0].trim();
  }

  void _showRegistrantDetailsDialog(Map<String, dynamic> r) {
    final circumstancesStr = r['circumstances']?.toString();
    String rawPhoto = r['photo_base64']?.toString() ?? '';
    if (rawPhoto.isEmpty) {
      rawPhoto = _getPhotoBase64(circumstancesStr);
    }
    final photoBase64 = _cleanPhotoBase64(rawPhoto);
    final cleanCircumstances = _cleanCircumstances(circumstancesStr);
    
    Uint8List? photoBytes;
    if (photoBase64.isNotEmpty) {
      try {
        photoBytes = base64Decode(photoBase64);
      } catch (e) {
        debugPrint('Failed to decode registrant photo: $e');
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
              backgroundImage: photoBytes != null ? MemoryImage(photoBytes) : null,
              child: photoBytes == null 
                  ? const Icon(LucideIcons.user300, color: AppTheme.primary, size: 28)
                  : null,
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r['full_name'] ?? 'Unknown Registrant', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('Ref: ${r['reference'] ?? 'N/A'}', style: const TextStyle(fontSize: 12, color: AppTheme.mutedForeground)),
              ],
            ),
          ],
        ),
        content: SizedBox(
          width: 600,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 24,
                  runSpacing: 16,
                  children: [
                    _buildDetailsField('Registration Category', (r['category']?.toString() ?? 'N/A').toUpperCase()),
                    _buildDetailsField('Gender', r['gender'] ?? 'N/A'),
                    _buildDetailsField('Date of Birth', r['dob'] ?? 'N/A'),
                    _buildDetailsField('Phone Number', r['phone'] ?? 'N/A'),
                    _buildDetailsField('State of Origin', r['state_origin'] ?? 'N/A'),
                    _buildDetailsField('LGA', r['lga'] ?? 'N/A'),
                    _buildDetailsField('Nationality', r['nationality'] ?? 'N/A'),
                    _buildDetailsField('Dependants Count', r['dependants']?.toString() ?? '0'),
                    _buildDetailsField('Creation Timestamp', r['created_at'] ?? 'N/A'),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('Residential Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.mutedForeground)),
                const SizedBox(height: 6),
                Text(r['address'] ?? 'No address registered.', style: const TextStyle(fontSize: 13)),
                const SizedBox(height: 24),
                const Text('Special Circumstances / Vulnerability Notes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.mutedForeground)),
                const SizedBox(height: 6),
                Text(cleanCircumstances, style: const TextStyle(fontSize: 13)),
                const SizedBox(height: 28),
                const Text('Biometrics Registration Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.mutedForeground)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildBiometricStatusIndicator('Face Capture', r['face_captured'] == true),
                    const SizedBox(width: 24),
                    _buildBiometricStatusIndicator('Thumbprint Scan', r['thumb_captured'] == true),
                  ],
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsField(String label, String value) {
    return SizedBox(
      width: 170,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildBiometricStatusIndicator(String label, bool isCaptured) {
    return Row(
      children: [
        Icon(
          isCaptured ? LucideIcons.checkCircle2300 : LucideIcons.xCircle300,
          color: isCaptured ? AppTheme.primary : AppTheme.destructive,
          size: 18,
        ),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

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
                      _buildNavItem(1, 'Registrant Management', LucideIcons.users300),
                      _buildNavItem(2, 'Geopolitical Map', LucideIcons.map300),
                      _buildNavItem(3, 'Zonal Registry', LucideIcons.mapPin300),
                      _buildNavItem(4, 'Audits & Reports', LucideIcons.fileText300),
                      _buildNavItem(5, 'User Management', LucideIcons.shield300),
                      _buildNavItem(6, 'Content Management', LucideIcons.newspaper300),
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
                      CompositedTransformTarget(
                        link: _layerLink,
                        child: SizedBox(
                          width: 320,
                          height: 44,
                          child: TextField(
                            controller: _searchController,
                            focusNode: _searchFocusNode,
                            onTap: _showOverlay,
                            onChanged: (value) => _onSearchChanged(),
                            decoration: InputDecoration(
                              hintText: 'Search operations...',
                              hintStyle: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground),
                              prefixIcon: const Icon(LucideIcons.search300, size: 18, color: AppTheme.mutedForeground),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(LucideIcons.x300, size: 16, color: AppTheme.mutedForeground),
                                      onPressed: () {
                                        _searchController.clear();
                                      },
                                    )
                                  : null,
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
