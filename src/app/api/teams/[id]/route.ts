import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Registration from '@/models/Registration';
import { isAuthenticated } from '@/lib/auth';
import { syncTeamsWithEventType, teamNeedsSync } from '@/lib/teamSync';

// Load a team, first re-syncing it (and its event's other teams) if the event's type changed since creation.
async function findSyncedTeam(id: string, eventFields: string) {
  const team: any = await Team.findById(id).populate('eventId', eventFields);
  const ev = team?.eventId;
  if (ev?._id && teamNeedsSync(team, ev.eventType)) {
    await syncTeamsWithEventType(ev._id, ev.eventType);
    return Team.findById(id).populate('eventId', eventFields);
  }
  return team;
}

export const dynamic = 'force-dynamic';

// GET /api/teams/[id] - Get single team with populated registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const team = await findSyncedTeam(id, 'title eventType sport startDate venue');

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Populate player registrations
    const registrationIds = team.players.map((p: any) => p.registrationId);
    const registrations = await Registration.find({
      _id: { $in: registrationIds }
    }).select('name contactNo photoUrl playerRole playingStyle skillLevel selfAssignedCategory');

    // Map registrations to players
    const playersWithDetails = team.players.map((player: any) => {
      const registration = registrations.find(
        r => r._id.toString() === player.registrationId.toString()
      );
      return {
        ...player,
        registration: registration || null,
      };
    });

    const teamWithPlayers = {
      ...team.toObject(),
      players: playersWithDetails,
    };

    return NextResponse.json({
      success: true,
      team: teamWithPlayers,
    });
  } catch (error: any) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch team', 
        error: error.message
       },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team (e.g., assign captain)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    // Check authentication
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Find the team (synced, so captain matching sees the event's current type)
    const team = await findSyncedTeam(id, 'eventType');
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    team.depopulate('eventId'); // keep the response shape (eventId as an id) unchanged

    // Update team fields
    if (body.captain !== undefined) {
      team.captain = body.captain;
    }
    
    if (body.registrationId && team.eventType === 'auction') {
      if (!Array.isArray(team.players)) {
        team.players = [];
      }
      
      // Check if captain is already in players array
      const captainAlreadyExists = team.players.some((p: any) => 
        p.registrationId?.toString() === body.registrationId.toString()
      );
      
      if (!captainAlreadyExists) {
        const captainPlayer = {
          registrationId: body.registrationId as any,
          playerName: body.captain || 'Captain',
          category: body.category || 'Captain',
          purchasePrice: 0, // Captain is free
          transactionDate: new Date(),
        };
        team.players.push(captainPlayer);
        
        team.markModified('players');
      } else {
        console.log('Captain already exists in players array');
      }
    }
    
    if (body.status !== undefined) {
      team.status = body.status;
    }

    await team.save();

    return NextResponse.json({
      success: true,
      team,
      message: 'Team updated successfully',
    });
  } catch (error: any) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update team', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

