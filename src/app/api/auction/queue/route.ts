import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { isAuthenticated } from '@/lib/auth';

await dbConnect();

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Find all registrations in the specified category that are approved and not yet sold
    // We need to find registrations that are part of the auction but not yet assigned to a team
    const registrations = await Registration.find({
      $or: [
        { approvedCategory: category },
        { selfAssignedCategory: category }
      ],
      status: 'approved',
      teamId: { $exists: false }
    }).lean(); // Use lean() for better performance
    
    console.log(`Found ${registrations.length} available players in ${category} category`);

    // Randomize the order
    const shuffledRegistrations = registrations.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      category,
      players: shuffledRegistrations,
      total: shuffledRegistrations.length
    });
  } catch (error) {
    console.error('Get queue error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction queue' },
      { status: 500 }
    );
  }
}
