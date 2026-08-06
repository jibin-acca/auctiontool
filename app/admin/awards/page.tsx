'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Trophy, Medal, Heart, Target, TrendingUp, Star, X, Loader2, Pencil, Trash2, Eye, UserCheck } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { cn } from '@/lib/utils';
import type { Award as AwardType, TeamOwner } from '@/lib/types';

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy, medal: Medal, award: Award, 'trending-up': TrendingUp, heart: Heart, target: Target, star: Star,
};
const iconOptions = ['trophy', 'medal', 'award', 'trending-up', 'heart', 'target', 'star'];

export default function AdminAwardsPage() {
  const { tournament, loading } = useTournament();
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardType | null>(null);
  const [deletingAward, setDeletingAward] = useState<AwardType | null>(null);
  const [assigningAward, setAssigningAward] = useState<AwardType | null>(null);

  const fetchAwards = useCallback(async (tid: string) => {
    const { data: aw } = await supabase.from('awards').select('*').eq('tournament_id', tid).order('display_order');
    const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tid);
    setOwners(ow ?? []);
    setAwards((aw ?? []) as AwardType[]);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchAwards(tournament.id);
  }, [tournament, fetchAwards]);

  const [publishError, setPublishError] = useState('');
  const handlePublish = async (award: AwardType) => {
    const { error } = await supabase.from('awards').update({ is_published: !award.is_published }).eq('id', award.id);
    if (error) { setPublishError(error.message); return; }
    setPublishError('');
    if (tournament) fetchAwards(tournament.id);
  };

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Award className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Awards' }];
  const ownerMap: Record<string, TeamOwner> = {};
  owners.forEach((o) => { ownerMap[o.id] = o; });

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Awards" breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Award} title="No Awards Available" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  if (awards.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="Awards" breadcrumbs={breadcrumbs} action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Award</Button>} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Award}
            title="No Awards Available"
            description="Create award categories like Champion, Runner-Up, Best Auction Manager, and more. Awards are assigned after the tournament concludes."
            action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Award</Button>}
          />
        </div>
        {showAddModal && <AwardModal tournamentId={tournament.id} onClose={() => setShowAddModal(false)} onSaved={() => { fetchAwards(tournament.id); setShowAddModal(false); }} />}
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader title="Awards" subtitle={`${awards.length} award categories`} breadcrumbs={breadcrumbs} action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Award</Button>} />
      <div className="grid gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {publishError && <div className="col-span-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{publishError}</div>}
        {awards.map((award) => {
          const Icon = iconMap[award.icon] ?? Trophy;
          const isChampion = award.name === 'Champion';
          const winner = award.winner_team_id ? ownerMap[award.winner_team_id] : null;
          return (
            <Card key={award.id} className={cn('glass-card relative overflow-hidden p-5 transition-all hover:border-accent/40', isChampion && 'border-accent/30 bg-accent/5')}>
              {isChampion && <div className="absolute right-0 top-0 h-24 w-24 bg-accent/10 blur-2xl" />}
              <div className="relative">
                <div className="mb-3 flex items-start justify-between">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', isChampion ? 'bg-accent/20 text-accent glow-gold' : 'bg-primary/10 text-primary')}><Icon className="h-6 w-6" /></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePublish(award)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title={award.is_published ? 'Unpublish' : 'Publish'}>
                      <Eye className={cn('h-3.5 w-3.5', award.is_published && 'text-success')} />
                    </button>
                    <button onClick={() => setEditingAward(award)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeletingAward(award)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold">{award.name}</h3>
                {award.description && <p className="mt-1 text-sm text-muted-foreground">{award.description}</p>}
                {award.prize && <div className="mt-3"><Badge variant="outline" className="border-accent/30 text-accent">{award.prize}</Badge></div>}
                <div className="mt-4 border-t border-border/50 pt-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Winner</div>
                  {winner ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-display font-bold text-accent">{winner.team_name ?? winner.name}</span>
                      <button onClick={() => setAssigningAward(award)} className="text-xs text-primary hover:underline">Change</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningAward(award)} className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                      <UserCheck className="h-3.5 w-3.5" /> Assign winner
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {showAddModal && <AwardModal tournamentId={tournament.id} onClose={() => setShowAddModal(false)} onSaved={() => { fetchAwards(tournament.id); setShowAddModal(false); }} />}
      {editingAward && <AwardModal tournamentId={tournament.id} award={editingAward} onClose={() => setEditingAward(null)} onSaved={() => { fetchAwards(tournament.id); setEditingAward(null); }} />}
      {deletingAward && <DeleteAwardModal award={deletingAward} onClose={() => setDeletingAward(null)} onDeleted={() => { fetchAwards(tournament.id); setDeletingAward(null); }} />}
      {assigningAward && <AssignWinnerModal award={assigningAward} owners={owners} onClose={() => setAssigningAward(null)} onAssigned={() => { fetchAwards(tournament.id); setAssigningAward(null); }} />}
    </AdminShell>
  );
}

function AwardModal({ tournamentId, award, onClose, onSaved }: { tournamentId: string; award?: AwardType; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(award?.name ?? '');
  const [description, setDescription] = useState(award?.description ?? '');
  const [prize, setPrize] = useState(award?.prize ?? '');
  const [icon, setIcon] = useState(award?.icon ?? 'trophy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('Award name is required.'); setLoading(false); return; }

    if (award) {
      const { error: updateError } = await supabase.from('awards').update({
        name: name.trim(), description: description.trim() || null, prize: prize.trim() || null, icon,
      }).eq('id', award.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
    } else {
      const { error: insertError } = await supabase.from('awards').insert({
        tournament_id: tournamentId, name: name.trim(), description: description.trim() || null, prize: prize.trim() || null, icon,
      });
      if (insertError) { setError(insertError.message); setLoading(false); return; }
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold">{award ? 'Edit Award' : 'Add Award'}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{award ? 'Update award details.' : 'Create a new award category for the tournament.'}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Award Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Champion" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Tournament winner" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Prize</label>
            <input value={prize} onChange={(e) => setPrize(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Gold Trophy + ₹10,000" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Icon</label>
            <select value={icon} onChange={(e) => setIcon(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              {iconOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Plus className="mr-2 h-4 w-4" /> {award ? 'Save Changes' : 'Add Award'}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAwardModal({ award, onClose, onDeleted }: { award: AwardType; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const { error: deleteError } = await supabase.from('awards').delete().eq('id', award.id);
    if (deleteError) { setError(deleteError.message); setLoading(false); return; }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive"><Trash2 className="h-6 w-6" /></div>
        <h2 className="mb-1 font-display text-lg font-bold">Delete Award?</h2>
        <p className="text-sm text-muted-foreground">Delete <span className="font-medium text-foreground">{award.name}</span>? This cannot be undone.</p>
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssignWinnerModal({ award, owners, onClose, onAssigned }: { award: AwardType; owners: TeamOwner[]; onClose: () => void; onAssigned: () => void }) {
  const [selected, setSelected] = useState(award.winner_team_id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAssign = async () => {
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.from('awards').update({ winner_team_id: selected || null }).eq('id', award.id);
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    onAssigned();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold">Assign Winner</h2>
        <p className="mb-5 text-sm text-muted-foreground">Select the team owner for <span className="font-medium text-foreground">{award.name}</span>.</p>
        {owners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team owners have joined the tournament yet.</p>
        ) : (
          <div className="space-y-2">
            {owners.map((o) => (
              <button key={o.id} onClick={() => setSelected(o.id)} className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors', selected === o.id ? 'border-accent bg-accent/10' : 'border-border/60 hover:bg-muted/20')}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: o.team_color }}>{(o.team_name ?? o.name).slice(0, 2).toUpperCase()}</div>
                <span className="flex-1 text-sm font-medium">{o.team_name ?? o.name}</span>
                {selected === o.id && <Trophy className="h-4 w-4 text-accent" />}
              </button>
            ))}
          </div>
        )}
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 glow-blue" onClick={handleAssign} disabled={loading || owners.length === 0}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : <><UserCheck className="mr-2 h-4 w-4" /> Assign</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
