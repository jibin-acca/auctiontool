'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useTournament } from '@/lib/use-tournament';
import type { Notification } from '@/lib/types';

export function NotificationCenter() {
  const { tournament } = useTournament();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!tournament) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_role', 'admin')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notification[]);
    setUnreadCount((data ?? []).filter((n) => !n.is_read).length);
    setLoading(false);
  }, [tournament]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!tournament) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const was = notifications.find((n) => n.id === id);
    if (was && !was.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const categoryStyles: Record<string, string> = {
    info: 'border-primary/30 bg-primary/5 text-primary',
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    error: 'border-destructive/30 bg-destructive/5 text-destructive',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shadow-[0_0_6px_2px_hsl(43_96%_56%/0.4)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 sm:w-96 rounded-xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl animate-scale-in">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'group relative px-4 py-3 transition-colors hover:bg-muted/20',
                      !n.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.is_read ? 'bg-muted-foreground/30' : 'bg-accent shadow-[0_0_4px_1px_hsl(43_96%_56%/0.4)]')} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', categoryStyles[n.category] ?? categoryStyles.info)}>
                            {n.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Mark as read">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
