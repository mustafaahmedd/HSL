import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Auction from '@/models/Auction';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';
import { parsePlayerSheet, driveDownloadUrl } from '@/lib/playerImport';
import { uploadRemoteImage } from '@/lib/upload';

export const dynamic = 'force-dynamic';

// POST /api/auction/[id]/import  { text, commit }
// commit=false → preview only (nothing written). commit=true → upsert registrations and add them to the auction.
// Rows are matched to existing registrations of the auction's event by contact + name, so re-importing a
// corrected sheet updates profile fields without touching auction state (sold/team/price).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id: auctionId } = await params;
    const { text, commit } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: 'No sheet data provided' }, { status: 400 });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return NextResponse.json({ success: false, error: 'Auction not found' }, { status: 404 });
    }

    let parsed;
    try {
      parsed = parsePlayerSheet(text);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }

    const existing = await Registration.find(
      { eventId: auction.eventId },
      'name contactNo auctionStatus teamName'
    ).lean();
    const keyOf = (contactNo: string, name: string) => `${contactNo}|${name.trim().toLowerCase()}`;
    const existingByKey = new Map(existing.map((r: any) => [keyOf(r.contactNo, r.name), r]));

    const preview = parsed.players.map(p => {
      const match: any = existingByKey.get(keyOf(p.contactNo, p.name));
      return {
        ...p,
        action: match ? 'update' : 'new',
        soldTo: match?.auctionStatus === 'sold' ? match.teamName : undefined,
      };
    });

    if (!commit) {
      return NextResponse.json({ success: true, preview, warnings: parsed.warnings });
    }

    // Copy Drive photos to Cloudinary so the live auction never depends on Drive (it rate-limits).
    // On failure keep the proxied Drive URL, which still works, just slower.
    const photoFailures: string[] = [];
    const queue = preview.filter(p => p.driveId);
    await Promise.all(Array.from({ length: 6 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        try {
          p.photoUrl = await uploadRemoteImage(driveDownloadUrl(p.driveId!), 'auction-players', p.driveId!);
        } catch (e) {
          console.error(`Photo upload failed for ${p.name}:`, e);
          photoFailures.push(p.name);
        }
      }
    }));

    const event = await Event.findById(auction.eventId, 'title').lean() as any;
    const now = new Date();
    const auctionPlayerIds: string[] = [];

    for (const p of preview) {
      const isCaptain = p.category === 'Captain';
      const profile = {
        eventName: event?.title,
        name: p.name,
        contactNo: p.contactNo,
        courseEnrolled: p.courseEnrolled,
        photoUrl: p.photoUrl,
        playerRole: p.playerRole,
        approvedCategory: p.category,
        approvedIconPlayer: isCaptain,
        iconPlayerRequest: isCaptain,
        status: 'approved',
      };

      const match: any = existingByKey.get(keyOf(p.contactNo, p.name));
      let id;
      if (match) {
        await Registration.updateOne({ _id: match._id }, { $set: profile });
        id = match._id;
      } else {
        const created = await Registration.create({
          ...profile,
          eventId: auction.eventId,
          isHikmahStudent: true,
          paymentStatus: 'paid',
          isPaid: true,
          approvedAt: now,
          auctionStatus: 'available',
          bidPrice: 0,
          teamName: '', // queue filters on teamName === ""
        });
        id = created._id;
      }
      // Captains are matched to teams separately, not auctioned
      if (!isCaptain) auctionPlayerIds.push(id.toString());
    }

    await Auction.updateOne(
      { _id: auction._id },
      { $addToSet: { players: { $each: auctionPlayerIds } } }
    );
    // Keep the event card's participant count in step with what's actually registered
    await Event.updateOne(
      { _id: auction.eventId },
      { $set: { totalParticipants: await Registration.countDocuments({ eventId: auction.eventId }) } }
    );

    return NextResponse.json({
      success: true,
      inserted: preview.filter(p => p.action === 'new').length,
      updated: preview.filter(p => p.action === 'update').length,
      addedToAuction: auctionPlayerIds.length,
      captains: preview.length - auctionPlayerIds.length,
      photoFailures,
    });
  } catch (error) {
    console.error('Import players error:', error);
    return NextResponse.json({ success: false, error: 'Failed to import players' }, { status: 500 });
  }
}
