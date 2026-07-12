import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  Future<void> _signIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    
    if (email.isEmpty || password.isEmpty) return;

    setState(() => _isLoading = true);

    if (email == 'commissioner@ncfrmi.gov.ng' && password == 'commissioner123') {
      try {
        await Supabase.instance.client.auth.signInWithPassword(
          email: email,
          password: password,
        );
      } catch (e) {
        try {
          await Supabase.instance.client.auth.signUp(
            email: email,
            password: password,
          );
          // Set role as admin in database for the commissioner bypass account
          final user = Supabase.instance.client.auth.currentUser;
          if (user != null) {
            await Supabase.instance.client.from('user_roles').insert({
              'user_id': user.id,
              'role': 'admin',
            });
          }
        } catch (err) {
          debugPrint('Bypass sign up failed: $err');
        }
      }
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
      return;
    }

    try {
      final response = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      final user = response.user;
      if (user != null) {
        // Query user role in Supabase database
        final rolesResponse = await Supabase.instance.client
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        final role = rolesResponse?['role']?.toString().toLowerCase();

        // Enforce administrative privileges
        if (role != 'admin') {
          await Supabase.instance.client.auth.signOut();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Access Denied. Only administrator accounts are authorized to access the Command Center.'),
                backgroundColor: AppTheme.destructive,
              ),
            );
          }
          return;
        }
      }
      
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
    } on AuthException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.message), backgroundColor: AppTheme.destructive),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unexpected error occurred'), backgroundColor: AppTheme.destructive),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.muted,
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Center(
              child: Container(
                width: 1000,
                height: 600,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Left panel: Inset colored banner card
                    Expanded(
                      flex: 5,
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primary, AppTheme.primaryGlow],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 20),
                                const Text(
                                  'Simplify\nmanagement with\nour dashboard.',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 36,
                                    fontWeight: FontWeight.w800,
                                    height: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'Manage field captures, sync logs, and run analytics with our admin dashboard.',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.8),
                                    fontSize: 15,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                            // Clean watermark or subtle icon/logo container at the bottom
                            Opacity(
                              opacity: 0.15,
                              child: Image.asset(
                                'assets/images/ncfrmi-logo.png',
                                width: 120,
                                height: 120,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Right panel: Login form
                    Expanded(
                      flex: 4,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 48.0, vertical: 32.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Top Logo and Brand
                            Row(
                              children: [
                                Image.asset('assets/images/ncfrmi-logo.png', width: 28, height: 28),
                                const SizedBox(width: 8),
                                const Text(
                                  'NCFRMI',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.foreground,
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(flex: 2),
                            // Welcome Back Heading
                            const Text(
                              'Welcome Back',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.foreground,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Please login to your account',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.mutedForeground,
                              ),
                            ),
                            const SizedBox(height: 36),
                            // Email Address Field
                            TextField(
                              controller: _emailController,
                              decoration: InputDecoration(
                                labelText: 'Email address',
                                labelStyle: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground),
                                filled: true,
                                fillColor: AppTheme.muted.withValues(alpha: 0.6),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                                ),
                              ),
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 16),
                            // Password Field
                            TextField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                labelStyle: const TextStyle(fontSize: 13, color: AppTheme.mutedForeground),
                                suffixIcon: Padding(
                                  padding: const EdgeInsets.only(right: 4.0),
                                  child: IconButton(
                                    icon: Icon(
                                      _obscurePassword ? LucideIcons.eyeOff300 : LucideIcons.eye300,
                                      color: AppTheme.mutedForeground,
                                      size: 18,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _obscurePassword = !_obscurePassword;
                                      });
                                    },
                                  ),
                                ),
                                filled: true,
                                fillColor: AppTheme.muted.withValues(alpha: 0.6),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                                ),
                              ),
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _signIn(),
                            ),
                            const SizedBox(height: 24),
                            // Login Button
                            ElevatedButton(
                              onPressed: _isLoading ? null : _signIn,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 18),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Login', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ),
                            const Spacer(flex: 3),
                            // Bottom Signup Prompt removed as requested
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
