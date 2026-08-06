'use client';

import { Gavel } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/arena/empty-state';
import { useTournament } from '@/lib/use-tournament';

export default function OwnerAuctionPage() {
  const { tournament, loading } = useTournament();

  if (loading) {
    return <div className="flex justify-center py-20"><Gavel className="h-6 w-6 animate-pulse text-primary" /></div>;
  }

  if (!tournament) {
    return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">Live Auction</h1><EmptyState icon={Gavel} title="No Live Auction" description="No tournament has been created yet." /></div>;
  }

  if (tournament.current_phase !== 'Auction Live') {
    return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">Live Auction</h1><EmptyState icon={Gavel} title="No Live Auction" description={`The auction has not started yet. Current phase: ${tournament.current_phase}.`} /></div>;
  }

  return <div className="space-y-4 px-4 py-4"><h1 className="font-display text-xl font-bold">Live Auction</h1><EmptyState icon={Gavel} title="Auction in Progress" description="The auction is live. Bidding controls will appear here." /></div>;
}
