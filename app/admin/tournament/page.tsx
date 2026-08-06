'use client';

import { useState, useEffect } from 'react';
import {
  Trophy, Plus, Pencil, Archive, Copy, Trash2, X, Loader2, Check,
  Calendar, Users, Shield, Gavel, Award, Megaphone, Settings as SettingsIcon,
  Save, AlertCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ArrowRightCircle, GitBranch, AlertTriangle,
} from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tournament, TournamentPhase } from '@/lib/types';
import { PHASES } from '@/lib/types';

export default function TournamentManagementPage() {
  const { tournament, tournaments, loading, createTournament, updateTournament, archiveTournament, deleteTournament, duplicateTournament, setTournamentPhase } = useTournament();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Tournament | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tournament | null>(null);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-ball-spin" />
            <Trophy className="h-5 w-5 text-primary" />
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader
        title="Tournament Management"
        subtitle={tournament ? `${tournament.name} · ${tournament.season}` : 'Create and manage tournaments'}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Tournament' }]}
        action={
          <Button size="sm" className="glow-blue" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create New
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Active tournament card */}
        {tournament && (
          <TournamentDetailCard
            tournament={tournament}
            onEdit={() => setEditingTournament(tournament)}
            onPhaseChange={async (phase) => setTournamentPhase(tournament.id, phase)}
          />
        )}

        {/* All tournaments list */}
        <Card className="glass-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            All Tournaments ({tournaments.length})
          </h3>
          {tournaments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tournaments exist yet. Click &ldquo;Create New&rdquo; to set up your first tournament.
            </div>
          ) : (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/12 bg-card/30 px-4 py-3 transition-colors hover:bg-primary/5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display font-semibold">{t.name}</span>
                        {t.is_active && <Badge variant="success" className="shrink-0">Active</Badge>}
                        {t.status === 'Archived' && <Badge variant="secondary" className="shrink-0">Archived</Badge>}
                        {t.status === 'Draft' && <Badge variant="outline" className="shrink-0">Draft</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.season} · {t.tournament_format} · {t.manager_count} teams</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingTournament(t)} className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => duplicateTournament(t.id)} className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </button>
                    {t.status !== 'Archived' && (
                      <button onClick={() => setConfirmArchive(t)} className="rounded-md p-2 text-muted-foreground hover:bg-warning/10 hover:text-warning" title="Archive">
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(t)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showCreateModal && (
        <TournamentEditorModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const t = await createTournament(data);
            if (t) setShowCreateModal(false);
            return t !== null;
          }}
        />
      )}
      {editingTournament && (
        <TournamentEditorModal
          mode="edit"
          tournament={editingTournament}
          onClose={() => setEditingTournament(null)}
          onSave={async (data) => {
            const t = await updateTournament(editingTournament.id, data);
            if (t) setEditingTournament(null);
            return t !== null;
          }}
        />
      )}
      {confirmArchive && (
        <ConfirmModal
          title="Archive Tournament?"
          message={`Archiving "${confirmArchive.name}" will make it read-only. You can still view historical data, but no new registrations or matches can be added.`}
          confirmLabel="Archive"
          confirmVariant="warning"
          onClose={() => setConfirmArchive(null)}
          onConfirm={async () => {
            const ok = await archiveTournament(confirmArchive.id);
            if (ok) setConfirmArchive(null);
            return ok;
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Tournament?"
          message={`Deleting "${confirmDelete.name}" will permanently remove all associated data: team owners, players, fixtures, results, awards, and announcements. This cannot be undone.`}
          confirmLabel="Delete Permanently"
          confirmVariant="destructive"
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const ok = await deleteTournament(confirmDelete.id);
            if (ok) setConfirmDelete(null);
            return ok;
          }}
        />
      )}
    </AdminShell>
  );
}

