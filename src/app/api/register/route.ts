import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Player from '@/models/Player';
import { IPlayer } from '@/types/Player';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    
    // Extract form fields
    const playerData: Partial<IPlayer> = {
      name: formData.get('name') as string,
      contactNo: formData.get('contactNo') as string,
      isHikmahStudent: formData.get('isHikmahStudent') === 'true',
      courseEnrolled: formData.get('courseEnrolled') as string || undefined,
      darseNizamiYear: formData.get('darseNizamiYear') as string || undefined,
      currentCourseYear: formData.get('currentCourseYear') as string || undefined,
      timings: formData.get('timings') as string,
      playBothTournaments: formData.get('playBothTournaments') === 'true',
      skillLevel: formData.get('skillLevel') as string,
      iconPlayerRequest: formData.get('iconPlayerRequest') === 'true',
      selfAssignedCategory: formData.get('selfAssignedCategory') as string,
    };

    // Handle file upload
    const photoFile = formData.get('photo') as File;
    if (photoFile) {
      // For now, we'll store the file name as a placeholder
      // In production, you'd upload to a cloud storage service
      playerData.photoUrl = `/uploads/${Date.now()}-${photoFile.name}`;
    } else {
      // Set a default placeholder if no photo is uploaded
      playerData.photoUrl = '/placeholder.jpg';
    }

    // Validate required fields
    const requiredFields = ['name', 'contactNo', 'timings', 'skillLevel', 'selfAssignedCategory'];
    for (const field of requiredFields) {
      if (!playerData[field as keyof IPlayer]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create player
    const player = await Player.create(playerData);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      player: {
        id: player._id,
        name: player.name,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register player' },
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
