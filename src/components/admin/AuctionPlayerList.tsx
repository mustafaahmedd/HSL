'use client';

import React, { useMemo, useState } from 'react';
import PlayerPhoto from '@/components/ui/PlayerPhoto';
import { CATEGORY_ORDER } from '@/lib/auctionConfig';
import { PLAYER_ROLES, COURSES } from '@/lib/playerOptions';

const TAG: Record<string, string> = {
  Captain: 'bg-green-100 text-green-800',
  Platinum: 'bg-purple-100 text-purple-800',
  Gold: 'bg-yellow-100 text-yellow-800',
  Silver: 'bg-slate-100 text-slate-800',
};

interface Props {
  players: any[];
  onEdit: (player: any) => void;
  onPhotoClick?: (url: string) => void;
}

// Compact, filterable list of everyone in the auction (pool + captains) with an Edit action per row.
export default function AuctionPlayerList({ players, onEdit, onPhotoClick }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [onlyIssues, setOnlyIssues] = useState(false);

  const categoryOf = (p: any) => (p.approvedIconPlayer ? 'Captain' : p.approvedCategory || '—');
  // Flag rows that need attention before the auction: no photo, or a role/course outside the standard lists
  const issuesOf = (p: any) => [
    !p.photoUrl && 'no photo',
    p.playerRole && !PLAYER_ROLES.includes(p.playerRole) && 'role',
    p.courseEnrolled && !COURSES.includes(p.courseEnrolled) && 'course',
  ].filter(Boolean) as string[];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order = ['Captain', ...CATEGORY_ORDER];
    return players
      .filter(p => category === 'All' || categoryOf(p) === category)
      .filter(p => !q || p.name?.toLowerCase().includes(q))
      .filter(p => !onlyIssues || issuesOf(p).length > 0)
      .sort((a, b) => order.indexOf(categoryOf(a)) - order.indexOf(categoryOf(b)) || (a.name || '').localeCompare(b.name || ''));
  }, [players, query, category, onlyIssues]);

  const issueCount = players.filter(p => issuesOf(p).length > 0).length;

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search players…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {['All', 'Captain', ...CATEGORY_ORDER].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {issueCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-amber-700 whitespace-nowrap px-1">
            <input type="checkbox" checked={onlyIssues} onChange={e => setOnlyIssues(e.target.checked)} />
            Needs attention ({issueCount})
          </label>
        )}
      </div>

      <div className="max-h-[480px] overflow-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visible.map(p => {
              const issues = issuesOf(p);
              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3 min-w-44">
                      <PlayerPhoto
                        src={p.photoUrl}
                        name={p.name}
                        onClick={p.photoUrl && onPhotoClick ? () => onPhotoClick(p.photoUrl) : undefined}
                        className={`h-9 w-9 shrink-0 rounded-full object-cover ${p.photoUrl ? 'cursor-pointer' : ''}`}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                        {issues.length > 0 && <div className="text-xs text-amber-700">Check: {issues.join(', ')}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${TAG[categoryOf(p)] || 'bg-gray-100 text-gray-700'}`}>{categoryOf(p)}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{p.playerRole || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{p.courseEnrolled || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {p.teamName
                      ? <span className="text-green-700">{p.teamName}{p.bidPrice ? ` · PKR ${p.bidPrice.toLocaleString()}` : ''}</span>
                      : <span className="text-gray-500">Available</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => onEdit(p)} className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No players match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
