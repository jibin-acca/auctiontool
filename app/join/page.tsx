'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Trophy, KeyRound, Loader2, CheckCircle2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { BackButton } from '@/components/arena/public-nav';
import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/lib/types';
import { saveOwnerSession } from '@/lib/owner-session';

export default function JoinPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [checkingTournament, setCheckingTournament] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successState, setSuccessState] = useState<{ action: string; tournamentName: string; season: string } | null>(null);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code');
      const urlInvite = params.get('invite');
      if (urlCode) setCode(urlCode.toUpperCase());

      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (!data) {
        const { data: fallback } = await supabase.from('tournaments').select('*').neq('status', 'Draft').neq('status', 'Archived').order('created_at', { ascending: false }).limit(1).maybeSingle();
        setTournament(fallback as Tournament | null);
      } else {
        setTournament(data as Tournament | null);
      }
      setCheckingTournament(false);
    })();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!code.trim()) {
      setError('Tournament code is required.');
      setLoading(false);
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('A valid phone number is required (minimum 10 digits).');
      setLoading(false);
      return;
    }

    const { data: result, error: rpcError } = await supabase.rpc('authenticate_team_owner', {
      p_tournament_code: code.trim().toUpperCase(),
      p_phone: phone.trim(),
      p_name: name.trim() || null,
    });

    if (rpcError) {
      setError('Something went wrong. Please try again or contact the tournament administrator.');
      setLoading(false);
      return;
    }

    if (!result || result.error) {
      setError(result?.error ?? 'Authentication failed. Please try again.');
      setLoading(false);
      return;
    }

    if (!result.success) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      return;
    }

    saveOwnerSession({
      phone: phone.trim(),
      tournamentId: result.tournament_id ?? '',
      teamOwnerId: result.team_owner_id,
      name: result.name,
    });

    setSuccessState({
      action: result.action,
      tournamentName: result.tournament_name,
      season: result.tournament_season,
    });
    setLoading(false);

    setTimeout(() => router.push('/owner/dashboard'), 1200);
  };

  if (checkingTournament) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="absolute inset-0 bg-pitch-grid opacity-20" />
        <div className="absolute inset-0 bg-stadium-glow" />
        <div className="relative w-full max-w-md">
          <div className="mb-4">
            <BackButton label="Back to Home" />
          </div>
          <EmptyState
            icon={Trophy}
            title="No Active Tournament"
            description="No tournament is currently accepting registrations. Please check back later or contact your tournament administrator."
          />
        </div>
      </div>
    );
  }

  if (successState) {
    const isLogin = successState.action === 'login';
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="absolute inset-0 bg-pitch-grid opacity-20" />
        <div className="absolute inset-0 bg-stadium-glow" />
        <div className="relative w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
            {isLogin ? <LogIn className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
          </div>
          <h1 className="font-display text-2xl font-bold">{isLogin ? 'Welcome Back!' : 'Registration Successful!'}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? `You have been logged in to ${successState.tournamentName} · ${successState.season}. Redirecting to your dashboard...`
              : `You have successfully joined ${successState.tournamentName} · ${successState.season}. Redirecting to your dashboard...`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
            <Button asChild><Link href="/owner/dashboard">Go to Owner Portal</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-pitch-grid opacity-20" />
      <div className="absolute inset-0 bg-stadium-glow" />
      <div className="absolute left-4 top-4 z-20">
        <BackButton />
      </div>
      <div className="relative w-full max-w-md pt-12 sm:pt-0">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary glow-blue">
            <Trophy className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Join or Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your tournament code and phone number. New managers will be registered; returning managers will be logged in.
          </p>
        </div>
        <Card className="glass-card p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tournament Code</label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm uppercase outline-none placeholder:text-muted-foreground"
                  placeholder="Enter tournament code"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                placeholder="+91 98200 11223"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Full Name <span className="text-muted-foreground">(required for new managers only)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                placeholder="Enter your name (leave blank if returning)"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : <>Continue <ArrowRight className="ml-1.5 h-4 w-4" /></>}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> New? Enter your name</span>
            <span className="flex items-center gap-1"><LogIn className="h-3 w-3" /> Returning? Just phone</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
