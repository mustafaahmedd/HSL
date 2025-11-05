import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { isAuthenticated } from '@/lib/auth';
import Auction from '@/models/Auction';

await dbConnect();

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const auctionId = searchParams.get('auctionId');

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!auctionId) {
      return NextResponse.json(
        { error: 'AuctionId is required' },
        { status: 400 }
      );
    }
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    const registrations = await Registration.find({
      _id: { $in: auction.players },
      approvedCategory: category,
      teamId: { $eq: null },
      teamName: { $eq: "" }
    }).lean();

    // Randomize the order
    const shuffledRegistrations = registrations.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      category,
      auctionId,
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
