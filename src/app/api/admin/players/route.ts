import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Player from '@/models/Player';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

export async function PUT(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { playerId, updates } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    const player = await Player.findByIdAndUpdate(
      playerId,
      updates,
      { new: true }
    );

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Player updated successfully',
      player
    });
  } catch (error) {
    console.error('Update player error:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { originalPlayerId, finalData } = await request.json();

    if (!originalPlayerId) {
      return NextResponse.json(
        { error: 'Original player ID is required' },
        { status: 400 }
      );
    }

    // Get the original player
    const originalPlayer = await Player.findById(originalPlayerId);
    if (!originalPlayer) {
      return NextResponse.json(
        { error: 'Original player not found' },
        { status: 404 }
      );
    }

    // Create final player with updated data
    const finalPlayer = await Player.create({
      ...originalPlayer.toObject(),
      ...finalData,
      status: 'available',
      _id: undefined, // Let MongoDB generate new ID
    });

    return NextResponse.json({
      success: true,
      message: 'Final player created successfully',
      player: finalPlayer
    });
  } catch (error) {
    console.error('Create final player error:', error);
    return NextResponse.json(
      { error: 'Failed to create final player' },
      { status: 500 }
    );
  }
}
