'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PlayerPhoto from '@/components/ui/PlayerPhoto';
import { CATEGORY_ORDER } from '@/lib/auctionConfig';
import { PLAYER_ROLES, COURSES } from '@/lib/playerOptions';

export interface EditablePlayer {
  _id: string;
  name: string;
  photoUrl?: string;
  approvedCategory?: string;
  approvedIconPlayer?: boolean;
  playerRole?: string;
  courseEnrolled?: string;
  contactNo?: string;
}

interface Props {
  player: EditablePlayer | null;
  onClose: () => void;
  onSaved: (saved: { id: string; isCaptain: boolean }) => void;
}

const CATEGORY_OPTIONS = ['Captain', ...CATEGORY_ORDER];

// Options for a standardised field, keeping a non-standard current value selectable so it isn't lost
const withCurrent = (options: string[], current?: string) =>
  current && !options.includes(current) ? [...options, current] : options;

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// Quick edit of an auction player's registration (name, tier, role, course, photo) from the auction console.
export default function EditPlayerModal({ player, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EditablePlayer | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(player ? {
      ...player,
      approvedCategory: player.approvedIconPlayer ? 'Captain' : player.approvedCategory || '',
    } : null);
  }, [player]);

  if (!player || !form) return null;

  const set = (patch: Partial<EditablePlayer>) => setForm(f => (f ? { ...f, ...patch } : f));

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('files', file);
      body.append('category', 'auction-players');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      set({ photoUrl: data.files[0].url });
    } catch (e: any) {
      toast.error(e.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const isCaptain = form.approvedCategory === 'Captain';
      const res = await fetch('/api/registrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          registrationId: player._id,
          name: form.name.trim(),
          photoUrl: form.photoUrl || '',
          playerRole: form.playerRole || '',
          courseEnrolled: form.courseEnrolled || '',
          approvedCategory: form.approvedCategory,
          approvedIconPlayer: isCaptain,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      toast.success(`${form.name} updated`);
      onSaved({ id: player._id, isCaptain });
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit player</h2>

        <div className="flex items-center gap-4 mb-4">
          <PlayerPhoto src={form.photoUrl} name={form.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
          <div className="flex flex-col gap-2 min-w-0">
            <label className="inline-flex w-fit cursor-pointer items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
              {uploading ? 'Uploading…' : form.photoUrl ? 'Replace photo' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => uploadPhoto(e.target.files?.[0])} />
            </label>
            {form.photoUrl && (
              <button type="button" onClick={() => set({ photoUrl: '' })} className="w-fit text-xs text-red-600 hover:underline">
                Remove photo (show initials)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={e => set({ name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.approvedCategory || ''} onChange={e => set({ approvedCategory: e.target.value })} className={inputClass}>
              {withCurrent(CATEGORY_OPTIONS, form.approvedCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Playing role</label>
            <select value={form.playerRole || ''} onChange={e => set({ playerRole: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {withCurrent(PLAYER_ROLES, form.playerRole).map(r => (
                <option key={r} value={r}>{PLAYER_ROLES.includes(r) ? r : `${r} (as typed)`}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select value={form.courseEnrolled || ''} onChange={e => set({ courseEnrolled: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {withCurrent(COURSES, form.courseEnrolled).map(c => (
                <option key={c} value={c}>{COURSES.includes(c) ? c : `${c} (as typed)`}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Changing someone to or from Captain moves them between captain matching and the bidding pool. Make category changes before the player is sold.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
