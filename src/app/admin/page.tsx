'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MinusCircleIcon,
  TableCellsIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types (mirror GET /api/admin/stats)
// ---------------------------------------------------------------------------

type CountMap = Record<string, number>;

interface EventSummary {
  _id: string;
  title: string;
  eventType: string;
  status: string;
  startDate: string;
}

interface AuctionStats {
  _id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  status: string;
  auctionDate: string;
  pool: number;
  sold: number;
  unsold: number;
  available: number;
  captains: number;
  totalRevenue: number;
  categories: { category: string; total: number; sold: number; unsold: number; available: number }[];
  teams: {
    _id: string;
    title: string;
    owner: string;
    totalPoints: number;
    pointsSpent: number;
    pointsLeft: number;
    playerCount: number;
  }[];
}

interface Stats {
  scope: { eventId: string | null };
  generatedAt: string;
  events: { total: number; byStatus: CountMap; byType: CountMap; list: EventSummary[] };
  registrations: {
    total: number;
    byStatus: CountMap;
    byPaymentStatus: CountMap;
    paidCount: number;
    amountPaid: number;
    perDay: { date: string; count: number }[];
    perEvent: { eventId: string; title: string; total: number; approved: number; pending: number; amountPaid: number }[];
  };
  auction: AuctionStats | null;
  teams: { total: number };
}

// ---------------------------------------------------------------------------
// Chart tokens (dataviz reference palette, light mode — the admin shell is light-only)
// ---------------------------------------------------------------------------

const C = {
  series1: '#2a78d6', // blue — primary measure
  series2: '#eb6834', // orange — second series (unsold)
  track: '#b7d3f6', // blue step 150 — remainder / unfilled track (same ramp as series1)
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  muted: '#898781',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  neutral: '#c3c2b7',
};