function TournamentDetailCard({ tournament, onEdit, onPhaseChange }: { tournament: Tournament; onEdit: () => void; onPhaseChange: (phase: string) => Promise<boolean> }) {
  const fields = [
    { label: 'Short Name', value: tournament.short_name ?? '—' },
    { label: 'Season', value: tournament.season },
    { label: 'Organizer', value: tournament.organizer },
    { label: 'Tournament Type', value: tournament.tournament_format },
    { label: 'Match Format', value: tournament.match_format },
    { label: 'Number of Teams', value: `${tournament.manager_count}` },
    { label: 'Squad Size', value: `${tournament.squad_size}` },
    { label: 'Retained Players', value: `${tournament.retained_players}` },
    { label: 'Auction Players', value: `${tournament.auction_players}` },
    { label: 'Budget', value: `${tournament.budget} ${tournament.currency}` },
    { label: 'Base Price', value: `${tournament.base_price} ${tournament.currency}` },
    { label: 'Auction Timer', value: `${tournament.auction_timer}s` },
    { label: 'Qualification Rule', value: tournament.qualification_rule },
    { label: 'Points (W/D/L)', value: `${tournament.points_win}/${tournament.points_draw}/${tournament.points_loss}` },
    { label: 'Tie-Break Rule', value: tournament.tie_break_rule ?? '—' },
    { label: 'Theme Color', value: tournament.theme_color ?? '#3b82f6' },
    { label: 'Tournament Code', value: tournament.tournament_code ?? '—' },
    { label: 'Current Phase', value: tournament.current_phase },
    { label: 'Registration Window', value: formatDateRange(tournament.registration_start, tournament.registration_end) },
    { label: 'Nomination Window', value: formatDateRange(tournament.nomination_start, tournament.nomination_end) },
    { label: 'Auction Date', value: tournament.auction_date ?? '—' },
    { label: 'League Schedule', value: formatDateRange(tournament.league_start, tournament.league_end) },
    { label: 'Knockout Schedule', value: formatDateRange(tournament.knockout_start, tournament.knockout_end) },
  ];

  return (
    <Card className="glass-card-premium relative overflow-hidden p-6">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">{tournament.name}</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{tournament.season}</span>
                <Badge variant={tournament.is_active ? 'success' : 'outline'}>
                  {tournament.is_active ? 'Active' : tournament.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        </div>

        {tournament.description && (
          <p className="mb-5 text-sm text-muted-foreground">{tournament.description}</p>
        )}

        <PhaseController
          currentPhase={tournament.current_phase}
          onPhaseChange={onPhaseChange}
        />

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5 border-b border-primary/8 pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</span>
              <span className="truncate text-sm font-medium">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—';
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? '—';
}

function TournamentEditorModal({
  mode,
  tournament,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  tournament?: Tournament;
  onClose: () => void;
  onSave: (data: Partial<Tournament>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    name: tournament?.name ?? '',
    short_name: tournament?.short_name ?? '',
    season: tournament?.season ?? '',
    description: tournament?.description ?? '',
    logo_url: tournament?.logo_url ?? '',
    banner_url: tournament?.banner_url ?? '',
    organizer: tournament?.organizer ?? '',
    current_phase: tournament?.current_phase ?? 'Registration',
    tournament_format: tournament?.tournament_format ?? 'League + Knockout',
    match_format: tournament?.match_format ?? 'Single Match',
    manager_count: tournament?.manager_count ?? 8,
    squad_size: tournament?.squad_size ?? 17,
    retained_players: tournament?.retained_players ?? 1,
    auction_players: tournament?.auction_players ?? 16,
    budget: tournament?.budget ?? 100,
    currency: tournament?.currency ?? 'Cr',
    base_price: tournament?.base_price ?? 1,
    auction_timer: tournament?.auction_timer ?? 20,
    qualification_rule: tournament?.qualification_rule ?? 'Top 4',
    points_win: tournament?.points_win ?? 3,
    points_draw: tournament?.points_draw ?? 1,
    points_loss: tournament?.points_loss ?? 0,
    tie_break_rule: tournament?.tie_break_rule ?? 'Head-to-head, then goal difference, then goals scored',
    theme_color: tournament?.theme_color ?? '#3b82f6',
    registration_start: tournament?.registration_start ?? '',
    registration_end: tournament?.registration_end ?? '',
    nomination_start: tournament?.nomination_start ?? '',
    nomination_end: tournament?.nomination_end ?? '',
    auction_date: tournament?.auction_date ?? '',
    league_start: tournament?.league_start ?? '',
    league_end: tournament?.league_end ?? '',
    knockout_start: tournament?.knockout_start ?? '',
    knockout_end: tournament?.knockout_end ?? '',
    start_date: tournament?.start_date ?? '',
    end_date: tournament?.end_date ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.name.trim() || !form.season.trim() || !form.organizer.trim()) {
      setError('Tournament name, season, and organizer are required.');
      setSaving(false);
      return;
    }

    // Configuration validation
    const validationErrors: string[] = [];
    const managerCount = Number(form.manager_count);
    const squadSize = Number(form.squad_size);
    const retainedPlayers = Number(form.retained_players);
    const auctionPlayers = Number(form.auction_players);
    const budget = Number(form.budget);
    const basePrice = Number(form.base_price);

    if (managerCount < 2) validationErrors.push('Team count must be at least 2.');
    if (squadSize < 1) validationErrors.push('Squad size must be at least 1.');
    if (retainedPlayers < 0) validationErrors.push('Retained players cannot be negative.');
    if (retainedPlayers >= squadSize) validationErrors.push('Retained players must be less than squad size (players must be available to buy in the auction).');
    if (auctionPlayers < 1) validationErrors.push('Auction player pool must be at least 1.');
    if (basePrice < 0) validationErrors.push('Base price cannot be negative.');
    if (budget < basePrice) validationErrors.push('Budget per team must be at least the base price.');

    // Validate player pool sufficiency: each team needs (squadSize - retainedPlayers) auction players
    const playersNeededPerTeam = squadSize - retainedPlayers;
    const totalPlayersNeeded = playersNeededPerTeam * managerCount;
    if (auctionPlayers < totalPlayersNeeded) {
      validationErrors.push(
        `Player pool insufficient: ${managerCount} teams × ${playersNeededPerTeam} auction players each = ${totalPlayersNeeded} needed, but only ${auctionPlayers} available. Increase the auction player pool or reduce team count / squad size.`
      );
    }

    // Validate squad size against tournament format
    if (form.tournament_format === 'Knockout Only' && managerCount < 2) {
      validationErrors.push('Knockout-only format requires at least 2 teams.');
    }
    if ((form.tournament_format === 'League + Knockout' || form.tournament_format === 'League Only' || form.tournament_format === 'Group Stage + Knockout') && managerCount < 4) {
      validationErrors.push(`${form.tournament_format} format requires at least 4 teams.`);
    }

    // Validate qualification rule against team count
    const qualMap: Record<string, number> = { 'Top 2': 2, 'Top 4': 4, 'Top 6': 6 };
    const qualSlots = qualMap[form.qualification_rule] ?? 0;
    if (qualSlots > 0 && qualSlots > managerCount) {
      validationErrors.push(`Qualification rule (${form.qualification_rule}) requires at least ${qualSlots} teams, but only ${managerCount} are configured.`);
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      setSaving(false);
      return;
    }

    const data: Partial<Tournament> = {
      name: form.name.trim(),
      short_name: form.short_name.trim() || null,
      season: form.season.trim(),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      organizer: form.organizer.trim(),
      tournament_format: form.tournament_format,
      match_format: form.match_format,
      manager_count: Number(form.manager_count),
      squad_size: Number(form.squad_size),
      retained_players: Number(form.retained_players),
      auction_players: Number(form.auction_players),
      budget: Number(form.budget),
      currency: form.currency,
      base_price: Number(form.base_price),
      auction_timer: Number(form.auction_timer),
      qualification_rule: form.qualification_rule,
      points_win: Number(form.points_win),
      points_draw: Number(form.points_draw),
      points_loss: Number(form.points_loss),
      tie_break_rule: form.tie_break_rule,
      theme_color: form.theme_color,
      registration_start: form.registration_start || null,
      registration_end: form.registration_end || null,
      nomination_start: form.nomination_start || null,
      nomination_end: form.nomination_end || null,
      auction_date: form.auction_date || null,
      league_start: form.league_start || null,
      league_end: form.league_end || null,
      knockout_start: form.knockout_start || null,
      knockout_end: form.knockout_end || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    const ok = await onSave(data);
    if (!ok) {
      setError('Failed to save tournament. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold uppercase tracking-wide">
          {mode === 'create' ? 'Create Tournament' : 'Edit Tournament'}
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          {mode === 'create' ? 'Set up your eFootball tournament configuration.' : 'Update tournament details and settings.'}
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Basic Info */}
          <Section title="Basic Information">
            <Field label="Tournament Name *">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputCls} placeholder="Analytix eFootball League" />
            </Field>
            <Field label="Short Name">
              <input value={form.short_name} onChange={(e) => set('short_name', e.target.value)} className={inputCls} placeholder="AEL" />
            </Field>
            <Field label="Season *">
              <input value={form.season} onChange={(e) => set('season', e.target.value)} required className={inputCls} placeholder="Season 1" />
            </Field>
            <Field label="Organizer *">
              <input value={form.organizer} onChange={(e) => set('organizer', e.target.value)} required className={inputCls} placeholder="Gaming Council" />
            </Field>
            <Field label="Description" full>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inputCls} placeholder="Tournament description (optional)" />
            </Field>
            <Field label="Logo URL">
              <input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="Banner URL">
              <input value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>
          </Section>

          {/* Format */}
          <Section title="Format & Teams">
            <Field label="Tournament Type">
              <select value={form.tournament_format} onChange={(e) => set('tournament_format', e.target.value)} className={inputCls}>
                <option>League + Knockout</option><option>League Only</option><option>Knockout Only</option><option>Group Stage + Knockout</option>
              </select>
            </Field>
            <Field label="Match Format">
              <select value={form.match_format} onChange={(e) => set('match_format', e.target.value)} className={inputCls}>
                <option>Single Match</option><option>Two-Legged</option><option>Best of 3</option>
              </select>
            </Field>
            <Field label="Number of Teams">
              <input type="number" value={form.manager_count} onChange={(e) => set('manager_count', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Squad Size">
              <input type="number" value={form.squad_size} onChange={(e) => set('squad_size', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Retained Players">
              <input type="number" value={form.retained_players} onChange={(e) => set('retained_players', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Auction Players">
              <input type="number" value={form.auction_players} onChange={(e) => set('auction_players', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Qualification Rule">
              <select value={form.qualification_rule} onChange={(e) => set('qualification_rule', e.target.value)} className={inputCls}>
                <option>Top 2</option><option>Top 4</option><option>Top 6</option><option>All</option>
              </select>
            </Field>
          </Section>

          {/* Budget */}
          <Section title="Budget & Auction">
            <Field label="Budget">
              <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Currency">
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls}>
                <option>Cr</option><option>Coins</option><option>Points</option><option>Custom</option>
              </select>
            </Field>
            <Field label="Base Price">
              <input type="number" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Auction Timer (seconds)">
              <select value={form.auction_timer} onChange={(e) => set('auction_timer', e.target.value)} className={inputCls}>
                <option value={10}>10s</option><option value={15}>15s</option><option value={20}>20s</option><option value={30}>30s</option><option value={45}>45s</option><option value={60}>60s</option>
              </select>
            </Field>
          </Section>

          {/* Points */}
          <Section title="Points System">
            <Field label="Points for Win">
              <input type="number" value={form.points_win} onChange={(e) => set('points_win', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Points for Draw">
              <input type="number" value={form.points_draw} onChange={(e) => set('points_draw', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Points for Loss">
              <input type="number" value={form.points_loss} onChange={(e) => set('points_loss', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tie-Break Rule" full>
              <input value={form.tie_break_rule} onChange={(e) => set('tie_break_rule', e.target.value)} className={inputCls} />
            </Field>
          </Section>

          {/* Dates */}
          <Section title="Schedule & Dates">
            <Field label="Registration Start">
              <input type="date" value={form.registration_start} onChange={(e) => set('registration_start', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Registration End">
              <input type="date" value={form.registration_end} onChange={(e) => set('registration_end', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nomination Start">
              <input type="date" value={form.nomination_start} onChange={(e) => set('nomination_start', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nomination End">
              <input type="date" value={form.nomination_end} onChange={(e) => set('nomination_end', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Auction Date">
              <input type="date" value={form.auction_date} onChange={(e) => set('auction_date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="League Start">
              <input type="date" value={form.league_start} onChange={(e) => set('league_start', e.target.value)} className={inputCls} />
            </Field>
            <Field label="League End">
              <input type="date" value={form.league_end} onChange={(e) => set('league_end', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Knockout Start">
              <input type="date" value={form.knockout_start} onChange={(e) => set('knockout_start', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Knockout End">
              <input type="date" value={form.knockout_end} onChange={(e) => set('knockout_end', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tournament Start">
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tournament End">
              <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputCls} />
            </Field>
          </Section>

          {/* Phase (read-only) & Theme */}
          <Section title="Phase & Theme">
            <Field label="Current Phase (managed via Phase Controller)">
              <div className="flex h-11 items-center rounded-lg border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                <GitBranch className="mr-2 h-4 w-4" /> {form.current_phase}
              </div>
            </Field>
            <Field label="Theme Color">
              <div className="flex items-center gap-2">
                <input type="color" value={form.theme_color} onChange={(e) => set('theme_color', e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-input bg-background" />
                <input value={form.theme_color} onChange={(e) => set('theme_color', e.target.value)} className={inputCls} />
              </div>
            </Field>
          </Section>

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> {mode === 'create' ? 'Create Tournament' : 'Save Changes'}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-accent/70">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function ConfirmModal({
  title, message, confirmLabel, confirmVariant, onClose, onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'warning' | 'destructive';
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    const ok = await onConfirm();
    if (!ok) {
      setError('Operation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', confirmVariant === 'destructive' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning')}>
          {confirmVariant === 'destructive' ? <Trash2 className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
        </div>
        <h2 className="mb-1 font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant === 'destructive' ? 'destructive' : 'gold'} className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Phase Controller: lifecycle timeline + next/prev/jump
// ============================================================
function PhaseController({
  currentPhase,
  onPhaseChange,
}: {
  currentPhase: TournamentPhase;
  onPhaseChange: (phase: string) => Promise<boolean>;
}) {
  const [pendingPhase, setPendingPhase] = useState<TournamentPhase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentIndex = PHASES.indexOf(currentPhase);
  const canGoNext = currentIndex < PHASES.length - 1;
  const canGoPrev = currentIndex > 0;

  const handlePhaseChange = async (phase: TournamentPhase) => {
    setPendingPhase(phase);
    setError('');
    setSuccess('');
  };

  const confirmChange = async () => {
    if (!pendingPhase) return;
    setLoading(true);
    setError('');
    const ok = await onPhaseChange(pendingPhase);
    setLoading(false);
    if (ok) {
      setSuccess(`Phase changed to ${pendingPhase}`);
      setPendingPhase(null);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to change phase. Please try again.');
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-primary/15 bg-card/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-accent" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-accent">Tournament Lifecycle</h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!canGoPrev || loading}
            onClick={() => handlePhaseChange(PHASES[currentIndex - 1])}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canGoNext || loading}
            onClick={() => handlePhaseChange(PHASES[currentIndex + 1])}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {PHASES.map((phase, i) => {
          const isActive = phase === currentPhase;
          const isPast = i < currentIndex;
          const isPending = phase === pendingPhase;
          return (
            <button
              key={phase}
              onClick={() => handlePhaseChange(phase)}
              disabled={loading}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all',
                isActive && 'bg-primary/20 text-primary ring-1 ring-primary/40 shadow-[0_0_12px_-2px_hsl(217_91%_56%/0.4)]',
                isPast && !isActive && 'bg-success/10 text-success/70 hover:bg-success/20',
                !isActive && !isPast && !isPending && 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
                isPending && 'bg-warning/20 text-warning ring-1 ring-warning/40'
              )}
            >
              {isActive && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
              {isPending && <ArrowRightCircle className="h-3 w-3" />}
              {phase}
            </button>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {pendingPhase && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span>
              Change phase from <strong>{currentPhase}</strong> to <strong>{pendingPhase}</strong>?
              This will update all modules immediately.
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPendingPhase(null)} disabled={loading}>
              Cancel
            </Button>
            <Button size="sm" variant="gold" onClick={confirmChange} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Confirm
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}
    </div>
  );
}
