import { CATEGORY_ORDER } from '@/lib/auctionConfig';
import { normalizeRole, normalizeCourse } from '@/lib/playerOptions';

// Parses the Google Form responses sheet, either downloaded as CSV or copy-pasted from Sheets (TSV).
// Expected headers (matched case-insensitively, by substring):
//   Full Name | Contact | Course Enrolled In | Category | Playing Role | Upload your picture for the auction

export const IMPORT_CATEGORIES = ['Captain', ...CATEGORY_ORDER];

export interface ImportRow {
  row: number;
  name: string;
  contactNo: string;
  category: string;
  courseEnrolled: string;
  playerRole: string;
  photoUrl: string; // preview URL (proxied for Drive files)
  driveId?: string;
  // false when the sheet value didn't match a standard option and was kept as typed
  roleMatched: boolean;
  courseMatched: boolean;
}

// Minimal RFC 4180 parser (quoted fields, embedded delimiters/newlines, "" escapes)
const parseDelimited = (text: string, delim: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"' && field === '') inQuotes = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
};

const driveIdOf = (link: string) => link.match(/[?&]id=([\w-]+)/)?.[1] || link.match(/\/d\/([\w-]+)/)?.[1];

// Direct file download; Drive's thumbnail/lh3 endpoints rate-limit (429) when many load at once
export const driveDownloadUrl = (id: string) => `https://drive.usercontent.google.com/download?id=${id}&export=view`;

const normalizeCategory = (raw: string) => {
  const v = raw.trim().toLowerCase().replace(/s$/, '');
  return IMPORT_CATEGORIES.find(c => c.toLowerCase() === v);
};

const normalizeContact = (raw: string) => {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('92')) d = '0' + d.slice(2);
  else if (d.length === 10 && d.startsWith('3')) d = '0' + d;
  return d;
};

export const parsePlayerSheet = (text: string): { players: ImportRow[]; warnings: string[] } => {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0];
  const [header, ...data] = parseDelimited(clean, firstLine.includes('\t') ? '\t' : ',');
  if (!header) throw new Error('Sheet is empty');

  const col = (key: string) => {
    const i = header.findIndex(h => h.toLowerCase().includes(key));
    if (i === -1) throw new Error(`Missing column containing "${key}". Found: ${header.join(' | ')}`);
    return i;
  };
  const C = {
    name: col('full name'), contact: col('contact'), course: col('course'),
    category: col('category'), role: col('playing role'), photo: col('picture'),
  };

  const players: ImportRow[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  data.forEach((r, idx) => {
    const row = idx + 2;
    const name = (r[C.name] || '').trim().replace(/\s+/g, ' ');
    const contactNo = normalizeContact(r[C.contact] || '') || 'N/A';
    const category = normalizeCategory(r[C.category] || '');
    const photo = (r[C.photo] || '').trim();

    if (!name) return warnings.push(`Row ${row}: no name — skipped`);
    // Legend rows at the bottom of the sheet ("Captain", "Gold", … in the name column)
    if (!r[C.category]?.trim() && normalizeCategory(name)) return;
    if (!category) return warnings.push(`Row ${row} (${name}): unknown category "${r[C.category]}" — skipped`);
    const key = `${contactNo}|${name.toLowerCase()}`;
    if (seen.has(key)) return warnings.push(`Row ${row} (${name}): duplicate row — skipped`);
    seen.add(key);
    if (contactNo === 'N/A') warnings.push(`Row ${row} (${name}): no contact number`);
    if (!photo) warnings.push(`Row ${row} (${name}): no photo`);

    const driveId = driveIdOf(photo);
    const role = normalizeRole(r[C.role] || '');
    const course = normalizeCourse(r[C.course] || '');
    players.push({
      row, name, contactNo, category,
      courseEnrolled: course.value,
      courseMatched: course.matched || !course.value,
      playerRole: role.value,
      roleMatched: role.matched || !role.value,
      photoUrl: driveId ? `/api/drive-photo?id=${driveId}` : photo,
      driveId,
    });
  });

  return { players, warnings };
};
