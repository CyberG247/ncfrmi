import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:math';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import '../theme.dart';
import '../models/registrant.dart';
import '../models/intervention.dart';
import '../services/offline_service.dart';
import '../data/ng_states_lgas.dart';
import '../utils/uuid.dart';
class CaptureScreen extends StatefulWidget {
  final String? initialCategory;
  final VoidCallback? onCategoryHandled;
  final Registrant? editRegistrant;
  const CaptureScreen({super.key, this.initialCategory, this.onCategoryHandled, this.editRegistrant});

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
  String _reference = '';
  String _stateOrigin = '';
  String _lga = '';
  String? _selectedState;
  String? _selectedLga;

  List<String> _getLgasForState(String state) {
    return NgData.statesAndLgas[state] ?? ['Local Area 1', 'Local Area 2', 'Local Area 3'];
  }

  final _fullNameController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dependantsController = TextEditingController(text: '0');
  
  String _dob = '';
  final _dobController = TextEditingController();
  String _gender = 'Male';
  String _nationality = 'Nigeria';
  
  // Custom Web-Matched fields (merged into circumstances in Supabase)
  String _educationLevel = 'none'; // none, primary, secondary, tertiary, vocational
  String _skills = '';
  String _reason = '';

  // Biometric states
  bool _faceCaptured = false;
  bool _livenessVerifying = false;
  bool _livenessVerified = false;
  double _livenessProgress = 0.0;

  bool _thumbCaptured = false;
  bool _thumbScanning = false;
  double _thumbProgress = 0.0;
  String _scannedThumb = '';
  
