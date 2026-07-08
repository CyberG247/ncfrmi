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

  Future<List<Map<String, dynamic>>> _fetchUsersFromDb() async {
    final List<dynamic> profilesResponse = await _supabase.from('profiles').select('*').order('created_at', ascending: false);
    final List<dynamic> rolesResponse = await _supabase.from('user_roles').select('*');
    
    final rolesMap = <String, String>{};
    for (var item in rolesResponse) {
      final userId = item['user_id']?.toString();
      final role = item['role']?.toString();
      if (userId != null && role != null) {
        rolesMap[userId] = role;
      }
    }
    
    final List<Map<String, dynamic>> joinedList = [];
    for (var item in profilesResponse) {
      final joinedItem = Map<String, dynamic>.from(item as Map);
      final userId = joinedItem['id']?.toString();
      joinedItem['user_roles'] = {
        'role': rolesMap[userId] ?? 'applicant'
      };
      joinedList.add(joinedItem);
    }
    return joinedList;
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoading = true);
    try {
      List<Map<String, dynamic>> list = await _fetchUsersFromDb();

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
            list = await _fetchUsersFromDb();
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

  Future<void> _createUser(StateSetter setDialogState) async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (email.isEmpty || password.isEmpty || name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }

    setDialogState(() => _isActionLoading = true);
    try {
      // Use a temporary client to sign up the new user so it doesn't overwrite
      // the Admin's session on the global Supabase.instance.client!
      final tempClient = SupabaseClient(
        'https://kbchfzawnkvppibakkst.supabase.co',
        'sb_publishable_1mEoHkQX3WR_h2-DVgCHEg_OmA6ogkd',
      );

      final authResponse = await tempClient.auth.signUp(
        email: email,
        password: password,
        data: {
          'full_name': name,
          'phone': phone,
        },
      );

      final user = authResponse.user;
      if (user != null) {
        // Clear any auto-generated roles from the auth trigger, then insert selected role
        await _supabase.from('user_roles').delete().eq('user_id', user.id);
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
      setDialogState(() => _isActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User account created successfully!')));
      Navigator.pop(context);
      _fetchUsers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create account: $e'), backgroundColor: AppTheme.destructive),
      );
      setDialogState(() => _isActionLoading = false);
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
    bool obscurePassword = true;

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
                TextField(
                  controller: _passwordController,
                  obscureText: obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password *',
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscurePassword ? LucideIcons.eye300 : LucideIcons.eyeOff300,
                        size: 20,
                        color: AppTheme.mutedForeground,
                      ),
                      onPressed: () {
                        setDialogState(() {
                          obscurePassword = !obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
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
              onPressed: _isActionLoading ? null : () => _createUser(setDialogState),
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
    final isUnauthenticated = _supabase.auth.currentUser == null;
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isUnauthenticated) ...[
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.alertTriangle300, color: Colors.amber.shade900),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Warning: Bypassed/Unauthenticated Session. Supabase RLS will block User Creation and Deletion. Please register "commissioner@ncfrmi.gov.ng" and elevate it to Admin in the SQL Editor.',
                      style: TextStyle(color: Colors.amber.shade900, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
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
                  IconButton(
                    onPressed: _isLoading ? null : _fetchUsers,
                    icon: const Icon(LucideIcons.refreshCw300, size: 20),
                    tooltip: 'Refresh Users',
                  ),
                  const SizedBox(width: 12),
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

                             final isSelf = u['id'] == _supabase.auth.currentUser?.id;
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
                                      onPressed: isSelf ? null : () => _changeUserRole(u['id'], 'officer'),
                                      icon: const Icon(LucideIcons.userMinus300, size: 14),
                                      label: const Text('Demote to Officer'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.secondary,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                    )
                                  else
                                    ElevatedButton.icon(
                                      onPressed: isSelf ? null : () => _changeUserRole(u['id'], 'admin'),
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
                                  if (!isSelf)
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
