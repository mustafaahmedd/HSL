import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Registration from '@/models/Registration';
import { isAuthenticated } from '@/lib/auth';

// GET /api/teams/[id] - Get single team with populated registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const team = await Team.findById(id)
      .populate('eventId', 'title eventType sport startDate venue');

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
    // Check authentication
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Find the team
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Update team fields
    if (body.captain !== undefined) {
      team.captain = body.captain;
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

