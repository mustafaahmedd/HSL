import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { isAuthenticated } from '@/lib/auth';
import { extractFiles, saveFiles } from '@/lib/upload';
import { DEFAULT_PAYMENT_ACCOUNT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET - Fetch all events (public)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const published = searchParams.get('published');

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (published === 'true') {
      query.isPublished = true;
    }

    const events = await Event.find(query)
      .sort({ startDate: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create new event (admin only)
export async function POST(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized to create events' }, { status: 401 });
  }

  try {
    await dbConnect();
    const formData = await request.formData();
    
    // Extract form fields
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      eventType: formData.get('eventType') as string,
      sport: formData.get('sport') as string,
      formTemplate: (formData.get('formTemplate') as string) || 'generic',
      startDate: formData.get('startDate') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      venue: formData.get('venue') as string,
      registrationType: formData.get('registrationType') as string,
      pricePerPerson: Number(formData.get('pricePerPerson')),
      pricePerTeam: Number(formData.get('pricePerTeam')),
      amenities: JSON.parse(formData.get('amenities') as string || '[]'),
      facilities: JSON.parse(formData.get('facilities') as string || '[]'),
      maxParticipants: formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : null,
      minParticipants: Number(formData.get('minParticipants')),
      organizer: formData.get('organizer') as string,
      contactInfo: {
        phone: formData.get('contactPhone') as string,
      },
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      isPublished: formData.get('isPublished') === 'true',
      status: formData.get('status') as string,
      paymentAccount: {
        bankName: (formData.get('bankName') as string) || DEFAULT_PAYMENT_ACCOUNT.bankName,
        accountTitle: (formData.get('accountTitle') as string) || DEFAULT_PAYMENT_ACCOUNT.accountTitle,
        accountNumber: (formData.get('accountNumber') as string) || DEFAULT_PAYMENT_ACCOUNT.accountNumber,
        iban: (formData.get('iban') as string) || DEFAULT_PAYMENT_ACCOUNT.iban,
      },
      paymentAccountHistory: [{
        bankName: (formData.get('bankName') as string) || DEFAULT_PAYMENT_ACCOUNT.bankName,
        accountTitle: (formData.get('accountTitle') as string) || DEFAULT_PAYMENT_ACCOUNT.accountTitle,
        accountNumber: (formData.get('accountNumber') as string) || DEFAULT_PAYMENT_ACCOUNT.accountNumber,
        iban: (formData.get('iban') as string) || DEFAULT_PAYMENT_ACCOUNT.iban,
        updatedAt: new Date(),
        updatedBy: 'Admin',
        reason: 'Initial setup on event creation'
      }],
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'eventType', 'startDate', 'startTime', 'endTime', 'venue', 'organizer'];
    for (const field of requiredFields) {
      if (!eventData[field as keyof typeof eventData]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Handle image uploads
    const images: { url: string; caption?: string; isPrimary: boolean }[] = [];
    const imageFiles = extractFiles(formData, 'images');
    
    if (imageFiles.length > 0) {
      try {
        const uploadedFiles = await saveFiles(imageFiles, 'events');
        
        uploadedFiles.forEach((file, index) => {
          images.push({
            url: file.url,
            caption: `Event image ${index + 1}`,
            isPrimary: index === 0
          });
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: `Image upload failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    (eventData as any).images = images;

    const event = await Event.create(eventData);

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { message: 'Failed to create event', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update event (admin only)
export async function PUT(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized to update events' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { eventId, updates } = await request.json();
    console.log('Update event data:', { eventId, updates });

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Audit log payment account updates if changed
    if (updates.paymentAccount) {
      const newAcc = updates.paymentAccount;
      const oldAcc = existingEvent.paymentAccount || {};

      if (
        newAcc.bankName !== oldAcc.bankName ||
        newAcc.accountTitle !== oldAcc.accountTitle ||
        newAcc.accountNumber !== oldAcc.accountNumber ||
        newAcc.iban !== oldAcc.iban
      ) {
        const historyItem = {
          bankName: newAcc.bankName,
          accountTitle: newAcc.accountTitle,
          accountNumber: newAcc.accountNumber,
          iban: newAcc.iban,
          updatedAt: new Date(),
          updatedBy: updates.updatedBy || 'Admin',
          reason: updates.paymentUpdateReason || 'Updated bank account details'
        };

        if (!updates.$push) {
          updates.$push = {};
        }
        updates.$push.paymentAccountHistory = historyItem;
      }
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      updates,
      { new: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('Updated event:', event);
    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event (admin only)
export async function DELETE(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized to delete events' }, { status: 401 });
  }

  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
