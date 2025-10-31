import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { Bid, AuctionSession } from '@/models/Auction';
import Registration from '@/models/Registration';
import Team from '@/models/Team';
import { isAuthenticated } from '@/lib/auth';

await dbConnect();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized User to access auction/id route' }, { status: 401 });
    }

    const { id: auctionId } = await params;

    const auction = await Auction.findById(auctionId)
      .populate('eventId', 'title description startDate startTime endTime venue images maxParticipants')
      .populate('players', 'name type category status contactNo photoUrl skillLevel iconPlayerRequest selfAssignedCategory bidPrice role teamId playerId')
      .populate('teams', 'name owner totalPoints pointsSpent pointsLeft players maxPlayers');

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
        const registrationIds = data.registrationIds || [];
        const registrations = await Registration.find({ _id: { $in: registrationIds } });
        const newRegistrationIds = registrations.map((r: any) => r._id);
        auction.players = [...new Set([...auction.players.map((p: any) => p.toString()), ...newRegistrationIds.map((r: any) => r.toString())])];
        break;

      case 'remove_players':
        const removeRegistrationIds = data.registrationIds || [];
        auction.players = auction.players.filter((p: any) => !removeRegistrationIds.includes(p.toString()));
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

      // Start bidding for a specific player (moderated)
      case 'start_bidding': {
        const { registrationId } = data || {};
        if (!registrationId) {
          return NextResponse.json(
            { success: false, error: 'registrationId is required' },
            { status: 400 }
          );
        }

        if (auction.status !== 'live') {
          return NextResponse.json(
            { success: false, error: 'Auction must be live to start bidding' },
            { status: 400 }
          );
        }

        const registration = await Registration.findById(registrationId);
        if (!registration || registration.status !== 'available') {
          return NextResponse.json(
            { success: false, error: 'Player not available' },
            { status: 400 }
          );
        }

        let session = await AuctionSession.findOne({ auctionId });
        if (!session) {
          session = new AuctionSession({ auctionId });
        }
        const now = new Date();
        session.currentPlayerId = registration._id as any;
        session.biddingStartTime = now;
        session.biddingEndTime = new Date(now.getTime() + (auction.timeLimitPerPlayer || 300) * 1000);
        session.isActive = true;
        await session.save();
        break;
      }

      // Move to next player (clear current and timers)
      case 'next_player': {
        const session = await AuctionSession.findOne({ auctionId });
        if (session) {
          session.currentHighestBid = undefined as any;
          session.currentPlayerId = undefined as any;
          session.biddingStartTime = undefined as any;
          session.biddingEndTime = undefined as any;
          await session.save();
        }
        break;
      }

      // Finalize the current winning bid and assign player to team
      case 'finalize_bid': {
        const { bidId } = data || {};
        if (!bidId) {
          return NextResponse.json(
            { success: false, error: 'bidId is required' },
            { status: 400 }
          );
        }

        const bid = await Bid.findById(bidId);
        if (!bid) {
          return NextResponse.json(
            { success: false, error: 'Bid not found' },
            { status: 404 }
          );
        }

        const registration = await Registration.findById(bid.playerId);
        const team = await Team.findById(bid.teamId);
        if (!registration || !team) {
          return NextResponse.json(
            { success: false, error: 'Registration or Team not found' },
            { status: 404 }
          );
        }

        if (registration.status === 'sold') {
          return NextResponse.json(
            { success: false, error: 'Player already sold' },
            { status: 400 }
          );
        }

        // Check if team has reached max players
        if ((team as any).maxPlayers && (team as any).players.length >= (team as any).maxPlayers) {
          return NextResponse.json(
            { success: false, error: 'Team has reached maximum player capacity' },
            { status: 400 }
          );
        }

        // Mark this bid as winning and clear other winning flags for the player
        await Bid.updateMany({ auctionId, playerId: bid.playerId }, { $set: { isWinning: false } });
        bid.isWinning = true;
        await bid.save();

        // Assign player to team and adjust team budget
        registration.status = 'sold';
        registration.teamId = team._id as any;
        registration.bidPrice = bid.amount;
        await registration.save();

        // For auction teams, update spent/left and add player record
        const purchase = {
          registrationId: registration._id as any,
          playerName: registration.name,
          category: registration.selfAssignedCategory || 'Uncategorized',
          purchasePrice: bid.amount,
          transactionDate: new Date(),
        } as any;

        if (!Array.isArray((team as any).players)) (team as any).players = [];
        (team as any).players.push(purchase);
        (team as any).pointsSpent = ((team as any).pointsSpent || 0) + bid.amount;
        (team as any).pointsLeft = ((team as any).totalPoints || 0) - ((team as any).pointsSpent || 0);
        await team.save();

        // Update auction totals and session stats
        auction.totalRevenue = (auction.totalRevenue || 0) + bid.amount;
        const session = await AuctionSession.findOne({ auctionId });
        if (session) {
          session.sessionStats.playersSold = (session.sessionStats.playersSold || 0) + 1;
          session.sessionStats.playersRemaining = Math.max(0, (session.sessionStats.playersRemaining || 0) - 1);
          session.sessionStats.totalRevenue = (session.sessionStats.totalRevenue || 0) + bid.amount;
          session.currentHighestBid = undefined as any;
          session.currentPlayerId = undefined as any;
          session.biddingStartTime = undefined as any;
          session.biddingEndTime = undefined as any;
          await session.save();
        }
        break;
      }

      // Randomly assign one Icon Player (Captain) per team
      case 'assign_icon_players': {
        // Fetch finalized registrations who requested icon and are available
        const iconRegistrations = await Registration.find({ 
          iconPlayerRequest: true, 
          status: 'available',
          _id: { $in: auction.players }
        });
        const teams = await Team.find({ _id: { $in: auction.teams } });
        if (teams.length === 0 || iconRegistrations.length === 0) {
          break;
        }

        // Shuffle registrations
        const pool = iconRegistrations.sort(() => Math.random() - 0.5);

        for (const team of teams) {
          const pick = pool.pop();
          if (!pick) break;

          // Check if team has space
          if ((team as any).maxPlayers && (team as any).players.length >= (team as any).maxPlayers) {
            continue;
          }

          // Assign as captain
          pick.role = 'Captain';
          pick.teamId = team._id as any;
          pick.status = 'sold';
          await pick.save();

          // Add zero-price captain to team roster
          if (!Array.isArray((team as any).players)) (team as any).players = [];
          (team as any).players.push({
            registrationId: pick._id as any,
            playerName: pick.name,
            category: pick.selfAssignedCategory || 'Icon',
            purchasePrice: 0,
            transactionDate: new Date(),
          });
          await team.save();
        }
        break;
      }

      // Manual assignment of player to team by moderator
      case 'manual_assign': {
        const { registrationId, teamId, bidPrice } = data || {};
        if (!registrationId || !teamId || bidPrice === undefined) {
          return NextResponse.json(
            { success: false, error: 'registrationId, teamId, and bidPrice are required' },
            { status: 400 }
          );
        }

        const registration = await Registration.findById(registrationId);
        const team = await Team.findById(teamId);
        if (!registration || !team) {
          return NextResponse.json(
            { success: false, error: 'Registration or Team not found' },
            { status: 404 }
          );
        }

        if (registration.status === 'sold') {
          return NextResponse.json(
            { success: false, error: 'Player already sold' },
            { status: 400 }
          );
        }

        // Check if team has reached max players
        if ((team as any).maxPlayers && (team as any).players.length >= (team as any).maxPlayers) {
          return NextResponse.json(
            { success: false, error: 'Team has reached maximum player capacity' },
            { status: 400 }
          );
        }

        // Assign player to team
        registration.status = 'sold';
        registration.teamId = team._id as any;
        registration.bidPrice = bidPrice;
        await registration.save();

        // Update team roster and budget
        const purchase = {
          registrationId: registration._id as any,
          playerName: registration.name,
          category: registration.selfAssignedCategory || 'Uncategorized',
          purchasePrice: bidPrice,
          transactionDate: new Date(),
        } as any;

        if (!Array.isArray((team as any).players)) (team as any).players = [];
        (team as any).players.push(purchase);
        (team as any).pointsSpent = ((team as any).pointsSpent || 0) + bidPrice;
        (team as any).pointsLeft = ((team as any).totalPoints || 0) - ((team as any).pointsSpent || 0);
        await team.save();

        // Update auction totals
        auction.totalRevenue = (auction.totalRevenue || 0) + bidPrice;

        // Clear current player from session
        const session = await AuctionSession.findOne({ auctionId });
        if (session) {
          session.sessionStats.playersSold = (session.sessionStats.playersSold || 0) + 1;
          session.sessionStats.playersRemaining = Math.max(0, (session.sessionStats.playersRemaining || 0) - 1);
          session.sessionStats.totalRevenue = (session.sessionStats.totalRevenue || 0) + bidPrice;
          session.currentPlayerId = undefined as any;
          session.biddingStartTime = undefined as any;
          session.biddingEndTime = undefined as any;
          await session.save();
        }
        break;
      }

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
