import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';
import { syncTeamsWithEventType, teamNeedsSync, toTeamEventType } from '@/lib/teamSync';

export const dynamic = 'force-dynamic';

// GET /api/teams - Get all teams with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to access teams' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query. eventType is NOT queried on the stored Team.eventType: that is a copy taken at
    // creation, so the event's current type (populated below) is what counts.
    const query: any = {};

    if (eventId) query.eventId = eventId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
        { captain: { $regex: search, $options: 'i' } },
      ];
    }

    const findTeams = () =>
      Team.find(query)
        .populate('eventId', 'title eventType sport startDate')
        .sort({ createdAt: -1 });

    let teams = await findTeams();

    // Self-heal teams whose event changed type after they were created (e.g. tournament -> auction).
    const staleEvents = new Map<string, string>();
    for (const team of teams as any[]) {
      const ev = team.eventId;
      if (ev?._id && teamNeedsSync(team, ev.eventType)) staleEvents.set(ev._id.toString(), ev.eventType);
    }
    if (staleEvents.size > 0) {
      for (const [evId, evType] of staleEvents) await syncTeamsWithEventType(evId, evType);
      teams = await findTeams();
    }

    if (eventType) {
      teams = (teams as any[]).filter(
        team => (toTeamEventType(team.eventId?.eventType) ?? team.eventType) === eventType
      );
    }

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
    await dbConnect();

    const body = await request.json();
    const {
      eventId,
      title,
      captain,
      entry,
      entryAmount,
      owner,
      totalPoints,
      maxPlayers,
      players,
      status,
    } = body;

    // Validate required fields
    if (!eventId || !title) {
      return NextResponse.json(
        { error: 'Event ID and team title are required' },
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

    // The team's type always comes from the event (the client's copy may be stale).
    const eventType = toTeamEventType(event.eventType) ?? toTeamEventType(body.eventType);
    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    const points = Number(totalPoints);
    if (eventType === 'auction' && (!owner || !Number.isFinite(points) || points <= 0)) {
      return NextResponse.json(
        { error: 'Owner and total points are required for auction teams' },
        { status: 400 }
      );
    }

    // Create team data
    const teamData: any = {
      eventId,
      eventType,
      title,
      status: status || 'active',
      players: players || [],
    };
    if (captain) teamData.captain = captain;

    // Add event type specific fields
    if (eventType === 'auction') {
      teamData.owner = owner;
      teamData.totalPoints = points;
      teamData.pointsSpent = 0;
      teamData.pointsLeft = points;
      if (Number(maxPlayers) > 0) teamData.maxPlayers = Number(maxPlayers);
    } else {
      teamData.entry = entry || 'unpaid';
      teamData.entryAmount = Number(entryAmount) || 0;
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

// PUT /api/teams - Update team from the admin "Edit Team" form (admin only).
// Body: { teamId, updates }. Which fields apply is decided by the team's event's CURRENT type.
// Auction: owner, totalPoints, maxPlayers (pointsLeft is recomputed as totalPoints - pointsSpent;
// pointsSpent itself is only changed by the auction flow). Others: entry, entryAmount.
export async function PUT(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized to update teams' }, { status: 401 });
    }
    await dbConnect();

    const body = await request.json();
    const { teamId } = body;
    const updates = body.updates || {};

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const team: any = await Team.findById(teamId).populate('eventId', 'title eventType sport');
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const eventType = toTeamEventType(team.eventId?.eventType) ?? team.eventType;
    team.eventType = eventType;

    if (updates.title !== undefined) {
      if (!String(updates.title).trim()) {
        return NextResponse.json({ error: 'Team title is required' }, { status: 400 });
      }
      team.title = updates.title;
    }
    if (updates.status !== undefined) team.status = updates.status;
    if (updates.captain !== undefined) team.captain = updates.captain;

    if (eventType === 'auction') {
      if (updates.owner !== undefined) team.owner = updates.owner;
      if (updates.maxPlayers !== undefined) team.maxPlayers = Number(updates.maxPlayers) || undefined;
      if (updates.totalPoints !== undefined) {
        const points = Number(updates.totalPoints);
        if (!Number.isFinite(points) || points <= 0) {
          return NextResponse.json({ error: 'Total points must be greater than 0' }, { status: 400 });
        }
        team.totalPoints = points;
      }
      if (!team.owner) {
        return NextResponse.json({ error: 'Owner is required for auction teams' }, { status: 400 });
      }
      if (typeof team.totalPoints === 'number') {
        team.pointsSpent = team.pointsSpent || 0;
        team.pointsLeft = team.totalPoints - team.pointsSpent;
      }
    } else {
      if (updates.entry !== undefined) team.entry = updates.entry;
      if (updates.entryAmount !== undefined) team.entryAmount = Number(updates.entryAmount) || 0;
    }

    await team.save();

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
    await dbConnect();

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

