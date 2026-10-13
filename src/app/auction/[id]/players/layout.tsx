import type { Metadata } from 'next';
import { getAuctionSummary, formatAuctionDate } from '@/lib/auctionSummary';

// Server wrapper for the (client) player pool page: gives shared links a proper title, description
// and the generated preview image (opengraph-image.tsx in this folder) on WhatsApp, Facebook, etc.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const summary = await getAuctionSummary(id).catch(() => null);
  if (!summary) return { title: 'Player Auction · Hikmah Student Life' };

  const title = `${summary.name} — Player Pool`;
  const when = formatAuctionDate(summary.auctionDate);
  const description = [
    `${summary.poolCount + summary.captainCount} players (${summary.captainCount} captains, ${summary.poolCount} up for auction)`,
    `${summary.teamCount} teams`,
    summary.categories.filter(c => c.count).map(c => `${c.name} ${c.count}`).join(' · '),
    when && `Live ${when}${summary.venue ? ` at ${summary.venue}` : ''}`,
  ].filter(Boolean).join(' | ');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Hikmah Student Life',
      url: `/auction/${id}/players`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function PlayerPoolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
