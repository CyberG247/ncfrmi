import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class ReportsModule extends StatefulWidget {
  const ReportsModule({super.key});

  @override
  State<ReportsModule> createState() => _ReportsModuleState();
}

class _ReportsModuleState extends State<ReportsModule> {
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();
  String _format = 'PDF'; // PDF or CSV
  bool _isGenerating = false;
  double _generationProgress = 0.0;

  final List<Map<String, String>> _auditTrail = [
    {
      'title': 'Intake Audit Statement',
      'date': 'Jul 05, 2026',
      'user': 'commissioner@ncfrmi.gov.ng',
      'format': 'PDF',
      'status': 'Generated'
    },
    {
      'title': 'Borno Node Camps Audit',
      'date': 'Jul 02, 2026',
      'user': 'system-manager@ncfrmi.gov.ng',
      'format': 'CSV',
      'status': 'Generated'
    },
    {
      'title': 'Geopolitical Density Sync Report',
      'date': 'Jun 28, 2026',
      'user': 'commissioner@ncfrmi.gov.ng',
      'format': 'PDF',
      'status': 'Generated'
    },
  ];

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2025),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _generateReport() async {
    setState(() {
      _isGenerating = true;
      _generationProgress = 0.0;
    });

    // Simulate progress counting up
    for (int i = 0; i <= 10; i++) {
      await Future.delayed(const Duration(milliseconds: 200));
      if (mounted) {
        setState(() {
          _generationProgress = i / 10;
        });
      }
    }

    if (mounted) {
      setState(() {
        _isGenerating = false;
        _auditTrail.insert(0, {
          'title': 'Custom Period Intake Statement',
          'date': DateFormat('MMM dd, yyyy').format(DateTime.now()),
          'user': 'commissioner@ncfrmi.gov.ng',
          'format': _format,
          'status': 'Generated',
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Report generated successfully as $_format! Saved to documents folder.'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Audits & Reports Console',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.foreground),
          ),
          const SizedBox(height: 8),
          const Text(
            'Generate compiled registration logs, camp rosters, and audit trails for compliance reporting.',
            style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground),
          ),
          const SizedBox(height: 28),
          
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Panel: Generator Card
                Expanded(
                  flex: 3,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(28.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Request Statement Report',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
                          ),
                          const SizedBox(height: 24),
                          
                          // Start Date input
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Start Date', style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 8),
                                    InkWell(
                                      onTap: () => _selectDate(context, true),
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                        decoration: BoxDecoration(
                                          color: AppTheme.muted.withValues(alpha: 0.6),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(DateFormat('yyyy-MM-dd').format(_startDate), style: const TextStyle(fontSize: 14)),
                                            const Icon(LucideIcons.calendar300, size: 18, color: AppTheme.mutedForeground),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 20),
                              
                              // End Date input
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('End Date', style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 8),
                                    InkWell(
                                      onTap: () => _selectDate(context, false),
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                        decoration: BoxDecoration(
                                          color: AppTheme.muted.withValues(alpha: 0.6),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(DateFormat('yyyy-MM-dd').format(_endDate), style: const TextStyle(fontSize: 14)),
                                            const Icon(LucideIcons.calendar300, size: 18, color: AppTheme.mutedForeground),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          
                          // Format selector dropdown
                          const Text('Export Format', style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            initialValue: _format,
                            decoration: const InputDecoration(),
                            items: const [
                              DropdownMenuItem(value: 'PDF', child: Text('PDF Format Statement')),
                              DropdownMenuItem(value: 'CSV', child: Text('CSV Flat Database')),
                            ],
                            onChanged: (val) {
                              setState(() => _format = val!);
                            },
                          ),
                          const SizedBox(height: 36),
                          
                          if (_isGenerating) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: _generationProgress,
                                minHeight: 8,
                                color: AppTheme.primary,
                                backgroundColor: AppTheme.border,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Center(
                              child: Text(
                                'Compiling registry data and signing cryptographic stamp...',
                                style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
                              ),
                            ),
                          ] else
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: _generateReport,
                                icon: const Icon(LucideIcons.fileText300, size: 18),
                                label: const Text('Generate Statement Report', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 28),
                
                // Right Panel: Audit Logs list
                Expanded(
                  flex: 2,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Recent Statements & Audits',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.foreground),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Historical system audit logs',
                            style: TextStyle(fontSize: 12, color: AppTheme.mutedForeground),
                          ),
                          const Divider(height: 24),
                          
                          Expanded(
                            child: _auditTrail.isEmpty
                                ? const Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(LucideIcons.fileText300, size: 48, color: AppTheme.mutedForeground),
                                        SizedBox(height: 16),
                                        Text(
                                          'No statements generated yet.',
                                          style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.foreground),
                                        ),
                                        SizedBox(height: 8),
                                        Text(
                                          'Set parameters and click "Generate Statement Report" to create audit records.',
                                          style: TextStyle(color: AppTheme.mutedForeground, fontSize: 11),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  )
                                : ListView.separated(
                                    itemCount: _auditTrail.length,
                                    separatorBuilder: (context, index) => const Divider(height: 16),
                              itemBuilder: (context, index) {
                                final audit = _auditTrail[index];
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          audit['title']!,
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primary.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            audit['format']!,
                                            style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Generated by ${audit['user']} on ${audit['date']}',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.mutedForeground),
                                    ),
                                  ],
                                );
                              },
                            ),
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
}
