import { renderAuctionOgImage } from '@/lib/auctionOgImage';

// Link-preview image for this page; design lives in src/lib/auctionOgImage.tsx
export const runtime = 'nodejs'; // needs Mongoose
export const alt = 'Player auction — player pool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderAuctionOgImage(id, 'pool');
}
