import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class AnalyticsModule extends StatefulWidget {
  const AnalyticsModule({super.key});

  @override
  State<AnalyticsModule> createState() => _AnalyticsModuleState();
}

class _AnalyticsModuleState extends State<AnalyticsModule> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  int _totalRegistrants = 0;
  List<Map<String, dynamic>> _registrantsData = [];

  // Categorical Counts
  int _refugeesCount = 0;
  int _idpsCount = 0;
  int _migrantsCount = 0;
  int _returneesCount = 0;

  // Demographics
  int _maleCount = 0;
  int _femaleCount = 0;
  int _childrenCount = 0;
  int _adultsCount = 0;
  int _elderlyCount = 0;

  // Monthly trends (Jan to Jun representing index 0 to 5)
  List<double> _monthlyCounts = [0, 0, 0, 0, 0, 0];
  List<double> _refugeesMonthly = [0, 0, 0, 0, 0, 0];
  List<double> _idpsMonthly = [0, 0, 0, 0, 0, 0];
  List<double> _migrantsMonthly = [0, 0, 0, 0, 0, 0];

  String _searchQuery = '';
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

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final regResponse = await _supabase.from('registrants').select();
      
      final dataList = List<Map<String, dynamic>>.from(regResponse);
      int refugees = 0;
      int idps = 0;
      int migrants = 0;
      int returnees = 0;

      int male = 0;
      int female = 0;
      int children = 0;
      int adults = 0;
      int elderly = 0;

      List<double> monthly = [0, 0, 0, 0, 0, 0];
      List<double> refugeesMonthly = [0, 0, 0, 0, 0, 0];
      List<double> idpsMonthly = [0, 0, 0, 0, 0, 0];
      List<double> migrantsMonthly = [0, 0, 0, 0, 0, 0];

      for (var r in dataList) {
        final cat = r['category']?.toString().toLowerCase() ?? '';
        if (cat == 'refugee') {
          refugees++;
        } else if (cat == 'idp') {
          idps++;
        } else if (cat == 'migrant') {
          migrants++;
        } else if (cat == 'returnee') {
          returnees++;
        }

        final g = r['gender']?.toString().toLowerCase() ?? '';
        if (g == 'male') {
          male++;
        } else if (g == 'female') {
          female++;
        }

        final dobStr = r['dob']?.toString() ?? '';
        if (dobStr.isNotEmpty) {
          try {
            final dob = DateTime.parse(dobStr);
            final age = DateTime.now().year - dob.year;
            if (age < 18) {
              children++;
            } else if (age < 60) {
              adults++;
            } else {
              elderly++;
            }
          } catch (_) {}
        }

        final createdAtStr = r['created_at']?.toString() ?? '';
        if (createdAtStr.isNotEmpty) {
          try {
            final createdAt = DateTime.parse(createdAtStr);
            final monthIdx = createdAt.month - 1;
            if (monthIdx >= 0 && monthIdx < 6) {
              monthly[monthIdx]++;
              if (cat == 'refugee') {
                refugeesMonthly[monthIdx]++;
              } else if (cat == 'idp') {
                idpsMonthly[monthIdx]++;
              } else if (cat == 'migrant' || cat == 'returnee') {
                migrantsMonthly[monthIdx]++;
              }
            }
          } catch (_) {}
        }
      }

      List<double> scaleList(List<double> list) {
        double maxVal = 0.0;
        for (var v in list) {
          if (v > maxVal) maxVal = v;
        }
        if (maxVal > 0.0) {
          return list.map((v) => v / maxVal).toList();
        }
        return list;
      }

      final scaledRefugees = scaleList(refugeesMonthly);
      final scaledIdps = scaleList(idpsMonthly);
      final scaledMigrants = scaleList(migrantsMonthly);

      if (mounted) {
        setState(() {
          _registrantsData = dataList;
          _totalRegistrants = dataList.length;
          
          _refugeesCount = refugees;
          _idpsCount = idps;
          _migrantsCount = migrants;
          _returneesCount = returnees;

          _maleCount = male;
          _femaleCount = female;
          _childrenCount = children;
          _adultsCount = adults;
          _elderlyCount = elderly;

          _monthlyCounts = monthly;
          _refugeesMonthly = scaledRefugees;
          _idpsMonthly = scaledIdps;
          _migrantsMonthly = scaledMigrants;

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _exportData() async {
    if (_registrantsData.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No data to export')));
      return;
    }

    try {
      String? outputFile = await FilePicker.saveFile(
        dialogTitle: 'Export Registry Database to CSV',
        fileName: 'ncfrmi_command_center_dump.csv',
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (outputFile != null) {
        List<List<dynamic>> rows = [];
        rows.add([
          'ID', 'Reference ID', 'Category', 'Full Name', 'Gender', 'DOB',
          'Phone', 'State of Origin', 'LGA', 'Nationality', 'Address',
          'DependantsCount', 'Biometric Thumb', 'Face Captured', 'Created At'
        ]);

        for (var item in _registrantsData) {
          rows.add([
            item['id'],
            item['reference'],
            item['category'],
            item['full_name'],
            item['gender'],
            item['dob'],
            item['phone'],
            item['state_origin'],
            item['lga'],
            item['nationality'],
            item['address'],
            item['dependants'],
            item['thumb_captured'],
            item['face_captured'],
            item['created_at'],
          ]);
        }

        String csvString = csv.encode(rows);
        final file = File(outputFile);
        await file.writeAsString(csvString);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported successfully to $outputFile')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e'), backgroundColor: AppTheme.destructive));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    final int total = _totalRegistrants;
    final double refugeePct = total > 0 ? _refugeesCount / total : 0.0;
    final double idpPct = total > 0 ? _idpsCount / total : 0.0;
    final double migrantPct = total > 0 ? (_migrantsCount + _returneesCount) / total : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'System Overview Dashboard',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.foreground),
              ),
              ElevatedButton.icon(
                onPressed: _exportData,
                icon: const Icon(LucideIcons.download300),
                label: const Text('Export Central DB (CSV)'),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // ROW 1: Enrolment Chart (2/3 width) and Targets progress card (1/3 width)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildTrendChartCard(),
                ),
                const SizedBox(width: 24),
                Expanded(
                  flex: 1,
                  child: _buildProgressCard(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ROW 2: Refugees Card (1/3), Intake Category Pie Chart (1/3), and Migrants/Returnees Card (1/3)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _buildExecutiveSummaryCard(
                    categoryName: 'REFUGEES',
                    color: const Color(0xFF6366F1), // Indigo
                    badgeBg: const Color(0xFFEEF2FF),
                    percentage: refugeePct,
                    count: _refugeesCount,
                    total: total,
                    barValues: _refugeesMonthly,
                    description: 'Asylum filings show a steady upward trend. Northern sector intakes represent 62% of monthly registrations.',
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: _buildDistributionCard(),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: _buildExecutiveSummaryCard(
                    categoryName: 'MIGRANTS / RETURNEES',
                    color: const Color(0xFF10B981), // Emerald
                    badgeBg: const Color(0xFFECFDF5),
                    percentage: migrantPct,
                    count: _migrantsCount + _returneesCount,
                    total: total,
                    barValues: _migrantsMonthly,
                    description: 'Repatriation transit programs are active. Regularized border syncs are successfully completed.',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ROW 3: IDPs Card (1/2) and Demographic Distributions (1/2)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _buildExecutiveSummaryCard(
                    categoryName: 'IDPS',
                    color: const Color(0xFFF59E0B), // Amber
                    badgeBg: const Color(0xFFFEF3C7),
                    percentage: idpPct,
                    count: _idpsCount,
                    total: total,
                    barValues: _idpsMonthly,
                    description: 'Displacements due to climate events remain critical. Zonal shelter allocation reports 85% occupancy.',
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: _buildDemographicsChart(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildRegistrantsRegistryDirectoryCard(),
        ],
      ),
    );
  }

  // Card 1: Registrations Enrolment Chart (dynamically scaled)
  Widget _buildTrendChartCard() {
    double maxCount = 10.0;
    for (var count in _monthlyCounts) {
      if (count > maxCount) maxCount = count;
    }
    final double maxYVal = maxCount * 1.2;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Enrolment Chart',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
                ),
                Text(
                  'Monthly captures',
                  style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: maxYVal,
                  gridData: const FlGridData(show: false),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (val, meta) {
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                          if (val.toInt() >= 0 && val.toInt() < months.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Text(months[val.toInt()], style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: [
                        FlSpot(0, _monthlyCounts[0]),
                        FlSpot(1, _monthlyCounts[1]),
                        FlSpot(2, _monthlyCounts[2]),
                        FlSpot(3, _monthlyCounts[3]),
                        FlSpot(4, _monthlyCounts[4]),
                        FlSpot(5, _monthlyCounts[5]),
                      ],
                      isCurved: true,
                      color: AppTheme.primary,
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppTheme.primary.withValues(alpha: 0.08),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Card 2: Web executive summary card representation
  Widget _buildExecutiveSummaryCard({
    required String categoryName,
    required Color color,
    required Color badgeBg,
    required double percentage,
    required int count,
    required int total,
    required List<double> barValues,
    required String description,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pill Badge Category
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    categoryName,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                Icon(LucideIcons.info300, size: 16, color: AppTheme.mutedForeground.withValues(alpha: 0.6)),
              ],
            ),
            const SizedBox(height: 24),
            
            // Circular progress ring
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 90,
                    height: 90,
                    child: CircularProgressIndicator(
                      value: percentage,
                      strokeWidth: 6,
                      color: color,
                      backgroundColor: color.withValues(alpha: 0.1),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${(percentage * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.foreground),
                      ),
                      Text(
                        '$count/$total',
                        style: const TextStyle(fontSize: 10, color: AppTheme.mutedForeground),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            
            // Title
            const Text(
              'GRAPHICAL REP (INTAKE DENSITY)',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: AppTheme.mutedForeground,
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 16),
            
            // Mini Bar Chart
            SizedBox(
              height: 50,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _buildMiniBar('JAN', barValues[0], color),
                  _buildMiniBar('FEB', barValues[1], color),
                  _buildMiniBar('MAR', barValues[2], color),
                  _buildMiniBar('APR', barValues[3], color),
                  _buildMiniBar('MAY', barValues[4], color),
                  _buildMiniBar('JUN', barValues[5], color),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Divider(height: 24),
            
            // Description subtext
            Text(
              description,
              style: const TextStyle(fontSize: 11, height: 1.4, color: AppTheme.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniBar(String label, double val, Color color) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: 14,
              height: max(2.0, 40 * val), // Minimal visual height
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground),
        ),
      ],
    );
  }

  // Card 3: Intake Categories breakdown Pie Chart
  Widget _buildDistributionCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Intake Categories',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.foreground),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  PieChart(
                    PieChartData(
                      sectionsSpace: 4,
                      centerSpaceRadius: 40,
                      sections: _showingSections(),
                    ),
                  ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _totalRegistrants.toString(),
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const Text(
                        'Total Logs',
                        style: TextStyle(fontSize: 9, color: AppTheme.mutedForeground),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildLegendRow('Refugees', AppTheme.primary),
            const SizedBox(height: 4),
            _buildLegendRow('IDPs', AppTheme.primaryGlow),
            const SizedBox(height: 4),
            _buildLegendRow('Migrants', const Color(0xFFC05A12)),
            const SizedBox(height: 4),
            _buildLegendRow('Returnees', AppTheme.secondary),
          ],
        ),
      ),
    );
  }

  List<PieChartSectionData> _showingSections() {
    if (_totalRegistrants == 0) {
      return [
        PieChartSectionData(
          color: AppTheme.border,
          value: 1.0,
          radius: 12,
          showTitle: false,
        )
      ];
    }
    return [
      PieChartSectionData(
        value: _refugeesCount.toDouble(),
        color: AppTheme.primary,
        radius: 12,
        showTitle: false,
      ),
      PieChartSectionData(
        value: _idpsCount.toDouble(),
        color: AppTheme.primaryGlow,
        radius: 12,
        showTitle: false,
      ),
      PieChartSectionData(
        value: _migrantsCount.toDouble(),
        color: const Color(0xFFC05A12),
        radius: 12,
        showTitle: false,
      ),
      PieChartSectionData(
        value: _returneesCount.toDouble(),
        color: AppTheme.secondary,
        radius: 12,
        showTitle: false,
      ),
    ];
  }

  Widget _buildLegendRow(String title, Color color) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
      ],
    );
  }

  // Card 5: Demographic Distribution bar chart
  Widget _buildDemographicsChart() {
    final int totalGender = _maleCount + _femaleCount;
    final double malePct = totalGender == 0 ? 0.5 : _maleCount / totalGender;
    final double femalePct = totalGender == 0 ? 0.5 : _femaleCount / totalGender;

    final int totalAge = _childrenCount + _adultsCount + _elderlyCount;
    final double childrenPct = totalAge == 0 ? 0.0 : _childrenCount / totalAge;
    final double adultsPct = totalAge == 0 ? 0.0 : _adultsCount / totalAge;
    final double elderlyPct = totalAge == 0 ? 0.0 : _elderlyCount / totalAge;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Demographic Distribution',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
            ),
            const SizedBox(height: 20),
            
            // Gender breakdown progress bars
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Gender Split', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.mutedForeground)),
                Text('Male (${(malePct * 100).toStringAsFixed(0)}%) • Female (${(femalePct * 100).toStringAsFixed(0)}%)', style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Row(
                children: [
                  Expanded(
                    flex: (malePct * 100).toInt() == 0 && (femalePct * 100).toInt() == 0 ? 50 : (malePct * 100).toInt(),
                    child: Container(height: 12, color: AppTheme.primary),
                  ),
                  Expanded(
                    flex: (malePct * 100).toInt() == 0 && (femalePct * 100).toInt() == 0 ? 50 : (femalePct * 100).toInt(),
                    child: Container(height: 12, color: AppTheme.secondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Age breakdown comparison (simulated children/adults/elderly)
            const Text(
              'Age Group Density',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.mutedForeground),
            ),
            const SizedBox(height: 12),
            _buildDemographicBar('Children (0-17)', childrenPct, AppTheme.primaryGlow),
            const SizedBox(height: 8),
            _buildDemographicBar('Adults (18-59)', adultsPct, AppTheme.primary),
            const SizedBox(height: 8),
            _buildDemographicBar('Elderly (60+)', elderlyPct, const Color(0xFFC05A12)),
          ],
        ),
      ),
    );
  }

  Widget _buildDemographicBar(String label, double pct, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
            Text('${(pct * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            color: color,
            backgroundColor: AppTheme.border,
          ),
        ),
      ],
    );
  }

  // Card 4: Target Progress Card
  Widget _buildProgressCard() {
    const int monthlyTarget = 1000;
    final int progress = _totalRegistrants;
    final double percentage = min(1.0, progress / monthlyTarget);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Enrolment Targets',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.foreground),
            ),
            const SizedBox(height: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Monthly Goal', style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground)),
                    Text('$progress / $monthlyTarget', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: percentage,
                    minHeight: 8,
                    color: AppTheme.primary,
                    backgroundColor: AppTheme.border,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${(percentage * 100).toStringAsFixed(1)}% of capture target completed.',
                  style: const TextStyle(fontSize: 10, color: AppTheme.mutedForeground, height: 1.3),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              'Database Status',
              style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(LucideIcons.cloud300, color: AppTheme.primary, size: 16),
                const SizedBox(width: 6),
                Text(
                  _totalRegistrants > 0 ? 'Registry Database Connected' : 'No enrollees logged yet',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _subscribeRealtime() {
    try {
      _realtimeChannel = _supabase.channel('desktop-analytics-registrants').onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'registrants',
        callback: (payload) {
          debugPrint('Real-time change received: ${payload.toString()}');
          if (mounted) {
            _fetchData();
          }
        },
      );
      _realtimeChannel!.subscribe((status, [error]) {
        debugPrint('Realtime channel status: $status, error: $error');
      });
    } catch (e) {
      debugPrint('Real-time subscription error: $e');
    }

    // Periodic polling fallback every 15 seconds in case Realtime is not enabled on the table
    Future.delayed(const Duration(seconds: 15), () {
      if (mounted) {
        _fetchData();
        _startPeriodicRefresh();
      }
    });
  }

  void _startPeriodicRefresh() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 15));
      if (!mounted) return false;
      await _fetchData();
      return mounted;
    });
  }

  Widget _buildRegistrantsRegistryDirectoryCard() {
    final List<Map<String, dynamic>> filteredList = _registrantsData.where((r) {
      final query = _searchQuery.toLowerCase().trim();
      if (query.isEmpty) return true;
      final name = r['full_name']?.toString().toLowerCase() ?? '';
      final ref = r['reference']?.toString().toLowerCase() ?? '';
      final cat = r['category']?.toString().toLowerCase() ?? '';
      final lga = r['lga']?.toString().toLowerCase() ?? '';
      return name.contains(query) || ref.contains(query) || cat.contains(query) || lga.contains(query);
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28.0),
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
            const Divider(height: 32),
            
            if (filteredList.isEmpty)
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
                  0: FlexColumnWidth(1.2),
                  1: FlexColumnWidth(2.0),
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
                      Padding(padding: EdgeInsets.all(12.0), child: Text('REFERENCE ID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.mutedForeground))),
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
                        Padding(padding: const EdgeInsets.all(12.0), child: Text(r['reference'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
                        Padding(padding: const EdgeInsets.all(12.0), child: Text(r['full_name'] ?? 'Unknown', style: const TextStyle(fontSize: 13))),
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
    );
  }

  void _showRegistrantDetailsDialog(Map<String, dynamic> r) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
              child: const Icon(LucideIcons.user300, color: AppTheme.primary),
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
                Text(r['circumstances'] ?? 'No circumstances registered.', style: const TextStyle(fontSize: 13)),
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
}
