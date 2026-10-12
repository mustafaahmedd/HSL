import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction from '@/models/Auction';
import Registration from '@/models/Registration';
import Team from '@/models/Team';
import Event from '@/models/Event';
import { resolveCategorySettings } from '@/lib/auctionConfig';

export const dynamic = 'force-dynamic';

// GET /api/auction/[id]/pool — public, shareable player pool (no contact numbers or other private fields).
// Available before the auction starts, and reflects sales/captain matching live once it does.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: auctionId } = await params;

    const auction = await Auction.findById(auctionId).lean() as any;
    if (!auction) {
      return NextResponse.json({ success: false, error: 'Auction not found' }, { status: 404 });
    }

    const fields = 'name photoUrl approvedCategory approvedIconPlayer playerRole courseEnrolled auctionStatus teamName bidPrice';
    const [event, teams, registrations] = await Promise.all([
      Event.findById(auction.eventId, 'title venue startDate').lean() as any,
      Team.find({ _id: { $in: auction.teams } }, 'title owner captain totalPoints pointsLeft players').lean(),
      // Auction pool + the event's captains (captains are kept out of auction.players)
      Registration.find({
        $or: [
          { _id: { $in: auction.players } },
          { eventId: auction.eventId, approvedIconPlayer: true, status: 'approved' },
        ],
      }, fields).sort({ name: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      auction: {
        name: auction.name,
        status: auction.status,
        auctionDate: auction.auctionDate,
        event: event ? { title: event.title, venue: event.venue } : null,
      },
      categories: resolveCategorySettings(auction),
      teams: teams.map((t: any) => ({
        _id: t._id,
        title: t.title,
        owner: t.owner,
        captain: t.captain,
        totalPoints: t.totalPoints,
        pointsLeft: t.pointsLeft ?? t.totalPoints,
        playerCount: Array.isArray(t.players) ? t.players.length : 0,
      })),
      players: registrations.map((r: any) => ({
        _id: r._id,
        name: r.name,
        photoUrl: r.photoUrl,
        category: r.approvedIconPlayer ? 'Captain' : r.approvedCategory,
        playerRole: r.playerRole,
        courseEnrolled: r.courseEnrolled,
        sold: r.auctionStatus === 'sold' && !!r.teamName,
        teamName: r.teamName || '',
        bidPrice: r.bidPrice || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching auction pool:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch auction pool' }, { status: 500 });
  }
}
