import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
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
      
      if (mounted) {
        setState(() {
          _registrantsData = List<Map<String, dynamic>>.from(regResponse);
          _totalRegistrants = _registrantsData.length;
          _totalInterventions = (intResponse as List).length;
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
        // Headers
        rows.add(['ID', 'Reference', 'Category', 'State of Origin', 'Created At']);
        
        for (var item in _registrantsData) {
          rows.add([
            item['id'],
            item['reference'],
            item['category'],
            item['state_origin'],
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
      return const Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('System Analytics', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                onPressed: _exportData,
                icon: const Icon(Icons.download),
                label: const Text('Export CSV'),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: _buildSummaryCard('Total Registrants', _totalRegistrants.toString(), Icons.people, AppTheme.primary)),
              const SizedBox(width: 24),
              Expanded(child: _buildSummaryCard('Total Interventions', _totalInterventions.toString(), Icons.handshake, AppTheme.secondary)),
              const SizedBox(width: 24),
              Expanded(child: _buildSummaryCard('Active Camps', '12', Icons.place, AppTheme.accent)),
            ],
          ),
          const SizedBox(height: 32),
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Registrations Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                    Expanded(
                      child: BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: (_totalRegistrants > 10 ? _totalRegistrants.toDouble() : 10) * 1.2,
                          titlesData: FlTitlesData(
                            show: true,
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                getTitlesWidget: (value, meta) {
                                  const titles = ['Refugees', 'IDPs', 'Migrants', 'Returnees'];
                                  if (value.toInt() >= 0 && value.toInt() < titles.length) {
                                    return Padding(padding: const EdgeInsets.only(top: 8), child: Text(titles[value.toInt()]));
                                  }
                                  return const Text('');
                                },
                              ),
                            ),
                          ),
                          borderData: FlBorderData(show: false),
                          barGroups: [
                            BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: _totalRegistrants * 0.4, color: AppTheme.primary, width: 20, borderRadius: BorderRadius.circular(4))]),
                            BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: _totalRegistrants * 0.3, color: AppTheme.primaryGlow, width: 20, borderRadius: BorderRadius.circular(4))]),
                            BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: _totalRegistrants * 0.2, color: AppTheme.secondary, width: 20, borderRadius: BorderRadius.circular(4))]),
                            BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: _totalRegistrants * 0.1, color: AppTheme.accent, width: 20, borderRadius: BorderRadius.circular(4))]),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 32, color: color),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 14, color: AppTheme.mutedForeground)),
                  const SizedBox(height: 8),
                  Text(value, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
