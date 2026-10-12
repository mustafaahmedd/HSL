// Canonical values for free-text player fields (playing role, course), plus normalisers that map
// the many spellings found in form/sheet data onto them. Unrecognised input is returned unchanged
// so nothing is lost; it can be fixed by hand from the player edit dialog.

export const PLAYER_ROLES = ['Batsman', 'Bowler', 'Batting All Rounder', 'Bowling All Rounder', 'Wicket Keeper'];

export const COURSES = ['Darse Nizami', 'QHD', 'QS', 'Prep Oula', 'Reviving Hearts', 'Alumni', 'Not enrolled'];

// Darse Nizami year names, which people sometimes write instead of the course
const DN_YEARS = ['oula', 'saniya', 'sania', 'salisa', 'rabia', 'khamisa', 'sadisa', 'saadisa', 'sabia', 'thamina'];

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

export const normalizeRole = (raw: string): { value: string; matched: boolean } => {
  const v = raw.trim();
  const k = key(v);
  if (!k) return { value: '', matched: false };
  const exact = PLAYER_ROLES.find(r => key(r) === k);
  if (exact) return { value: exact, matched: true };
  if (k.includes('keep') || k === 'wk') return { value: 'Wicket Keeper', matched: true };
  if (k.includes('allround') || k.includes('allrounder')) {
    if (k.startsWith('bowl')) return { value: 'Bowling All Rounder', matched: true };
    if (k.startsWith('bat')) return { value: 'Batting All Rounder', matched: true };
    return { value: v, matched: false };
  }
  if (/^(bats(man|men)|batter|batting)$/.test(k)) return { value: 'Batsman', matched: true };
  if (/^(bowler|bowling)$/.test(k)) return { value: 'Bowler', matched: true };
  return { value: v, matched: false };
};

export const normalizeCourse = (raw: string): { value: string; matched: boolean } => {
  const v = raw.trim();
  const k = key(v);
  if (!k) return { value: '', matched: false };
  const exact = COURSES.find(c => key(c) === k);
  if (exact) return { value: exact, matched: true };
  if (k.startsWith('prep') || k.includes('prepoula')) return { value: 'Prep Oula', matched: true };
  // DN, Dars-e-Nizami, Drs e nizami, Foundation Dars e Nizaami, "Salisa morning" …
  if (k === 'dn' || /d[ae]?r[sz].*niz/.test(k) || DN_YEARS.some(y => k.startsWith(y))) return { value: 'Darse Nizami', matched: true };
  if (k.startsWith('qhd')) return { value: 'QHD', matched: true };
  if (k.startsWith('qs') || k.startsWith('quranicscience')) return { value: 'QS', matched: true };
  if (k.includes('reviving') || k === 'rh') return { value: 'Reviving Hearts', matched: true };
  if (k.startsWith('alum')) return { value: 'Alumni', matched: true };
  if (/^(none|no|na|nil|notenrolled|notrightnow|currentlynot|notcurrently)$/.test(k)) return { value: 'Not enrolled', matched: true };
  return { value: v, matched: false };
};
