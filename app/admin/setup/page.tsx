'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, Lock, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthNav } from '@/components/arena/public-nav';

export default function AdminSetupPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already logged in, go to admin
    if (session) {
      router.replace('/admin');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('setup_complete')
        .maybeSingle();
      if (data?.setup_complete) {
        router.replace('/admin/login');
      } else {
        setChecking(false);
      }
    })();
  }, [router, session]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (!username.trim()) {
      setError('Username is required.');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || username,
          username,
          role: 'admin',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from('app_settings')
        .update({ setup_complete: true, updated_at: new Date().toISOString() })
        .eq('id', 1);
    }

    // Sign out so the user must log in explicitly
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="absolute inset-0 bg-pitch-grid opacity-20" />
      <div className="absolute inset-0 bg-stadium-glow" />

      <AuthNav />

      <div className="relative w-full max-w-md pt-8 sm:pt-0">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary glow-blue">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">Create Administrator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up the first tournament administrator account. This can only be done once.
          </p>
        </div>

        <Card className="glass-card p-6">
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="admin"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Display Name (optional)</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Tournament Director"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full glow-blue" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" /> Create Administrator</>
              )}
            </Button>
          </form>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            After setup, this page will be disabled forever.
          </p>
        </Card>
      </div>
    </div>
  );
}
