import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
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
  int _totalInterventions = 0;
  List<Map<String, dynamic>> _registrantsData = [];

  // Summary categories count
  int _refugeesCount = 0;
  int _idpsCount = 0;
  int _migrantsCount = 0;
  int _returneesCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final regResponse = await _supabase.from('registrants').select();
      final intResponse = await _supabase.from('interventions').select();
      
      final dataList = List<Map<String, dynamic>>.from(regResponse);
      int refugees = 0;
      int idps = 0;
      int migrants = 0;
      int returnees = 0;

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
      }

      if (mounted) {
        setState(() {
          _registrantsData = dataList;
          _totalRegistrants = dataList.length;
          _totalInterventions = (intResponse as List).length;
          _refugeesCount = refugees;
          _idpsCount = idps;
          _migrantsCount = migrants;
          _returneesCount = returnees;
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
        dialogTitle: 'Export Analytics to CSV',
        fileName: 'ncfrmi_analytics_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv',
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (outputFile != null) {
        List<List<dynamic>> rows = [];
        rows.add(['ID', 'Reference', 'Category', 'Full Name', 'State of Origin', 'LGA', 'Created At']);
        
        for (var item in _registrantsData) {
          rows.add([
            item['id'],
            item['reference'],
            item['category'],
            item['full_name'],
            item['state_origin'],
            item['lga'],
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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upper Row: Title and Export Action
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Main Layout Structure mimicking fitness mockup (Two Column Grid)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left Column (Analytics Graphs and Distributions)
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    // Card 1: Registrations Trend Line Chart
                    _buildTrendChartCard(),
                    const SizedBox(height: 24),
                    
                    // Row with Card 3 (Distribution) and Card 4 (Target Progress)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: _buildDistributionCard()),
                        const SizedBox(width: 24),
                        Expanded(child: _buildProgressCard()),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 28),

              // Right Column (Calendar and Activity Logs)
              Expanded(
                flex: 2,
                child: Column(
                  children: [
                    // Card 2: Operations Calendar Card (colors matching, structure mimicking)
                    _buildCalendarCard(),
                    const SizedBox(height: 24),

                    // Card 5: Recent Operations & Activities
                    _buildRecentActivitiesCard(),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Card 1: Registrations Trend Line Chart (mimicking mockup style)
  Widget _buildTrendChartCard() {
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
                  'Enrolment Trend',
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
                  gridData: const FlGridData(show: false),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (val, meta) {
                          const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
                        const FlSpot(0, 150),
                        const FlSpot(1, 240),
                        const FlSpot(2, 190),
                        const FlSpot(3, 310),
                        FlSpot(4, _totalRegistrants.toDouble() + 50),
                        FlSpot(5, _totalRegistrants.toDouble() + 100),
                      ],
                      isCurved: true,
                      color: AppTheme.primary,
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppTheme.primary.withValues(alpha: 0.1),
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

  // Card 2: Operations Calendar Card (mimicking fitness mockup active calendar layout)
  Widget _buildCalendarCard() {
    final now = DateTime.now();
    final formatter = DateFormat('MMMM yyyy');
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final firstDayOfWeek = DateTime(now.year, now.month, 1).weekday; // 1 = Monday

    return Card(
      color: AppTheme.primary,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Operations Calendar',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                Text(
                  formatter.format(now),
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Days of the week row
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _CalendarHeaderDay('M'),
                _CalendarHeaderDay('T'),
                _CalendarHeaderDay('W'),
                _CalendarHeaderDay('T'),
                _CalendarHeaderDay('F'),
                _CalendarHeaderDay('S'),
                _CalendarHeaderDay('S'),
              ],
            ),
            const SizedBox(height: 12),
            // Grid of calendar days
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: daysInMonth + (firstDayOfWeek - 1),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
              ),
              itemBuilder: (context, index) {
                if (index < firstDayOfWeek - 1) {
                  return const SizedBox.shrink();
                }
                final dayNum = index - (firstDayOfWeek - 2);
                final isToday = dayNum == now.day;
                // Highlight a few "active operations" days (e.g. multiples of 3 for demo)
                final isActiveOperation = dayNum % 3 == 0 || isToday;

                return Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isToday 
                        ? Colors.white 
                        : (isActiveOperation ? Colors.white.withValues(alpha: 0.15) : Colors.transparent),
                    shape: BoxShape.circle,
                    border: isActiveOperation && !isToday 
                        ? Border.all(color: Colors.white70, width: 1.5) 
                        : null,
                  ),
                  child: Text(
                    dayNum.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: (isToday || isActiveOperation) ? FontWeight.bold : FontWeight.normal,
                      color: isToday 
                          ? AppTheme.primary 
                          : (isActiveOperation ? Colors.white : Colors.white60),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // Card 3: Intake Distribution Pie Chart (mimicking sleep/fitness ring chart)
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
                      sections: [
                        PieChartSectionData(
                          value: _refugeesCount == 0 ? 1 : _refugeesCount.toDouble(),
                          color: AppTheme.primary,
                          radius: 12,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: _idpsCount == 0 ? 1 : _idpsCount.toDouble(),
                          color: AppTheme.primaryGlow,
                          radius: 12,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: _migrantsCount == 0 ? 1 : _migrantsCount.toDouble(),
                          color: const Color(0xFFC05A12),
                          radius: 12,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: _returneesCount == 0 ? 1 : _returneesCount.toDouble(),
                          color: AppTheme.secondary,
                          radius: 12,
                          showTitle: false,
                        ),
                      ],
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

  Widget _buildLegendRow(String title, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground)),
      ],
    );
  }

  // Card 4: Target Progress Card (mimicking progress bar layout in mockup)
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
                  'Cloud Sync Completed',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary.withValues(alpha: 0.8)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(LucideIcons.handshake300, color: AppTheme.primary, size: 16),
                const SizedBox(width: 6),
                Text(
                  'Active Interventions: $_totalInterventions logs',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Card 5: Recent Operations & Activities (mimicking fitness activities layout)
  Widget _buildRecentActivitiesCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent Operations Logs',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
            ),
            const SizedBox(height: 20),
            
            // Reusable activity cards (mimicking Gym, Running, Meditation)
            _buildActivityItem(
              title: 'Refugee Intake Enrolment',
              subtitle: 'Agent Portal • 09:30 AM',
              icon: LucideIcons.userPlus300,
              color: AppTheme.primary,
            ),
            const SizedBox(height: 16),
            _buildActivityItem(
              title: 'Camp Distribution Logged',
              subtitle: 'Command Center • 02:00 PM',
              icon: LucideIcons.truck300,
              color: const Color(0xFFC05A12),
            ),
            const SizedBox(height: 16),
            _buildActivityItem(
              title: 'Commissioners Audit Update',
              subtitle: 'System Manager • Yesterday',
              icon: LucideIcons.clipboardCheck300,
              color: AppTheme.secondary,
            ),
            const SizedBox(height: 24),

            // Card 6: Add Activity Widget (Dashed Border Card)
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Navigation link clicked — Redirecting to registration...')),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.5), width: 1.5, style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(10),
                  color: AppTheme.primary.withValues(alpha: 0.03),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.plus300, color: AppTheme.primary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Log New Operation Activity',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary),
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

  Widget _buildActivityItem({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.muted.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
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
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.foreground),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground),
                ),
              ],
            ),
          ),
          Icon(LucideIcons.arrowUpRight300, size: 14, color: AppTheme.mutedForeground.withValues(alpha: 0.6)),
        ],
      ),
    );
  }
}

class _CalendarHeaderDay extends StatelessWidget {
  final String label;
  const _CalendarHeaderDay(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white70),
      ),
    );
  }
}
