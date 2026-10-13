import { ImageResponse } from 'next/og';
import { getAuctionSummary, formatAuctionDate } from '@/lib/auctionSummary';

// Shared 1200×630 link-preview image for public auction pages (what WhatsApp/Facebook show).
//   'pool' → /auction/[id]/players   (who's in the auction, base prices)
//   'live' → /auction/[id]/details   (LIVE badge, sold progress, "watch live")
// Each page's opengraph-image.tsx calls renderAuctionOgImage with its variant.
export const OG_SIZE = { width: 1200, height: 630 };

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

const tile = (border = 'rgba(255,255,255,0.12)') => ({
  display: 'flex', flexDirection: 'column' as const, padding: '14px 24px', borderRadius: 16,
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`,
});

export async function renderAuctionOgImage(auctionId: string, variant: 'pool' | 'live') {
  const summary = await getAuctionSummary(auctionId).catch(() => null);
  const photos = summary ? await loadPhotos(summary.photos, 8) : [];
  const when = formatAuctionDate(summary?.auctionDate);
  const isLive = summary?.status === 'live';
  const isDone = summary?.status === 'completed';

  const badge = variant === 'live'
    ? isLive ? { text: '● LIVE NOW', bg: '#dc2626' } : isDone ? { text: 'RESULTS', bg: '#475569' } : { text: 'STARTS SOON', bg: '#0284c7' }
    : null;
  const cta = variant === 'live'
    ? isDone ? 'See final squads →' : isLive ? 'Watch the auction live →' : 'Follow the auction live →'
    : 'See the full player pool →';

  const stats = summary
    ? variant === 'live'
      ? [
          { label: 'Sold', value: `${summary.soldCount}/${summary.poolCount}` },
          { label: 'Teams', value: String(summary.teamCount) },
          { label: 'Captains', value: String(summary.captainCount) },
        ]
      : [
          { label: 'Players', value: String(summary.poolCount + summary.captainCount) },
          { label: 'Teams', value: String(summary.teamCount) },
        ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '56px 64px', color: '#f8fafc',
          background: variant === 'live'
            ? 'radial-gradient(circle at 85% 10%, rgba(220,38,38,0.35), transparent 45%), radial-gradient(circle at 0% 100%, rgba(16,185,129,0.22), transparent 40%), #0b0f19'
            : 'radial-gradient(circle at 85% 10%, rgba(16,185,129,0.35), transparent 45%), radial-gradient(circle at 0% 100%, rgba(217,119,6,0.25), transparent 40%), #0b0f19',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {badge && (
              <div style={{ display: 'flex', padding: '6px 14px', borderRadius: 999, background: badge.bg, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
                {badge.text}
              </div>
            )}
            <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: '#34d399', fontWeight: 700 }}>
              {(summary?.eventTitle || 'Hikmah Student Life').toUpperCase()} · {variant === 'live' ? (isDone ? 'AUCTION RESULTS' : 'LIVE AUCTION') : 'PLAYER AUCTION'}
            </div>
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
            {stats.map(s => (
              <div key={s.label} style={tile()}>
                <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>{s.value}</div>
                <div style={{ display: 'flex', fontSize: 20, color: '#94a3b8' }}>{s.label}</div>
              </div>
            ))}
            {variant === 'pool' && summary.categories.filter(c => c.count > 0).map(c => (
              <div key={c.name} style={tile(TIER_COLOR[c.name] || '#475569')}>
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
          <div style={{ display: 'flex', padding: '14px 28px', borderRadius: 999, background: variant === 'live' && isLive ? '#dc2626' : '#10b981', fontSize: 26, fontWeight: 700, color: '#ffffff' }}>
            {cta}
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
