import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import Player from '@/models/Player';
import { isAuthenticated } from '@/lib/auth';

// GET /api/registrations - Get all registrations (admin only)
export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: any = {};
    if (eventId) query.eventId = eventId;
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('eventId', 'name eventType startDate endDate')
      .populate('playerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Registration.countDocuments(query);

    return NextResponse.json({
      success: true,
      registrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// POST /api/registrations - Create new registration
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      eventId,
      name,
      email,
      phone,
      studentId,
      department,
      emergencyContact,
      teamName,
      teamMembers,
      specialRequirements,
    } = body;

    // Validate required fields
    if (!eventId || !name || !email || !phone || !studentId || !department || !emergencyContact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if event exists and is open for registration
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'upcoming' && event.status !== 'registration') {
      return NextResponse.json(
        { error: 'Event is not open for registration' },
        { status: 400 }
      );
    }

    // Check if user already registered for this event
    const existingRegistration = await Registration.findOne({
      eventId,
      $or: [
        { email },
        { studentId },
      ],
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You have already registered for this event' },
        { status: 400 }
      );
    }

    // Check if player exists, if not create one
    let player = await Player.findOne({ email });
    if (!player) {
      player = new Player({
        name,
        contactNo: phone,
        email,
        studentId,
        courseEnrolled: department,
        isHikmahStudent: true,
        timings: 'Any',
        playBothTournaments: false,
        skillLevel: 'Beginner',
        iconPlayerRequest: false,
        selfAssignedCategory: 'General',
        photoUrl: '/api/placeholder/200/200',
      });
      await player.save();
    }

    // Create registration
    const registration = new Registration({
      eventId,
      eventName: event.title,
      eventType: event.eventType,
      registrationType: event.registrationType,
      name,
      email,
      phone,
      studentId,
      department,
      emergencyContact,
      teamName,
      teamMembers: teamMembers ? teamMembers.split(',').map((m: string) => m.trim()) : [],
      specialRequirements,
      playerId: player._id,
      amountPaid: event.registrationType === 'team' ? event.pricePerTeam : event.pricePerPerson,
    });

    await registration.save();

    // Update event participant count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { totalParticipants: 1 },
    });

    return NextResponse.json({
      success: true,
      registration,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Create registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}

// PUT /api/registrations - Update registration status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { registrationId, status, rejectionReason } = body;

    if (!registrationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      approvedAt: status === 'approved' ? new Date() : undefined,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    };

    const registration = await Registration.findByIdAndUpdate(
      registrationId,
      updateData,
      { new: true }
    ).populate('eventId', 'name eventType');

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      registration,
      message: 'Registration status updated',
    });
  } catch (error) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations - Delete registration (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const registration = await Registration.findByIdAndDelete(registrationId);
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update event participant count
    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { totalParticipants: -1 },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
