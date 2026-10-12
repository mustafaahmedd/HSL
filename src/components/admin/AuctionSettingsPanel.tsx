'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  resolveCategorySettings,
  CategorySetting,
  DEFAULT_TIMER_BUFFER_SECONDS,
  DEFAULT_TIMER_WARNING_PERCENT,
} from '@/lib/auctionConfig';

interface Props {
  auctionId: string;
  auction: { categorySettings?: Partial<CategorySetting>[]; timerBufferSeconds?: number; timerWarningPercent?: number };
  onSaved: () => void;
}

const inputClass = 'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// Per-category base price, bid increment and bid timer, plus the timer's start buffer and warning threshold.
// Collapsible; open state is remembered per browser.
export default function AuctionSettingsPanel({ auctionId, auction, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CategorySetting[]>([]);
  const [buffer, setBuffer] = useState(DEFAULT_TIMER_BUFFER_SECONDS);
  const [warning, setWarning] = useState(DEFAULT_TIMER_WARNING_PERCENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { setOpen(localStorage.getItem('auctionSettingsOpen') === '1'); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setRows(resolveCategorySettings(auction));
    setBuffer(auction.timerBufferSeconds ?? DEFAULT_TIMER_BUFFER_SECONDS);
    setWarning(auction.timerWarningPercent ?? DEFAULT_TIMER_WARNING_PERCENT);
  }, [auction]);

  const toggle = () => setOpen(o => {
    try { localStorage.setItem('auctionSettingsOpen', o ? '0' : '1'); } catch { /* ignore */ }
    return !o;
  });

  const update = (name: string, field: keyof CategorySetting, value: string) =>
    setRows(rs => rs.map(r => (r.name === name ? { ...r, [field]: value === '' ? 0 : Number(value) } : r)));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/auction/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          action: 'update_category_settings',
          data: { categorySettings: rows, timerBufferSeconds: buffer, timerWarningPercent: warning },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      toast.success('Auction settings saved');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-white shadow-md">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Auction Settings</h3>
          <p className="text-xs text-gray-500">
            {rows.map(r => `${r.name}: PKR ${r.minBidPrice.toLocaleString()} · ${r.timerSeconds ? `${r.timerSeconds}s` : 'no timer'}`).join('  |  ')}
          </p>
        </div>
        <svg className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Base price (PKR)</th>
                  <th className="py-2 pr-3 font-medium">Bid increment (PKR)</th>
                  <th className="py-2 pr-3 font-medium">Timer (seconds, 0 = off)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.name} className="border-t border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-900">{r.name}</td>
                    {(['minBidPrice', 'bidIncrement', 'timerSeconds'] as const).map(field => (
                      <td key={field} className="py-2 pr-3 min-w-28">
                        <input
                          type="number"
                          min={0}
                          value={r[field]}
                          onChange={e => update(r.name, field, e.target.value)}
                          className={inputClass}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay before timer starts (seconds)</label>
              <input type="number" min={0} value={buffer} onChange={e => setBuffer(Number(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buzzer starts at (% of time used)</label>
              <input type="number" min={0} max={100} value={warning} onChange={e => setWarning(Number(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <p className="text-xs text-gray-500">New timer values apply from the next player brought up.</p>
          </div>
        </div>
      )}
    </div>
  );
}
