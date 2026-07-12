import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../theme.dart';

class MapNode {
  final String id;
  final String name;
  final String state;
  final double x; // percentage left (0.0 to 1.0)
  final double y; // percentage top (0.0 to 1.0)
  final Color color;
  final List<String> camps;
  final int registrants;
  final int refugees;
  final int idps;
  final int migrants;
  final String status;

  const MapNode({
    required this.id,
    required this.name,
    required this.state,
    required this.x,
    required this.y,
    required this.color,
    required this.camps,
    required this.registrants,
    required this.refugees,
    required this.idps,
    required this.migrants,
    required this.status,
  });
}

class GeopoliticalMapModule extends StatefulWidget {
  const GeopoliticalMapModule({super.key});

  @override
  State<GeopoliticalMapModule> createState() => _GeopoliticalMapModuleState();
}

class _GeopoliticalMapModuleState extends State<GeopoliticalMapModule> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  MapNode? _selectedNode;
  bool _isLoading = true;
  RealtimeChannel? _realtimeChannel;
  
  // Dynamic counts loaded from Supabase to merge with baseline
  int _dbRefugeesCount = 0;
  int _dbIdpsCount = 0;
  int _dbMigrantsCount = 0;

  final List<MapNode> _baseNodes = const [
    MapNode(
      id: "abuja",
      name: "Abu Camp Sector Node",
      state: "Abuja FCT",
      x: 0.435,
      y: 0.48,
      color: Color(0xFF10B981), // Emerald
      camps: ["Abuja Municipal Camp", "Kuje Camp Area"],
      registrants: 3200,
      refugees: 150,
      idps: 2900,
      migrants: 150,
      status: "Operational",
    ),
    MapNode(
      id: "borno",
      name: "Maiduguri Camp Node",
      state: "Borno State",
      x: 0.865,
      y: 0.20,
      color: Color(0xFFEF4444), // Red
      camps: ["Custom House Camp", "Muna Garage Camp", "Dalori Settlement"],
      registrants: 12450,
      refugees: 450,
      idps: 11800,
      migrants: 200,
      status: "High Density Operations",
    ),
    MapNode(
      id: "lagos",
      name: "Transit Exit Node",
      state: "Lagos State",
      x: 0.095,
      y: 0.78,
      color: Color(0xFF3B82F6), // Blue
      camps: ["Seme Border Transit Camp", "Badagry Depot"],
      registrants: 1520,
      refugees: 1200,
      idps: 50,
      migrants: 270,
      status: "Operational",
    ),
    MapNode(
      id: "benue",
      name: "Daudu Sector Node",
      state: "Benue State",
      x: 0.545,
      y: 0.635,
      color: Color(0xFFF59E0B), // Amber
      camps: ["Daudu Camp 1 & 2", "Gbajimba Camp"],
      registrants: 4120,
      refugees: 120,
      idps: 3800,
      migrants: 200,
      status: "Operational",
    ),
    MapNode(
      id: "edo",
      name: "Uhogua Camp Node",
      state: "Edo State",
      x: 0.285,
      y: 0.72,
      color: Color(0xFF06B6D4), // Cyan
      camps: ["Uhogua Camp"],
      registrants: 2150,
      refugees: 350,
      idps: 1700,
      migrants: 100,
      status: "Operational",
    ),
    MapNode(
      id: "cross_river",
      name: "Ogoja Border Sector",
      state: "Cross River State",
      x: 0.48,
      y: 0.785,
      color: Color(0xFF8B5CF6), // Violet
      camps: ["Adagom Refugee Settlement", "Okende Settlement"],
      registrants: 5820,
      refugees: 5200,
      idps: 300,
      migrants: 320,
      status: "Operational",
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _fetchDatabaseCounts();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    if (_realtimeChannel != null) {
      Supabase.instance.client.removeChannel(_realtimeChannel!);
    }
    super.dispose();
  }

  void _subscribeRealtime() {
    try {
      _realtimeChannel = Supabase.instance.client.channel('desktop-map-registrants').onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'registrants',
        callback: (payload) {
          debugPrint('Real-time map counts update received');
          if (mounted) {
            _fetchDatabaseCounts();
          }
        },
      );
      _realtimeChannel!.subscribe((status, [error]) {
        debugPrint('Realtime map channel status: $status, error: $error');
      });
    } catch (e) {
      debugPrint('Real-time map subscription error: $e');
    }

    // Periodic polling fallback
    Future.delayed(const Duration(seconds: 20), () {
      if (mounted) _fetchDatabaseCounts();
    });
  }

  Future<void> _fetchDatabaseCounts() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final response = await supabase.from('registrants').select('category');
      
      int refugees = 0;
      int idps = 0;
      int migrants = 0;

      for (var r in response) {
        final cat = r['category']?.toString().toLowerCase() ?? '';
        if (cat == 'refugee') refugees++;
        if (cat == 'idp') idps++;
        if (cat == 'migrant' || cat == 'returnee') migrants++;
      }

      if (mounted) {
        setState(() {
          _dbRefugeesCount = refugees;
          _dbIdpsCount = idps;
          _dbMigrantsCount = migrants;
          _selectedNode = _baseNodes.first; // Default selection
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _selectedNode = _baseNodes.first;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'National Geopolitical Registry & Camps Density Map',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.foreground),
          ),
          const SizedBox(height: 8),
          const Text(
            'Interactive dashboard of active refugee settlements, IDP camps, and border registry sector nodes.',
            style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground),
          ),
          const SizedBox(height: 28),
          
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column: Interactive Map Widget
                Expanded(
                  flex: 3,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Center(
                        child: AspectRatio(
                          aspectRatio: 1.47, // Matches cropped svg aspect ratio
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              return Stack(
                                children: [
                                  // Map Image
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.asset(
                                      'assets/images/nigeria-poverty-map.png',
                                      fit: BoxFit.cover,
                                      width: constraints.maxWidth,
                                      height: constraints.maxHeight,
                                    ),
                                  ),
                                  
                                  // Pulsing Nodes overlay
                                  ..._baseNodes.map((node) {
                                    final double left = constraints.maxWidth * node.x;
                                    final double top = constraints.maxHeight * node.y;
                                    final isSelected = _selectedNode?.id == node.id;
                                    
                                    return Positioned(
                                      left: left - 24,
                                      top: top - 24,
                                      child: GestureDetector(
                                        onTap: () {
                                          setState(() => _selectedNode = node);
                                        },
                                        child: MouseRegion(
                                          cursor: SystemMouseCursors.click,
                                          child: SizedBox(
                                            width: 48,
                                            height: 48,
                                            child: Stack(
                                              alignment: Alignment.center,
                                              children: [
                                                // Pulse ring
                                                AnimatedBuilder(
                                                  animation: _pulseController,
                                                  builder: (context, child) {
                                                    return Container(
                                                      width: 14 + (24 * _pulseController.value),
                                                      height: 14 + (24 * _pulseController.value),
                                                      decoration: BoxDecoration(
                                                        color: node.color.withValues(alpha: 1.0 - _pulseController.value),
                                                        shape: BoxShape.circle,
                                                      ),
                                                    );
                                                  },
                                                ),
                                                // Solid core dot
                                                Container(
                                                  width: 14,
                                                  height: 14,
                                                  decoration: BoxDecoration(
                                                    color: node.color,
                                                    shape: BoxShape.circle,
                                                    border: Border.all(color: Colors.white, width: 2),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: Colors.black.withValues(alpha: 0.2),
                                                        blurRadius: 4,
                                                        offset: const Offset(0, 2),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                if (isSelected)
                                                  Container(
                                                    width: 22,
                                                    height: 22,
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                      border: Border.all(color: node.color, width: 2),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 28),
                
                // Right Column: Zonal Details & Camps Inspector
                Expanded(
                  flex: 2,
                  child: _selectedNode == null
                      ? const Card(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.map300, size: 48, color: AppTheme.mutedForeground),
                                SizedBox(height: 16),
                                Text('Select a node on the map to inspect', style: TextStyle(color: AppTheme.mutedForeground)),
                              ],
                            ),
                          ),
                        )
                      : Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(color: _selectedNode!.color, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        _selectedNode!.name,
                                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.foreground),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _selectedNode!.state,
                                  style: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground),
                                ),
                                const Divider(height: 32),
                                
                                // Node Operational Status
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Operational Status:', style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _selectedNode!.status,
                                        style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                
                                // Camps Directory list
                                const Text(
                                  'CAMPS DIRECTORY IN NODE',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground, letterSpacing: 1.1),
                                ),
                                const SizedBox(height: 10),
                                Expanded(
                                  child: ListView.separated(
                                    itemCount: _selectedNode!.camps.length,
                                    separatorBuilder: (context, index) => const Divider(height: 16),
                                    itemBuilder: (context, index) {
                                      return Row(
                                        children: [
                                          const Icon(LucideIcons.home300, size: 16, color: AppTheme.primary),
                                          const SizedBox(width: 10),
                                          Text(
                                            _selectedNode!.camps[index],
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ),
                                const Divider(height: 32),
                                
                                // Intake Demographics breakdown
                                const Text(
                                  'REGISTRY VOLUME SPLIT',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground, letterSpacing: 1.1),
                                ),
                                const SizedBox(height: 16),
                                
                                // Merging DB counts to Borno node for realistic demo
                                _buildVolumeRow(
                                  'Refugees enrollees',
                                  _selectedNode!.id == 'borno' && _dbRefugeesCount > 0
                                      ? _selectedNode!.refugees + _dbRefugeesCount
                                      : _selectedNode!.refugees,
                                  AppTheme.primary,
                                ),
                                const SizedBox(height: 10),
                                _buildVolumeRow(
                                  'IDPs enrollees',
                                  _selectedNode!.id == 'borno' && _dbIdpsCount > 0
                                      ? _selectedNode!.idps + _dbIdpsCount
                                      : _selectedNode!.idps,
                                  AppTheme.primaryGlow,
                                ),
                                const SizedBox(height: 10),
                                _buildVolumeRow(
                                  'Migrants / Returnees',
                                  _selectedNode!.id == 'borno' && _dbMigrantsCount > 0
                                      ? _selectedNode!.migrants + _dbMigrantsCount
                                      : _selectedNode!.migrants,
                                  const Color(0xFFC05A12),
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
    );
  }

  Widget _buildVolumeRow(String label, int count, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.mutedForeground)),
          ],
        ),
        Text(
          '$count records',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.foreground),
        ),
      ],
    );
  }
}
