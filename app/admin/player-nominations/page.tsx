'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, Search, Pencil, Trash2, X, Loader2, AlertCircle,
  Check, Ban, Filter, CheckCheck, Upload, Download, FileSpreadsheet,
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
import { parseCSV, downloadTemplate, downloadCSV } from '@/lib/csv-utils';
import type { TeamOwner, Player } from '@/lib/types';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected';

export default function AdminPlayerNominationsPage() {
  const { tournament, loading } = useTournament();
  const [players, setPlayers] = useState<Player[]>([]);
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchData = useCallback(async (tid: string) => {
    const { data: pl } = await supabase.from('players').select('*').eq('tournament_id', tid).neq('is_retained', true).order('created_at', { ascending: false });
    const { data: ow } = await supabase.from('team_owners').select('*').eq('tournament_id', tid);
    setPlayers((pl ?? []) as Player[]);
    setOwners((ow ?? []) as TeamOwner[]);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchData(tournament.id);
  }, [tournament, fetchData]);

  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const filtered = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.category?.toLowerCase().includes(q) ?? false)) return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleExport = () => {
    downloadCSV('player-nominations.csv', ['name', 'category', 'base_price', 'status', 'nominated_by'], 
      filtered.map((p) => {
        const owner = p.nominated_by ? ownerMap.get(p.nominated_by) : null;
        return [p.name, p.category ?? '', p.base_price, p.status, owner?.name ?? 'Admin'];
      }));
  };

  const [actionError, setActionError] = useState('');

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from('players').update({ status: 'Approved' }).in('id', ids);
    if (error) { setActionError(error.message); return; }
    await notifyTournamentEvent(tournament, `${ids.length} nominations approved`, undefined, 'success');
    setSelected(new Set());
    setActionError('');
    if (tournament) fetchData(tournament.id);
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from('players').update({ status: 'Rejected' }).in('id', ids);
    if (error) { setActionError(error.message); return; }
    await notifyTournamentEvent(tournament, `${ids.length} nominations rejected`, undefined, 'warning');
    setSelected(new Set());
    setActionError('');
    if (tournament) fetchData(tournament.id);
  };

  const approveOne = async (p: Player) => {
    const { error } = await supabase.from('players').update({ status: 'Approved' }).eq('id', p.id);
    if (error) { setActionError(error.message); return; }
    setActionError('');
    if (tournament) fetchData(tournament.id);
  };

  const rejectOne = async (p: Player) => {
    const { error } = await supabase.from('players').update({ status: 'Rejected' }).eq('id', p.id);
    if (error) { setActionError(error.message); return; }
    setActionError('');
    if (tournament) fetchData(tournament.id);
  };

  const statusStyles: Record<string, string> = {
    Draft: 'bg-muted/40 text-muted-foreground',
    Pending: 'bg-warning/20 text-warning',
    Approved: 'bg-success/20 text-success',
    Rejected: 'bg-destructive/20 text-destructive',
  };

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><ClipboardList className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Player Nominations" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Player Nominations' }]} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={ClipboardList} title="No Tournament Created" description="Create a tournament first to manage nominations." />
        </div>
      </AdminShell>
    );
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Player Nominations' }];

  return (
    <AdminShell>
      <PageHeader
        title="Player Nominations"
        subtitle={`${players.length} players · ${players.filter((p) => p.status === 'Approved').length} approved`}
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}><Upload className="mr-1.5 h-4 w-4" /> Import</Button>
            <Button size="sm" variant="outline" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Nomination</Button>
          </div>
        }
      />
      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Search + Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search name or category..." />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-input bg-background p-1">
            <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            {(['all', 'Pending', 'Approved', 'Rejected'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors', statusFilter === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <Card className="glass-card flex items-center justify-between p-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={bulkApprove}><CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Approve All</Button>
              <Button size="sm" variant="outline" onClick={bulkReject}><X className="mr-1.5 h-3.5 w-3.5" /> Reject All</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </Card>
        )}
        {actionError && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{actionError}</span></div>}

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={search || statusFilter !== 'all' ? "No matching nominations" : "No nominations yet"}
            description={search || statusFilter !== 'all' ? "Try adjusting your filters." : "Add player nominations for the auction pool."}
            action={!search && statusFilter === 'all' ? <Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Nomination</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px] space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_0.8fr_0.8fr_0.8fr_6rem] gap-2 border-b border-border/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center">
                  <button onClick={toggleSelectAll} className="flex h-4 w-4 items-center justify-center rounded border border-border/60">
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="h-3 w-3" />}
                  </button>
                </div>
                <span>Player</span>
                <span>Nominated By</span>
                <span>Category</span>
                <span>Base Price</span>
                <span>Status</span>
                <span className="text-center">Actions</span>
              </div>
              {filtered.map((p) => {
                const owner = p.nominated_by ? ownerMap.get(p.nominated_by) : null;
                return (
                  <div key={p.id} className={cn('grid grid-cols-[2rem_1fr_1fr_0.8fr_0.8fr_0.8fr_6rem] items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/20', selected.has(p.id) && 'bg-primary/5')}>
                    <button onClick={() => toggleSelect(p.id)} className="flex h-4 w-4 items-center justify-center rounded border border-border/60">
                      {selected.has(p.id) && <Check className="h-3 w-3 text-primary" />}
                    </button>
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="truncate text-muted-foreground">{owner ? (owner.team_name ?? owner.name) : 'Admin'}</span>
                    <span className="truncate text-muted-foreground">{p.category ?? '—'}</span>
                    <span className="text-muted-foreground">{p.base_price}</span>
                    <Badge className={cn('border-0 w-fit', statusStyles[p.status] ?? statusStyles.Draft)}>{p.status}</Badge>
                    <div className="flex items-center justify-center gap-0.5">
                      {p.status !== 'Approved' && <button onClick={() => approveOne(p)} className="rounded-md p-1 text-muted-foreground hover:bg-success/10 hover:text-success" title="Approve"><Check className="h-3.5 w-3.5" /></button>}
                      {p.status !== 'Rejected' && <button onClick={() => rejectOne(p)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Reject"><Ban className="h-3.5 w-3.5" /></button>}
                      <button onClick={() => setEditingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeletingPlayer(p)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportPlayersModal tournamentId={tournament.id} owners={owners} onClose={() => setShowImportModal(false)} onImported={() => { fetchData(tournament.id); setShowImportModal(false); }} />
      )}
      {showAddModal && (
        <AddNominationModal
          tournamentId={tournament.id}
          owners={owners}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchData(tournament.id); setShowAddModal(false); }}
        />
      )}
      {editingPlayer && (
        <EditNominationModal
          player={editingPlayer}
          owners={owners}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => { fetchData(tournament.id); setEditingPlayer(null); }}
        />
      )}
      {deletingPlayer && (
        <DeleteNominationModal
          player={deletingPlayer}
          onClose={() => setDeletingPlayer(null)}
          onDeleted={() => { fetchData(tournament.id); setDeletingPlayer(null); }}
        />
      )}
    </AdminShell>
  );
}

