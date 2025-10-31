import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Player from '@/models/Player';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import { IPlayer } from '@/types/Player';
import { IRegistration } from '@/types/Registration';
import { Types } from 'mongoose';
import { saveFile } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const rawBody = JSON.parse(formData.get('data') as string);
    const photoFile = formData.get('photo') as File;
    
    // Extract all form fields
    const body = {
      ...rawBody,
      playedPreviousLeague: rawBody.playedPreviousLeague === 'true' || rawBody.playedPreviousLeague === 'yes',
      playBothTournaments: rawBody.playBothTournaments === 'true' || rawBody.playBothTournaments === 'yes',
      iconPlayerRequest: rawBody.iconPlayerRequest === 'true' || rawBody.iconPlayerRequest === 'yes',
      assurance: rawBody.assurance === 'true',
    };

    // Check if event exists first
    const event = await Event.findById(body.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    const requiredFields = ['eventId', 'name', 'contactNo', 'skillLevel', 'paymentMethod', 'photo'];
    
    if (event.sport === 'cricket') {
      requiredFields.push('selfAssignedCategory');
    }
    
    for (const field of requiredFields) {
      // if (!formFields[field as keyof typeof formFields]) {
      if (!body[field as keyof typeof body]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Handle photo upload first
    let photoUrl = '/placeholder.jpg';
    // const photoFile = formData.get('photo') as File;
    if (photoFile && photoFile.size > 0) {
      try {
        const uploadedFile = await saveFile(photoFile, 'players');
        photoUrl = uploadedFile.url;
      } catch (error: any) {
        return NextResponse.json(
          { error: `Photo upload failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Step 1: Find or create player based on name + contactNo
    let player = await Player.findOne({
      name: body.name,
      contactNo: body.contactNo
    });

    if (!player) {
      const playerData: Partial<IPlayer> = {
        ...body,
        photoUrl: photoUrl,
      };
      player = await Player.create(playerData);
    } else {
      // Update existing player's photo if provided
      if (photoUrl !== '/placeholder.jpg') {
        await Player.findByIdAndUpdate(player._id, { photoUrl: photoUrl });
        player.photoUrl = photoUrl;
      }
    }

    // Step 2: Create registration with event-specific data
    const registrationData: Partial<IRegistration> = {
      eventId: new Types.ObjectId(body.eventId),
      eventName: event.title,
      playerId: player._id,
      ...body,
      photoUrl: photoUrl,
      status: 'pending',
    };

    const registration = await Registration.create(registrationData);

    // Step 3: Increment event participant count
    await Event.findByIdAndUpdate(
      body.eventId,
      { $inc: { totalParticipants: 1 } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      registration: {
        id: registration._id,
        playerId: player._id,
        eventId: body.eventId,
        status: registration.status
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Failed to register player: ', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const players = await Player.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      players
    });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
