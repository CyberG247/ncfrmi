import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../theme.dart';

class UserManagementModule extends StatefulWidget {
  const UserManagementModule({super.key});

  @override
  State<UserManagementModule> createState() => _UserManagementModuleState();
}

class _UserManagementModuleState extends State<UserManagementModule> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  bool _isActionLoading = false;
  List<Map<String, dynamic>> _usersList = [];

  // Add User Dialog Controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _selectedRole = 'admin'; // admin or officer

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoading = true);
    try {
      final response = await _supabase.from('profiles').select('*, user_roles(role)').order('created_at', ascending: false);
      List<Map<String, dynamic>> list = List<Map<String, dynamic>>.from(response);

      // Auto-insert current logged in admin if list is empty (guarantees at least one user appears)
      if (list.isEmpty) {
        final currentUser = _supabase.auth.currentUser;
        if (currentUser != null) {
          try {
            await _supabase.from('profiles').upsert({
              'id': currentUser.id,
              'full_name': currentUser.userMetadata?['display_name'] ?? 'Command Center Admin',
              'phone': '+234 800 000 0000',
              'updated_at': DateTime.now().toIso8601String(),
            });
            // Try fetching again
            final retryResponse = await _supabase.from('profiles').select('*, user_roles(role)');
            list = List<Map<String, dynamic>>.from(retryResponse);
          } catch (e) {
            debugPrint('Auto-profile creation failed: $e');
          }
        }
      }

      if (mounted) {
        setState(() {
          _usersList = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching users: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading users: $e'),
            backgroundColor: AppTheme.destructive,
            duration: const Duration(seconds: 8),
          ),
        );
      }
    }
  }

  Future<void> _createUser() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (email.isEmpty || password.isEmpty || name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }

    setState(() => _isActionLoading = true);
    try {
      final authResponse = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'display_name': name},
      );

      final user = authResponse.user;
      if (user != null) {
        await _supabase.from('user_roles').insert({
          'user_id': user.id,
          'role': _selectedRole,
        });

        try {
          await _supabase.from('profiles').upsert({
            'id': user.id,
            'full_name': name,
            'phone': phone,
            'updated_at': DateTime.now().toIso8601String(),
          });
        } catch (e) {
          debugPrint('Profile details upsert failed: $e');
        }
      }

      _emailController.clear();
      _passwordController.clear();
      _nameController.clear();
      _phoneController.clear();

      if (!mounted) return;
      setState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User account created successfully!')));
      Navigator.pop(context);
      _fetchUsers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create account: $e'), backgroundColor: AppTheme.destructive),
      );
      setState(() => _isActionLoading = false);
    }
  }
  Future<void> _updateUser(String userId, String name, String phone, String role) async {
    setState(() => _isActionLoading = true);
    try {
      await _supabase.from('profiles').update({
        'full_name': name,
        'phone': phone,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', userId);

      await _supabase.from('user_roles').upsert({
        'user_id': userId,
        'role': role,
      });

      if (!mounted) return;
      setState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User details updated successfully!')));
      Navigator.pop(context);
      _fetchUsers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update details: $e'), backgroundColor: AppTheme.destructive),
      );
      setState(() => _isActionLoading = false);
    }
  }

  Future<void> _changeUserRole(String userId, String newRole) async {
    setState(() => _isActionLoading = true);
    try {
      await _supabase.from('user_roles').upsert({
        'user_id': userId,
        'role': newRole,
      });
      if (!mounted) return;
      setState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('User role updated to $newRole successfully.')));
      _fetchUsers();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to modify role: $e'), backgroundColor: AppTheme.destructive));
        setState(() => _isActionLoading = false);
      }
    }
  }

  Future<void> _deleteUser(String userId) async {
    setState(() => _isActionLoading = true);
    try {
      await _supabase.from('user_roles').delete().eq('user_id', userId);
      await _supabase.from('profiles').delete().eq('id', userId);

      if (!mounted) return;
      setState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account database records deleted.')));
      _fetchUsers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: $e'), backgroundColor: AppTheme.destructive),
      );
      setState(() => _isActionLoading = false);
    }
  }

  void _showAddUserDialog() {
    _emailController.clear();
    _passwordController.clear();
    _nameController.clear();
    _phoneController.clear();
    _selectedRole = 'admin';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Administrator / Officer Account'),
          content: SizedBox(
            width: 500,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name *')),
                const SizedBox(height: 16),
                TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email Address *')),
                const SizedBox(height: 16),
                TextField(controller: _passwordController, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true),
                const SizedBox(height: 16),
                TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone Number')),
                const SizedBox(height: 20),
                const Text('Administrative Privilege', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _selectedRole,
                  items: const [
                    DropdownMenuItem(value: 'admin', child: Text('Command Center Admin')),
                    DropdownMenuItem(value: 'officer', child: Text('Field Capture Officer')),
                  ],
                  onChanged: (val) {
                    setDialogState(() => _selectedRole = val!);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: _isActionLoading ? null : _createUser,
              child: _isActionLoading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditUserDialog(Map<String, dynamic> user) {
    final editNameController = TextEditingController(text: user['full_name'] ?? '');
    final editPhoneController = TextEditingController(text: user['phone'] ?? '');
    
    // Parse role safely
    String currentRole = 'applicant';
    if (user['user_roles'] != null) {
      final roleObj = user['user_roles'];
      if (roleObj is List && roleObj.isNotEmpty) {
        currentRole = roleObj.first['role']?.toString() ?? 'applicant';
      } else if (roleObj is Map) {
        currentRole = roleObj['role']?.toString() ?? 'applicant';
      }
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Edit Account Settings'),
          content: SizedBox(
            width: 500,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: editNameController, decoration: const InputDecoration(labelText: 'Full Name *')),
                const SizedBox(height: 16),
                TextField(controller: editPhoneController, decoration: const InputDecoration(labelText: 'Phone Number')),
                const SizedBox(height: 20),
                const Text('Account Access Role', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.mutedForeground)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: currentRole,
                  items: const [
                    DropdownMenuItem(value: 'admin', child: Text('Command Center Admin')),
                    DropdownMenuItem(value: 'officer', child: Text('Field Capture Officer')),
                    DropdownMenuItem(value: 'applicant', child: Text('Standard Applicant / Member')),
                  ],
                  onChanged: (val) {
                    setDialogState(() => currentRole = val!);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: _isActionLoading ? null : () => _updateUser(user['id'], editNameController.text, editPhoneController.text, currentRole),
              child: _isActionLoading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _exportData() async {
    if (_usersList.isEmpty) return;

    try {
      String? outputFile = await FilePicker.saveFile(
        dialogTitle: 'Export Users List',
        fileName: 'ncfrmi_users_accounts.csv',
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (outputFile != null) {
        List<List<dynamic>> rows = [];
        rows.add(['User ID', 'Full Name', 'Phone', 'Role', 'Created At']);
        
        for (var u in _usersList) {
          String userRole = 'applicant';
          final rObj = u['user_roles'];
          if (rObj is List && rObj.isNotEmpty) {
            userRole = rObj.first['role']?.toString() ?? 'applicant';
          } else if (rObj is Map) {
            userRole = rObj['role']?.toString() ?? 'applicant';
          }

          rows.add([
            u['id'],
            u['full_name'] ?? 'Unknown',
            u['phone'] ?? 'N/A',
            userRole,
            u['created_at']
          ]);
        }
        
        String csvString = csv.encode(rows);
        final file = File(outputFile);
        await file.writeAsString(csvString);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported to $outputFile')));
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
                    'User Roles & Access Manager',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.foreground),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'View all portal users. Promote, demote, authorize, or revoke administrative access privileges.',
                    style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground),
                  ),
                ],
              ),
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: _exportData,
                    icon: const Icon(LucideIcons.download300, size: 16),
                    label: const Text('Export CSV'),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: _showAddUserDialog,
                    icon: const Icon(LucideIcons.userPlus300, size: 16),
                    label: const Text('Add User Account'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 28),
          
          Expanded(
            child: Card(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                  : _usersList.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.users300, size: 48, color: AppTheme.mutedForeground),
                              SizedBox(height: 16),
                              Text(
                                'No registered users found in the database.',
                                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.foreground),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Click "Add User Account" to register a new admin or field officer.',
                                style: TextStyle(color: AppTheme.mutedForeground, fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _usersList.length,
                          separatorBuilder: (context, index) => const Divider(),
                          itemBuilder: (context, index) {
                            final u = _usersList[index];
                            
                            // Parse role
                            String role = 'applicant';
                            final rObj = u['user_roles'];
                            if (rObj is List && rObj.isNotEmpty) {
                              role = rObj.first['role']?.toString() ?? 'applicant';
                            } else if (rObj is Map) {
                              role = rObj['role']?.toString() ?? 'applicant';
                            }

                            final isAdmin = role == 'admin' || role == 'commissioner';
                            final isOfficer = role == 'officer';

                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isAdmin ? AppTheme.primary : (isOfficer ? AppTheme.secondary : AppTheme.muted),
                                child: Text(
                                  (u['full_name'] ?? 'U')[0].toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Text(
                                u['full_name'] ?? 'Unknown User',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text('ID: ${u['id']} • Phone: ${u['phone'] ?? 'N/A'}'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: (isAdmin ? AppTheme.primary : (isOfficer ? AppTheme.secondary : AppTheme.muted)).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      role.toUpperCase(),
                                      style: TextStyle(
                                        color: isAdmin ? AppTheme.primary : (isOfficer ? AppTheme.secondary : AppTheme.mutedForeground),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  
                                  // Promote / Demote Action Buttons
                                  if (isAdmin)
                                    ElevatedButton.icon(
                                      onPressed: () => _changeUserRole(u['id'], 'officer'),
                                      icon: const Icon(LucideIcons.userMinus300, size: 14),
                                      label: const Text('Demote to Officer'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.secondary,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    )
                                  else
                                    ElevatedButton.icon(
                                      onPressed: () => _changeUserRole(u['id'], 'admin'),
                                      icon: const Icon(LucideIcons.userCheck300, size: 14),
                                      label: const Text('Promote to Admin'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.primary,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    ),
                                  const SizedBox(width: 8),
                                  
                                  IconButton(
                                    icon: const Icon(LucideIcons.pencil300, size: 18),
                                    onPressed: () => _showEditUserDialog(u),
                                  ),
                                  IconButton(
                                    icon: const Icon(LucideIcons.trash2300, size: 18, color: AppTheme.destructive),
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text('Delete Account?'),
                                          content: const Text('This will delete all database profile records for this user.'),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                                            TextButton(
                                              onPressed: () {
                                                Navigator.pop(context);
                                                _deleteUser(u['id']);
                                              },
                                              child: const Text('Delete', style: TextStyle(color: AppTheme.destructive)),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}
