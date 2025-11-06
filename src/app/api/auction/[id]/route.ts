import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction, { Bid, AuctionSession } from '@/models/Auction';
import Registration from '@/models/Registration';
import Team from '@/models/Team';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';

await dbConnect();

// Category quota validation function
const validateTeamCategoryQuota = (team: any, playerCategory: string): { valid: boolean; message?: string } => {
  if (!team || !team.players) {
    return { valid: true };
  }

  // Count existing players by category
  const categoryCount = {
    Platinum: 0,
    Diamond: 0,
    Gold: 0
  };

  team.players.forEach((player: any) => {
    const category = player.category || player.approvedCategory;
    if (category && categoryCount.hasOwnProperty(category)) {
      categoryCount[category as keyof typeof categoryCount]++;
    }
  });

  // Define quotas
  const quotas = {
    Platinum: 1,
    Diamond: 2,
    Gold: 999 // No limit for Gold
  };

  // Check if adding this player would exceed quota
  const currentCount = categoryCount[playerCategory as keyof typeof categoryCount] || 0;
  const maxAllowed = quotas[playerCategory as keyof typeof quotas] || 999;

  if (currentCount >= maxAllowed) {
    return {
      valid: false,
      message: `Team "${team.title}" already has ${currentCount}/${maxAllowed} ${playerCategory} player(s). Cannot add more ${playerCategory} players.`
    };
  }

  return { valid: true };
};

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
        select: 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole playingStyle teamId playerId auctionStatus bidPrice teamName'
      });
    
      if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Get auction session
    const session = await AuctionSession.findOne({ auctionId })
      .populate({
        path: 'currentPlayerId',
        model: Registration,
        select: 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole playingStyle teamId playerId auctionStatus bidPrice teamName'
      })
      .populate('currentHighestBid')
      .populate('biddingHistory');


    // Get auction statistics
    const stats = {
      totalPlayers: auction.players.length,
      playersSold: auction.players.filter((p: any) => p.auctionStatus === 'sold').length,
      playersAvailable: auction.players.filter((p: any) => p.auctionStatus !== 'sold').length,
      totalTeams: auction.teams.length,
      totalRevenue: auction.totalRevenue,
    };

    return NextResponse.json({
      success: true,
      auction,
      session,
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
        
        // Initialize auctionStatus for new registrations if not set
        for (const registration of registrations) {
          if (!registration.auctionStatus) {
            registration.auctionStatus = 'available';
            await registration.save();
          }
        }
        
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
        if (!registration || registration.teamId) {
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

        if (registration.auctionStatus === 'sold') {
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

        // Validate team category quota for finalize_bid
        const playerCategory = registration.approvedCategory || 'Gold';
        const quotaValidation = validateTeamCategoryQuota(team, playerCategory);
        
        if (!quotaValidation.valid) {
          return NextResponse.json(
            { success: false, error: quotaValidation.message },
            { status: 400 }
          );
        }

        // Mark this bid as winning and clear other winning flags for the player
        await Bid.updateMany({ auctionId, playerId: bid.playerId }, { $set: { isWinning: false } });
        bid.isWinning = true;
        await bid.save();

        // Assign player to team and adjust team budget
        registration.auctionStatus = 'sold';
        registration.teamId = team._id as any;
        registration.teamName = (team as any).title;
        registration.bidPrice = bid.amount;
        await registration.save();

        // For auction teams, update spent/left and add player record
        const purchase = {
          registrationId: registration._id as any,
          playerName: registration.name,
          playerRole: registration.playerRole ,
          category: registration.approvedCategory ,
          contactNo: registration.contactNo ,
          purchasePrice: bid.amount,
          transactionDate: new Date(),
        } as any;

        if (!Array.isArray((team as any).players)) (team as any).players = [];
        (team as any).players.push(purchase);
        (team as any).pointsSpent = ((team as any).pointsSpent || 0) + bid.amount;
        (team as any).pointsLeft = ((team as any).totalPoints || 0) - ((team as any).pointsSpent || 0);
        
        (team as any).markModified('players');
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
          teamId: { $exists: false },
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

          // Validate team category quota for assign_icon_players
          const playerCategory = pick.approvedCategory || 'Gold';
          const quotaValidation = validateTeamCategoryQuota(team, playerCategory);
          
          if (!quotaValidation.valid) {
            continue; // Skip this team and try the next one
          }

          // Assign as captain
          pick.role = 'Captain';
          pick.teamId = team._id as any;
          await pick.save();

          // Add zero-price captain to team roster
          if (!Array.isArray((team as any).players)) (team as any).players = [];
          (team as any).players.push({
            registrationId: pick._id as any,
            playerName: pick.name,
            playerRole: pick.playerRole ,
            category: pick.approvedCategory ,
            contactNo: pick.contactNo ,
            purchasePrice: 0,
            transactionDate: new Date(),
          });
          (team as any).markModified('players');
          await team.save();
        }
        break;
      }

      // Manual assignment of player to team by moderator
      case 'manual_assign': {
        const { registrationId, teamId, teamName, bidPrice } = data || {};
        
        if (!registrationId || !teamId || !teamName || bidPrice === undefined) {
          return NextResponse.json(
            { success: false, error: 'registrationId, teamId, teamName, and bidPrice are required' },
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

        if (registration.auctionStatus === 'sold') {
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

        // Validate team category quota
        const playerCategory = registration.approvedCategory || 'Gold';
        const quotaValidation = validateTeamCategoryQuota(team, playerCategory);
        
        if (!quotaValidation.valid) {
          return NextResponse.json(
            { success: false, error: quotaValidation.message },
            { status: 400 }
          );
        }

        // Assign player to team
        registration.auctionStatus = 'sold';
        registration.teamId = team._id as any;
        registration.teamName = teamName;
        registration.bidPrice = bidPrice;
        await registration.save();

        // Update team roster and budget
        const purchase = {
          registrationId: registration._id as any,
          playerName: registration.name,
          playerRole: registration.playerRole,
          category: registration.approvedCategory,
          contactNo: registration.contactNo,
          purchasePrice: bidPrice,
          transactionDate: new Date(),
        } as any;

        if (!Array.isArray((team as any).players)) (team as any).players = [];
        (team as any).players.push(purchase);
        (team as any).pointsSpent = ((team as any).pointsSpent || 0) + bidPrice;
        (team as any).pointsLeft = ((team as any).totalPoints || 0) - ((team as any).pointsSpent || 0);

        (team as any).markModified('players');
        await team.save();

        // Update auction totals
        auction.totalRevenue = (auction.totalRevenue || 0) + bidPrice;
        await auction.save();
        
        return NextResponse.json({
          success: true,
          message: 'Player assigned successfully',
          playerName: registration.name,
          teamName: teamName,
          bidPrice: bidPrice
        });
        
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
      .populate({
        path: 'eventId',
        model: Event,
        select: 'name description'
      })
      .populate({
        path: 'players',
        model: Registration,
        select: 'name status contactNo photoUrl skillLevel iconPlayerRequest approvedIconPlayer selfAssignedCategory approvedCategory approvedSkillLevel playerRole playingStyle teamId playerId auctionStatus bidPrice teamName'
      })
      .populate({
        path: 'teams',
        model: Team,
        select: 'title owner totalPoints pointsSpent pointsLeft players maxPlayers captain'
      });

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
