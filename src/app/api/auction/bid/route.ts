import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Player from '@/models/Player';
import Team from '@/models/Team';
import Tournament from '@/models/Tournament';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { playerId, teamId, bidAmount, tournamentId } = await request.json();

    // Validate inputs
    if (!playerId || !teamId || !bidAmount || !tournamentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get player, team, and tournament
    const [player, team, tournament] = await Promise.all([
      Player.findById(playerId),
      Team.findById(teamId),
      Tournament.findById(tournamentId)
    ]);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if player is already sold
    if (player.status === 'sold') {
      return NextResponse.json(
        { error: 'Player is already sold' },
        { status: 400 }
      );
    }

    // Check minimum bid
    const category = player.category || player.selfAssignedCategory;
    const minBid = tournament.minBidByCategory.get(category) || 0;
    if (bidAmount < minBid) {
      return NextResponse.json(
        { error: `Bid amount must be at least ${minBid} for ${category} category` },
        { status: 400 }
      );
    }

    // Check if team has enough budget
    if (team.pointsLeft < bidAmount) {
      return NextResponse.json(
        { error: 'Team does not have enough budget' },
        { status: 400 }
      );
    }

    // Check squad cap
    const currentPlayers = await Player.find({ 
      teamId: teamId, 
      category: category 
    });
    const squadCap = tournament.squadCapByCategory.get(category) || Infinity;
    
    if (currentPlayers.length >= squadCap) {
      return NextResponse.json(
        { 
          error: `Team has reached the maximum limit of ${squadCap} ${category} players`,
          warning: true,
          currentCount: currentPlayers.length,
          maxAllowed: squadCap
        },
        { status: 400 }
      );
    }

    // Process the bid
    player.status = 'sold';
    player.teamId = teamId;
    player.bidPrice = bidAmount;
    await player.save();

    // Update team
    team.players.push(player._id);
    team.pointsSpent += bidAmount;
    team.pointsLeft = team.totalBudget - team.pointsSpent;
    await team.save();

    // Populate the team with players for response
    await team.populate('players');

    return NextResponse.json({
      success: true,
      message: 'Bid successful',
      player,
      team,
      transaction: {
        playerId: player._id,
        playerName: player.name,
        teamId: team._id,
        teamName: team.name,
        bidAmount,
        remainingBudget: team.pointsLeft
      }
    });
  } catch (error) {
    console.error('Bid error:', error);
    return NextResponse.json(
      { error: 'Failed to process bid' },
      { status: 500 }
    );
  }
}
