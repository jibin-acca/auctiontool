'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, Plus, Search, Pencil, Trash2, X, Loader2, AlertCircle, Shield,
} from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { TeamBadge, getInitials } from '@/components/arena/team-badge';
import { cn } from '@/lib/utils';
import { notifyTournamentEvent } from '@/lib/notifications';
import type { TeamOwner, Player } from '@/lib/types';

export default function AdminRetainedPlayersPage() {
  const { tournament, loading } = useTournament();
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  const fetchData = useCallback(async (tid: string) => {
    const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tid).order('name');
    const { data: pl } = await supabase.from('players').select('*').eq('tournament_id', tid).eq('is_retained', true).order('name');
    setOwners((ow ?? []) as TeamOwner[]);
    setPlayers((pl ?? []) as Player[]);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchData(tournament.id);
  }, [tournament, fetchData]);

  const filtered = players.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  const maxRetained = tournament?.retained_players ?? 1;
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><UserCheck className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Retained Players" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Retained Players' }]} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={UserCheck} title="No Tournament Created" description="Create a tournament first to manage retained players." />
        </div>
      </AdminShell>
    );
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Retained Players' }];

  if (owners.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="Retained Players" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={UserCheck} title="No Team Owners Yet" description="Add team owners before assigning retained players." action={<Button size="sm" onClick={() => window.location.href = '/admin/team-owners'}>Go to Team Owners</Button>} />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader
        title="Retained Players"
        subtitle={`${players.length} retained · max ${maxRetained} per team`}
        breadcrumbs={breadcrumbs}
        action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Retained Player</Button>}
      />
      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search player name..." />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={UserCheck} title={search ? "No matching players" : "No retained players yet"} description={search ? "Try a different search term." : "Add retained players to assign them to teams before the auction."} action={!search ? <Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Retained Player</Button> : undefined} />
        ) : (
          <div className="space-y-4">
            {/* Team-wise listing */}
            {owners.map((owner) => {
              const teamRetained = filtered.filter((p) => p.retained_by === owner.id);
              if (teamRetained.length === 0) return null;
              const overLimit = teamRetained.length > maxRetained;
              return (
                <Card key={owner.id} className="glass-card overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b border-border/60 bg-card/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TeamBadge initials={getInitials(owner.team_name ?? owner.name)} color={owner.team_color} name={owner.team_name ?? owner.name} size="sm" className="h-8 w-8 text-[10px]" />
                      <div>
                        <div className="font-display font-bold">{owner.team_name ?? owner.name}</div>
                        <div className="text-xs text-muted-foreground">{owner.name}</div>
                      </div>
                    </div>
                    <Badge className={cn('border-0', overLimit ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent')}>
                      {teamRetained.length}/{maxRetained}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/20">
                    {teamRetained.map((p) => (
                      <div key={p.id} className="group flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-accent" />
                          <span className="font-medium">{p.name}</span>
                          {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Base: {p.base_price}</span>
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => setEditingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeletingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            {/* Unassigned retained players */}
            {filtered.filter((p) => !p.retained_by || !ownerMap.has(p.retained_by)).length > 0 && (
              <Card className="glass-card overflow-hidden p-0">
                <div className="border-b border-border/60 bg-card/40 px-4 py-3">
                  <div className="font-display font-bold text-muted-foreground">Unassigned</div>
                </div>
                <div className="divide-y divide-border/20">
                  {filtered.filter((p) => !p.retained_by || !ownerMap.has(p.retained_by)).map((p) => (
                    <div key={p.id} className="group flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/20">
                      <span className="font-medium">{p.name}</span>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => setEditingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeletingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRetainedPlayerModal
          tournamentId={tournament.id}
          owners={owners}
          maxRetained={maxRetained}
          currentRetained={players}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchData(tournament.id); setShowAddModal(false); }}
        />
      )}
      {editingPlayer && (
        <EditRetainedPlayerModal
          player={editingPlayer}
          owners={owners}
          maxRetained={maxRetained}
          currentRetained={players}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => { fetchData(tournament.id); setEditingPlayer(null); }}
        />
      )}
      {deletingPlayer && (
        <DeleteRetainedPlayerModal
          player={deletingPlayer}
          onClose={() => setDeletingPlayer(null)}
          onDeleted={() => { fetchData(tournament.id); setDeletingPlayer(null); }}
        />
      )}
    </AdminShell>
  );
}

function AddRetainedPlayerModal({ tournamentId, owners, maxRetained, currentRetained, onClose, onAdded }: {
  tournamentId: string;
  owners: TeamOwner[];
  maxRetained: number;
  currentRetained: Player[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [basePrice, setBasePrice] = useState('1');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('Player name is required.'); setLoading(false); return; }
    if (!ownerId) { setError('Select a team owner.'); setLoading(false); return; }

    const retainedCount = currentRetained.filter((p) => p.retained_by === ownerId).length;
    if (retainedCount >= maxRetained) {
      setError(`This team already has the maximum (${maxRetained}) retained players.`);
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase.from('players').select('id').eq('tournament_id', tournamentId).eq('name', name.trim()).maybeSingle();
    if (existing) {
      setError('A player with this name already exists in this tournament.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('players').insert({
      tournament_id: tournamentId,
      name: name.trim(),
      base_price: parseFloat(basePrice) || 1,
      category: category.trim() || null,
      is_retained: true,
      retained_by: ownerId,
      status: 'Retained',
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const owner = owners.find((o) => o.id === ownerId);
    await notifyTournamentEvent(null, 'Retained Player Added', `${name.trim()} assigned to ${owner?.team_name ?? owner?.name ?? 'a team'}`, 'success');
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Add Retained Player</h2>
        <p className="mb-5 text-sm text-muted-foreground">Assign a retained player to a team before the auction.</p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Player Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Player name" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Assign to Team *</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Select team owner...</option>
              {owners.map((o) => {
                const count = currentRetained.filter((p) => p.retained_by === o.id).length;
                return (
                  <option key={o.id} value={o.id} disabled={count >= maxRetained}>
                    {o.team_name ?? o.name} ({count}/{maxRetained} retained){count >= maxRetained ? ' — Full' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Base Price</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="e.g. Batsman" />
            </div>
          </div>
          {error && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <>Add Player</>}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRetainedPlayerModal({ player, owners, maxRetained, currentRetained, onClose, onSaved }: {
  player: Player;
  owners: TeamOwner[];
  maxRetained: number;
  currentRetained: Player[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(player.name);
  const [ownerId, setOwnerId] = useState(player.retained_by ?? '');
  const [basePrice, setBasePrice] = useState(String(player.base_price));
  const [category, setCategory] = useState(player.category ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('Player name is required.'); setLoading(false); return; }

    if (ownerId !== player.retained_by) {
      const retainedCount = currentRetained.filter((p) => p.retained_by === ownerId && p.id !== player.id).length;
      if (retainedCount >= maxRetained) {
        setError(`Target team already has the maximum (${maxRetained}) retained players.`);
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase.from('players').update({
      name: name.trim(),
      retained_by: ownerId || null,
      base_price: parseFloat(basePrice) || 1,
      category: category.trim() || null,
    }).eq('id', player.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Edit Retained Player</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Player Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Assign to Team</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Unassigned</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.team_name ?? o.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Base Price</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="e.g. Batsman" />
            </div>
          </div>
          {error && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>Save Changes</>}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteRetainedPlayerModal({ player, onClose, onDeleted }: {
  player: Player;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const { error: deleteError } = await supabase.from('players').delete().eq('id', player.id);
    if (deleteError) { setError(deleteError.message); setLoading(false); return; }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 font-display text-lg font-bold">Delete Retained Player</h2>
        <p className="text-sm text-muted-foreground">Are you sure you want to remove <span className="font-medium text-foreground">{player.name}</span> from retained players?</p>
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" className="flex-1" disabled={loading} onClick={handleDelete}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete</Button>
        </div>
      </div>
    </div>
  );
}
