import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { Bid, AuctionSession } from '@/models/Auction';
import Event from '@/models/Event';
import Player from '@/models/Player';
import Team from '@/models/Team';
import { isAuthenticated } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id: auctionId } = await params;

    const auction = await Auction.findById(auctionId)
      .populate('eventId', 'name description startDate endDate venue')
      .populate('players', 'name type category status contactNo photoUrl')
      .populate('teams', 'name owner totalBudget pointsSpent pointsLeft players');

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Get auction session
    const session = await AuctionSession.findOne({ auctionId })
      .populate('currentPlayerId', 'name type category')
      .populate('currentHighestBid')
      .populate('biddingHistory');

    // Get all bids for this auction
    const bids = await Bid.find({ auctionId })
      .populate('playerId', 'name type category')
      .populate('teamId', 'name owner')
      .sort({ timestamp: -1 });

    // Get auction statistics
    const stats = {
      totalPlayers: auction.players.length,
      playersSold: auction.players.filter((p: any) => p.status === 'sold').length,
      playersAvailable: auction.players.filter((p: any) => p.status === 'available').length,
      totalTeams: auction.teams.length,
      totalBids: bids.length,
      totalRevenue: auction.totalRevenue,
      averageBidAmount: bids.length > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length : 0,
    };

    return NextResponse.json({
      success: true,
      auction,
      session,
      bids,
      stats,
    });
  } catch (error) {
    console.error('Error fetching auction details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id: auctionId } = await params;
    const body = await request.json();
    const { action, data } = body;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update_settings':
        auction.basePrice = data.basePrice || auction.basePrice;
        auction.biddingIncrement = data.biddingIncrement || auction.biddingIncrement;
        auction.timeLimitPerPlayer = data.timeLimitPerPlayer || auction.timeLimitPerPlayer;
        auction.settings = { ...auction.settings, ...data.settings };
        break;

      case 'add_players':
        const playerIds = data.playerIds || [];
        const players = await Player.find({ _id: { $in: playerIds } });
        const newPlayerIds = players.map((p: any) => p._id);
        auction.players = [...new Set([...auction.players.map((p: any) => p.toString()), ...newPlayerIds.map((p: any) => p.toString())])];
        break;

      case 'remove_players':
        const removePlayerIds = data.playerIds || [];
        auction.players = auction.players.filter((p: any) => !removePlayerIds.includes(p.toString()));
        break;

      case 'add_teams':
        const teamIds = data.teamIds || [];
        const teams = await Team.find({ _id: { $in: teamIds } });
        const newTeamIds = teams.map((t: any) => t._id);
        auction.teams = [...new Set([...auction.teams.map((t: any) => t.toString()), ...newTeamIds.map((t: any) => t.toString())])];
        break;

      case 'remove_teams':
        const removeTeamIds = data.teamIds || [];
        auction.teams = auction.teams.filter((t: any) => !removeTeamIds.includes(t.toString()));
        break;

      case 'start_auction':
        if (auction.status !== 'upcoming') {
          return NextResponse.json(
            { success: false, error: 'Only upcoming auctions can be started' },
            { status: 400 }
          );
        }
        auction.status = 'live';
        
        // Create or update session
        let session = await AuctionSession.findOne({ auctionId });
        if (!session) {
          session = new AuctionSession({
            auctionId,
            isActive: true,
            sessionStats: {
              totalPlayers: auction.players.length,
              playersSold: 0,
              playersRemaining: auction.players.length,
              totalRevenue: 0,
            },
          });
        } else {
          session.isActive = true;
          session.sessionStats.totalPlayers = auction.players.length;
          session.sessionStats.playersRemaining = auction.players.length;
        }
        await session.save();
        break;

      case 'end_auction':
        if (auction.status !== 'live') {
          return NextResponse.json(
            { success: false, error: 'Only live auctions can be ended' },
            { status: 400 }
          );
        }
        auction.status = 'completed';
        
        // Update session
        const endSession = await AuctionSession.findOne({ auctionId });
        if (endSession) {
          endSession.isActive = false;
          await endSession.save();
        }
        break;

      case 'cancel_auction':
        auction.status = 'cancelled';
        
        // Update session
        const cancelSession = await AuctionSession.findOne({ auctionId });
        if (cancelSession) {
          cancelSession.isActive = false;
          await cancelSession.save();
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    await auction.save();

    const updatedAuction = await Auction.findById(auctionId)
      .populate('eventId', 'name description')
      .populate('players', 'name type category status')
      .populate('teams', 'name owner totalBudget pointsSpent pointsLeft');

    return NextResponse.json({
      success: true,
      auction: updatedAuction,
      message: 'Auction updated successfully',
    });
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update auction' },
      { status: 500 }
    );
  }
}
