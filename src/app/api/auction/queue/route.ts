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

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Find all unsold players in the specified category
    const players = await Player.find({
      category,
      status: 'available'
    });

    // Randomize the order
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      category,
      players: shuffledPlayers,
      total: shuffledPlayers.length
    });
  } catch (error) {
    console.error('Get queue error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction queue' },
      { status: 500 }
    );
  }
}