function AddNominationModal({ tournamentId, owners, onClose, onAdded }: {
  tournamentId: string;
  owners: TeamOwner[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('1');
  const [nominatedBy, setNominatedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('Player name is required.'); setLoading(false); return; }

    const { data: existing } = await supabase.from('players').select('id').eq('tournament_id', tournamentId).eq('name', name.trim()).maybeSingle();
    if (existing) {
      setError('A player with this name already exists in this tournament.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('players').insert({
      tournament_id: tournamentId,
      name: name.trim(),
      category: category.trim() || null,
      base_price: parseFloat(basePrice) || 1,
      nominated_by: nominatedBy || null,
      status: 'Pending',
      is_retained: false,
    });

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Add Player Nomination</h2>
        <form onSubmit={handleAdd} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Player Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Player name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="e.g. Batsman" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Base Price</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nominated By (optional)</label>
            <select value={nominatedBy} onChange={(e) => setNominatedBy(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Admin nomination</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.team_name ?? o.name}</option>)}
            </select>
          </div>
          {error && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <>Add Nomination</>}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditNominationModal({ player, owners, onClose, onSaved }: {
  player: Player;
  owners: TeamOwner[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(player.name);
  const [category, setCategory] = useState(player.category ?? '');
  const [basePrice, setBasePrice] = useState(String(player.base_price));
  const [nominatedBy, setNominatedBy] = useState(player.nominated_by ?? '');
  const [status, setStatus] = useState(player.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.from('players').update({
      name: name.trim(),
      category: category.trim() || null,
      base_price: parseFloat(basePrice) || 1,
      nominated_by: nominatedBy || null,
      status,
    }).eq('id', player.id);

    if (updateError) { setError(updateError.message); setLoading(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Edit Nomination</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Player Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Base Price</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nominated By</label>
            <select value={nominatedBy} onChange={(e) => setNominatedBy(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Admin nomination</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.team_name ?? o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
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

function DeleteNominationModal({ player, onClose, onDeleted }: {
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
        <h2 className="mb-2 font-display text-lg font-bold">Delete Nomination</h2>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{player.name}</span>?</p>
        {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" className="flex-1" disabled={loading} onClick={handleDelete}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete</Button>
        </div>
      </div>
    </div>
  );
}

function ImportPlayersModal({ tournamentId, owners, onClose, onImported }: {
  tournamentId: string;
  owners: TeamOwner[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: { row: number; message: string }[]; duplicates: number; total: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setParsing(true);
    const text = await file.text();
    const rows = parseCSV(text);
    let success = 0;
    let duplicates = 0;
    const errors: { row: number; message: string }[] = [];

    for (const row of rows) {
      const name = row.data['name'] ?? '';
      if (!name) { errors.push({ row: row.rowNumber, message: 'Missing name' }); continue; }

      const { data: existing } = await supabase.from('players').select('id').eq('tournament_id', tournamentId).eq('name', name).maybeSingle();
      if (existing) { duplicates++; errors.push({ row: row.rowNumber, message: `Duplicate player: ${name}` }); continue; }

      const nominatedBy = row.data['nominated_by'] ?? '';
      const owner = owners.find((o) => o.name === nominatedBy || o.phone === nominatedBy);
      const { error } = await supabase.from('players').insert({
        tournament_id: tournamentId,
        name,
        category: row.data['category'] || null,
        base_price: parseFloat(row.data['base_price'] ?? '1') || 1,
        nominated_by: owner?.id ?? null,
        status: 'Pending',
        is_retained: false,
      });
      if (error) { errors.push({ row: row.rowNumber, message: error.message }); continue; }
      success++;
    }

    setResult({ success, errors, duplicates, total: rows.length });
    setParsing(false);
    if (success > 0) {
      await notifyTournamentEvent(null, 'Players Imported', `${success} players imported via CSV`, 'success');
      setTimeout(onImported, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Import Players</h2>
        <p className="mb-4 text-sm text-muted-foreground">CSV columns: name, category, base_price, nominated_by (team owner name or phone)</p>
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={() => downloadTemplate('players-template.csv', ['name', 'category', 'base_price', 'nominated_by'])}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Download Template</Button>
        </div>
        <div className="rounded-lg border-2 border-dashed border-border/60 p-6 text-center">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="players-csv-upload" />
          <label htmlFor="players-csv-upload" className="cursor-pointer">
            <FileSpreadsheet className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground">{file ? file.name : 'Click to select a CSV file'}</span>
          </label>
        </div>
        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-3 text-sm">
              <span className="text-success">Imported: {result.success}</span>
              {result.duplicates > 0 && <span className="text-warning">Duplicates: {result.duplicates}</span>}
              {result.errors.length > 0 && <span className="text-destructive">Errors: {result.errors.length}</span>}
              <span className="text-muted-foreground">Total: {result.total}</span>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 scrollbar-thin">
                {result.errors.map((e, i) => <div key={i} className="text-xs text-destructive">Row {e.row}: {e.message}</div>)}
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 glow-blue" disabled={!file || parsing} onClick={handleImport}>{parsing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <>Import CSV</>}</Button>
        </div>
      </div>
    </div>
  );
}
