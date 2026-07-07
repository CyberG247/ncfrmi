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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Search Logs'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw300),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
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
                fillColor: AppTheme.muted.withValues(alpha: 0.5),
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
                                trailing: const Icon(LucideIcons.arrowRight300, size: 16),
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
                                trailing: const Icon(LucideIcons.arrowRight300, size: 16),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
