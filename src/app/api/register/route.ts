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
    
    // Extract all form fields
    const formFields = {
      // Event related
      eventId: formData.get('eventId') as string,
      
      // Personal details (for Player collection)
      name: formData.get('name') as string,
      contactNo: formData.get('contactNo') as string,
      isHikmahStudent: formData.get('isHikmahStudent') === 'true',
      courseEnrolled: formData.get('courseEnrolled') as string || undefined,
      darseNizamiYear: formData.get('darseNizamiYear') as string || undefined,
      currentCourseYear: formData.get('currentCourseYear') as string || undefined,
      timings: formData.get('timings') as string,
      
      // Sport specific details (for Registration collection)
      playedPreviousLeague: formData.get('playedPreviousLeague') === 'true' || formData.get('playedPreviousLeague') === 'yes',
      playBothTournaments: formData.get('playBothTournaments') === 'true' || formData.get('playBothTournaments') === 'yes',
      skillLevel: formData.get('skillLevel') as string,
      iconPlayerRequest: formData.get('iconPlayerRequest') === 'true' || formData.get('iconPlayerRequest') === 'yes',
      selfAssignedCategory: formData.get('selfAssignedCategory') as string,
      type: formData.get('type') as string || undefined,
      position: formData.get('position') as string || undefined,
      experience: formData.get('experience') as string || undefined,
      subject: formData.get('subject') as string || undefined,
      level: formData.get('level') as string || undefined,
      category: formData.get('category') as string || undefined,
      
      // Additional fields
      teamName: formData.get('teamName') as string || undefined,
      specialRequirements: formData.get('specialRequirements') as string || undefined,
      teamMembers: formData.get('teamMembers') as string || undefined,
      department: formData.get('department') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      
      // Registration details
      paymentMethod: formData.get('paymentMethod') as string,
      assurance: formData.get('assurance') === 'true',
    };

    // Check if event exists first
    const event = await Event.findById(formFields.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate required fields (make validation more flexible based on sport type)
    const requiredFields = ['eventId', 'name', 'contactNo', 'skillLevel', 'paymentMethod'];
    
    // Add sport-specific required fields
    if (event.sport === 'cricket') {
      requiredFields.push('selfAssignedCategory');
    }
    
    for (const field of requiredFields) {
      if (!formFields[field as keyof typeof formFields]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Handle photo upload first
    let photoUrl = '/placeholder.jpg';
    const photoFile = formData.get('photo') as File;
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
      name: formFields.name,
      contactNo: formFields.contactNo
    });

    if (!player) {
      // Create new player with personal details
      const playerData: Partial<IPlayer> = {
        name: formFields.name,
        contactNo: formFields.contactNo,
        isHikmahStudent: formFields.isHikmahStudent,
        courseEnrolled: formFields.courseEnrolled,
        darseNizamiYear: formFields.darseNizamiYear,
        currentCourseYear: formFields.currentCourseYear,
        timings: formFields.timings,
        photoUrl: photoUrl,
        
        // Sport-specific fields with defaults to prevent validation errors
        playBothTournaments: formFields.playBothTournaments ?? false,
        skillLevel: formFields.skillLevel ?? 'Beginner',
        iconPlayerRequest: formFields.iconPlayerRequest ?? false,
        selfAssignedCategory: formFields.selfAssignedCategory ?? 'Bronze',
        type: formFields.type ?? 'Player',
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
      eventId: new Types.ObjectId(formFields.eventId),
      eventName: event.title,
      playerId: player._id,
      
      // Personal Information (duplicated for easy access)
      name: formFields.name,
      contactNo: formFields.contactNo,
      isHikmahStudent: formFields.isHikmahStudent,
      courseEnrolled: formFields.courseEnrolled,
      darseNizamiYear: formFields.darseNizamiYear,
      currentCourseYear: formFields.currentCourseYear,
      timings: formFields.timings,
      
      // Sport-specific details
      playedPreviousLeague: formFields.playedPreviousLeague,
      playBothTournaments: formFields.playBothTournaments,
      skillLevel: formFields.skillLevel,
      iconPlayerRequest: formFields.iconPlayerRequest,
      selfAssignedCategory: formFields.selfAssignedCategory,
      type: formFields.type,
      position: formFields.position,
      experience: formFields.experience,
      level: formFields.level,
      
      // Additional fields
      teamName: formFields.teamName,
      specialRequirements: formFields.specialRequirements,
      
      // Registration details
      paymentMethod: formFields.paymentMethod,
      assurance: formFields.assurance,
      status: 'pending',
    };
    registrationData.photoUrl = photoUrl;

    const registration = await Registration.create(registrationData);

    // Step 3: Increment event participant count
    await Event.findByIdAndUpdate(
      formFields.eventId,
      { $inc: { totalParticipants: 1 } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      registration: {
        id: registration._id,
        playerId: player._id,
        eventId: formFields.eventId,
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