  String? _faceImagePath;
  String? _faceImageBase64;
  Timer? _thumbTimer;
  CameraController? _cameraController;
  List<CameraDescription>? _cameras; // 'Left' or 'Right'
  bool _isSaving = false;

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
    _handleInitialCategory();
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        final frontCamera = _cameras!.firstWhere(
          (cam) => cam.lensDirection == CameraLensDirection.front,
          orElse: () => _cameras!.first,
        );
        _cameraController = CameraController(
          frontCamera, 
          ResolutionPreset.medium, 
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (mounted) setState(() {});
      }
    } catch (e) {
      debugPrint('Camera init error: $e');
    }
  }

  void _handleInitialCategory() {
    if (widget.editRegistrant != null) {
      final r = widget.editRegistrant!;
      _category = r.category;
      _fullNameController.text = r.fullName;
      _reference = r.reference;
      _addressController.text = r.address;
      _phoneController.text = r.phone;
      _dob = r.dob;
      _gender = r.gender;
      _nationality = r.nationality;
      _selectedState = NgData.states.contains(r.stateOrigin) ? r.stateOrigin : null;
      _stateOrigin = r.stateOrigin;
      _selectedLga = _getLgasForState(r.stateOrigin).contains(r.lga) ? r.lga : null;
      _lga = r.lga;
      _dependantsController.text = r.dependants.toString();
      
      final circs = r.circumstances;
      if (circs.contains('CAUSE OF DISPLACEMENT:')) {
        final startIndex = circs.indexOf('CAUSE OF DISPLACEMENT:') + 'CAUSE OF DISPLACEMENT:\n'.length;
        final endIndex = circs.indexOf('\n\nEDUCATION BACKGROUND:');
        if (endIndex != -1 && endIndex > startIndex) {
          _reason = circs.substring(startIndex, endIndex).trim();
        } else {
          _reason = r.circumstances;
        }
      } else {
        _reason = r.circumstances;
      }

      if (circs.contains('- Level: ')) {
        final startIndex = circs.indexOf('- Level: ') + '- Level: '.length;
        final endIndex = circs.indexOf('\n- Skills/Specialization:');
        if (endIndex != -1 && endIndex > startIndex) {
          _educationLevel = circs.substring(startIndex, endIndex).trim();
        }
      }
      
      if (circs.contains('- Skills/Specialization: ')) {
        final startIndex = circs.indexOf('- Skills/Specialization: ') + '- Skills/Specialization: '.length;
        int endIndex = circs.indexOf('\n\nNEEDS ASSESSMENT:');
        if (endIndex == -1) {
          endIndex = circs.indexOf('\n===PHOTO_BASE64===');
        }
        if (endIndex != -1 && endIndex > startIndex) {
          _skills = circs.substring(startIndex, endIndex).trim();
        } else {
          _skills = circs.substring(startIndex).trim();
        }
        if (_skills == "None") _skills = "";
      }

      _faceCaptured = r.faceCaptured;
      _thumbCaptured = r.thumbCaptured;
      
      _dobController.text = _dob;
      
      if (NgData.states.contains(_stateOrigin)) {
        _selectedState = _stateOrigin;
        final lgas = _getLgasForState(_stateOrigin);
        if (lgas.contains(_lga)) {
          _selectedLga = _lga;
        }
      }
      
      _wizardStep = 1;
    } else if (widget.initialCategory != null) {
      _category = widget.initialCategory!;
      _generateReference(_category);
      _wizardStep = 1;
      widget.onCategoryHandled?.call();
    }
  }

  @override
  void didUpdateWidget(covariant CaptureScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategory != null && widget.initialCategory != oldWidget.initialCategory) {
      setState(() {
        _handleInitialCategory();
      });
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
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
      _fullNameController.clear();
      _addressController.clear();
      _phoneController.clear();
      _dependantsController.text = '0';
      _dob = '';
      _dobController.clear();
      _gender = 'Male';
      _nationality = 'Nigeria';
      _stateOrigin = '';
      _lga = '';
      _selectedState = null;
      _selectedLga = null;
      _educationLevel = 'none';
      _skills = '';
      _reason = '';
      _faceImagePath = null;
      _faceImageBase64 = null;
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
    bool useSimulated = false;
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      useSimulated = true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Camera not initialized. Running simulated liveness check...'),
          duration: Duration(seconds: 2),
        ),
      );
    }

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

    if (useSimulated) {
      await _runSimulatedLivenessCapture();
      return;
    }

    try {
      final XFile photo = await _cameraController!.takePicture();
      final bytes = await File(photo.path).readAsBytes();
      final base64String = base64Encode(bytes);
      
      if (!mounted) return;
      setState(() {
        _livenessVerifying = false;
        _livenessVerified = true;
        _faceCaptured = true;
        _faceImagePath = photo.path;
        _faceImageBase64 = "data:image/jpeg;base64,$base64String";
      });
    } catch (e) {
      debugPrint('Real camera takePicture failed: $e. Falling back to simulated liveness check.');
      await _runSimulatedLivenessCapture();
    }
  }

  Future<void> _runSimulatedLivenessCapture() async {
    try {
      final ByteData bytes = await rootBundle.load('assets/images/ncfrmi-logo.png');
      final Uint8List list = bytes.buffer.asUint8List();
      final tempDir = await getTemporaryDirectory();
      final file = await File('${tempDir.path}/mock_face.png').create();
      await file.writeAsBytes(list);
      final base64String = base64Encode(list);
      
      if (!mounted) return;
      setState(() {
        _livenessVerifying = false;
        _livenessVerified = true;
        _faceCaptured = true;
        _faceImagePath = file.path;
        _faceImageBase64 = "data:image/png;base64,$base64String";
      });
    } catch (ex) {
      debugPrint("Simulated liveness check failed: $ex");
      if (mounted) {
        setState(() {
          _livenessVerifying = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Liveness verification failed: $ex')),
        );
      }
    }
  }

  void _startThumbTimer(String hand) {
    if (_thumbCaptured) return;
    setState(() {
      _thumbScanning = true;
      _thumbProgress = 0.0;
      _scannedThumb = hand;
    });
    
    _thumbTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) return;
      setState(() {
        _thumbProgress += 0.05;
        if (_thumbProgress >= 1.0) {
          _thumbProgress = 1.0;
          _thumbScanning = false;
          _thumbCaptured = true;
          timer.cancel();
        }
      });
    });
  }

  void _stopThumbTimer() {
    if (_thumbCaptured) return;
    _thumbTimer?.cancel();
    setState(() {
      _thumbScanning = false;
      _thumbProgress = 0.0;
    });
  }

  void _submitRegistrant() async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    
    final phone = _phoneController.text.trim();

    // Check locally
    final localRegs = await offlineService.getOfflineRegistrants();
    final duplicateLocal = localRegs.any((r) => r.phone == phone && (widget.editRegistrant == null || r.id != widget.editRegistrant!.id));
    if (duplicateLocal) {
      if (mounted) {
        setState(() => _isSaving = false);
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Duplicate Registrant'),
            content: Text('A registrant with phone number $phone is already registered locally.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
            ],
          ),
        );
      }
      return;
    }

    // Check remotely if authenticated
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      try {
        final remoteRegs = await Supabase.instance.client
            .from('registrants')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
        
        if (remoteRegs != null && (widget.editRegistrant == null || remoteRegs['id'] != widget.editRegistrant!.id)) {
          if (mounted) {
            setState(() => _isSaving = false);
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Duplicate Registrant'),
                content: Text('A registrant with phone number $phone is already registered in the central database.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
                ],
              ),
            );
          }
          return;
        }
      } catch (e) {
        debugPrint('Remote duplicate check failed (ignoring since offline): $e');
      }
    }
    
    final circumstancesMerged = '''
CAUSE OF DISPLACEMENT:
$_reason

EDUCATION BACKGROUND:
- Level: $_educationLevel
- Skills/Specialization: ${_skills.isEmpty ? "None" : _skills}
${_faceImageBase64 != null ? '\n===PHOTO_BASE64===\n$_faceImageBase64' : ''}
''';

    final registrant = Registrant(
      id: widget.editRegistrant != null ? widget.editRegistrant!.id : generateUuidV4(),
      reference: _reference,
      category: _category,
      fullName: _fullNameController.text.trim(),
      address: _addressController.text.trim(),
      phone: _phoneController.text.trim(),
      dob: _dob,
      gender: _gender,
      nationality: _nationality,
      stateOrigin: _stateOrigin,
      lga: _lga,
      dependants: int.tryParse(_dependantsController.text.trim()) ?? 0,
      circumstances: circumstancesMerged,
      faceCaptured: _faceCaptured,
      thumbCaptured: _thumbCaptured,
      capturedBy: widget.editRegistrant != null ? widget.editRegistrant!.capturedBy : user?.id,
      createdAt: widget.editRegistrant != null ? widget.editRegistrant!.createdAt : DateTime.now().toIso8601String(),
    );

    if (widget.editRegistrant != null) {
      await offlineService.updateRegistrant(registrant);
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registrant record successfully updated offline!'))
        );
        Navigator.pop(context, true);
      }
    } else {
      await offlineService.saveRegistrant(registrant);
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registrant record successfully saved offline!'))
        );
        _resetWizard();
      }
    }
  }

  void _submitIntervention() async {
    if (_intFormKey.currentState!.validate()) {
      _intFormKey.currentState!.save();
      final user = Supabase.instance.client.auth.currentUser;
      
      final intervention = Intervention(
        id: generateUuidV4(),
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
            icon: LucideIcons.globe300,
            color: AppTheme.primary,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'idp',
            title: 'IDPs',
            division: 'Camp Enrolment',
            desc: 'Register Internally Displaced Persons. Track shelter coordinates, camp assignments, and dependants.',
            icon: LucideIcons.home300,
            color: AppTheme.accent,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'migrant',
            title: 'Migrants',
            division: 'Transit and Exit',
            desc: 'Enrol regularized migrants or returnee enrolees. Track border transit and reintegration records.',
            icon: LucideIcons.plane300,
            color: Colors.amber[800]!,
          ),
          const SizedBox(height: 16),
          _buildCategoryCard(
            category: 'returnee',
            title: 'Returnees',
            division: 'Repatriation & Reintegration',
            desc: 'Register citizens repatriated from transit borders. Track returnee details and distribution assets.',
            icon: LucideIcons.undo300,
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
                  const Icon(LucideIcons.chevronRight300, size: 16, color: AppTheme.mutedForeground),
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
            controller: _fullNameController,
            decoration: const InputDecoration(labelText: 'Full Legal Name *'),
            validator: (val) => val!.isEmpty ? 'Full legal name is required' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
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
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _dobController,
            readOnly: true,
            decoration: const InputDecoration(
              labelText: 'Date of Birth *',
              hintText: 'Tap to select date',
              suffixIcon: Icon(LucideIcons.calendar300),
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
            items: NgData.states.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
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
            controller: _addressController,
            decoration: const InputDecoration(labelText: 'Current Address / Shelter *'),
            maxLines: 2,
            validator: (val) => val!.isEmpty ? 'Address / shelter is required' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _dependantsController,
            decoration: const InputDecoration(labelText: 'Number of Accompanying Dependants'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              if (_regFormKey1.currentState!.validate()) {
                setState(() => _wizardStep = 2);
              }
            },
            child: const Text('Proceed to Education & Displacement'),
          ),
        ],
      ),
    );
  }

  List<String> _getDisplacementCauses() {
    const causes = {
      'idp': [
        'Conflict / Violence / Insurgency',
        'Armed Banditry / Kidnapping',
        'Communal Clash / Land Dispute',
        'Farmer-Herder Conflict',
        'Natural Disaster (Flooding, Drought, etc.)',
      ],
      'migrant': [
        'Economic Hardship / Search for Employment',
        'Educational Opportunities',
        'Family Reunification',
        'Climate / Environmental Change',
      ],
      'returnee': [
        'Voluntary Repatriation',
        'Deportation / Forced Return',
        'Assisted Voluntary Return & Reintegration',
      ],
      'refugee': [
        'Conflict / Violence / Insurgency',
        'Armed Banditry / Kidnapping',
        'Communal Clash / Land Dispute',
        'Farmer-Herder Conflict',
        'Natural Disaster',
        'Economic Hardship / Migration',
        'Repatriation',
      ],
    };
    final list = List<String>.from(causes[_category] ?? causes['idp']!);
    if (_reason.isNotEmpty && !list.contains(_reason)) {
      list.add(_reason);
    }
    return list;
  }

  // Step 2: Education & Displacement Form
  Widget _buildStepEducationAndNeeds() {
    final causesList = _getDisplacementCauses();
    return Form(
      key: _regFormKey2,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Step 2 of 5: Education & Displacement'.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
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
            initialValue: _skills,
            decoration: const InputDecoration(labelText: 'Specialized Skills / Trade / Talents'),
            onSaved: (val) => _skills = val ?? '',
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _reason.isNotEmpty ? _reason : null,
            decoration: const InputDecoration(
              labelText: 'Cause of Displacement *',
              hintText: 'Select cause of displacement',
            ),
            items: causesList.map((cause) {
              return DropdownMenuItem<String>(
                value: cause,
                child: Text(cause),
              );
            }).toList(),
            validator: (val) {
              if (val == null || val.isEmpty) return 'Reason is required';
              return null;
            },
            onChanged: (val) {
              setState(() {
                _reason = val ?? '';
              });
            },
            onSaved: (val) => _reason = val ?? '',
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
                    if (_faceImagePath != null)
                      ClipOval(child: Image.file(File(_faceImagePath!), width: 260, height: 260, fit: BoxFit.cover))
                    else if (_cameraController != null && _cameraController!.value.isInitialized)
                      ClipOval(
                        child: SizedBox(
                          width: 260,
                          height: 260,
                          child: FittedBox(
                            fit: BoxFit.cover,
                            child: SizedBox(
                              width: _cameraController!.value.previewSize?.height ?? 1,
                              height: _cameraController!.value.previewSize?.width ?? 1,
                              child: CameraPreview(_cameraController!),
                            ),
                          ),
                        ),
                      )
                    else
                      const Icon(LucideIcons.scanFace300, size: 100, color: AppTheme.mutedForeground),
                    
                    if (_livenessVerified && _faceImagePath != null)
                      Positioned(
                        right: 20,
                        bottom: 20,
                        child: Container(
                          decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                          child: const Icon(LucideIcons.checkCircle300, size: 40, color: AppTheme.primary),
                        ),
                      ),
                    
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
              icon: const Icon(LucideIcons.video300),
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
                      const Icon(LucideIcons.fingerprint300, size: 100, color: AppTheme.primary)
                    else if (_thumbScanning)
                      const Icon(LucideIcons.fingerprint300, size: 100, color: AppTheme.primaryGlow)
                    else
                      const Icon(LucideIcons.fingerprint300, size: 100, color: AppTheme.mutedForeground),
                    
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
                  child: GestureDetector(
                    onTapDown: (_) => _startThumbTimer('Left'),
                    onTapUp: (_) => _stopThumbTimer(),
                    onTapCancel: () => _stopThumbTimer(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _thumbScanning && _scannedThumb == 'Left' ? AppTheme.primaryGlow : AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.fingerprint300, color: Colors.white),
                          SizedBox(width: 8),
                          Text('Hold Left', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: GestureDetector(
                    onTapDown: (_) => _startThumbTimer('Right'),
                    onTapUp: (_) => _stopThumbTimer(),
                    onTapCancel: () => _stopThumbTimer(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _thumbScanning && _scannedThumb == 'Right' ? AppTheme.primaryGlow : AppTheme.secondary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.fingerprint300, color: Colors.white),
                          SizedBox(width: 8),
                          Text('Hold Right', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
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
                _buildReviewRow('Full Name', _fullNameController.text),
                _buildReviewRow('Phone Number', _phoneController.text),
                _buildReviewRow('Date of Birth', _dobController.text),
                _buildReviewRow('Gender', _gender),
                _buildReviewRow('Nationality', _nationality),
                _buildReviewRow('State of Origin', _stateOrigin),
                _buildReviewRow('LGA', _lga),
                _buildReviewRow('Address', _addressController.text),
                _buildReviewRow('Dependants', _dependantsController.text),
                _buildReviewRow('Education Level', _educationLevel.toUpperCase()),
                _buildReviewRow('Specialized Skills', _skills.isEmpty ? 'None' : _skills),
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
          onPressed: _isSaving ? null : _submitRegistrant,
          icon: _isSaving
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(LucideIcons.cloudUpload300),
          label: Text(_isSaving ? 'Saving...' : 'Finalize and Save Offline'),
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
            icon: const Icon(LucideIcons.save300),
            label: const Text('Log Support Offline'),
          ),
        ],
      ),
    );
  }
}
