import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:math';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Wizard state for Registration
  int _wizardStep = 0; // 0: Category, 1: Biodata, 2: Education & Needs, 3: Face Capture, 4: Thumbprint, 5: Review
  final _regFormKey1 = GlobalKey<FormState>();
  final _regFormKey2 = GlobalKey<FormState>();

  // Data fields
  String _category = 'idp'; // refugee, idp, migrant, returnee
  String _fullName = '';
  String _reference = '';
  String _address = '';
  String _stateOrigin = '';
  String _lga = '';
  String? _selectedState;
  String? _selectedLga;

  final List<String> _states = const [
    'Abuja FCT', 'Adamawa', 'Borno', 'Kano', 'Lagos', 'Yobe',
    'Abia', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Katsina', 'Kebbi', 'Kogi', 
    'Kwara', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Zamfara'
  ];

  final Map<String, List<String>> _statesAndLgas = const {
    'Abuja FCT': ['Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji'],
    'Adamawa': ['Yola North', 'Yola South', 'Mubi North', 'Mubi South', 'Girei', 'Numan', 'Michika', 'Madagali'],
    'Borno': ['Maiduguri', 'Jere', 'Gwoza', 'Bama', 'Monguno', 'Chibok', 'Konduga', 'Kaga', 'Damboa', 'Dikwa'],
    'Kano': ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Nassarawa', 'Tarauni', 'Ungogo', 'Kumbotso'],
    'Lagos': ['Ikeja', 'Lagos Island', 'Eti-Osa', 'Alimosho', 'Surulere', 'Apapa', 'Yaba', 'Badagry', 'Epe'],
    'Yobe': ['Damaturu', 'Bade', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Jakusko', 'Potiskum'],
  };

  List<String> _getLgasForState(String state) {
    return _statesAndLgas[state] ?? ['Local Area 1', 'Local Area 2', 'Local Area 3'];
  }

  String _phone = '';
  String _dob = '';
  final _dobController = TextEditingController();
  String _gender = 'Male';
  String _nationality = 'Nigeria';
  int _dependants = 0;
  
  // Custom Web-Matched fields (merged into circumstances in Supabase)
  String _educationLevel = 'none'; // none, primary, secondary, tertiary, vocational
  String _skills = '';
  String _reason = '';
  String _needsDetails = '';
  final List<String> _selectedNeeds = [];
  final List<String> _needsOptions = ['Food', 'Medical', 'Shelter', 'Education', 'Financial', 'Counseling'];

  // Biometric states
  bool _faceCaptured = false;
  bool _livenessVerifying = false;
  bool _livenessVerified = false;
  double _livenessProgress = 0.0;

  bool _thumbCaptured = false;
  bool _thumbScanning = false;
  double _thumbProgress = 0.0;
  String _scannedThumb = ''; // 'Left' or 'Right'

  // Intervention Form fields
  final _intFormKey = GlobalKey<FormState>();
  String _intCamp = '';
  String _intCategory = 'Food';
  String _intDetails = '';
  int _intCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _dobController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _generateReference(String category) {
    final year = DateTime.now().year;
    final rand = Random().nextInt(1000000).toString().padLeft(6, '0');
    final prefix = category == 'returnee' ? 'RET' : (category == 'refugee' ? 'REF' : (category == 'migrant' ? 'MIG' : 'IDP'));
    setState(() {
      _reference = 'NCF-$prefix-$year-$rand';
    });
  }

  void _resetWizard() {
    setState(() {
      _wizardStep = 0;
      _fullName = '';
      _address = '';
      _phone = '';
      _dob = '';
      _dobController.clear();
      _gender = 'Male';
      _nationality = 'Nigeria';
      _stateOrigin = '';
      _lga = '';
      _selectedState = null;
      _selectedLga = null;
      _dependants = 0;
      _educationLevel = 'none';
      _skills = '';
      _reason = '';
      _needsDetails = '';
      _selectedNeeds.clear();
      _faceCaptured = false;
      _livenessVerifying = false;
      _livenessVerified = false;
      _livenessProgress = 0.0;
      _thumbCaptured = false;
      _thumbScanning = false;
      _thumbProgress = 0.0;
      _scannedThumb = '';
    });
  }

  void _runLivenessCheck() async {
    setState(() {
      _livenessVerifying = true;
      _livenessProgress = 0.0;
    });
    for (int i = 1; i <= 20; i++) {
      await Future.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
      setState(() {
        _livenessProgress = i / 20.0;
      });
    }
    setState(() {
      _livenessVerifying = false;
      _livenessVerified = true;
      _faceCaptured = true;
    });
  }

  void _runThumbprintScan(String hand) async {
    setState(() {
      _thumbScanning = true;
      _thumbProgress = 0.0;
      _scannedThumb = hand;
    });
    for (int i = 1; i <= 20; i++) {
      await Future.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
      setState(() {
        _thumbProgress = i / 20.0;
      });
    }
    setState(() {
      _thumbScanning = false;
      _thumbCaptured = true;
    });
  }

  void _submitRegistrant() async {
    final user = Supabase.instance.client.auth.currentUser;
    
    // Merge the custom form fields into circumstances to match the Supabase schema and web app
    final circumstancesMerged = '''
CAUSE OF DISPLACEMENT:
$_reason

EDUCATION BACKGROUND:
- Level: $_educationLevel
- Skills/Specialization: ${_skills.isEmpty ? "None" : _skills}

NEEDS ASSESSMENT:
- Immediate Needs: ${_selectedNeeds.join(", ").isEmpty ? "None" : _selectedNeeds.join(", ")}
- Details: $_needsDetails
''';

    final registrant = Registrant(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      reference: _reference,
      category: _category,
      fullName: _fullName,
      address: _address,
      phone: _phone,
      dob: _dob,
      gender: _gender,
      nationality: _nationality,
      stateOrigin: _stateOrigin,
      lga: _lga,
      dependants: _dependants,
      circumstances: circumstancesMerged,
      faceCaptured: _faceCaptured,
      thumbCaptured: _thumbCaptured,
      capturedBy: user?.id,
      createdAt: DateTime.now().toIso8601String(),
    );

    await offlineService.saveRegistrant(registrant);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registrant record successfully saved offline!'))
      );
      _resetWizard();
    }
  }

  void _submitIntervention() async {
    if (_intFormKey.currentState!.validate()) {
      _intFormKey.currentState!.save();
      final user = Supabase.instance.client.auth.currentUser;
      
      final intervention = Intervention(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        camp: _intCamp,
        category: _intCategory,
        details: _intDetails,
        count: _intCount,
        capturedBy: user?.id,
        createdAt: DateTime.now().toIso8601String(),
      );

      await offlineService.saveIntervention(intervention);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Intervention log successfully saved offline!'))
        );
        _intFormKey.currentState!.reset();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enrolment Terminal'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.mutedForeground,
          indicatorColor: AppTheme.primary,
          tabs: const [
            Tab(text: 'Registrations'),
            Tab(text: 'Interventions'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRegistrantWizard(),
          _buildInterventionForm(),
        ],
      ),
    );
  }

  // MARK: - Registrant Wizard Builder
  Widget _buildRegistrantWizard() {
    switch (_wizardStep) {
      case 0:
        return _buildStepCategory();
      case 1:
        return _buildStepBiodata();
      case 2:
        return _buildStepEducationAndNeeds();
      case 3:
        return _buildStepFaceCapture();
      case 4:
        return _buildStepThumbprint();
      case 5:
        return _buildStepReview();
      default:
        return _buildStepCategory();
    }
  }

  // Step 0: Category Selection Cards
  Widget _buildStepCategory() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SELECT INTAKE TYPE',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground, letterSpacing: 1.5),
          ),
          const SizedBox(height: 8),
          const Text(
            'Choose Enrolment Category',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 24),
          _buildCategoryCard(
            category: 'refugee',
            title: 'Refugees',
            division: 'Protection Division',
            desc: 'Enrol asylum seekers and certified refugees. Capture origin files and migration circumstances.',
            icon: Icons.language,
            color: AppTheme.primary,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'idp',
            title: 'IDPs',
            division: 'Camp Enrolment',
            desc: 'Register Internally Displaced Persons. Track shelter coordinates, camp assignments, and dependants.',
            icon: Icons.home,
            color: AppTheme.accent,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'migrant',
            title: 'Migrants',
            division: 'Transit and Exit',
            desc: 'Enrol regularized migrants or returnee enrolees. Track border transit and reintegration records.',
            icon: Icons.flight_takeoff,
            color: Colors.amber[800]!,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'returnee',
            title: 'Returnees',
            division: 'Repatriation & Reintegration',
            desc: 'Register citizens repatriated from transit borders. Track returnee details and distribution assets.',
            icon: Icons.assignment_return,
            color: AppTheme.secondary,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard({
    required String category,
    required String title,
    required String division,
    required String desc,
    required IconData icon,
    required Color color,
  }) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _category = category;
          _generateReference(category);
          _wizardStep = 1;
        });
      },
      child: Card(
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                          child: Text(division, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.mutedForeground),
                ],
              ),
              const SizedBox(height: 16),
              Text(desc, style: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground, height: 1.4)),
            ],
          ),
        ),
      ),
    );
  }

  // Step 1: Biodata Form
  Widget _buildStepBiodata() {
    return Form(
      key: _regFormKey1,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step 1 of 5: Biodata'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
              TextButton(onPressed: _resetWizard, child: const Text('Cancel')),
            ],
          ),
          const SizedBox(height: 8),
          Text('Personal Information (${_category.toUpperCase()})', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 24),
          
          TextFormField(
            key: ValueKey(_reference),
            initialValue: _reference,
            readOnly: true,
            decoration: const InputDecoration(labelText: 'Reference Number (Generated)'),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Full Legal Name *'),
            validator: (val) => val!.isEmpty ? 'Full legal name is required' : null,
            onSaved: (val) => _fullName = val!,
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Phone Number *',
              hintText: 'e.g. 08012345678',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ],
            validator: (val) {
              if (val == null || val.isEmpty) return 'Phone number is required';
              if (val.length != 11) return 'Phone number must be exactly 11 digits';
              return null;
            },
            onSaved: (val) => _phone = val!,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _dobController,
            readOnly: true,
            decoration: const InputDecoration(
              labelText: 'Date of Birth *',
              hintText: 'Tap to select date',
              suffixIcon: Icon(Icons.calendar_today),
            ),
            validator: (val) => val!.isEmpty ? 'Date of birth is required' : null,
            onTap: () async {
              DateTime? pickedDate = await showDatePicker(
                context: context,
                initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
              );
              if (pickedDate != null) {
                String formattedDate = "${pickedDate.year}-${pickedDate.month.toString().padLeft(2, '0')}-${pickedDate.day.toString().padLeft(2, '0')}";
                setState(() {
                  _dobController.text = formattedDate;
                  _dob = formattedDate;
                });
              }
            },
            onSaved: (val) => _dob = val!,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _gender,
            decoration: const InputDecoration(labelText: 'Gender *'),
            items: const [
              DropdownMenuItem(value: 'Male', child: Text('Male')),
              DropdownMenuItem(value: 'Female', child: Text('Female')),
              DropdownMenuItem(value: 'Other', child: Text('Other')),
            ],
            onChanged: (val) => setState(() => _gender = val!),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Nationality *'),
            initialValue: _nationality,
            validator: (val) => val!.isEmpty ? 'Nationality is required' : null,
            onSaved: (val) => _nationality = val!,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedState,
            decoration: const InputDecoration(labelText: 'State of Origin *'),
            items: _states.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (val) {
              setState(() {
                _selectedState = val;
                _selectedLga = null;
                _stateOrigin = val ?? '';
                _lga = '';
              });
            },
            validator: (val) => val == null ? 'State of origin is required' : null,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedLga,
            decoration: const InputDecoration(labelText: 'LGA *'),
            items: _selectedState == null
                ? []
                : _getLgasForState(_selectedState!).map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
            onChanged: _selectedState == null ? null : (val) {
              setState(() {
                _selectedLga = val;
                _lga = val ?? '';
              });
            },
            validator: (val) => val == null ? 'LGA is required' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Current Address / Shelter *'),
            maxLines: 2,
            validator: (val) => val!.isEmpty ? 'Address / shelter is required' : null,
            onSaved: (val) => _address = val!,
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Number of Accompanying Dependants'),
            keyboardType: TextInputType.number,
            initialValue: '0',
            onSaved: (val) => _dependants = int.tryParse(val ?? '0') ?? 0,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              if (_regFormKey1.currentState!.validate()) {
                _regFormKey1.currentState!.save();
                setState(() => _wizardStep = 2);
              }
            },
            child: const Text('Proceed to Education & Needs'),
          ),
        ],
      ),
    );
  }

  // Step 2: Education & Needs Form
  Widget _buildStepEducationAndNeeds() {
    return Form(
      key: _regFormKey2,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step 2 of 5: Education & Needs'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
              TextButton(onPressed: () => setState(() => _wizardStep = 1), child: const Text('Back')),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Profile & Displacement Details', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 24),
          
          DropdownButtonFormField<String>(
            initialValue: _educationLevel,
            decoration: const InputDecoration(labelText: 'Highest Level of Education Completed *'),
            items: const [
              DropdownMenuItem(value: 'none', child: Text('No Formal Education')),
              DropdownMenuItem(value: 'primary', child: Text('Primary Education')),
              DropdownMenuItem(value: 'secondary', child: Text('Secondary Education')),
              DropdownMenuItem(value: 'tertiary', child: Text('Tertiary / University Degree')),
              DropdownMenuItem(value: 'vocational', child: Text('Vocational / Technical training')),
            ],
            onChanged: (val) => setState(() => _educationLevel = val!),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Specialized Skills / Trade / Talents'),
            onSaved: (val) => _skills = val ?? '',
          ),
          const SizedBox(height: 24),
          const Text('Immediate Assistance Needs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _needsOptions.map((need) {
              final isSelected = _selectedNeeds.contains(need);
              return FilterChip(
                label: Text(need),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedNeeds.add(need);
                    } else {
                      _selectedNeeds.remove(need);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Specific Needs Details'),
            maxLines: 2,
            onSaved: (val) => _needsDetails = val ?? '',
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Circumstances & Causes of Displacement *',
              hintText: 'Detail the events that caused displacement (minimum 20 characters)...',
            ),
            maxLines: 4,
            validator: (val) {
              if (val == null || val.isEmpty) return 'Reason is required';
              if (val.length < 20) return 'Please describe in at least 20 characters';
              return null;
            },
            onSaved: (val) => _reason = val!,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              if (_regFormKey2.currentState!.validate()) {
                _regFormKey2.currentState!.save();
                setState(() => _wizardStep = 3);
              }
            },
            child: const Text('Proceed to Face Capture'),
          ),
        ],
      ),
    );
  }

  // Step 3: Facial Enrolment (Simulation)
  Widget _buildStepFaceCapture() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step 3 of 5: Facial Biometrics'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
              TextButton(onPressed: () => setState(() => _wizardStep = 2), child: const Text('Back')),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Facial Recognition Scanner', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 32),
          
          Expanded(
            child: Center(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _livenessVerified 
                      ? AppTheme.primary 
                      : (_livenessVerifying ? AppTheme.primaryGlow : AppTheme.border), 
                    width: 4
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_livenessVerified)
                      const Icon(Icons.check_circle, size: 80, color: AppTheme.primary)
                    else if (_livenessVerifying)
                      const Icon(Icons.face, size: 100, color: AppTheme.primaryGlow)
                    else
                      const Icon(Icons.face_retouching_natural, size: 100, color: AppTheme.mutedForeground),
                    
                    if (_livenessVerifying)
                      Positioned(
                        bottom: 40,
                        left: 40,
                        right: 40,
                        child: LinearProgressIndicator(
                          value: _livenessProgress,
                          color: AppTheme.primary,
                          backgroundColor: AppTheme.border,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _livenessVerified
              ? 'Liveness check passed. Face biometric captured.'
              : (_livenessVerifying 
                  ? 'Verifying Liveness... Keep face static.' 
                  : 'Align the enrolee\'s face inside the guide frame.'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.mutedForeground),
          ),
          const SizedBox(height: 32),
          if (!_livenessVerified)
            ElevatedButton.icon(
              onPressed: _livenessVerifying ? null : _runLivenessCheck,
              icon: const Icon(Icons.videocam),
              label: Text(_livenessVerifying ? 'Running Enrolment...' : 'Start Liveness Check'),
            )
          else
            ElevatedButton(
              onPressed: () => setState(() => _wizardStep = 4),
              child: const Text('Proceed to Thumbprint Scan'),
            ),
        ],
      ),
    );
  }

  // Step 4: Fingerprint Enrolment (Simulation)
  Widget _buildStepThumbprint() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step 4 of 5: Fingerprints'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
              TextButton(onPressed: () => setState(() => _wizardStep = 3), child: const Text('Back')),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Thumbprint Enrolment Scanner', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 32),
          
          Expanded(
            child: Center(
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _thumbCaptured 
                      ? AppTheme.primary 
                      : (_thumbScanning ? AppTheme.primaryGlow : AppTheme.border), 
                    width: 2
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_thumbCaptured)
                      const Icon(Icons.fingerprint, size: 100, color: AppTheme.primary)
                    else if (_thumbScanning)
                      const Icon(Icons.fingerprint, size: 100, color: AppTheme.primaryGlow)
                    else
                      const Icon(Icons.fingerprint_outlined, size: 100, color: AppTheme.mutedForeground),
                    
                    if (_thumbScanning)
                      Positioned(
                        bottom: 30,
                        left: 30,
                        right: 30,
                        child: LinearProgressIndicator(
                          value: _thumbProgress,
                          color: AppTheme.primaryGlow,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _thumbCaptured
              ? '$_scannedThumb thumbprint registered successfully.'
              : (_thumbScanning 
                  ? 'Scanning thumbprint... Keep contact secure.' 
                  : 'Place the enrolee\'s thumb flat on the scanner.'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.mutedForeground),
          ),
          const SizedBox(height: 32),
          if (!_thumbCaptured)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _thumbScanning ? null : () => _runThumbprintScan('Left'),
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Scan Left Thumb'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _thumbScanning ? null : () => _runThumbprintScan('Right'),
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Scan Right Thumb'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
                  ),
                ),
              ],
            )
          else
            ElevatedButton(
              onPressed: () => setState(() => _wizardStep = 5),
              child: const Text('Proceed to Profile Review'),
            ),
        ],
      ),
    );
  }

  // Step 5: Review & Save
  Widget _buildStepReview() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Step 5 of 5: Review'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
            TextButton(onPressed: () => setState(() => _wizardStep = 4), child: const Text('Back')),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Confirm Enrolment Profile', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 24),
        
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildReviewRow('Reference', _reference),
                _buildReviewRow('Category', _category.toUpperCase()),
                _buildReviewRow('Full Legal Name', _fullName),
                _buildReviewRow('Phone Number', _phone),
                _buildReviewRow('Date of Birth', _dob),
                _buildReviewRow('Gender', _gender),
                _buildReviewRow('Nationality', _nationality),
                _buildReviewRow('State of Origin', _stateOrigin),
                _buildReviewRow('LGA', _lga),
                _buildReviewRow('Accompanying Dependants', _dependants.toString()),
                _buildReviewRow('Address', _address),
                _buildReviewRow('Education Level', _educationLevel.toUpperCase()),
                _buildReviewRow('Specialized Skills', _skills.isEmpty ? 'None' : _skills),
                _buildReviewRow('Immediate Needs', _selectedNeeds.isEmpty ? 'None' : _selectedNeeds.join(', ')),
                _buildReviewRow('Needs Details', _needsDetails.isEmpty ? 'None' : _needsDetails),
                _buildReviewRow('Circumstances', _reason),
                const Divider(height: 24),
                _buildReviewRow('Facial Verification', _faceCaptured ? 'VERIFIED & ENROLLED' : 'FAILED', valueColor: _faceCaptured ? AppTheme.primary : AppTheme.destructive),
                _buildReviewRow('Biometric Fingerprint', _thumbCaptured ? 'REGISTERED' : 'FAILED', valueColor: _thumbCaptured ? AppTheme.primary : AppTheme.destructive),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed: _submitRegistrant,
          icon: const Icon(Icons.cloud_upload_outlined),
          label: const Text('Finalize and Save Offline'),
        ),
      ],
    );
  }

  Widget _buildReviewRow(String key, String val, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(key, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.mutedForeground, fontSize: 13)),
          ),
          Expanded(
            child: Text(
              val, 
              style: TextStyle(
                fontSize: 13, 
                fontWeight: valueColor != null ? FontWeight.bold : FontWeight.normal,
                color: valueColor ?? AppTheme.foreground
              )
            ),
          ),
        ],
      ),
    );
  }

  // MARK: - Intervention Form Builder
  Widget _buildInterventionForm() {
    return Form(
      key: _intFormKey,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            'AID DISTRIBUTION LOGS',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground, letterSpacing: 1.5),
          ),
          const SizedBox(height: 8),
          const Text('Record Support Activities', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 24),
          
          DropdownButtonFormField<String>(
            initialValue: _intCategory,
            decoration: const InputDecoration(labelText: 'Intervention Category *'),
            items: const [
              DropdownMenuItem(value: 'Food', child: Text('Food & NFI')),
              DropdownMenuItem(value: 'Medical', child: Text('Medical & Health')),
              DropdownMenuItem(value: 'Shelter', child: Text('Shelter')),
              DropdownMenuItem(value: 'Education', child: Text('Education')),
            ],
            onChanged: (val) => setState(() => _intCategory = val!),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Camp / Location *'),
            validator: (val) => val!.isEmpty ? 'Camp / location is required' : null,
            onSaved: (val) => _intCamp = val!,
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Number of Beneficiaries *'),
            keyboardType: TextInputType.number,
            validator: (val) => val!.isEmpty ? 'Number of beneficiaries is required' : null,
            onSaved: (val) => _intCount = int.tryParse(val!) ?? 0,
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Details / Remarks'),
            maxLines: 3,
            onSaved: (val) => _intDetails = val ?? '',
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _submitIntervention,
            icon: const Icon(Icons.save_outlined),
            label: const Text('Log Support Offline'),
          ),
        ],
      ),
    );
  }
}
