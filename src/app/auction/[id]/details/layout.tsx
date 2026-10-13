import type { Metadata } from 'next';
import { getAuctionSummary, formatAuctionDate } from '@/lib/auctionSummary';

// Server wrapper for the (client) live auction page: title, description and the "live" preview image
// (opengraph-image.tsx in this folder) for shared links.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const summary = await getAuctionSummary(id).catch(() => null);
  if (!summary) return { title: 'Live Auction · Hikmah Student Life' };

  const when = formatAuctionDate(summary.auctionDate);
  const state =
    summary.status === 'live' ? '🔴 LIVE NOW' : summary.status === 'completed' ? 'Final squads' : `Starts ${when}`;
  const title = `${summary.name} — ${summary.status === 'completed' ? 'Results' : 'Live'}`;
  const description = [
    state,
    `${summary.soldCount}/${summary.poolCount} players sold`,
    `${summary.teamCount} teams`,
    summary.status === 'completed' ? "See every team's final squad and purse" : 'Follow every pick, team squads and purses',
  ].join(' | ');

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Hikmah Student Life', url: `/auction/${id}/details` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function LiveAuctionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
