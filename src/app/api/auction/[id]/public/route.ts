import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { AuctionSession } from '@/models/Auction';
import Registration from '@/models/Registration';

await dbConnect();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;

    const auction = await Auction.findById(auctionId)
      .populate('eventId', 'title description startDate startTime endTime venue images maxParticipants')
      .populate({
        path: 'teams',
        select: 'title owner totalPoints pointsSpent pointsLeft players maxPlayers captain',
        options: { lean: false }
      })
      .populate({
        path: 'players', 
        model: Registration,
        select: 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole teamId playerId auctionStatus bidPrice teamName'
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
        select: 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole teamId playerId auctionStatus bidPrice teamName'
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

    return NextResponse.json({
      success: true,
      auction,
      session,
      recentAssignment,
      stats,
    });
  } catch (error) {
    console.error('Error fetching public auction details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction details' },
      { status: 500 }
    );
  }
}
