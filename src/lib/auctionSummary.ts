import { Types } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Auction from '@/models/Auction';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { resolveCategorySettings } from '@/lib/auctionConfig';

export interface AuctionSummary {
  name: string;
  status: string;
  auctionDate?: Date;
  eventTitle?: string;
  venue?: string;
  poolCount: number;
  captainCount: number;
  teamCount: number;
  categories: { name: string; count: number; minBidPrice: number }[];
  /** Cloudinary photo URLs, captains and top tiers first (for previews) */
  photos: string[];
}

// Small, public-safe summary of an auction for link previews (metadata + Open Graph image).
export async function getAuctionSummary(auctionId: string): Promise<AuctionSummary | null> {
  if (!Types.ObjectId.isValid(auctionId)) return null;
  await dbConnect();

  const auction = await Auction.findById(auctionId).lean() as any;
  if (!auction) return null;

  const [event, players, captains] = await Promise.all([
    Event.findById(auction.eventId, 'title venue').lean() as any,
    Registration.find({ _id: { $in: auction.players }, approvedIconPlayer: { $ne: true } }, 'approvedCategory photoUrl').lean(),
    Registration.find({ eventId: auction.eventId, approvedIconPlayer: true, status: 'approved' }, 'photoUrl').lean(),
  ]);

  const settings = resolveCategorySettings(auction);
  const order = settings.map(c => c.name);
  const photoOf = (r: any) => (typeof r.photoUrl === 'string' && r.photoUrl.includes('res.cloudinary.com') ? r.photoUrl : null);
  const sortedPlayers = [...players].sort(
    (a: any, b: any) => order.indexOf(a.approvedCategory) - order.indexOf(b.approvedCategory)
  );

  return {
    name: auction.name,
    status: auction.status,
    auctionDate: auction.auctionDate,
    eventTitle: event?.title,
    venue: event?.venue,
    poolCount: players.length,
    captainCount: captains.length,
    teamCount: (auction.teams || []).length,
    categories: settings.map(c => ({
      name: c.name,
      minBidPrice: c.minBidPrice,
      count: players.filter((p: any) => p.approvedCategory === c.name).length,
    })),
    photos: [...captains, ...sortedPlayers].map(photoOf).filter(Boolean) as string[],
  };
}

export const formatAuctionDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
