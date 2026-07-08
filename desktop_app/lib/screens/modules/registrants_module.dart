import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class RegistrantsModule extends StatefulWidget {
  const RegistrantsModule({super.key});

  @override
  State<RegistrantsModule> createState() => _RegistrantsModuleState();
}

class _RegistrantsModuleState extends State<RegistrantsModule> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _registrantsData = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _selectedCategoryFilter = 'all';
  RealtimeChannel? _realtimeChannel;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    if (_realtimeChannel != null) {
      _supabase.removeChannel(_realtimeChannel!);
    }
    super.dispose();
  }

  Future<void> _fetchData({bool silent = false}) async {
    if (!silent) {
      setState(() => _isLoading = true);
    }
    try {
      final regResponse = await _supabase.from('registrants').select();
      final dataList = List<Map<String, dynamic>>.from(regResponse);

      if (mounted) {
        setState(() {
          _registrantsData = dataList;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch registrants: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _subscribeRealtime() {
    try {
      _realtimeChannel = _supabase.channel('desktop-registrants-module').onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'registrants',
        callback: (payload) {
          debugPrint('Real-time change received: ${payload.toString()}');
          if (mounted) {
            _fetchData(silent: true);
          }
        },
      );
      _realtimeChannel!.subscribe((status, [error]) {
        debugPrint('Realtime channel status: $status, error: $error');
      });
    } catch (e) {
      debugPrint('Real-time subscription error: $e');
    }

    _startPeriodicRefresh();
  }

  void _startPeriodicRefresh() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 15));
      if (!mounted) return false;
      await _fetchData(silent: true);
      return mounted;
    });
  }

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

  Widget _buildFilterPill(String label, String value, IconData icon) {
    final isSelected = _selectedCategoryFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategoryFilter = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.muted.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isSelected ? Colors.white : AppTheme.mutedForeground),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? Colors.white : AppTheme.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Apply category filtering
    var filteredList = _registrantsData;
    if (_selectedCategoryFilter != 'all') {
      filteredList = filteredList.where((r) => r['category']?.toString().toLowerCase() == _selectedCategoryFilter).toList();
    }

    // 2. Apply search queries
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filteredList = filteredList.where((r) {
        final name = (r['full_name'] ?? '').toString().toLowerCase();
        final ref = (r['reference'] ?? '').toString().toLowerCase();
        final phone = (r['phone'] ?? '').toString().toLowerCase();
        final state = (r['state_origin'] ?? '').toString().toLowerCase();
        final lga = (r['lga'] ?? '').toString().toLowerCase();
        return name.contains(q) || ref.contains(q) || phone.contains(q) || state.contains(q) || lga.contains(q);
      }).toList();
    }

    // Sort by created_at desc as default
    filteredList.sort((a, b) {
      final aTime = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bTime = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bTime.compareTo(aTime);
    });

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Central Registrants Registry',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Search, view, and inspect detailed profiles of registered refugees, IDPs, and migrants.',
                          style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
                        ),
                      ],
                    ),
                    SizedBox(
                      width: 300,
                      height: 40,
                      child: TextField(
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Search registrants...',
                          prefixIcon: const Icon(LucideIcons.search300, size: 16, color: AppTheme.mutedForeground),
                          filled: true,
                          fillColor: AppTheme.muted.withValues(alpha: 0.4),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildFilterPill('All categories', 'all', LucideIcons.users300),
                    _buildFilterPill('Refugees', 'refugee', LucideIcons.globe300),
                    _buildFilterPill('IDPs', 'idp', LucideIcons.home300),
                    _buildFilterPill('Migrants', 'migrant', LucideIcons.compass300),
                    _buildFilterPill('Returnees', 'returnee', LucideIcons.undo2300),
                  ],
                ),
                const Divider(height: 32),
                
                if (_isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 48.0),
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                  )
                else if (filteredList.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 48.0),
                      child: Column(
                        children: [
                          Icon(LucideIcons.users300, size: 48, color: AppTheme.mutedForeground),
                          SizedBox(height: 16),
                          Text('No registrants found matching query.', style: TextStyle(color: AppTheme.mutedForeground)),
                        ],
                      ),
                    ),
                  )
                else
                  Table(
                    columnWidths: const {
                      0: FixedColumnWidth(60),
                      1: FlexColumnWidth(2.2),
                      2: FlexColumnWidth(1.2),
                      3: FlexColumnWidth(1.5),
                      4: FlexColumnWidth(1.0),
                      5: FlexColumnWidth(1.2),
                      6: FixedColumnWidth(60),
                    },
                    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                    children: [
                      TableRow(
                        decoration: BoxDecoration(color: AppTheme.muted.withValues(alpha: 0.3)),
                        children: const [
                          Padding(padding: EdgeInsets.all(12.0), child: Text('PICTURE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('FULL NAME', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('CATEGORY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('LOCATION', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('GENDER', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('BIOMETRICS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
                          Padding(padding: EdgeInsets.all(12.0), child: Text('ACTION', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground), textAlign: TextAlign.center)),
                        ],
                      ),
                      ...filteredList.map((r) {
                        final String cat = r['category']?.toString().toLowerCase() ?? 'refugee';
                        final bool hasFace = r['face_captured'] == true;
                        final bool hasThumb = r['thumb_captured'] == true;
                        
                        Color catColor = AppTheme.primary;
                        if (cat == 'idp') catColor = AppTheme.primaryGlow;
                        if (cat == 'migrant') catColor = const Color(0xFFC05A12);
                        if (cat == 'returnee') catColor = AppTheme.secondary;

                        return TableRow(
                          decoration: const BoxDecoration(
                            border: Border(bottom: BorderSide(color: AppTheme.border, width: 0.5)),
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Builder(
                                builder: (context) {
                                  final rawPhoto = r['photo_base64']?.toString() ?? '';
                                  final photoBase64 = _cleanPhotoBase64(rawPhoto.isEmpty ? _getPhotoBase64(r['circumstances']?.toString()) : rawPhoto);
                                  
                                  Uint8List? photoBytes;
                                  if (photoBase64.isNotEmpty) {
                                    try {
                                      photoBytes = base64Decode(photoBase64);
                                    } catch (e) {
                                      debugPrint('Failed to decode row photo: $e');
                                    }
                                  }

                                  return Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: AppTheme.muted,
                                      border: Border.all(color: AppTheme.border, width: 1),
                                    ),
                                    child: ClipOval(
                                      child: photoBytes != null
                                          ? Image.memory(
                                              photoBytes,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) => const Icon(LucideIcons.user300, size: 18, color: AppTheme.mutedForeground),
                                            )
                                          : const Icon(LucideIcons.user300, size: 18, color: AppTheme.mutedForeground),
                                    ),
                                  );
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(r['full_name'] ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 2),
                                  Text(r['reference'] ?? 'N/A', style: TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: catColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                                child: Text(cat.toUpperCase(), style: TextStyle(color: catColor, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ),
                            Padding(padding: const EdgeInsets.all(12.0), child: Text('${r['lga'] ?? 'LGA'}, ${r['state_origin'] ?? 'State'}', style: const TextStyle(fontSize: 12))),
                            Padding(padding: const EdgeInsets.all(12.0), child: Text(r['gender'] ?? 'N/A', style: const TextStyle(fontSize: 12))),
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Row(
                                children: [
                                  Icon(hasFace ? LucideIcons.smile300 : LucideIcons.x300, color: hasFace ? AppTheme.primary : AppTheme.destructive, size: 16),
                                  const SizedBox(width: 8),
                                  Icon(hasThumb ? LucideIcons.fingerprint300 : LucideIcons.x300, color: hasThumb ? AppTheme.primary : AppTheme.destructive, size: 16),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: IconButton(
                                icon: const Icon(LucideIcons.eye300, size: 16, color: AppTheme.primary),
                                onPressed: () => _showRegistrantDetailsDialog(r),
                                tooltip: 'View Detailed Profile',
                              ),
                            ),
                          ],
                        );
                      }),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
