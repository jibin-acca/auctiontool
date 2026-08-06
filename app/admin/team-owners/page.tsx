'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Upload, Download, X, Loader2, Pencil, Trash2,
  Copy, Check, QrCode, Link as LinkIcon, ArrowUpDown, ArrowUp, ArrowDown,
  FileSpreadsheet,
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
import { parseCSV, downloadTemplate, type ImportResult } from '@/lib/csv-utils';
import { notifyTournamentEvent } from '@/lib/notifications';
import type { TeamOwner, Tournament } from '@/lib/types';

const statusStyles: Record<string, string> = {
  Active: 'bg-success/20 text-success',
  Joined: 'bg-primary/20 text-primary',
  Invited: 'bg-muted/40 text-muted-foreground',
  'Nominations Pending': 'bg-warning/20 text-warning',
};

type SortField = 'name' | 'team_name' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

export default function AdminTeamOwnersPage() {
  const { tournament, loading } = useTournament();
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<TeamOwner | null>(null);
  const [deletingOwner, setDeletingOwner] = useState<TeamOwner | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showQR, setShowQR] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchOwners = useCallback(async (tid: string) => {
    const { data } = await supabase.from('team_owners').select('*').eq('tournament_id', tid).order('created_at');
    setOwners(data ?? []);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchOwners(tournament.id);
  }, [tournament, fetchOwners]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const inviteLink = tournament ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${tournament.tournament_code ?? ''}` : '';
  const tournamentCode = tournament?.tournament_code ?? '';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = owners.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.name.toLowerCase().includes(q) || (o.team_name?.toLowerCase().includes(q) ?? false) || o.phone.includes(q);
  }).sort((a, b) => {
    let av: string | null, bv: string | null;
    if (sortField === 'created_at') { av = a.created_at; bv = b.created_at; }
    else if (sortField === 'name') { av = a.name; bv = b.name; }
    else if (sortField === 'team_name') { av = a.team_name ?? ''; bv = b.team_name ?? ''; }
    else { av = a.status; bv = b.status; }
    if (!av) return 1;
    if (!bv) return -1;
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleExport = () => {
    if (owners.length === 0) return;
    const headers = ['Name', 'Phone', 'Email', 'Team Name', 'Department', 'Status', 'Joined At'];
    const rows = owners.map((o) => [
      o.name, o.phone, o.email ?? '', o.team_name ?? '', o.department ?? '', o.status, o.joined_at ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-owners-${tournament?.season ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Users className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Team Owners" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Team Owners' }]} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Users} title="No Managers Have Been Invited" description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Team Owners' }];

  if (owners.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="Team Owners" subtitle={`${tournament.name} · ${tournament.season}`} breadcrumbs={breadcrumbs} action={<Button size="sm" onClick={() => setShowAddModal(true)}><UserPlus className="mr-1.5 h-4 w-4" /> Add Team Owner</Button>} />
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <InvitationBar inviteLink={inviteLink} tournamentCode={tournamentCode} copiedField={copiedField} onCopy={copyToClipboard} onShowQR={() => setShowQR(true)} />
          <EmptyState
            icon={Users}
            title="No managers have been invited."
            description="Add team owners individually to invite them to the tournament. Share the tournament code or invitation link for self-registration."
            action={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowAddModal(true)}><UserPlus className="mr-1.5 h-4 w-4" /> Add Team Owner</Button>
              </div>
            }
          />
        </div>
        {showAddModal && <AddTeamOwnerModal tournamentId={tournament.id} onClose={() => setShowAddModal(false)} onAdded={() => { fetchOwners(tournament.id); setShowAddModal(false); }} />}
        {showQR && <QRModal code={tournamentCode} link={inviteLink} onClose={() => setShowQR(false)} />}
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader
        title="Team Owners"
        subtitle={`${owners.length}/${tournament.manager_count} joined`}
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}><Upload className="mr-1.5 h-4 w-4" /> Import</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}><UserPlus className="mr-1.5 h-4 w-4" /> Add Team Owner</Button>
          </div>
        }
      />
      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <InvitationBar inviteLink={inviteLink} tournamentCode={tournamentCode} copiedField={copiedField} onCopy={copyToClipboard} onShowQR={() => setShowQR(true)} />
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search name, team, phone..." />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px] space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_0.8fr_5rem] gap-2 border-b border-border/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-left hover:text-foreground">Name {sortField === 'name' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button>
              <button onClick={() => handleSort('team_name')} className="flex items-center gap-1 text-left hover:text-foreground">Team {sortField === 'team_name' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button>
              <span>Phone</span>
              <span>Department</span>
              <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-left hover:text-foreground">Status {sortField === 'status' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button>
              <span className="text-center">Actions</span>
            </div>
            {filtered.map((owner) => (
              <div key={owner.id} className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_0.8fr_5rem] items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/20">
                <div className="flex items-center gap-2">
                  <TeamBadge initials={getInitials(owner.team_name ?? owner.name)} color={owner.team_color} name={owner.team_name ?? owner.name} size="sm" className="h-8 w-8 text-[10px]" />
                  <span className="truncate font-medium">{owner.name}</span>
                </div>
                <span className="truncate text-muted-foreground">{owner.team_name ?? '—'}</span>
                <span className="truncate text-muted-foreground">{owner.phone}</span>
                <span className="truncate text-muted-foreground">{owner.department ?? '—'}</span>
                <Badge className={cn('border-0 w-fit', statusStyles[owner.status] ?? 'bg-muted/40 text-muted-foreground')}>{owner.status}</Badge>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setEditingOwner(owner)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeletingOwner(owner)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showAddModal && <AddTeamOwnerModal tournamentId={tournament.id} onClose={() => setShowAddModal(false)} onAdded={() => { fetchOwners(tournament.id); setShowAddModal(false); }} />}
      {editingOwner && <EditTeamOwnerModal owner={editingOwner} onClose={() => setEditingOwner(null)} onSaved={() => { fetchOwners(tournament.id); setEditingOwner(null); }} />}
      {deletingOwner && <DeleteConfirmModal owner={deletingOwner} onClose={() => setDeletingOwner(null)} onDeleted={() => { fetchOwners(tournament.id); setDeletingOwner(null); }} />}
      {showImportModal && <ImportTeamOwnersModal tournamentId={tournament.id} onClose={() => setShowImportModal(false)} onImported={() => { fetchOwners(tournament.id); setShowImportModal(false); }} />}
      {showQR && <QRModal code={tournamentCode} link={inviteLink} onClose={() => setShowQR(false)} />}
    </AdminShell>
  );
}

function InvitationBar({ inviteLink, tournamentCode, copiedField, onCopy, onShowQR }: { inviteLink: string; tournamentCode: string; copiedField: string | null; onCopy: (text: string, field: string) => void; onShowQR: () => void }) {
  return (
    <Card className="glass-card flex flex-wrap items-center gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tournament Code</span>
        <code className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-sm font-bold">{tournamentCode || 'N/A'}</code>
        <button onClick={() => onCopy(tournamentCode, 'code')} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Copy code">
          {copiedField === 'code' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invite Link</span>
        <code className="max-w-[200px] truncate rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs">{inviteLink}</code>
        <button onClick={() => onCopy(inviteLink, 'link')} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Copy link">
          {copiedField === 'link' ? <Check className="h-4 w-4 text-success" /> : <LinkIcon className="h-4 w-4" />}
        </button>
      </div>
      <Button variant="outline" size="sm" onClick={onShowQR} className="ml-auto"><QrCode className="mr-1.5 h-4 w-4" /> QR Code</Button>
    </Card>
  );
}

function QRModal({ code, link, onClose }: { code: string; link: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(link)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-4 text-center font-display text-lg font-bold">Scan to Join</h2>
        <div className="flex flex-col items-center gap-3">
          <img src={qrUrl} alt="QR Code" width={256} height={256} className="rounded-xl border border-border/60" />
          <code className="text-sm font-bold">{code}</code>
          <p className="text-xs text-muted-foreground">Scan this QR code to join the tournament</p>
        </div>
      </div>
    </div>
  );
}

function AddTeamOwnerModal({ tournamentId, onClose, onAdded }: { tournamentId: string; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required.');
      setLoading(false);
      return;
    }
    if (phone.trim().length < 10) {
      setError('Phone number must be at least 10 digits.');
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from('team_owners')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('phone', phone.trim())
      .maybeSingle();

    if (existing) {
      setError('A manager with this phone number already exists in this tournament.');
      setLoading(false);
      return;
    }

    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];
    const { data: insertedOwner, error: insertError } = await supabase.from('team_owners').insert({
      tournament_id: tournamentId,
      name: name.trim(),
      phone: phone.trim(),
      team_name: teamName.trim() || null,
      department: department.trim() || null,
      email: email.trim() || null,
      team_color: colors[Math.floor(Math.random() * colors.length)],
      status: 'Joined',
      joined_at: new Date().toISOString(),
    }).select().single();

    if (insertError || !insertedOwner) {
      setError(insertError?.message ?? 'Failed to add team owner.');
      setLoading(false);
      return;
    }

    // Generate an invitation record for this team owner
    const inviteCode = 'INV' + insertedOwner.id.slice(0, 8).toUpperCase();
    await supabase.from('manager_invitations').insert({
      tournament_id: tournamentId,
      team_owner_id: insertedOwner.id,
      invitation_code: inviteCode,
      manager_name: name.trim(),
      manager_phone: phone.trim(),
      status: 'Used',
      used_at: new Date().toISOString(),
    });

    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold">Add Team Owner</h2>
        <p className="mb-5 text-sm text-muted-foreground">Invite a manager to participate in the tournament.</p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="John Doe" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone Number *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="+91 98200 11223" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Team Name</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Blue Wolves" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Engineering" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="john@example.com" />
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <><UserPlus className="mr-2 h-4 w-4" /> Add Team Owner</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTeamOwnerModal({ owner, onClose, onSaved }: { owner: TeamOwner; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(owner.name);
  const [phone, setPhone] = useState(owner.phone);
  const [teamName, setTeamName] = useState(owner.team_name ?? '');
  const [department, setDepartment] = useState(owner.department ?? '');
  const [email, setEmail] = useState(owner.email ?? '');
  const [status, setStatus] = useState(owner.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('team_owners')
      .update({
        name: name.trim(),
        phone: phone.trim(),
        team_name: teamName.trim() || null,
        department: department.trim() || null,
        email: email.trim() || null,
        status,
      })
      .eq('id', owner.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold">Edit Team Owner</h2>
        <p className="mb-5 text-sm text-muted-foreground">Update manager details and registration status.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone Number *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Team Name</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option>Invited</option><option>Joined</option><option>Active</option><option>Nominations Pending</option>
            </select>
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Pencil className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ owner, onClose, onDeleted }: { owner: TeamOwner; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const { error: deleteError } = await supabase.from('team_owners').delete().eq('id', owner.id);
    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive"><Trash2 className="h-6 w-6" /></div>
        <h2 className="mb-1 font-display text-lg font-bold">Delete Team Owner?</h2>
        <p className="text-sm text-muted-foreground">Are you sure you want to remove <span className="font-medium text-foreground">{owner.name}</span> from the tournament? This action cannot be undone.</p>
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

function ImportTeamOwnersModal({ tournamentId, onClose, onImported }: { tournamentId: string; onClose: () => void; onImported: () => void }) {
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
      const phone = row.data['phone'] ?? '';
      if (!name) { errors.push({ row: row.rowNumber, message: 'Missing name' }); continue; }
      if (!phone) { errors.push({ row: row.rowNumber, message: 'Missing phone' }); continue; }

      const { data: existing } = await supabase.from('team_owners').select('id').eq('tournament_id', tournamentId).eq('phone', phone).maybeSingle();
      if (existing) { duplicates++; errors.push({ row: row.rowNumber, message: `Duplicate phone: ${phone}` }); continue; }

      const { error } = await supabase.from('team_owners').insert({
        tournament_id: tournamentId,
        name,
        phone,
        email: row.data['email'] || null,
        employee_id: row.data['employee_id'] || null,
        department: row.data['department'] || null,
        team_name: row.data['team_name'] || null,
        status: 'Invited',
      });
      if (error) { errors.push({ row: row.rowNumber, message: error.message }); continue; }
      success++;
    }

    setResult({ success, errors, duplicates, total: rows.length });
    setParsing(false);
    if (success > 0) {
      await notifyTournamentEvent(null, 'Team Owners Imported', `${success} team owners imported via CSV`, 'success');
      setTimeout(onImported, 1500);
    }
  };

  const downloadTemplateFile = () => {
    downloadTemplate('team-owners-template.csv', ['name', 'phone', 'email', 'employee_id', 'department', 'team_name']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-scale-in" onClick={onClose}>
      <div className="glass-card-premium relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-lg font-bold">Import Team Owners</h2>
        <p className="mb-4 text-sm text-muted-foreground">Upload a CSV file with columns: name, phone, email, employee_id, department, team_name</p>

        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplateFile}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Download Template</Button>
        </div>

        <div className="rounded-lg border-2 border-dashed border-border/60 p-6 text-center">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer">
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
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-destructive">Row {e.row}: {e.message}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 glow-blue" disabled={!file || parsing} onClick={handleImport}>
            {parsing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <>Import CSV</>}
          </Button>
        </div>
      </div>
    </div>
  );
}