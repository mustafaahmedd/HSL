import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';
import { syncTeamsWithEventType } from '@/lib/teamSync';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    
    // Validate id parameter
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update an event (admin only). Body: `{ updates: {...} }` or the fields directly.
// When eventType changes, the event's teams are re-synced (Team.eventType is a copy taken at creation;
// switching to auction turns an existing entryAmount into the team's totalPoints budget).
// Note: the admin edit page uses PUT /api/events (which also keeps the payment-account history).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized to update events' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates = { ...(body?.updates ?? body ?? {}) };
    delete updates._id;
    delete updates.eventId;

    const event = await Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Always sync when a type is sent (cheap, and repairs teams left behind by earlier type changes).
    const teamsSynced = updates.eventType
      ? await syncTeamsWithEventType(event._id, event.eventType)
      : 0;

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event,
      teamsSynced,
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event', message: error?.message },
      { status: 500 }
    );
  }
}
