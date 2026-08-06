'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/owner/dashboard');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
