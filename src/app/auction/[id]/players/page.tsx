'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PlayerPhoto from '@/components/ui/PlayerPhoto';

interface PoolPlayer {
  _id: string;
  name: string;
  photoUrl?: string;
  category: string;
  playerRole?: string;
  courseEnrolled?: string;
  sold: boolean;
  teamName: string;
  bidPrice: number;
}

interface PoolTeam {
  _id: string;
  title: string;
  owner?: string;
  captain?: string;
  totalPoints?: number;
  pointsLeft?: number;
  playerCount: number;
}

interface PoolData {
  auction: { name: string; status: string; auctionDate?: string; event: { title: string; venue?: string } | null };
  categories: { name: string; minBidPrice: number; bidIncrement: number }[];
  teams: PoolTeam[];
  players: PoolPlayer[];
}

const CATEGORY_STYLE: Record<string, string> = {
  Captain: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Platinum: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Gold: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Silver: 'bg-slate-400/15 text-slate-200 border-slate-400/30',
};

const STATUS_STYLE: Record<string, string> = {
  upcoming: 'bg-sky-500/15 text-sky-300',
  live: 'bg-red-500/15 text-red-300',
  completed: 'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-slate-500/20 text-slate-400',
};

const pkr = (n?: number) => `PKR ${(n || 0).toLocaleString()}`;

export default function AuctionPlayerPool() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PoolData | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState<'all' | 'available' | 'sold'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/auction/${id}/pool`, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) { setData(json); setError(''); }
        else setError(json.error || 'Could not load auction');
      } catch {
        if (!cancelled) setError('Could not load auction');
      }
    };
    load();
    // Keep the pool in sync while the auction is running
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  const priceOf = useMemo(() => {
    const map = new Map((data?.categories || []).map(c => [c.name, c]));
    return (cat: string) => map.get(cat);
  }, [data]);

  const tabs = useMemo(() => {
    if (!data) return [];
    const names = ['Captain', ...data.categories.map(c => c.name)];
    return [
      { name: 'All', count: data.players.length },
      ...names.map(n => ({ name: n, count: data.players.filter(p => p.category === n).length })).filter(t => t.count > 0),
    ];
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const order = ['Captain', ...data.categories.map(c => c.name)];
    const q = query.trim().toLowerCase();
    return data.players
      .filter(p => category === 'All' || p.category === category)
      .filter(p => availability === 'all' || (availability === 'sold' ? p.sold : !p.sold))
      .filter(p => !q || p.name.toLowerCase().includes(q) || (p.playerRole || '').toLowerCase().includes(q))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));
  }, [data, category, availability, query]);

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-2">Auction not found</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const { auction, teams, players, categories } = data;
  const sold = players.filter(p => p.sold && p.category !== 'Captain').length;
  const pool = players.filter(p => p.category !== 'Captain').length;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
            {auction.event?.title || 'Player Auction'}
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{auction.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[auction.status] || STATUS_STYLE.upcoming}`}>
              {auction.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            {auction.auctionDate && new Date(auction.auctionDate).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
            {auction.event?.venue && ` · ${auction.event.venue}`}
          </p>
        </header>

        {/* Summary + base prices */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="text-center p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold text-white">{pool}</div>
            <div className="text-xs text-slate-400 mt-1">Players in auction</div>
          </div>
          <div className="text-center p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold text-white">{teams.length}</div>
            <div className="text-xs text-slate-400 mt-1">Teams</div>
          </div>
          <div className="text-center p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold text-emerald-400">{sold}</div>
            <div className="text-xs text-slate-400 mt-1">Sold</div>
          </div>
          <div className="text-center p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold text-amber-400">{pool - sold}</div>
            <div className="text-xs text-slate-400 mt-1">Remaining</div>
          </div>
        </section>

        <section className="glass-card p-4 sm:p-6 mb-8">
          <h2 className="font-bold text-white mb-3">Base prices</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.name} className={`rounded-lg border px-4 py-3 ${CATEGORY_STYLE[c.name] || ''}`}>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-lg font-bold text-white">{pkr(c.minBidPrice)}</div>
                <div className="text-xs opacity-80">Bid increment {pkr(c.bidIncrement)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map(t => (
              <button
                key={t.name}
                onClick={() => setCategory(t.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${category === t.name
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-slate-900/40 text-slate-300 border-slate-700 hover:border-emerald-500/50'}`}
              >
                {t.name === 'Captain' ? 'Captains' : t.name} <span className="opacity-70">({t.count})</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or role…"
              // globals.css gives inputs an unlayered white background, which beats Tailwind utilities
              style={{ backgroundColor: 'rgb(15 23 42 / 0.6)', color: '#fff' }}
              className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex rounded-lg border border-slate-700 overflow-hidden text-sm">
              {(['all', 'available', 'sold'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAvailability(a)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 capitalize ${availability === a ? 'bg-slate-700 text-white' : 'bg-slate-900/40 text-slate-400 hover:text-white'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Players */}
        {visible.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No players match these filters.</p>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-12">
            {visible.map(p => {
              const isCaptain = p.category === 'Captain';
              const price = priceOf(p.category);
              return (
                <article key={p._id} className="glass-card overflow-hidden flex flex-col">
                  <div className="relative aspect-square bg-slate-800">
                    <PlayerPhoto src={p.photoUrl} name={p.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold border backdrop-blur ${CATEGORY_STYLE[p.category] || ''}`}>
                      {p.category}
                    </span>
                    {p.sold && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white">
                        {isCaptain ? 'ASSIGNED' : 'SOLD'}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{p.name}</h3>
                    {p.playerRole && <p className="text-xs text-slate-400">{p.playerRole}</p>}
                    {p.courseEnrolled && <p className="text-xs text-slate-500 truncate">{p.courseEnrolled}</p>}
                    <div className="mt-auto pt-2 border-t border-slate-800 text-xs">
                      {p.sold ? (
                        <p className="text-emerald-300 font-medium">
                          {isCaptain ? `Captain · ${p.teamName}` : `${p.teamName} · ${pkr(p.bidPrice)}`}
                        </p>
                      ) : isCaptain ? (
                        <p className="text-slate-400">Team draw pending</p>
                      ) : (
                        <p className="text-slate-300">Base <span className="font-semibold text-white">{pkr(price?.minBidPrice)}</span></p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Teams */}
        {teams.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Teams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map(t => (
                <div key={t._id} className="glass-card p-4">
                  <h3 className="font-bold text-white text-lg">{t.title}</h3>
                  {t.owner && <p className="text-sm text-slate-400">Owner: <span className="text-slate-200">{t.owner}</span></p>}
                  <p className="text-sm text-slate-400">Captain: <span className="text-slate-200">{t.captain || 'TBD'}</span></p>
                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>{t.playerCount} players</span>
                    {t.totalPoints ? <span>Purse left <span className="text-emerald-300 font-semibold">{pkr(t.pointsLeft)}</span></span> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
