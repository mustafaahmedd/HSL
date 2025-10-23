import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import Team from '@/models/Team';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log("GET request received");
  
  try {
    await dbConnect();

    const tournaments = await Tournament.find({}).sort({ createdAt: -1 });
    
    // Check if user is authenticated for admin data
    const isAuth = await isAuthenticated(request);
    
    if (isAuth) {
      // Return full data for authenticated admin users
      const teams = await Team.find({}).populate('players').sort({ createdAt: -1 });
      return NextResponse.json({
        success: true,
        tournaments,
        teams
      });
    } else {
      // Return only tournaments for public users
      return NextResponse.json({
        success: true,
        tournaments
      });
    }
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
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

    const { tournamentId, minBidByCategory, squadCapByCategory } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Update tournament configuration
    if (minBidByCategory) {
      tournament.minBidByCategory = new Map(Object.entries(minBidByCategory));
    }
    if (squadCapByCategory) {
      tournament.squadCapByCategory = new Map(Object.entries(squadCapByCategory));
    }

    await tournament.save();

    return NextResponse.json({
      success: true,
      message: 'Tournament configuration updated',
      tournament
    });
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
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

    const { type, data } = await request.json();

    if (type === 'tournament') {
      const tournament = await Tournament.create(data);
      return NextResponse.json({
        success: true,
        message: 'Tournament created',
        tournament
      });
    } else if (type === 'team') {
      const team = await Team.create({
        ...data,
        pointsLeft: data.totalBudget || 8000
      });
      return NextResponse.json({
        success: true,
        message: 'Team created',
        team
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "tournament" or "team"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Create config error:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    );
  }
}
