'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Trophy, Loader2 } from 'lucide-react';

const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/setup'];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ADMIN_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;

    // If on setup page and already logged in, redirect to admin
    if (pathname === '/admin/setup' && session) {
      router.replace('/admin');
      return;
    }

    // If on login page and already logged in, redirect to admin
    if (pathname === '/admin/login' && session) {
      router.replace('/admin');
      return;
    }

    // For protected routes, check auth
    if (!isPublicRoute && !session) {
      (async () => {
        const { data } = await supabase
          .from('app_settings')
          .select('setup_complete')
          .maybeSingle();
        if (!data?.setup_complete) {
          router.replace('/admin/setup');
        } else {
          router.replace('/admin/login');
        }
      })();
    }
  }, [session, loading, router, pathname, isPublicRoute]);

  // Public routes render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes show loading until session is confirmed
  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
