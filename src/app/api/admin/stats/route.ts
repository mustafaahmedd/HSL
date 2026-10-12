import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { isAuthenticated } from '@/lib/auth';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import Team from '@/models/Team';
import Auction from '@/models/Auction';
import { CATEGORY_ORDER } from '@/lib/auctionConfig';

export const dynamic = 'force-dynamic';

const TREND_DAYS = 30;
const TIMEZONE = 'Asia/Karachi';

type CountRow = { _id: string | null; count: number };

const toCountMap = (rows: CountRow[]) =>
  rows.reduce<Record<string, number>>((acc, r) => {
    const key = r._id == null || r._id === '' ? 'unknown' : String(r._id);
    acc[key] = (acc[key] || 0) + r.count;
    return acc;
  }, {});

// YYYY-MM-DD for a date in the dashboard's timezone (matches $dateToString below).
const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

// GET /api/admin/stats[?eventId=] — aggregated numbers for the admin dashboard (admin only).
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const eventIdParam = new URL(request.url).searchParams.get('eventId') || '';
    if (eventIdParam && !mongoose.Types.ObjectId.isValid(eventIdParam)) {
      return NextResponse.json({ success: false, error: 'Invalid eventId' }, { status: 400 });
    }
    const eventObjectId = eventIdParam ? new mongoose.Types.ObjectId(eventIdParam) : null;
    const regScope: Record<string, unknown> = eventObjectId ? { eventId: eventObjectId } : {};

    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    // Slightly wider than the window; days outside it are dropped when the series is built.
    const trendStart = new Date(now.getTime() - TREND_DAYS * DAY_MS);

    const [
      eventsTotal,
      eventsByStatus,
      eventsByType,
      eventList,
      regTotals,
      regByStatus,
      regByPayment,
      regByDay,
      regPerEvent,
      teamsTotal,
    ] = await Promise.all([
      Event.countDocuments({}),
      Event.aggregate<CountRow>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Event.aggregate<CountRow>([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]),
      Event.find({}, 'title eventType status startDate').sort({ startDate: -1 }).lean(),
      Registration.aggregate([
        { $match: regScope },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            paidCount: { $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] } },
            amountPaid: { $sum: { $ifNull: ['$amountPaid', 0] } },
          },
        },
      ]),
      Registration.aggregate<CountRow>([
        { $match: regScope },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Registration.aggregate<CountRow>([
        { $match: regScope },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      Registration.aggregate<CountRow>([
        { $match: { ...regScope, createdAt: { $gte: trendStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE } },
            count: { $sum: 1 },
          },
        },
      ]),
      Registration.aggregate([
        { $match: regScope },
        {
          $group: {
            _id: '$eventId',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            amountPaid: { $sum: { $ifNull: ['$amountPaid', 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Team.countDocuments(eventObjectId ? { eventId: eventObjectId } : {}),
    ]);

    const titleById = new Map<string, string>(
      (eventList as any[]).map((e) => [String(e._id), e.title as string])
    );

    // Fill every day of the window so the chart has a continuous x-axis.
    const dayCounts = toCountMap(regByDay);
    const perDay: { date: string; count: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const key = dayKey(new Date(now.getTime() - i * DAY_MS));
      perDay.push({ date: key, count: dayCounts[key] || 0 });
    }

    // ---- Auction: selected event's auction, else the live/upcoming one, else the most recent.
    let auction: any = null;
    if (eventObjectId) {
      auction = await Auction.findOne({ eventId: eventObjectId }).sort({ auctionDate: -1 }).lean();
    } else {
      auction =
        (await Auction.findOne({ status: 'live' }).sort({ auctionDate: -1 }).lean()) ||
        (await Auction.findOne({ status: 'upcoming' }).sort({ auctionDate: -1 }).lean()) ||
        (await Auction.findOne({}).sort({ auctionDate: -1 }).lean());
    }

    let auctionStats: any = null;
    if (auction) {
      const soldExpr = { $and: [{ $eq: ['$auctionStatus', 'sold'] }, { $gt: [{ $strLenCP: { $ifNull: ['$teamName', ''] } }, 0] }] };
      const [poolRows, captains, teams] = await Promise.all([
        Registration.aggregate([
          { $match: { _id: { $in: auction.players || [] } } },
          {
            $group: {
              _id: { $ifNull: ['$approvedCategory', ''] },
              total: { $sum: 1 },
              sold: { $sum: { $cond: [soldExpr, 1, 0] } },
              unsold: { $sum: { $cond: [{ $eq: ['$auctionStatus', 'unsold'] }, 1, 0] } },
              revenue: { $sum: { $cond: [soldExpr, { $ifNull: ['$bidPrice', 0] }, 0] } },
            },
          },
        ]),
        Registration.countDocuments({ eventId: auction.eventId, approvedIconPlayer: true, status: 'approved' }),
        Team.find({ _id: { $in: auction.teams || [] } }, 'title owner totalPoints pointsSpent pointsLeft players').lean(),
      ]);

      const rank = (name: string) => {
        const i = CATEGORY_ORDER.indexOf(name);
        return i === -1 ? CATEGORY_ORDER.length : i;
      };
      const categories = (poolRows as any[])
        .map((r) => ({
          category: r._id || 'Uncategorised',
          total: r.total,
          sold: r.sold,
          unsold: r.unsold,
          available: r.total - r.sold - r.unsold,
        }))
        .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));

      const pool = categories.reduce((s, c) => s + c.total, 0);
      const sold = categories.reduce((s, c) => s + c.sold, 0);
      const unsold = categories.reduce((s, c) => s + c.unsold, 0);
      const soldRevenue = (poolRows as any[]).reduce((s, r) => s + (r.revenue || 0), 0);

      const teamRows = (teams as any[])
        .map((t) => {
          const totalPoints = t.totalPoints || 0;
          const pointsSpent = t.pointsSpent || 0;
          return {
            _id: String(t._id),
            title: t.title,
            owner: t.owner || '',
            totalPoints,
            pointsSpent,
            pointsLeft: t.pointsLeft ?? totalPoints - pointsSpent,
            playerCount: Array.isArray(t.players) ? t.players.length : 0,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title));

      auctionStats = {
        _id: String(auction._id),
        eventId: String(auction.eventId),
        eventTitle: titleById.get(String(auction.eventId)) || '',
        name: auction.name,
        status: auction.status,
        auctionDate: auction.auctionDate,
        pool,
        sold,
        unsold,
        available: pool - sold - unsold,
        captains,
        // Sum of winning prices; fall back to the stored total if bid prices weren't recorded.
        totalRevenue: soldRevenue || auction.totalRevenue || 0,
        categories,
        teams: teamRows,
      };
    }

    const totals = regTotals[0] || { total: 0, paidCount: 0, amountPaid: 0 };

    return NextResponse.json({
      success: true,
      scope: { eventId: eventIdParam || null },
      generatedAt: now.toISOString(),
      events: {
        total: eventsTotal,
        byStatus: toCountMap(eventsByStatus),
        byType: toCountMap(eventsByType),
        list: (eventList as any[]).map((e) => ({
          _id: String(e._id),
          title: e.title,
          eventType: e.eventType,
          status: e.status,
          startDate: e.startDate,
        })),
      },
      registrations: {
        total: totals.total,
        byStatus: toCountMap(regByStatus),
        byPaymentStatus: toCountMap(regByPayment),
        paidCount: totals.paidCount,
        amountPaid: totals.amountPaid,
        perDay,
        perEvent: (regPerEvent as any[]).map((r) => ({
          eventId: String(r._id),
          title: titleById.get(String(r._id)) || 'Deleted event',
          total: r.total,
          approved: r.approved,
          pending: r.pending,
          amountPaid: r.amountPaid,
        })),
      },
      auction: auctionStats,
      teams: { total: teamsTotal },
    });
  } catch (error) {
    console.error('Error building admin stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard stats' }, { status: 500 });
  }
}
