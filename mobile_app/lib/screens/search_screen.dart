import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List<Registrant> _allRegistrants = [];
  List<Intervention> _allInterventions = [];
  List<dynamic> _filteredResults = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final regs = await offlineService.getOfflineRegistrants();
    final ints = await offlineService.getOfflineInterventions();
    if (mounted) {
      setState(() {
        _allRegistrants = regs;
        _allInterventions = ints;
        _isLoading = false;
        _onSearchChanged();
      });
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() {
        _filteredResults = [..._allRegistrants, ..._allInterventions];
      });
      return;
    }

    final List<dynamic> results = [];
    
    for (final reg in _allRegistrants) {
      if (reg.fullName.toLowerCase().contains(query) ||
          reg.reference.toLowerCase().contains(query) ||
          reg.category.toLowerCase().contains(query) ||
          reg.nationality.toLowerCase().contains(query) ||
          reg.stateOrigin.toLowerCase().contains(query) ||
          reg.lga.toLowerCase().contains(query)) {
        results.add(reg);
      }
    }

    for (final inter in _allInterventions) {
      if (inter.category.toLowerCase().contains(query) ||
          inter.camp.toLowerCase().contains(query) ||
          inter.details.toLowerCase().contains(query)) {
        results.add(inter);
      }
    }

    setState(() {
      _filteredResults = results;
    });
  }

  void _showRegistrantDetails(Registrant r) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.82,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                    child: const Icon(LucideIcons.user300, color: AppTheme.primary, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Ref: ${r.reference}', style: const TextStyle(color: AppTheme.mutedForeground, fontSize: 13)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      r.category.toUpperCase(),
                      style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 32),
            
            // Details
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  _detailRow('Date of Birth', r.dob, LucideIcons.calendar300),
                  _detailRow('Gender', r.gender, LucideIcons.user300),
                  _detailRow('Nationality', r.nationality, LucideIcons.globe300),
                  _detailRow('State of Origin', r.stateOrigin, LucideIcons.map300),
                  _detailRow('LGA', r.lga, LucideIcons.mapPin300),
                  _detailRow('Phone Number', r.phone, LucideIcons.phone300),
                  _detailRow('Home Address', r.address, LucideIcons.home300),
                  _detailRow('Accompanying Dependants', r.dependants.toString(), LucideIcons.users300),
                  _detailRow('Special Circumstances', r.circumstances.isEmpty ? 'None specified' : r.circumstances, LucideIcons.info300),
                  
                  const SizedBox(height: 16),
                  const Text('Biometrics Captured', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _biometricStatus('Face Photo', r.faceCaptured),
                      const SizedBox(width: 16),
                      _biometricStatus('Thumbprint', r.thumbCaptured),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String val, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.mutedForeground),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.mutedForeground)),
                const SizedBox(height: 2),
                Text(val, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _biometricStatus(String label, bool isCaptured) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.border),
          borderRadius: BorderRadius.circular(12),
          color: isCaptured ? AppTheme.primary.withValues(alpha: 0.05) : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              isCaptured ? LucideIcons.checkCircle2300 : LucideIcons.xCircle300,
              color: isCaptured ? AppTheme.primary : AppTheme.destructive,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          // 1. Scrollable Content
          SafeArea(
            top: false,
            child: Column(
              children: [
                SizedBox(height: kToolbarHeight + topPadding + 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by name, category, reference, or camp...',
                      prefixIcon: const Icon(LucideIcons.search300, color: AppTheme.mutedForeground),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(LucideIcons.x300),
                              onPressed: () => _searchController.clear(),
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : _filteredResults.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(LucideIcons.search300, size: 48, color: AppTheme.mutedForeground.withValues(alpha: 0.5)),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'No matching logs found',
                                    style: TextStyle(color: AppTheme.mutedForeground, fontSize: 16),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              itemCount: _filteredResults.length,
                              itemBuilder: (context, index) {
                                final item = _filteredResults[index];
                                if (item is Registrant) {
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    child: ListTile(
                                      onTap: () => _showRegistrantDetails(item),
                                      leading: CircleAvatar(
                                        backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                                        child: const Icon(LucideIcons.user300, color: AppTheme.primary, size: 20),
                                      ),
                                      title: Text(
                                        item.fullName,
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      subtitle: Text(
                                        'Registrant (${item.category.toUpperCase()}) • Ref: ${item.reference}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      trailing: const Icon(LucideIcons.eye300, size: 18, color: AppTheme.primary),
                                    ),
                                  );
                                } else if (item is Intervention) {
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    child: ListTile(
                                      leading: CircleAvatar(
                                        backgroundColor: AppTheme.secondary.withValues(alpha: 0.1),
                                        child: const Icon(LucideIcons.handshake300, color: AppTheme.secondary, size: 20),
                                      ),
                                      title: Text(
                                        'Intervention: ${item.category}',
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      subtitle: Text(
                                        'Camp: ${item.camp} • Count: ${item.count}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  );
                                }
                                return const SizedBox.shrink();
                              },
                            ),
                ),
              ],
            ),
          ),
          
          // 2. Fixed Translucent Glassy Header
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
                        'Search Logs',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.foreground),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.refreshCw300, color: AppTheme.foreground),
                        onPressed: _loadData,
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
}
