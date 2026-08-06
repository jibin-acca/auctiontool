'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Pin, X, Loader2, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdminShell, PageHeader } from '@/components/arena/admin-shell';
import { useTournament } from '@/lib/use-tournament';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/arena/empty-state';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/lib/types';

const priorityStyles: Record<string, string> = {
  Critical: 'bg-destructive/20 text-destructive',
  Important: 'bg-warning/20 text-warning',
  Normal: 'bg-primary/20 text-primary',
  Low: 'bg-muted/40 text-muted-foreground',
};

export default function AdminAnnouncementsPage() {
  const { tournament, loading } = useTournament();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(async (tid: string) => {
    const { data } = await supabase.from('announcements').select('*').eq('tournament_id', tid).order('created_at', { ascending: false });
    setAnnouncements((data ?? []) as Announcement[]);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    fetchAnnouncements(tournament.id);
  }, [tournament, fetchAnnouncements]);

  const [publishError, setPublishError] = useState('');
  const handleTogglePublish = async (ann: Announcement) => {
    const newStatus = ann.status === 'Published' ? 'Draft' : 'Published';
    const { error } = await supabase.from('announcements').update({ status: newStatus }).eq('id', ann.id);
    if (error) { setPublishError(error.message); return; }
    setPublishError('');
    if (tournament) fetchAnnouncements(tournament.id);
  };

  if (loading) {
    return <AdminShell><div className="flex items-center justify-center py-20"><Megaphone className="h-6 w-6 animate-pulse text-primary" /></div></AdminShell>;
  }

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Announcements' }];

  if (!tournament) {
    return (
      <AdminShell>
        <PageHeader title="Announcements" breadcrumbs={breadcrumbs} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState icon={Megaphone} title="No announcements have been published." description="No tournament has been created yet." />
        </div>
      </AdminShell>
    );
  }

  if (announcements.length === 0) {
    return (
      <AdminShell>
        <PageHeader title="Announcements" breadcrumbs={breadcrumbs} action={<Button size="sm" onClick={() => setShowCreateModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Create Announcement</Button>} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Megaphone}
            title="No announcements have been published."
            description="Create announcements to notify Team Owners about tournament updates, schedule changes, and important information."
            action={<Button size="sm" onClick={() => setShowCreateModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Create Announcement</Button>}
          />
        </div>
        {showCreateModal && <AnnouncementModal tournamentId={tournament.id} onClose={() => setShowCreateModal(false)} onSaved={() => { fetchAnnouncements(tournament.id); setShowCreateModal(false); }} />}
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader title="Announcements" subtitle={`${announcements.length} total`} breadcrumbs={breadcrumbs} action={<Button size="sm" onClick={() => setShowCreateModal(true)}><Plus className="mr-1.5 h-4 w-4" /> Create Announcement</Button>} />
      <div className="space-y-3 px-4 py-6 sm:px-6 lg:px-8">
        {publishError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{publishError}</div>}
        {announcements.map((a) => (
          <Card key={a.id} className="glass-card p-4 transition-all hover:border-primary/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    {a.priority === 'Critical' && <Pin className="h-3.5 w-3.5 text-destructive" />}
                    <h3 className="font-display font-semibold">{a.title}</h3>
                    {a.status === 'Draft' && <Badge className="bg-muted/40 text-muted-foreground border-0">Draft</Badge>}
                  </div>
                  {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(a.created_at).toLocaleDateString()}</span><span>·</span><span>{a.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={cn('border-0', priorityStyles[a.priority] ?? 'bg-muted/40 text-muted-foreground')}>{a.priority}</Badge>
                <button onClick={() => handleTogglePublish(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title={a.status === 'Published' ? 'Unpublish' : 'Publish'}>
                  {a.status === 'Published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditingAnn(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeletingAnn(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showCreateModal && <AnnouncementModal tournamentId={tournament.id} onClose={() => setShowCreateModal(false)} onSaved={() => { fetchAnnouncements(tournament.id); setShowCreateModal(false); }} />}
      {editingAnn && <AnnouncementModal tournamentId={tournament.id} announcement={editingAnn} onClose={() => setEditingAnn(null)} onSaved={() => { fetchAnnouncements(tournament.id); setEditingAnn(null); }} />}
      {deletingAnn && <DeleteAnnouncementModal announcement={deletingAnn} onClose={() => setDeletingAnn(null)} onDeleted={() => { fetchAnnouncements(tournament.id); setDeletingAnn(null); }} />}
    </AdminShell>
  );
}

function AnnouncementModal({ tournamentId, announcement, onClose, onSaved }: { tournamentId: string; announcement?: Announcement; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [category, setCategory] = useState(announcement?.category ?? 'General');
  const [priority, setPriority] = useState(announcement?.priority ?? 'Normal');
  const [status, setStatus] = useState(announcement?.status ?? 'Published');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      setLoading(false);
      return;
    }

    if (announcement) {
      const { error: updateError } = await supabase.from('announcements').update({
        title: title.trim(), body: body.trim() || null, category, priority, status,
      }).eq('id', announcement.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
    } else {
      const { error: insertError } = await supabase.from('announcements').insert({
        tournament_id: tournamentId, title: title.trim(), body: body.trim() || null, category, priority, status, created_by: user?.id,
      });
      if (insertError) { setError(insertError.message); setLoading(false); return; }
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <h2 className="mb-1 font-display text-xl font-bold">{announcement ? 'Edit Announcement' : 'Create Announcement'}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{announcement ? 'Update announcement details.' : 'Publish an announcement to all tournament participants.'}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Round 3 fixtures are live" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Announcement details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option>General</option><option>Registration</option><option>Auction</option><option>Fixtures</option><option>Results</option><option>Standings</option><option>Awards</option><option>Maintenance</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option>Low</option><option>Normal</option><option>Important</option><option>Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option>Published</option><option>Draft</option>
            </select>
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 glow-blue" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Megaphone className="mr-2 h-4 w-4" /> {announcement ? 'Save Changes' : 'Publish'}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAnnouncementModal({ announcement, onClose, onDeleted }: { announcement: Announcement; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const { error: deleteError } = await supabase.from('announcements').delete().eq('id', announcement.id);
    if (deleteError) { setError(deleteError.message); setLoading(false); return; }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card relative w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive"><Trash2 className="h-6 w-6" /></div>
        <h2 className="mb-1 font-display text-lg font-bold">Delete Announcement?</h2>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{announcement.title}</span>? This action cannot be undone.</p>
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
