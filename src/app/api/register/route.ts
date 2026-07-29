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
    console.log(formData);
    const data = Object.fromEntries(formData.entries());
    const photo = formData.get('photo') as File;
    // const rawBody = JSON.parse(formData.get('data') as string);
    
    // Extract all form fields
    const body = {
      ...data,
      playedPreviousLeague: data.playedPreviousLeague === 'true' || data.playedPreviousLeague === 'yes',
      playBothTournaments: data.playBothTournaments === 'true' || data.playBothTournaments === 'yes',
      iconPlayerRequest: data.iconPlayerRequest === 'true' || data.iconPlayerRequest === 'yes',
      assurance: data.assurance === 'true',
    };

    // Check if event exists first
    const event = await Event.findById(data.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    // Define required fields based on form template
    const requiredFields = ['eventId', 'name', 'contactNo', 'paymentMethod'];
    if (event.formTemplate === 'cricket' || event.formTemplate === 'futsal' || event.formTemplate === 'padel') {
      requiredFields.push('skillLevel');
    }
    if (event.sport === 'cricket') {
      requiredFields.push('selfAssignedCategory');
    }
    
    for (const field of requiredFields) {
      if (!body[field as keyof typeof body]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Handle photo upload if provided
    let photoUrl = '/placeholder.jpg';
    if (photo && photo instanceof File && photo.size > 0) {
      try {
        const uploadedFile = await saveFile(photo, 'players');
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
      name: data.name,
      contactNo: data.contactNo
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
      eventId: new Types.ObjectId(data.eventId as string),
      eventName: event.title,
      playerId: player._id,
      ...body,
      photoUrl: photoUrl,
      status: 'pending',
    };

    const registration = await Registration.create(registrationData);

    // Step 3: Increment event participant count
    await Event.findByIdAndUpdate(
      data.eventId,
      { $inc: { totalParticipants: 1 } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      registration: {
        id: registration._id,
        _id: registration._id,
        playerId: player._id,
        eventId: data.eventId,
        name: data.name,
        contactNo: data.contactNo,
        courseEnrolled: data.courseEnrolled,
        timings: data.timings,
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

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();
    let registrationId = formData.get('registrationId') as string;
    const eventId = formData.get('eventId') as string;
    const contactNo = formData.get('contactNo') as string;
    const paymentProof = formData.get('paymentProof') as File;

    if (!paymentProof) {
      return NextResponse.json(
        { error: 'Payment receipt image file is required' },
        { status: 400 }
      );
    }

    let registration = null;

    if (registrationId && registrationId !== 'undefined' && registrationId !== 'null' && registrationId.trim() !== '') {
      registration = await Registration.findById(registrationId);
    }

    if (!registration && eventId && contactNo) {
      registration = await Registration.findOne({ eventId, contactNo }).sort({ createdAt: -1 });
    }

    if (!registration && eventId) {
      registration = await Registration.findOne({ eventId }).sort({ createdAt: -1 });
    }

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration record not found for payment receipt upload' },
        { status: 404 }
      );
    }

    const uploaded = await saveFile(paymentProof, 'registrations');
    registration.paymentProofUrl = uploaded.url;
    registration.paymentStatus = 'pending';
    await registration.save();

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      paymentProofUrl: uploaded.url,
      registration,
    });
  } catch (error: any) {
    console.error('Payment proof upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload payment proof' },
      { status: 500 }
    );
  }
}

