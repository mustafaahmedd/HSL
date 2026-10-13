import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { AuctionSession } from '@/models/Auction';
import Registration from '@/models/Registration';
import Team from '@/models/Team';
import Event from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: auctionId } = await params;

    const auction = await Auction.findById(auctionId)
      .populate({
        path: 'eventId',
        model: Event,
        select: 'title description startDate startTime endTime venue images maxParticipants'
      })
      .populate({
        path: 'teams',
        model: Team,
        select: 'title owner totalPoints pointsSpent pointsLeft players maxPlayers captain',
        options: { lean: false }
      })
      .populate({
        path: 'players', 
        model: Registration,
        select: 'name status photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole playingStyle teamId playerId auctionStatus bidPrice teamName'
      });
    
    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Only return auction details if it's live or completed
    // This prevents showing details of upcoming auctions
    if (auction.status !== 'live' && auction.status !== 'completed') {
      return NextResponse.json({
        success: true,
        auction: {
          _id: auction._id,
          name: auction.name,
          status: auction.status,
          eventId: auction.eventId,
          teams: [],
          players: [],
          totalRevenue: 0
        }
      });
    }

    // Get auction session for current player info
    const session = await AuctionSession.findOne({ auctionId })
      .populate({
        path: 'currentPlayerId',
        model: Registration,
        select: 'name status photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole teamId playerId auctionStatus bidPrice teamName'
      });

    // Get the most recent assignment (last 10 seconds) for notification purposes
    let recentAssignment = null;
    const tenSecondsAgo = new Date(Date.now() - 10000);
    
    for (const team of auction.teams) {
        if (team.players && team.players.length > 0) {
            const recentPlayer = team.players
                .filter((p: any) => p.transactionDate && new Date(p.transactionDate) > tenSecondsAgo)
                .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0];
            
            if (recentPlayer) {
                recentAssignment = {
                    playerId: recentPlayer.registrationId?._id || recentPlayer.registrationId,
                    playerName: recentPlayer.playerName,
                    teamName: team.title,
                    bidPrice: recentPlayer.purchasePrice,
                    transactionDate: recentPlayer.transactionDate
                };
                break;
            }
        }
    }

    // Calculate basic statistics
    const stats = {
      totalPlayers: auction.players.length,
      playersSold: auction.players.filter((p: any) => p.auctionStatus === 'sold').length,
      playersAvailable: auction.players.filter((p: any) => p.auctionStatus !== 'sold').length,
      totalTeams: auction.teams.length,
      totalRevenue: auction.totalRevenue || 0,
    };

    // Public endpoint: never expose phone numbers (team rosters snapshot contactNo at purchase time)
    const publicAuction: any = auction.toObject();
    publicAuction.teams = (publicAuction.teams || []).map((t: any) => ({
      ...t,
      players: (Array.isArray(t.players) ? t.players : []).map(({ contactNo, ...rest }: any) => rest),
    }));

    return NextResponse.json({
      success: true,
      auction: publicAuction,
      session,
      recentAssignment,
      stats,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching public auction details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction details' },
      { status: 500 }
    );
  }
}
