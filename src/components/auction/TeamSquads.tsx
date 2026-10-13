'use client';

import React, { useEffect, useMemo, useState } from 'react';

const TAG: Record<string, string> = {
  Captain: 'bg-green-100 text-green-800',
  Platinum: 'bg-purple-100 text-purple-800',
  Gold: 'bg-yellow-100 text-yellow-800',
  Silver: 'bg-slate-200 text-slate-800',
};

const pkr = (n?: number) => `PKR ${(n || 0).toLocaleString()}`;
const pointsLeftOf = (t: any) => t.pointsLeft ?? ((t.totalPoints || 0) - (t.pointsSpent || 0));

// Public, mobile-first view of every team's squad: captain, purchases (in order) and purse.
// A team picker lets a captain/owner jump to their own team (remembered on the device), and a search
// finds any player: which team bought them and for how much, or that they're still unsold.
export default function TeamSquads({ teams, players = [], storageKey }: { teams: any[]; players?: any[]; storageKey: string }) {
  const [selected, setSelected] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSelected(saved);
    } catch { /* storage unavailable */ }
  }, [storageKey]);

  const choose = (id: string) => {
    setSelected(id);
    try { localStorage.setItem(storageKey, id); } catch { /* ignore */ }
  };

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [teams]
  );
  const visible = selected === 'all' ? sortedTeams : sortedTeams.filter(t => t._id?.toString() === selected);

  // Everyone searchable: team rosters (incl. captains) plus pool players not bought yet
  const directory = useMemo(() => {
    const rows: { key: string; name: string; category?: string; role?: string; teamId?: string; teamTitle?: string; price?: number }[] = [];
    const seen = new Set<string>();
    for (const t of sortedTeams) {
      for (const p of t.players || []) {
        const name = p.playerName || '';
        seen.add(name.toLowerCase());
        rows.push({ key: `${t._id}-${p.registrationId || name}`, name, category: p.category, role: p.playerRole, teamId: t._id?.toString(), teamTitle: t.title, price: p.purchasePrice });
      }
    }
    for (const p of players) {
      const name = p.name || '';
      if (!name || seen.has(name.toLowerCase())) continue;
      rows.push({ key: String(p._id), name, category: p.approvedIconPlayer ? 'Captain' : p.approvedCategory, role: p.playerRole });
    }
    return rows;
  }, [sortedTeams, players]);

  const q = query.trim().toLowerCase();
  const results = q ? directory.filter(r => r.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="text-gray-900">
      {/* Player search */}
      <div className="relative mb-3">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search a player…"
          // globals.css styles inputs unlayered; keep this one explicit
          style={{ backgroundColor: '#fff', color: '#111827' }}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {q && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
            {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query.trim()}&rdquo;
          </div>
          <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {results.map(r => (
              <li key={r.key}>
                <button
                  type="button"
                  disabled={!r.teamId}
                  onClick={() => { if (r.teamId) { choose(r.teamId); setQuery(''); } }}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left enabled:hover:bg-blue-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 break-words">{r.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      {r.category && <span className={`rounded px-1.5 py-0.5 font-medium ${TAG[r.category] || 'bg-gray-100 text-gray-700'}`}>{r.category}</span>}
                      {r.role && <span>{r.role}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    {r.teamId ? (
                      <>
                        <div className="font-semibold text-blue-700">Team {r.teamTitle}</div>
                        <div className="text-xs text-gray-600">{r.category === 'Captain' ? 'Captain' : pkr(r.price)}</div>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-amber-700">Not sold yet</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">No player matches</li>}
          </ul>
        </div>
      )}

      {/* Team picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
        {[{ _id: 'all', title: 'All teams' }, ...sortedTeams].map(t => {
          const id = t._id?.toString();
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'}`}
            >
              {id === 'all' ? t.title : `Team ${t.title}`}
            </button>
          );
        })}
      </div>

      <div className={`grid gap-4 ${selected === 'all' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 max-w-2xl'}`}>
        {visible.map(team => {
          const roster = [...(team.players || [])].sort(
            (a: any, b: any) => new Date(a.transactionDate || 0).getTime() - new Date(b.transactionDate || 0).getTime()
          );
          const captainEntry = roster.find((p: any) => p.category === 'Captain');
          const purchases = roster.filter((p: any) => p.category !== 'Captain');
          const left = pointsLeftOf(team);
          const spentPct = team.totalPoints ? Math.min(100, ((team.pointsSpent || 0) / team.totalPoints) * 100) : 0;

          return (
            <section key={team._id?.toString()} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
                <h4 className="text-lg font-bold">Team {team.title}</h4>
                <p className="text-sm text-blue-50">
                  Owner: <span className="font-semibold text-white">{team.owner || '—'}</span>
                  <span className="mx-2 opacity-60">·</span>
                  Captain: <span className="font-semibold text-white">{team.captain || captainEntry?.playerName || 'TBD'}</span>
                </p>
              </header>

              {/* Purse */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 text-center">
                <div className="px-2 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Purse</div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">{pkr(team.totalPoints)}</div>
                </div>
                <div className="px-2 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Spent</div>
                  <div className="text-xs sm:text-sm font-bold text-red-600 whitespace-nowrap">{pkr(team.pointsSpent)}</div>
                </div>
                <div className="px-2 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Left</div>
                  <div className="text-xs sm:text-sm font-bold text-green-700 whitespace-nowrap">{pkr(left)}</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100">
                <div className="h-full bg-red-500" style={{ width: `${spentPct}%` }} />
              </div>

              {/* Squad */}
              <ol className="divide-y divide-gray-100">
                {(team.captain || captainEntry) && (
                  <li className="flex items-start gap-3 px-4 py-2.5 bg-green-50/60">
                    <span className="w-5 shrink-0 pt-0.5 text-xs text-gray-400">1</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 break-words">{team.captain || captainEntry?.playerName}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span className={`rounded px-1.5 py-0.5 font-medium ${TAG.Captain}`}>Captain</span>
                        {captainEntry?.playerRole && <span>{captainEntry.playerRole}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-right text-sm text-gray-400">—</span>
                  </li>
                )}
                {purchases.map((p: any, i: number) => (
                  <li key={p.registrationId?.toString() || i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="w-5 shrink-0 pt-0.5 text-xs text-gray-400">{i + ((team.captain || captainEntry) ? 2 : 1)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 break-words">{p.playerName || '—'}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span className={`rounded px-1.5 py-0.5 font-medium ${TAG[p.category] || 'bg-gray-100 text-gray-700'}`}>{p.category || '—'}</span>
                        {p.playerRole && <span>{p.playerRole}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-right text-sm font-semibold text-gray-900 tabular-nums">
                      {(p.purchasePrice || 0).toLocaleString()}
                    </span>
                  </li>
                ))}
                {purchases.length === 0 && (
                  <li className="px-4 py-4 text-center text-sm text-gray-500">No players bought yet</li>
                )}
              </ol>

              <footer className="flex justify-between bg-gray-50 px-4 py-2 text-xs text-gray-600">
                <span>{purchases.length + ((team.captain || captainEntry) ? 1 : 0)} players</span>
                <span>Purse left <span className="font-semibold text-green-700">{pkr(left)}</span></span>
              </footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}
