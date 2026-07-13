import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:csv/csv.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';
import '../../utils/file_saver.dart';

class ContentManagementModule extends StatefulWidget {
  const ContentManagementModule({super.key});

  @override
  State<ContentManagementModule> createState() => _ContentManagementModuleState();
}

class _ContentManagementModuleState extends State<ContentManagementModule> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Website Config Current values
  String _currentLogoUrl = 'assets/images/ncfrmi-logo.png';
  String _currentFaviconUrl = 'favicon.ico';
  String _currentPrimaryColor = '#0B6E4F';
  String _currentSecondaryColor = '#4E342E';
  String _currentCommissionerName = 'Hon. Aliyu Tijani Ahmed';
  String _currentCommissionerPic = 'assets/images/commissioner.jpg';
  String _currentPortalName = 'NCFRMI Management Center';

  // Website Config Form Controllers
  final _logoUrlController = TextEditingController();
  final _faviconUrlController = TextEditingController();
  final _primaryColorController = TextEditingController();
  final _secondaryColorController = TextEditingController();
  final _commissionerNameController = TextEditingController();
  final _commissionerPicController = TextEditingController();
  final _portalNameController = TextEditingController();

  bool _isSavingConfig = false;
  bool _isDeploying = false;

  // Web Asset Change Audit log
  final List<Map<String, String>> _assetChanges = [
    {
      'id': 'a1',
      'asset': 'Favicon URL',
      'oldValue': 'default_favicon.ico',
      'newValue': 'favicon.ico',
      'date': '2026-07-06 14:20',
      'user': 'commissioner@ncfrmi.gov.ng',
      'status': 'Synced',
    },
    {
      'id': 'a2',
      'asset': 'Commissioner Bio Name',
      'oldValue': 'Hon. Aliyu Ahmed',
      'newValue': 'Hon. Aliyu Tijani Ahmed',
      'date': '2026-07-07 09:12',
      'user': 'commissioner@ncfrmi.gov.ng',
      'status': 'Synced',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Initialize controllers with current values
    _logoUrlController.text = _currentLogoUrl;
    _faviconUrlController.text = _currentFaviconUrl;
    _primaryColorController.text = _currentPrimaryColor;
    _secondaryColorController.text = _currentSecondaryColor;
    _commissionerNameController.text = _currentCommissionerName;
    _commissionerPicController.text = _currentCommissionerPic;
    _portalNameController.text = _currentPortalName;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _logoUrlController.dispose();
    _faviconUrlController.dispose();
    _primaryColorController.dispose();
    _secondaryColorController.dispose();
    _commissionerNameController.dispose();
    _commissionerPicController.dispose();
    _portalNameController.dispose();
    super.dispose();
  }

  Future<void> _saveWebsiteConfig() async {
    setState(() => _isSavingConfig = true);
    await Future.delayed(const Duration(milliseconds: 600));

    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'commissioner@ncfrmi.gov.ng';
    final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now());

    setState(() {
      // Check for changes and log them as Pending Deployment
      if (_portalNameController.text != _currentPortalName) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_1',
          'asset': 'Portal Title',
          'oldValue': _currentPortalName,
          'newValue': _portalNameController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_logoUrlController.text != _currentLogoUrl) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_2',
          'asset': 'Logo Path',
          'oldValue': _currentLogoUrl,
          'newValue': _logoUrlController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_faviconUrlController.text != _currentFaviconUrl) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_3',
          'asset': 'Favicon URL',
          'oldValue': _currentFaviconUrl,
          'newValue': _faviconUrlController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_primaryColorController.text != _currentPrimaryColor) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_4',
          'asset': 'Primary Color Hex',
          'oldValue': _currentPrimaryColor,
          'newValue': _primaryColorController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_secondaryColorController.text != _currentSecondaryColor) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_5',
          'asset': 'Secondary Color Hex',
          'oldValue': _currentSecondaryColor,
          'newValue': _secondaryColorController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_commissionerNameController.text != _currentCommissionerName) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_6',
          'asset': 'Commissioner Name',
          'oldValue': _currentCommissionerName,
          'newValue': _commissionerNameController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }
      if (_commissionerPicController.text != _currentCommissionerPic) {
        _assetChanges.insert(0, {
          'id': 'change_${DateTime.now().millisecondsSinceEpoch}_7',
          'asset': 'Commissioner Photo Path',
          'oldValue': _currentCommissionerPic,
          'newValue': _commissionerPicController.text,
          'date': dateStr,
          'user': email,
          'status': 'Pending Deployment',
        });
      }

      _isSavingConfig = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Configuration saved locally. Review and deploy changes in Asset Review Panel Tab.'),
          backgroundColor: AppTheme.primary,
        ),
      );
      _tabController.animateTo(0); // Switch to Asset Review tab
    }
  }

  void _resetWebsiteConfig() {
    setState(() {
      _logoUrlController.text = _currentLogoUrl;
      _faviconUrlController.text = _currentFaviconUrl;
      _primaryColorController.text = _currentPrimaryColor;
      _secondaryColorController.text = _currentSecondaryColor;
      _commissionerNameController.text = _currentCommissionerName;
      _commissionerPicController.text = _currentCommissionerPic;
      _portalNameController.text = _currentPortalName;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Form fields reset to current live configuration.')),
    );
  }

  Future<void> _deployAllPending() async {
    setState(() => _isDeploying = true);
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      for (var c in _assetChanges) {
        if (c['status'] == 'Pending Deployment') {
          c['status'] = 'Synced';
        }
      }
      // Apply the configurations to live
      _currentLogoUrl = _logoUrlController.text;
      _currentFaviconUrl = _faviconUrlController.text;
      _currentPrimaryColor = _primaryColorController.text;
      _currentSecondaryColor = _secondaryColorController.text;
      _currentCommissionerName = _commissionerNameController.text;
      _currentCommissionerPic = _commissionerPicController.text;
      _currentPortalName = _portalNameController.text;
      
      _isDeploying = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All pending website asset changes deployed to the live portal!'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  void _deployItem(int index) {
    setState(() {
      final item = _assetChanges[index];
      item['status'] = 'Synced';
      
      // Sync specific value
      final asset = item['asset'];
      final val = item['newValue']!;
      if (asset == 'Portal Title') _currentPortalName = val;
      if (asset == 'Logo Path') _currentLogoUrl = val;
      if (asset == 'Favicon URL') _currentFaviconUrl = val;
      if (asset == 'Primary Color Hex') _currentPrimaryColor = val;
      if (asset == 'Secondary Color Hex') _currentSecondaryColor = val;
      if (asset == 'Commissioner Name') _currentCommissionerName = val;
      if (asset == 'Commissioner Photo Path') _currentCommissionerPic = val;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Deployed change for ${(_assetChanges[index]['asset'])}!')),
    );
  }

  void _rollbackItem(int index) {
    setState(() {
      final item = _assetChanges[index];
      final asset = item['asset'];
      final oldVal = item['oldValue']!;
      
      // Rollback values in form fields
      if (asset == 'Portal Title') _portalNameController.text = oldVal;
      if (asset == 'Logo Path') _logoUrlController.text = oldVal;
      if (asset == 'Favicon URL') _faviconUrlController.text = oldVal;
      if (asset == 'Primary Color Hex') _primaryColorController.text = oldVal;
      if (asset == 'Secondary Color Hex') _secondaryColorController.text = oldVal;
      if (asset == 'Commissioner Name') _commissionerNameController.text = oldVal;
      if (asset == 'Commissioner Photo Path') _commissionerPicController.text = oldVal;

      _assetChanges.removeAt(index);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Config changes rolled back.')),
    );
  }

  Future<void> _exportChangeLog() async {
    if (_assetChanges.isEmpty) return;

    try {
      List<List<dynamic>> rows = [];
      rows.add(['ID', 'Asset Name', 'Previous Value', 'New Value', 'Date Changed', 'User', 'Status']);
      for (var c in _assetChanges) {
        rows.add([
          c['id'],
          c['asset'],
          c['oldValue'],
          c['newValue'],
          c['date'],
          c['user'],
          c['status']
        ]);
      }
      String csvString = csv.encode(rows);
      await saveBytesOrString(csvString, 'ncfrmi_web_assets_audit.csv');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Exported log successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e'), backgroundColor: AppTheme.destructive));
      }
    }
  }

  // Parses a hex string safely into a Flutter Color
  Color _parseColor(String hex, Color defaultColor) {
    try {
      final cleanHex = hex.trim().replaceAll('#', '');
      if (cleanHex.length == 6) {
        return Color(int.parse('FF$cleanHex', radix: 16));
      } else if (cleanHex.length == 8) {
        return Color(int.parse(cleanHex, radix: 16));
      }
    } catch (_) {}
    return defaultColor;
  }

  // Load preview images from network, asset, or file system with dynamic fallbacks
  Widget _buildPreviewImage(String path, {double? width, double? height, IconData fallbackIcon = LucideIcons.image300}) {
    final cleanPath = path.trim();
    if (cleanPath.isEmpty) {
      return Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground);
    }
    
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return Image.network(
        cleanPath,
        width: width,
        height: height,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground),
      );
    }
    
    if (cleanPath.startsWith('assets/')) {
      return Image.asset(
        cleanPath,
        width: width,
        height: height,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground),
      );
    }
    
    // File system path
    if (kIsWeb) {
      return Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground);
    }
    try {
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(
          file,
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground),
        );
      }
    } catch (_) {}

    return Icon(fallbackIcon, size: 24, color: AppTheme.mutedForeground);
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _assetChanges.where((c) => c['status'] == 'Pending Deployment').length;

    // Parse real-time user-entered colors for live preview swatches
    final primaryColorPreview = _parseColor(_primaryColorController.text, AppTheme.primary);
    final secondaryColorPreview = _parseColor(_secondaryColorController.text, AppTheme.secondary);

    return Padding(
      padding: const EdgeInsets.all(32.0),
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
                    'Content & Portal Management',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.foreground),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Remotely manage portal settings, logo assets, primary palettes, and leadership details.',
                    style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground),
                  ),
                ],
              ),
              TabBar(
                controller: _tabController,
                isScrollable: true,
                labelColor: AppTheme.primary,
                unselectedLabelColor: AppTheme.mutedForeground,
                indicatorColor: AppTheme.primary,
                tabs: const [
                  Tab(text: 'Web Asset Review Panel'),
                  Tab(text: 'Web Remote Settings'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 28),
          
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Web Asset Review Panel
                Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            if (pendingCount > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '$pendingCount PENDING DEPLOYMENTS',
                                  style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                        Row(
                          children: [
                            ElevatedButton.icon(
                              onPressed: _exportChangeLog,
                              icon: const Icon(LucideIcons.download300, size: 16),
                              label: const Text('Export Change Log'),
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
                            ),
                            if (pendingCount > 0) ...[
                              const SizedBox(width: 16),
                              _isDeploying
                                  ? const CircularProgressIndicator()
                                  : ElevatedButton.icon(
                                      onPressed: _deployAllPending,
                                      icon: const Icon(LucideIcons.cloudLightning300, size: 16),
                                      label: const Text('Deploy Pending Assets'),
                                    ),
                            ],
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Expanded(
                      child: Card(
                        child: _assetChanges.isEmpty
                            ? const Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(LucideIcons.shieldAlert300, size: 48, color: AppTheme.mutedForeground),
                                    SizedBox(height: 16),
                                    Text('No web assets logged in audit log.', style: TextStyle(color: AppTheme.mutedForeground)),
                                  ],
                                ),
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _assetChanges.length,
                                separatorBuilder: (context, index) => const Divider(),
                                itemBuilder: (context, index) {
                                  final change = _assetChanges[index];
                                  final isPending = change['status'] == 'Pending Deployment';

                                  return ListTile(
                                    leading: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: (isPending ? AppTheme.primary : AppTheme.secondary).withValues(alpha: 0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        isPending ? LucideIcons.cloudLightning300 : LucideIcons.checkCheck300,
                                        color: isPending ? AppTheme.primary : AppTheme.secondary,
                                        size: 18,
                                      ),
                                    ),
                                    title: Text(
                                      '${change['asset']} changed',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Text(
                                      'From: "${change['oldValue']}"  →  To: "${change['newValue']}"\nModified by ${change['user']} on ${change['date']}',
                                      style: const TextStyle(height: 1.4),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: (isPending ? AppTheme.primary : AppTheme.secondary).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            change['status']!.toUpperCase(),
                                            style: TextStyle(
                                              color: isPending ? AppTheme.primary : AppTheme.secondary,
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        if (isPending) ...[
                                          const SizedBox(width: 12),
                                          IconButton(
                                            icon: const Icon(LucideIcons.cloudUpload300, color: AppTheme.primary, size: 18),
                                            onPressed: () => _deployItem(index),
                                            tooltip: 'Deploy Change',
                                          ),
                                          IconButton(
                                            icon: const Icon(LucideIcons.undo300, color: AppTheme.destructive, size: 18),
                                            onPressed: () => _rollbackItem(index),
                                            tooltip: 'Rollback Change',
                                          ),
                                        ],
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                    ),
                  ],
                ),
                
                // Tab 2: Remote Web Config Editor
                SingleChildScrollView(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Form card
                      Expanded(
                        flex: 3,
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(28.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Website & Portal Identity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 20),
                                
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Portal Title / Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _portalNameController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 20),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Web Favicon URL', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _faviconUrlController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                
                                const Text('Logo URL / Path', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _logoUrlController,
                                  onChanged: (val) => setState(() {}),
                                ),
                                const SizedBox(height: 28),
                                
                                const Text('Leadership Profile Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 20),
                                
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Commissioner Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _commissionerNameController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 20),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Commissioner Photo Path', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _commissionerPicController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 28),
                                
                                const Text('Theme Color Palette', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 20),
                                
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Primary Color Hex', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _primaryColorController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 20),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Secondary Color Hex', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                          const SizedBox(height: 8),
                                          TextField(
                                            controller: _secondaryColorController,
                                            onChanged: (val) => setState(() {}),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 36),
                                
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton(
                                      onPressed: _resetWebsiteConfig,
                                      child: const Text('Reset Defaults'),
                                    ),
                                    const SizedBox(width: 16),
                                    _isSavingConfig
                                        ? const CircularProgressIndicator()
                                        : ElevatedButton(
                                            onPressed: _saveWebsiteConfig,
                                            child: const Text('Save Config Changes'),
                                          ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 28),
                      
                      // Preview panel card
                      Expanded(
                        flex: 2,
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Web Portal Live Preview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 6),
                                const Text('Real-time mock of the landing page configuration.', style: TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
                                const Divider(height: 24),
                                
                                // Mock Header (Live Logo, Favicon and Portal Name)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.muted.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      _buildPreviewImage(
                                        _logoUrlController.text,
                                        width: 22,
                                        height: 22,
                                        fallbackIcon: LucideIcons.image300,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _portalNameController.text,
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      _buildPreviewImage(
                                        _faviconUrlController.text,
                                        width: 14,
                                        height: 14,
                                        fallbackIcon: LucideIcons.globe300,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 20),
                                
                                // Commissioner Card Live Preview
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppTheme.border),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      ClipOval(
                                        child: Container(
                                          width: 72,
                                          height: 72,
                                          color: primaryColorPreview.withValues(alpha: 0.1),
                                          child: _buildPreviewImage(
                                            _commissionerPicController.text,
                                            width: 72,
                                            height: 72,
                                            fallbackIcon: LucideIcons.user300,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        _commissionerNameController.text,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        'Federal Commissioner / CEO',
                                        style: TextStyle(fontSize: 10, color: AppTheme.mutedForeground),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 20),
                                
                                // Colors preview
                                const Text('Theme Color Palette', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(color: primaryColorPreview, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text('Primary Color', style: TextStyle(fontSize: 11)),
                                    const Spacer(),
                                    Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(color: secondaryColorPreview, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text('Secondary Color', style: TextStyle(fontSize: 11)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
