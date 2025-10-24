import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { Bid, AuctionSession } from '@/models/Auction';
import Player from '@/models/Player';
import Team from '@/models/Team';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { auctionId, playerId, teamId, amount } = body;

    // Validate required fields
    if (!auctionId || !playerId || !teamId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if auction exists and is live
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    if (auction.status !== 'live') {
      return NextResponse.json(
        { success: false, error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Check if player exists and is available
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.status !== 'available') {
      return NextResponse.json(
        { success: false, error: 'Player is not available' },
        { status: 400 }
      );
    }

    // Check if team exists and has enough budget
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.pointsLeft < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient budget' },
        { status: 400 }
      );
    }

    // Check if bid meets minimum requirements
    if (amount < auction.basePrice) {
      return NextResponse.json(
        { success: false, error: `Bid must be at least ${auction.basePrice}` },
        { status: 400 }
      );
    }

    // Get current highest bid for this player
    const currentHighestBid = await Bid.findOne({
      auctionId,
      playerId,
      isWinning: true,
    });

    if (currentHighestBid) {
      const minimumBid = currentHighestBid.amount + auction.biddingIncrement;
      if (amount < minimumBid) {
        return NextResponse.json(
          { success: false, error: `Bid must be at least ${minimumBid}` },
          { status: 400 }
        );
      }
    }

    // Create new bid
    const bid = new Bid({
      auctionId,
      playerId,
      teamId,
      amount,
      timestamp: new Date(),
      isWinning: true,
      bidderInfo: {
        teamName: team.name,
        ownerName: team.owner,
      },
    });

    // Mark previous winning bid as not winning
    if (currentHighestBid) {
      currentHighestBid.isWinning = false;
      await currentHighestBid.save();
    }

    await bid.save();

    // Update auction session
    const session = await AuctionSession.findOne({ auctionId });
    if (session) {
      session.currentHighestBid = bid._id;
      session.biddingHistory.push(bid._id);
      await session.save();
    }

    // Populate bid with player and team info
    const populatedBid = await Bid.findById(bid._id)
      .populate('playerId', 'name type category')
      .populate('teamId', 'name owner');

    return NextResponse.json({
      success: true,
      bid: populatedBid,
      message: 'Bid placed successfully',
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');
    const playerId = searchParams.get('playerId');
    const teamId = searchParams.get('teamId');

    let query: any = {};
    if (auctionId) query.auctionId = auctionId;
    if (playerId) query.playerId = playerId;
    if (teamId) query.teamId = teamId;

    const bids = await Bid.find(query)
      .populate('playerId', 'name type category')
      .populate('teamId', 'name owner')
      .sort({ timestamp: -1 });

    return NextResponse.json({
      success: true,
      bids,
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}