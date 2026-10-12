'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import PlayerPhoto from '@/components/ui/PlayerPhoto';
import { IMPORT_CATEGORIES } from '@/lib/playerImport';

interface PreviewRow {
  row: number;
  name: string;
  contactNo: string;
  category: string;
  courseEnrolled: string;
  playerRole: string;
  photoUrl: string;
  action: 'new' | 'update';
  soldTo?: string;
}

const CATEGORY_TAG: Record<string, string> = {
  Captain: 'bg-green-100 text-green-800',
  Platinum: 'bg-purple-100 text-purple-800',
  Gold: 'bg-yellow-100 text-yellow-800',
  Silver: 'bg-slate-100 text-slate-800',
};

export default function PlayerImport({ auctionId, onImported }: { auctionId: string; onImported: () => void }) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const call = async (commit: boolean) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/auction/${auctionId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ text, commit }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Import failed');
        return;
      }
      if (commit) {
        setResult(`Imported: ${data.inserted} new, ${data.updated} updated. ${data.addedToAuction} players in auction pool, ${data.captains} captains ready for Captain Matching.` +
          (data.photoFailures?.length ? ` Photos not copied (still shown via Drive): ${data.photoFailures.join(', ')}.` : ''));
        setPreview(null);
        setWarnings([]);
        setText('');
        setFileName('');
        onImported();
      } else {
        setPreview(data.preview);
        setWarnings(data.warnings);
        setResult('');
      }
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
    setPreview(null);
  };

  const counts = preview
    ? IMPORT_CATEGORIES.map(c => ({ c, n: preview.filter(p => p.category === c).length }))
    : [];

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-1">Import Players from Sheet</h4>
      <p className="text-xs text-gray-600 mb-3">
        Upload the Form Responses CSV (Sheets → File → Download → .csv) or paste the sheet including its header row.
        Needs columns: Full Name, Contact, Course, Category ({IMPORT_CATEGORIES.join(' / ')}), Playing Role, picture.
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          onChange={e => onFile(e.target.files?.[0])}
          className="text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-100 file:text-purple-700"
        />
        <textarea
          value={fileName ? `Loaded ${fileName}` : text}
          onChange={e => { setFileName(''); setText(e.target.value); setPreview(null); }}
          readOnly={!!fileName}
          placeholder="…or paste rows copied from Google Sheets here"
          className="w-full h-24 p-2 text-xs font-mono border border-gray-300 rounded text-gray-800 bg-white"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={!text.trim() || busy} onClick={() => call(false)}>
            {busy && !preview ? 'Checking…' : 'Preview (dry run)'}
          </Button>
          {preview && preview.length > 0 && (
            <Button size="sm" disabled={busy} onClick={() => call(true)}>
              {busy ? 'Importing & uploading photos (~1 min)…' : `Confirm import of ${preview.length} players`}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mt-3 p-2 text-sm bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}
      {result && <div className="mt-3 p-2 text-sm bg-green-50 text-green-800 rounded border border-green-200">{result}</div>}

      {preview && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 mb-2 text-sm">
            <span className="font-medium text-gray-900">{preview.length} players:</span>
            {counts.map(({ c, n }) => (
              <span key={c} className={`px-2 py-0.5 rounded ${CATEGORY_TAG[c] || 'bg-gray-100 text-gray-800'}`}>{c} {n}</span>
            ))}
            <span className="text-gray-600">
              · {preview.filter(p => p.action === 'new').length} new, {preview.filter(p => p.action === 'update').length} already imported
            </span>
          </div>

          {warnings.length > 0 && (
            <ul className="mb-2 p-2 text-xs bg-amber-50 text-amber-800 rounded border border-amber-200 list-disc list-inside max-h-32 overflow-y-auto">
              {warnings.map(w => <li key={w}>{w}</li>)}
            </ul>
          )}

          <div className="max-h-96 overflow-auto border border-gray-200 rounded bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-left text-gray-700">
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">Photo</th>
                  <th className="px-2 py-1.5">Name</th>
                  <th className="px-2 py-1.5">Contact</th>
                  <th className="px-2 py-1.5">Category</th>
                  <th className="px-2 py-1.5">Role</th>
                  <th className="px-2 py-1.5">Course</th>
                  <th className="px-2 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(p => (
                  <tr key={p.row} className="border-t border-gray-100 text-gray-800">
                    <td className="px-2 py-1 text-gray-500">{p.row}</td>
                    <td className="px-2 py-1">
                      <PlayerPhoto src={p.photoUrl} name={p.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                    </td>
                    <td className="px-2 py-1 font-medium">{p.name}</td>
                    <td className="px-2 py-1">{p.contactNo}</td>
                    <td className="px-2 py-1">
                      <span className={`px-1.5 py-0.5 rounded ${CATEGORY_TAG[p.category] || ''}`}>{p.category}</span>
                    </td>
                    <td className="px-2 py-1">{p.playerRole}</td>
                    <td className="px-2 py-1">{p.courseEnrolled}</td>
                    <td className="px-2 py-1">
                      {p.action === 'new' ? 'New' : p.soldTo ? `Update (sold to ${p.soldTo})` : 'Update'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Players without a photo show their initials. On confirm, photos are copied from Drive to Cloudinary.
          </p>
        </div>
      )}
    </div>
  );
}