// Status colours carry meaning (good / warning / critical) and always ship with an icon + label.
const STATUS_STYLE: Record<string, { color: string; Icon: typeof CheckCircleIcon; order: number }> = {
  approved: { color: C.good, Icon: CheckCircleIcon, order: 0 },
  paid: { color: C.good, Icon: CheckCircleIcon, order: 0 },
  pending: { color: C.warning, Icon: ClockIcon, order: 1 },
  rejected: { color: C.critical, Icon: XCircleIcon, order: 2 },
  failed: { color: C.critical, Icon: XCircleIcon, order: 2 },
  cancelled: { color: C.neutral, Icon: MinusCircleIcon, order: 3 },
  refunded: { color: C.neutral, Icon: MinusCircleIcon, order: 3 },
};
const statusStyle = (key: string) => STATUS_STYLE[key] || { color: C.neutral, Icon: MinusCircleIcon, order: 9 };

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) => (n || 0).toLocaleString('en-US');
const fmtCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 || n >= 10000 ? 0 : 1)}K` : String(n);
const pkr = (n: number) => `PKR ${fmt(n)}`;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// perDay dates are 'YYYY-MM-DD' calendar days; parse as local noon so the label never shifts a day.
const parseDay = (d: string) => new Date(`${d}T12:00:00`);
const dayShort = (d: string) => parseDay(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const dayLong = (d: string) =>
  parseDay(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const dateLabel = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

// Clean axis maximum + ticks (1 / 2 / 5 × 10^k steps).
const niceScale = (max: number, tickCount = 4) => {
  if (max <= 0) return { max: tickCount, ticks: Array.from({ length: tickCount + 1 }, (_, i) => i) };
  const raw = max / tickCount;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw && Number.isInteger(s)) || Math.ceil(raw);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { max: top, ticks };
};

const STATUS_PILL: Record<string, string> = {
  upcoming: 'bg-blue-50 text-blue-700 ring-blue-200',
  live: 'bg-green-50 text-green-700 ring-green-200',
  completed: 'bg-gray-100 text-gray-700 ring-gray-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_PILL[status] || STATUS_PILL.completed
      }`}
    >
      {status === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-green-600" aria-hidden />}
      {cap(status)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: C.track }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: C.series1 }} />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  meter,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  meter?: { value: number; max: number };
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold text-gray-900 sm:text-3xl">{value}</div>
      {meter && <Meter value={meter.value} max={meter.max} label={label} />}
      {sub && <div className="mt-2 truncate text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

// Chart container: title, optional legend, and a table-view twin of the chart (the accessible equivalent).
function ChartCard({
  title,
  subtitle,
  legend,
  table,
  className = '',
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  legend?: { label: string; color: string }[];
  table?: { columns: string[]; rows: (string | number)[][] };
  className?: string;
  children: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {table && table.rows.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            aria-pressed={showTable}
          >
            {showTable ? <ChartBarIcon className="h-4 w-4" /> : <TableCellsIcon className="h-4 w-4" />}
            {showTable ? 'Chart' : 'Table'}
          </button>
        )}
      </div>
      {legend && legend.length > 1 && !showTable && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        {showTable && table ? (
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} className={`px-3 py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-1.5 ${ci > 0 ? 'text-right tabular-nums text-gray-900' : 'text-gray-700'}`}
                      >
                        {typeof cell === 'number' ? fmt(cell) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

// Column chart: one bar per day. Crosshair-style hover/focus readout; columns are the hit targets.
function DailyColumns({ data }: { data: { date: string; count: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const { max, ticks } = niceScale(Math.max(...data.map((d) => d.count), 0));
  const n = data.length;
  const PLOT_H = 160;
  const labelEvery = n > 14 ? 7 : 1;
  const a = active != null ? data[active] : null;

  return (
    <div className="flex gap-2" onPointerLeave={() => setActive(null)}>
      {/* Y axis */}
      <div className="relative w-7 shrink-0 text-right text-[11px] tabular-nums text-gray-400" style={{ height: PLOT_H }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2 leading-none" style={{ top: PLOT_H - (t / max) * PLOT_H }}>
            {fmtCompact(t)}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        {/* Plot */}
        <div className="relative" style={{ height: PLOT_H }}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 h-px"
              style={{ top: PLOT_H - (t / max) * PLOT_H, backgroundColor: t === 0 ? C.baseline : C.grid }}
              aria-hidden
            />
          ))}
          <div className="absolute inset-0 flex items-end" role="list" aria-label="Registrations per day">
            {data.map((d, i) => (
              <div
                key={d.date}
                role="listitem"
                tabIndex={0}
                aria-label={`${dayLong(d.date)}: ${d.count} registration${d.count === 1 ? '' : 's'}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="flex h-full flex-1 cursor-default items-end justify-center px-px outline-none focus-visible:bg-blue-50"
              >
                {active === i && <div className="pointer-events-none absolute inset-y-0 w-px bg-gray-300" style={{ left: `${((i + 0.5) / n) * 100}%` }} />}
                <div
                  className="w-full max-w-6 rounded-t-sm transition-opacity"
                  style={{
                    height: d.count > 0 ? Math.max(2, (d.count / max) * PLOT_H) : 0,
                    backgroundColor: C.series1,
                    opacity: active == null || active === i ? 1 : 0.55,
                  }}
                />
              </div>
            ))}
          </div>
          {a && active != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
              style={
                active < n / 3
                  ? { left: `${(active / n) * 100}%` }
                  : active > (2 * n) / 3
                  ? { right: `${((n - active - 1) / n) * 100}%` }
                  : { left: `${((active + 0.5) / n) * 100}%`, transform: 'translateX(-50%)' }
              }
            >
              <div className="whitespace-nowrap font-semibold text-gray-900">
                {fmt(a.count)} registration{a.count === 1 ? '' : 's'}
              </div>
              <div className="whitespace-nowrap text-gray-500">{dayLong(a.date)}</div>
            </div>
          )}
        </div>
        {/* X axis band (part of the container height, never clipped) */}
        <div className="relative mt-1.5 h-4 text-[11px] text-gray-400">
          {data.map((d, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <span
                key={d.date}
                className={`absolute whitespace-nowrap ${i === n - 1 ? '-translate-x-full' : i === 0 ? '' : '-translate-x-1/2'}`}
                style={{ left: i === n - 1 ? '100%' : i === 0 ? 0 : `${((i + 0.5) / n) * 100}%` }}
              >
                {i === n - 1 ? 'Today' : dayShort(d.date)}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

// Part-to-whole status breakdown: one stacked bar + a labelled legend (icon + label + count).
function StatusBreakdown({ title, counts }: { title: string; counts: CountMap }) {
  const entries = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => statusStyle(a[0]).order - statusStyle(b[0]).order || b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">{title}</span>
        <span className="text-xs text-gray-500">{fmt(total)} total</span>
      </div>
      {total === 0 ? (
        <div className="h-3 rounded-r-sm" style={{ backgroundColor: C.grid }} />
      ) : (
        <div className="flex h-3 w-full gap-0.5">
          {entries.map(([k, v], i) => (
            <div
              key={k}
              title={`${cap(k)}: ${fmt(v)} (${pct(v, total)}%)`}
              className={i === entries.length - 1 ? 'rounded-r-sm' : ''}
              style={{ width: `${(v / total) * 100}%`, minWidth: 3, backgroundColor: statusStyle(k).color }}
            />
          ))}
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {entries.map(([k, v]) => {
          const { color, Icon } = statusStyle(k);
          return (
            <li key={k} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
              <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-gray-700">{cap(k)}</span>
              <span className="font-medium tabular-nums text-gray-900">{fmt(v)}</span>
              <span className="w-10 text-right text-xs tabular-nums text-gray-500">{pct(v, total)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Horizontal stacked bar row: label above, segments (2px surface gap, 4px rounded data-end).
function SegmentRow({
  label,
  right,
  note,
  segments,
  scale,
}: {
  label: string;
  right: React.ReactNode;
  note?: React.ReactNode;
  segments: { value: number; color: string; name: string }[];
  scale: number; // the value that spans the full row width
}) {
  const visible = segments.filter((s) => s.value > 0);
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-gray-800">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-gray-600">{right}</span>
      </div>
      <div className="flex h-3 w-full">
        <div className="flex h-full gap-0.5" style={{ width: `${scale > 0 ? (total / scale) * 100 : 0}%` }}>
          {visible.map((s, i) => (
            <div
              key={s.name}
              title={`${s.name}: ${fmt(s.value)}`}
              className={`h-full transition-opacity group-hover:opacity-90 ${i === visible.length - 1 ? 'rounded-r-sm' : ''}`}
              style={{ flexGrow: s.value, flexBasis: 0, minWidth: 3, backgroundColor: s.color }}
            />
          ))}
        </div>
      </div>
      {note && <div className="mt-1 text-xs text-gray-500">{note}</div>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-xl border border-gray-200 bg-white lg:col-span-2" />
        <div className="h-72 rounded-xl border border-gray-200 bg-white" />
      </div>
      <div className="h-64 rounded-xl border border-gray-200 bg-white" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  const load = useCallback(
    async (scopeEventId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!token) return; // the admin layout redirects to login
      const seq = ++requestSeq.current;
      setLoading(true);
      try {
        const qs = scopeEventId ? `?eventId=${encodeURIComponent(scopeEventId)}` : '';
        const res = await fetch(`/api/admin/stats${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          toast.error('Your session has expired. Please log in again.');
          router.replace('/admin/login?redirect=%2Fadmin');
          return;
        }
        const data = await res.json();
        if (seq !== requestSeq.current) return; // a newer request superseded this one
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load dashboard');
        setStats(data as Stats);
        setEvents(data.events.list);
        setError('');
      } catch (e) {
        if (seq !== requestSeq.current) return;
        const msg = e instanceof Error ? e.message : 'Failed to load dashboard';
        setError(msg);
        toast.error(msg);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    load(eventId);
  }, [eventId, load]);

  const derived = useMemo(() => {
    if (!stats) return null;
    const r = stats.registrations;
    const trendTotal = r.perDay.reduce((s, d) => s + d.count, 0);
    const peak = r.perDay.reduce<{ date: string; count: number } | null>(
      (best, d) => (d.count > (best?.count ?? 0) ? d : best),
      null
    );
    const regCountByEvent = new Map(r.perEvent.map((e) => [e.eventId, e]));
    const upcoming = stats.events.list
      .filter((e) => (e.status === 'upcoming' || e.status === 'live') && (!eventId || e._id === eventId))
      .sort((x, y) => new Date(x.startDate).getTime() - new Date(y.startDate).getTime())
      .slice(0, 5);
    return { trendTotal, peak, regCountByEvent, upcoming };
  }, [stats, eventId]);

  const selectedEvent = events.find((e) => e._id === eventId);

  return (
    <div className="space-y-6">
      {/* Header + filter row (scopes everything below) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {selectedEvent ? selectedEvent.title : 'All events'}
            {stats && (
              <>
                {' · updated '}
                {new Date(stats.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-event" className="sr-only">
            Filter by event
          </label>
          <select
            id="dashboard-event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64 sm:flex-none"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title}
                {e.status !== 'upcoming' ? ` (${e.status})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(eventId)}
            disabled={loading}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            aria-label="Refresh"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {!stats && loading && <LoadingSkeleton />}

      {!stats && !loading && error && (
        <div className="rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-gray-900">Couldn&apos;t load the dashboard</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={() => load(eventId)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {stats && derived && (
        // Refetch keeps the frame: previous numbers stay visible, dimmed, while the new slice loads.
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
              label="Upcoming events"
              value={fmt((stats.events.byStatus.upcoming || 0) + (stats.events.byStatus.live || 0))}
              sub={`${fmt(stats.events.byStatus.live || 0)} live · ${fmt(stats.events.total)} total`}
            />
            <StatTile
              label="Approved registrations"
              value={
                <>
                  {fmt(stats.registrations.byStatus.approved || 0)}
                  <span className="text-base font-normal text-gray-400"> / {fmt(stats.registrations.total)}</span>
                </>
              }
              meter={{ value: stats.registrations.byStatus.approved || 0, max: stats.registrations.total }}
              sub={`${fmt(stats.registrations.byStatus.pending || 0)} pending review`}
            />
            <StatTile
              label="Payments collected"
              value={pkr(stats.registrations.amountPaid)}
              sub={`${fmt(stats.registrations.paidCount)} paid · ${fmt(stats.registrations.byPaymentStatus.pending || 0)} pending`}
            />
            {stats.auction ? (
              <StatTile
                label="Auction players sold"
                value={
                  <>
                    {fmt(stats.auction.sold)}
                    <span className="text-base font-normal text-gray-400"> / {fmt(stats.auction.pool)}</span>
                  </>
                }
                meter={{ value: stats.auction.sold, max: stats.auction.pool }}
                sub={stats.auction.name}
              />
            ) : (
              <StatTile label="Teams" value={fmt(stats.teams.total)} sub="No auction for this selection" />
            )}
          </div>

          {/* Registrations */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Registrations per day"
              subtitle={
                derived.trendTotal > 0 ? (
                  <>
                    {fmt(derived.trendTotal)} in the last 30 days
                    {derived.peak && ` · peak ${fmt(derived.peak.count)} on ${dayShort(derived.peak.date)}`}
                  </>
                ) : (
                  'Last 30 days'
                )
              }
              table={{
                columns: ['Day', 'Registrations'],
                rows: stats.registrations.perDay
                  .filter((d) => d.count > 0)
                  .reverse()
                  .map((d) => [dayLong(d.date), d.count]),
              }}
            >
              {derived.trendTotal === 0 ? (
                <EmptyNote>No registrations in the last 30 days.</EmptyNote>
              ) : (
                <DailyColumns data={stats.registrations.perDay} />
              )}
            </ChartCard>

            <ChartCard
              title="Registration status"
              subtitle="Review and payment progress"
              table={{
                columns: ['Status', 'Count'],
                rows: [
                  ...Object.entries(stats.registrations.byStatus).map(([k, v]) => [`Review: ${cap(k)}`, v]),
                  ...Object.entries(stats.registrations.byPaymentStatus).map(([k, v]) => [`Payment: ${cap(k)}`, v]),
                ],
              }}
            >
              {stats.registrations.total === 0 ? (
                <EmptyNote>No registrations yet.</EmptyNote>
              ) : (
                <div className="space-y-6">
                  <StatusBreakdown title="Review" counts={stats.registrations.byStatus} />
                  <StatusBreakdown title="Payment" counts={stats.registrations.byPaymentStatus} />
                </div>
              )}
            </ChartCard>
          </div>

          {/* Auction */}
          {stats.auction ? (
            <AuctionSection auction={stats.auction} />
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Auction</h2>
              <div className="mt-3">
                <EmptyNote>
                  {eventId ? 'This event has no auction.' : 'No auctions yet.'}{' '}
                  <Link href="/admin/auction" className="font-medium text-blue-600 hover:underline">
                    Auction control
                  </Link>
                </EmptyNote>
              </div>
            </section>
          )}

          {/* Events */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">Upcoming events</h2>
                <Link href="/admin/events" className="shrink-0 text-sm font-medium text-blue-600 hover:underline">
                  All events
                </Link>
              </div>
              <div className="mt-3">
                {derived.upcoming.length === 0 ? (
                  <EmptyNote>{eventId ? 'The selected event is not upcoming.' : 'No upcoming events.'}</EmptyNote>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {derived.upcoming.map((e) => {
                      const reg = derived.regCountByEvent.get(e._id);
                      return (
                        <li key={e._id}>
                          <Link
                            href={`/admin/events/${e._id}/participants`}
                            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-gray-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-gray-900">{e.title}</div>
                              <div className="truncate text-xs text-gray-500">
                                {cap(e.eventType)} · {dateLabel(e.startDate)}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-sm font-semibold tabular-nums text-gray-900">{fmt(reg?.total || 0)}</div>
                              <div className="text-xs text-gray-500">
                                {reg?.pending ? `${fmt(reg.pending)} pending` : 'registered'}
                              </div>
                            </div>
                            {e.status === 'live' && <StatusPill status="live" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
                {Object.entries(stats.events.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, n]) => (
                    <span key={type} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {cap(type)} <span className="font-semibold text-gray-900">{n}</span>
                    </span>
                  ))}
              </div>
            </section>

            <ChartCard
              title="Registrations by event"
              subtitle={eventId ? 'Selected event' : 'Top events by registrations'}
              legend={[
                { label: 'Approved', color: C.series1 },
                { label: 'Not yet approved', color: C.track },
              ]}
              table={{
                columns: ['Event', 'Total', 'Approved', 'Pending', 'Paid (PKR)'],
                rows: stats.registrations.perEvent.map((e) => [e.title, e.total, e.approved, e.pending, e.amountPaid]),
              }}
            >
              {stats.registrations.perEvent.length === 0 ? (
                <EmptyNote>No registrations yet.</EmptyNote>
              ) : (
                <div className="space-y-4">
                  {stats.registrations.perEvent.slice(0, 6).map((e) => (
                    <SegmentRow
                      key={e.eventId}
                      label={e.title}
                      right={
                        <>
                          <span className="font-semibold text-gray-900">{fmt(e.approved)}</span> / {fmt(e.total)}
                        </>
                      }
                      note={e.amountPaid > 0 ? `${pkr(e.amountPaid)} collected` : undefined}
                      scale={stats.registrations.perEvent[0].total}
                      segments={[
                        { name: 'Approved', value: e.approved, color: C.series1 },
                        { name: 'Not yet approved', value: e.total - e.approved, color: C.track },
                      ]}
                    />
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auction section
// ---------------------------------------------------------------------------

function AuctionSection({ auction }: { auction: AuctionStats }) {
  const maxCategory = Math.max(...auction.categories.map((c) => c.total), 0);
  const maxPurse = Math.max(...auction.teams.map((t) => Math.max(t.totalPoints, t.pointsSpent)), 0);
  const hasUnsold = auction.unsold > 0;
  const spentTotal = auction.teams.reduce((s, t) => s + t.pointsSpent, 0);
  const purseTotal = auction.teams.reduce((s, t) => s + t.totalPoints, 0);

  return (
    <section className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-gray-900">{auction.name}</h2>
              <StatusPill status={auction.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {auction.eventTitle && `${auction.eventTitle} · `}
              {dateLabel(auction.auctionDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/auction/${auction._id}`}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open auction console
            </Link>
            <Link
              href={`/auction/${auction._id}/players`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Public player pool <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ['In pool', fmt(auction.pool)],
            ['Sold', fmt(auction.sold)],
            ['Available', fmt(auction.available)],
            ['Unsold', fmt(auction.unsold)],
            ['Captains', fmt(auction.captains)],
            ['Revenue (pts)', fmtCompact(auction.totalRevenue)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
              <dt className="truncate text-xs text-gray-500">{label}</dt>
              <dd className="truncate text-lg font-semibold text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Players by category"
          subtitle={`Sold vs still in the pool${auction.captains ? ` · ${auction.captains} captains matched separately` : ''}`}
          legend={[
            { label: 'Sold', color: C.series1 },
            ...(hasUnsold ? [{ label: 'Unsold', color: C.series2 }] : []),
            { label: 'Available', color: C.track },
          ]}
          table={{
            columns: ['Category', 'Sold', 'Unsold', 'Available', 'Total'],
            rows: auction.categories.map((c) => [c.category, c.sold, c.unsold, c.available, c.total]),
          }}
        >
          {auction.categories.length === 0 ? (
            <EmptyNote>No players added to this auction yet.</EmptyNote>
          ) : (
            <div className="space-y-4">
              {auction.categories.map((c) => (
                <SegmentRow
                  key={c.category}
                  label={c.category}
                  right={
                    <>
                      <span className="font-semibold text-gray-900">{fmt(c.sold)}</span> / {fmt(c.total)} sold
                    </>
                  }
                  scale={maxCategory}
                  segments={[
                    { name: 'Sold', value: c.sold, color: C.series1 },
                    { name: 'Unsold', value: c.unsold, color: C.series2 },
                    { name: 'Available', value: c.available, color: C.track },
                  ]}
                />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Team purses"
          subtitle={
            purseTotal > 0
              ? `${fmt(spentTotal)} of ${fmt(purseTotal)} points spent (${pct(spentTotal, purseTotal)}%)`
              : 'Points spent vs remaining'
          }
          legend={[
            { label: 'Spent', color: C.series1 },
            { label: 'Remaining', color: C.track },
          ]}
          table={{
            columns: ['Team', 'Players', 'Spent', 'Left', 'Purse'],
            rows: auction.teams.map((t) => [t.title, t.playerCount, t.pointsSpent, t.pointsLeft, t.totalPoints]),
          }}
        >
          {auction.teams.length === 0 ? (
            <EmptyNote>No teams added to this auction yet.</EmptyNote>
          ) : (
            <div className="space-y-4">
              {auction.teams.map((t) => (
                <SegmentRow
                  key={t._id}
                  label={t.title}
                  right={
                    t.pointsLeft < 0 ? (
                      <span className="font-semibold text-red-700">{fmt(-t.pointsLeft)} over budget</span>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900">{fmt(t.pointsLeft)}</span> left
                      </>
                    )
                  }
                  note={`${t.owner ? `${t.owner} · ` : ''}${t.playerCount} player${t.playerCount === 1 ? '' : 's'} · ${fmt(
                    t.pointsSpent
                  )} spent of ${fmt(t.totalPoints)}`}
                  scale={maxPurse}
                  segments={[
                    { name: 'Spent', value: t.pointsSpent, color: C.series1 },
                    { name: 'Remaining', value: Math.max(0, t.pointsLeft), color: C.track },
                  ]}
                />
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
