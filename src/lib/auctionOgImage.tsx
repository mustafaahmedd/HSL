import { ImageResponse } from 'next/og';
import { getAuctionSummary, formatAuctionDate } from '@/lib/auctionSummary';

// Link-preview image for the shareable player pool (1200×630, what WhatsApp/Facebook show).
export const runtime = 'nodejs'; // needs Mongoose
export const alt = 'Player auction — player pool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

const TIER_COLOR: Record<string, string> = { Platinum: '#a78bfa', Gold: '#fbbf24', Silver: '#cbd5e1' };

// Small face-cropped JPEGs inlined as data URIs, so one slow/missing photo can't break the image
async function loadPhotos(urls: string[], max: number): Promise<string[]> {
  const picked = urls.slice(0, max * 2).map(u => u.replace('/upload/', '/upload/w_180,h_180,c_fill,g_face,f_jpg,q_70/'));
  const results = await Promise.all(picked.map(async url => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    } catch {
      return null;
    }
  }));
  return results.filter(Boolean).slice(0, max) as string[];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getAuctionSummary(id).catch(() => null);
  const photos = summary ? await loadPhotos(summary.photos, 8) : [];
  const when = formatAuctionDate(summary?.auctionDate);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '56px 64px', color: '#f8fafc',
          background: 'radial-gradient(circle at 85% 10%, rgba(16,185,129,0.35), transparent 45%), radial-gradient(circle at 0% 100%, rgba(217,119,6,0.25), transparent 40%), #0b0f19',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: '#34d399', fontWeight: 700 }}>
            {(summary?.eventTitle || 'Hikmah Student Life').toUpperCase()} · PLAYER AUCTION
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, marginTop: 12, lineHeight: 1.05 }}>
            {summary?.name || 'Player Auction'}
          </div>
          {when && (
            <div style={{ display: 'flex', fontSize: 30, color: '#cbd5e1', marginTop: 14 }}>
              {`${when}${summary?.venue ? ` · ${summary.venue}` : ''}`}
            </div>
          )}
        </div>

        {summary && (
          <div style={{ display: 'flex', gap: 18 }}>
            {[
              { label: 'Players', value: summary.poolCount + summary.captainCount },
              { label: 'Teams', value: summary.teamCount },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', padding: '14px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>{String(s.value)}</div>
                <div style={{ display: 'flex', fontSize: 20, color: '#94a3b8' }}>{s.label}</div>
              </div>
            ))}
            {summary.categories.filter(c => c.count > 0).map(c => (
              <div key={c.name} style={{ display: 'flex', flexDirection: 'column', padding: '14px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: `1px solid ${TIER_COLOR[c.name] || '#475569'}` }}>
                <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: TIER_COLOR[c.name] || '#e2e8f0' }}>{`${c.name} · ${c.count}`}</div>
                <div style={{ display: 'flex', fontSize: 20, color: '#94a3b8', marginTop: 6 }}>{`Base PKR ${c.minBidPrice.toLocaleString()}`}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                width={96}
                height={96}
                style={{ borderRadius: 48, border: '4px solid #0b0f19', marginLeft: i === 0 ? 0 : -22, objectFit: 'cover' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', padding: '14px 28px', borderRadius: 999, background: '#10b981', fontSize: 26, fontWeight: 700, color: '#ffffff' }}>
            See the full player pool →
          </div>
        </div>
      </div>
    ),
    size
  );
}
