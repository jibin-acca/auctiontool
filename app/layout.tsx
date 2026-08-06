import './globals.css';
import type { Metadata } from 'next';
import { Inter, Rajdhani, Bebas_Neue } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { TournamentProvider } from '@/lib/tournament-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-rajdhani' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: ['400'], variable: '--font-bebas' });

export const metadata: Metadata = {
  title: 'ArenaOS — Tournament Operating System',
  description:
    'ArenaOS is the operating system for internal eFootball tournaments. Create tournaments, run live auctions, manage squads, fixtures, standings, and awards — all from one platform.',
  openGraph: {
    title: 'ArenaOS — Tournament Operating System',
    description:
      'Run your entire eFootball tournament from creation through auction, league, knockout, and awards.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable} ${bebas.variable}`}>
      <body className="font-sans">
        <AuthProvider><TournamentProvider>{children}</TournamentProvider></AuthProvider>
      </body>
    </html>
  );
}
