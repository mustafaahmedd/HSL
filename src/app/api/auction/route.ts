import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { Bid, AuctionSession } from '@/models/Auction';
import Event from '@/models/Event';
import Player from '@/models/Player';
import Team from '@/models/Team';
import { isAuthenticated } from '@/lib/auth';

await dbConnect(); // Connect to MongoDB

export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized User to access auction route' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    let query: any = {};
    if (eventId) query.eventId = eventId;
    if (status) query.status = status;

    const auctions = await Auction.find(query)
      .populate('eventId', 'title description')
      .populate('players', 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole teamId playerId')
      .populate('teams', 'name owner totalBudget pointsSpent pointsLeft')
      .sort({ auctionDate: -1 });

    return NextResponse.json({
      success: true,
      auctions,
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      name,
      description,
      auctionDate,
      basePrice,
      biddingIncrement,
      timeLimitPerPlayer,
      settings,
    } = body;

    // Validate required fields
    if (!eventId || !name || !auctionDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const auction = new Auction({
      eventId,
      name,
      description,
      auctionDate: new Date(auctionDate),
      basePrice: basePrice || 100,
      biddingIncrement: biddingIncrement || 50,
      timeLimitPerPlayer: timeLimitPerPlayer || 300,
      settings: {
        allowMultipleBids: settings?.allowMultipleBids ?? true,
        autoAssignOnTimeout: settings?.autoAssignOnTimeout ?? false,
        requireMinimumBids: settings?.requireMinimumBids ?? true,
        minimumBidsRequired: settings?.minimumBidsRequired ?? 1,
      },
      players: [],
      teams: [],
      totalRevenue: 0,
    });

    await auction.save();

    // Create auction session
    const session = new AuctionSession({
      auctionId: auction._id,
      isActive: false,
      sessionStats: {
        totalPlayers: 0,
        playersSold: 0,
        playersRemaining: 0,
        totalRevenue: 0,
      },
    });

    await session.save();

    return NextResponse.json({
      success: true,
      auction,
      message: 'Auction created successfully',
    });
  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create auction' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { auctionId, updates } = body;

    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      );
    }

    const auction = await Auction.findByIdAndUpdate(
      auctionId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .populate('eventId', 'name description')
      .populate('players', 'name type category status')
      .populate('teams', 'name owner totalBudget pointsSpent pointsLeft');

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      auction,
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

export async function DELETE(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');

    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      );
    }

    // Check if auction exists and is not live
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    if (auction.status === 'live') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete live auction' },
        { status: 400 }
      );
    }

    // Delete related bids and session
    await Bid.deleteMany({ auctionId });
    await AuctionSession.deleteOne({ auctionId });
    await Auction.findByIdAndDelete(auctionId);

    return NextResponse.json({
      success: true,
      message: 'Auction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete auction' },
      { status: 500 }
    );
  }
}
