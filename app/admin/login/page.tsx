'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { AuthNav } from '@/components/arena/public-nav';

export default function AdminLoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/admin');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('setup_complete')
        .maybeSingle();
      setSetupComplete(data?.setup_complete ?? false);
    })();
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
  };

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
          <h1 className="font-display text-2xl font-bold">Administrator Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to the ArenaOS Tournament Control Center
          </p>
        </div>

        <Card className="glass-card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Enter password"
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          {setupComplete === false && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">No administrator exists yet.</p>
              <Button asChild variant="ghost" size="sm" className="mt-2 text-accent hover:text-accent">
                <Link href="/admin/setup">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Create Administrator
                </Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
