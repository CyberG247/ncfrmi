import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';
import '../services/supabase_service.dart';
import 'capture_screen.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  List<Registrant> _registrants = [];
  List<Intervention> _interventions = [];
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadRecords();
    offlineService.addListener(_onOfflineServiceChanged);
  }

  @override
  void dispose() {
    offlineService.removeListener(_onOfflineServiceChanged);
    super.dispose();
  }

  void _onOfflineServiceChanged() {
    _loadRecords();
  }

  Future<void> _loadRecords() async {
    setState(() => _isLoading = true);
    final regs = await offlineService.getOfflineRegistrants();
    final ints = await offlineService.getOfflineInterventions();
    
    if (mounted) {
      setState(() {
        _registrants = regs;
        _interventions = ints;
        _isLoading = false;
      });
    }
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);
    final errorMsg = await supabaseSyncService.syncAll();
    
    if (mounted) {
      setState(() => _isSyncing = false);
      if (errorMsg == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sync completed successfully!')),
        );
        _loadRecords();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sync failed: $errorMsg'),
            backgroundColor: AppTheme.destructive,
            duration: const Duration(seconds: 6),
          ),
        );
      }
    }
  }

  void _editRegistrant(Registrant r) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CaptureScreen(
          editRegistrant: r,
        ),
      ),
    );
    if (result == true) {
      _loadRecords();
    }
  }

  void _confirmDeleteRegistrant(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete offline record?'),
        content: const Text('Are you sure you want to permanently delete this registrant from your offline queue? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final scaffoldMessenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              await offlineService.deleteRegistrant(id);
              _loadRecords();
              scaffoldMessenger.showSnackBar(const SnackBar(content: Text('Offline record deleted.')));
            },
            child: const Text('Delete', style: TextStyle(color: AppTheme.destructive)),
          ),
        ],
      ),
    );
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
                    backgroundImage: r.photoBase64 != null ? MemoryImage(base64Decode(r.photoBase64!.split(',').last)) : null,
                    child: r.photoBase64 == null ? const Icon(LucideIcons.user300, color: AppTheme.primary, size: 28) : null,
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
                  _detailRow('Special Circumstances', r.cleanCircumstances.isEmpty ? 'None specified' : r.cleanCircumstances, LucideIcons.info300),
                  
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
          // 1. Scrollable List Content
          SafeArea(
            top: false,
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : (_registrants.isEmpty && _interventions.isEmpty)
                    ? const Center(child: Text('No offline records.', style: TextStyle(color: AppTheme.mutedForeground)))
                    : ListView(
                        padding: EdgeInsets.only(
                          left: 16,
                          right: 16,
                          top: kToolbarHeight + topPadding + 16,
                          bottom: 96,
                        ),
                        children: [
                          if (_registrants.isNotEmpty) ...[
                            const Text('Registrants Pending Sync', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 8),
                            ..._registrants.map((r) => Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    onTap: () => _showRegistrantDetails(r),
                                    leading: CircleAvatar(
                                      backgroundColor: AppTheme.primary,
                                      backgroundImage: r.photoBase64 != null ? MemoryImage(base64Decode(r.photoBase64!.split(',').last)) : null,
                                      child: r.photoBase64 == null ? const Icon(LucideIcons.user300, color: Colors.white, size: 20) : null,
                                    ),
                                    title: Text(r.fullName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text('${r.category.toUpperCase()} • ${r.reference}'),
                                    trailing: PopupMenuButton<String>(
                                      icon: const Icon(LucideIcons.moreVertical300, color: AppTheme.mutedForeground, size: 20),
                                      onSelected: (value) {
                                        if (value == 'view') {
                                          _showRegistrantDetails(r);
                                        } else if (value == 'edit') {
                                          _editRegistrant(r);
                                        } else if (value == 'delete') {
                                          _confirmDeleteRegistrant(r.id);
                                        }
                                      },
                                      itemBuilder: (BuildContext context) => [
                                        const PopupMenuItem(
                                          value: 'view',
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.eye300, size: 16, color: AppTheme.primary),
                                              SizedBox(width: 8),
                                              Text('View Details'),
                                            ],
                                          ),
                                        ),
                                        const PopupMenuItem(
                                          value: 'edit',
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.pencil300, size: 16, color: AppTheme.primary),
                                              SizedBox(width: 8),
                                              Text('Edit Profile'),
                                            ],
                                          ),
                                        ),
                                        const PopupMenuItem(
                                          value: 'delete',
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.trash2300, size: 16, color: AppTheme.destructive),
                                              SizedBox(width: 8),
                                              Text('Delete Record', style: TextStyle(color: AppTheme.destructive)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )),
                            const SizedBox(height: 24),
                          ],
                          if (_interventions.isNotEmpty) ...[
                            const Text('Interventions Pending Sync', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 8),
                            ..._interventions.map((i) => Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    leading: const CircleAvatar(
                                      backgroundColor: AppTheme.secondary,
                                      child: Icon(LucideIcons.handshake300, color: Colors.white, size: 20),
                                    ),
                                    title: Text(i.category, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text('${i.camp} • Beneficiaries: ${i.count}'),
                                  ),
                                )),
                          ],
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
                        'Offline Records',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.foreground),
                      ),
                      Row(
                        children: [
                          if (_isSyncing)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16.0),
                                child: SizedBox(
                                  width: 20, height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            )
                          else
                            IconButton(
                              icon: const Icon(LucideIcons.refreshCw300, color: AppTheme.foreground),
                              tooltip: 'Sync Now',
                              onPressed: (_registrants.isEmpty && _interventions.isEmpty) ? null : _syncNow,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: (_registrants.isNotEmpty || _interventions.isNotEmpty) && !_isSyncing
          ? FloatingActionButton.extended(
              onPressed: _syncNow,
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(LucideIcons.cloudUpload300),
              label: const Text('Sync All'),
            )
          : null,
    );
  }
}
