import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';

await dbConnect();

// GET /api/teams - Get all teams with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to access teams' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};
    
    if (eventId) query.eventId = eventId;
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
        { captain: { $regex: search, $options: 'i' } },
      ];
    }

    const teams = await Team.find(query)
      .populate('eventId', 'title eventType sport startDate')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      teams,
      count: teams.length,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to create teams' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      eventType,
      title,
      captain,
      entry,
      entryAmount,
      owner,
      totalPoints,
      players,
      status,
    } = body;

    // Validate required fields
    if (!eventId || !eventType || !title) {
      return NextResponse.json(
        { error: 'Event ID, event type, and team title are required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate event type specific fields
    if (eventType === 'auction') {
      if (!owner || !totalPoints) {
        return NextResponse.json(
          { error: 'Owner and total points are required for auction teams' },
          { status: 400 }
        );
      }
    }

    // Create team data
    const teamData: any = {
      eventId,
      eventType,
      title,
      status: status || 'active',
      players: players || [],
    };

    // Add event type specific fields
    if (eventType === 'auction') {
      teamData.owner = owner;
      teamData.totalPoints = totalPoints;
      teamData.pointsSpent = 0;
      teamData.pointsLeft = totalPoints;
    } else {
      teamData.captain = captain;
      teamData.entry = entry || 'unpaid';
      teamData.entryAmount = entryAmount || 0;
    }

    const team = await Team.create(teamData);

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team,
    });
  } catch (error: any) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Failed to create team', message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/teams - Update team (admin only)
export async function PUT(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to update teams' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, updates } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const team = await Team.findByIdAndUpdate(
      teamId,
      updates,
      { new: true, runValidators: true }
    ).populate('eventId', 'title eventType sport');

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      team,
    });
  } catch (error: any) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: 'Failed to update team', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/teams - Delete team (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to delete teams' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}

