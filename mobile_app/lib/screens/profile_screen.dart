import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import '../theme.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _supabase = Supabase.instance.client;
  final _displayNameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  final _picker = ImagePicker();
  String? _localAvatarPath;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  void _loadProfile() {
    final user = _supabase.auth.currentUser;
    if (user != null) {
      _displayNameController.text = user.userMetadata?['display_name'] ?? '';
      final path = user.userMetadata?['avatar_url']?.toString();
      if (path != null && !path.startsWith('http') && File(path).existsSync()) {
        setState(() {
          _localAvatarPath = path;
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );
      if (image != null) {
        setState(() {
          _localAvatarPath = image.path;
        });
        
        await _supabase.auth.updateUser(UserAttributes(
          data: {'avatar_url': image.path},
        ));
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile picture updated successfully!')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to access camera/gallery: $e'), backgroundColor: AppTheme.destructive),
        );
      }
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Update Profile Photo',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            ListTile(
              leading: const Icon(LucideIcons.camera300, color: AppTheme.primary),
              title: const Text('Take Photo using Camera'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image300, color: AppTheme.primary),
              title: const Text('Choose from Photo Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Future<void> _updateProfile() async {
    setState(() => _isLoading = true);
    try {
      final updates = <String, dynamic>{};
      if (_displayNameController.text.isNotEmpty) {
        updates['data'] = {'display_name': _displayNameController.text};
      }
      if (_passwordController.text.isNotEmpty) {
        updates['password'] = _passwordController.text;
      }
      
      if (updates.isNotEmpty) {
        await _supabase.auth.updateUser(UserAttributes(
          data: updates['data'],
          password: updates['password'],
        ));
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully!')));
        _passwordController.clear();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: AppTheme.destructive));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _supabase.auth.currentUser;
    final email = user?.email ?? 'Unknown User';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Profile'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut300),
            tooltip: 'Sign Out',
            onPressed: () async {
              await _supabase.auth.signOut();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: AppTheme.primary,
                        backgroundImage: _localAvatarPath != null
                            ? FileImage(File(_localAvatarPath!))
                            : (user?.userMetadata?['avatar_url'] != null &&
                                    (user!.userMetadata!['avatar_url'] as String).startsWith('http')
                                ? NetworkImage(user.userMetadata!['avatar_url'])
                                : null),
                        child: (_localAvatarPath == null && user?.userMetadata?['avatar_url'] == null)
                            ? const Icon(LucideIcons.user300, size: 50, color: Colors.white)
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          decoration: const BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            icon: const Icon(LucideIcons.camera300, color: Colors.white, size: 18),
                            onPressed: _showPhotoOptions,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Account Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        TextField(
                          controller: TextEditingController(text: email),
                          decoration: const InputDecoration(labelText: 'Email Address (Read-only)', prefixIcon: Icon(LucideIcons.mail300)),
                          readOnly: true,
                          enabled: false,
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _displayNameController,
                          decoration: const InputDecoration(labelText: 'Display Name', prefixIcon: Icon(LucideIcons.user300)),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          decoration: const InputDecoration(labelText: 'New Password', prefixIcon: Icon(LucideIcons.lock300)),
                          obscureText: true,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _updateProfile,
                          icon: const Icon(LucideIcons.save300),
                          label: const Text('Save Changes'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
