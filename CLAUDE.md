# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # production build
npx tsc --noEmit     # type check (no lint script / no test suite exists)
```

Env vars live in `.env` (gitignored): `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_*`, `NEXT_PUBLIC_DEFAULT_*` (payment account shown on events).

See `ARCHITECTURE.md` for the player/registration data flow (form vs sheet import) and how an auction is run.

## Stack

Next.js 16 App Router (all pages are `'use client'` components that `fetch` the API routes), React 19, Mongoose 8 on MongoDB, Tailwind v4, Cloudinary for uploads, jsPDF for exports. Path alias `@/*` → `src/*`.

## Architecture

**Auth** — single hard-coded admin (`src/lib/auth.ts`). `/api/auth/login` returns a JWT; the client stores it in `localStorage.adminToken` and sends `Authorization: Bearer <token>`. API routes guard with `isAuthenticated(request)`. Some public GETs (e.g. `/api/auction`, `/api/auction/[id]/public`) skip the check.

**DB access** — every route calls `dbConnect()` from `src/lib/mongodb.ts` (cached global connection). Models in `src/models/*` use the `models.X || model(...)` pattern for hot reload; matching TS interfaces are in `src/types/*`.

**Registration is the real player record, not Player.** The newer event system stores participants in `Registration` (one per person per `Event`). Auctions reference Registrations:
- `Auction.players` = Registration ids; `Auction.teams` = Team ids. One `AuctionSession` per auction holds the current player/timer; `Bid` docs exist but the live flow mostly uses moderator `manual_assign`.
- `Player` model and `/api/admin/players` are legacy (the original single-tournament version) — don't build new auction features on them.
- `Team.players` is `Schema.Types.Mixed`; for auction teams each entry is `{ registrationId, playerName, playerRole, category, contactNo, purchasePrice, transactionDate }`. Budget is `totalPoints / pointsSpent / pointsLeft`, mutated manually in the route (call `markModified('players')`).

**Key Registration fields for auctions**: `approvedCategory` (tier), `approvedIconPlayer` (captain), `status: 'approved'`, `auctionStatus` (`available|sold|unsold`), `teamId`, `teamName`, `bidPrice`. The queue endpoint (`/api/auction/queue`) filters on `teamName: ""` exactly, so unsold players must have an empty-string `teamName`, not a missing field.

**Auction state machine** — `PUT /api/auction/[id]` with `{ action, data }`: `add_players`, `add_teams`, `start_auction`, `start_bidding`, `finalize_bid`, `manual_assign`, `remove_player` (undo), `next_player`, `end_auction`, `assign_icon_players`, etc. `reset_auction` undoes captain matching and all sales (clears Registration team fields, empties Team rosters/refunds purses, deletes Bids, resets the session, status back to `upcoming`); it's for dry runs. The admin console is `src/app/admin/auction/[id]/page.tsx` (large single file). Public views: `/auction/[id]/players` (shareable player pool backed by `/api/auction/[id]/pool`, which deliberately omits contact numbers; works before the auction starts and polls every 15s), plus the older `/auction/[id]/details` and `/live` (these only show data once the auction is live).

**Auction tiers** — names/order and default base price, increment and timer live in `src/lib/auctionConfig.ts` (`CATEGORY_CONFIG`); each auction can override them in `Auction.categorySettings` (plus `timerBufferSeconds`, `timerWarningPercent`) via the console's Auction Settings panel. Always read them through `getCategoryConfig(name, auction)` / `resolveCategorySettings(auction)`. `start_bidding` sets `AuctionSession.biddingStartTime = now + buffer` and `biddingEndTime` from the tier's timer; `AuctionTimer` (`src/components/ui/AuctionTimer.tsx`) renders it using the `serverTime` returned by the auction GET routes to correct clock skew. Per-team category quota is computed as `ceil(players in tier / team count)` and enforced both client-side and in `finalize_bid`/`manual_assign`. Captains are not a tier: they are `approvedIconPlayer: true`, kept out of `Auction.players`, and paired with teams via the "Captain Matching" section of the admin console before bidding starts.

**Bulk import** — the "Import Players from Sheet" panel on the admin auction page (`src/components/admin/PlayerImport.tsx`) posts CSV or pasted-from-Sheets TSV to `POST /api/auction/[id]/import` with `commit: false` (preview) then `commit: true`. Parsing and normalisation live in `src/lib/playerImport.ts`. Rows upsert into the auction's event Registrations matched on contact + name; auction state (`auctionStatus`, `teamName`, `bidPrice`) is only set on insert, so re-importing never un-sells anyone. Drive photo links: the preview shows them through `/api/drive-photo?id=` (a proxy, because hotlinking Drive's thumbnail/lh3 URLs returns 429 under load); on commit each is copied to Cloudinary via `uploadRemoteImage` (public_id = Drive id, so it's idempotent), falling back to the proxy URL if the upload fails.

**Events** — `Event.eventType` (`auction|tournament|farmhouse|…`) and `formTemplate` select which form in `src/components/forms/*RegistrationForm.tsx` is rendered at `/events/[id]/register`. Uploads go through `/api/upload` → Cloudinary (`src/lib/upload.ts`, `src/hooks/useUpload.ts`).

**UI conventions** — never use `alert`/`confirm`/`prompt`: use `toast` from react-toastify and `confirmDialog`/`promptDialog` from `src/components/ui/Dialogs.tsx` (`<DialogHost />` is mounted in the root layout). Standard playing roles and courses, plus normalisers for free-text input, are in `src/lib/playerOptions.ts`.

**Team type sync** — Teams copy their event's `eventType` at creation; `src/lib/teamSync.ts` re-syncs them when an event's type changes (and on read in the teams API), turning `entryAmount` into `totalPoints` when an event becomes an auction.

## Quirks

- Player photos render through `src/components/ui/PlayerPhoto.tsx` (plain `<img>`, not `next/image`), which falls back to coloured initials when there's no photo or it fails to load. Use it for any new player avatar.
- Admin pages render inside `src/app/admin/layout.tsx`; `<main>` is `min-w-0 flex-1` so wide tables scroll inside their own `overflow-x-auto` wrapper rather than the whole page.
- The admin console and public details page sort any player whose name contains "mustafa" to the front of the queue; ask before removing it.
- Mongoose models are cached on the dev server across hot reloads, so after changing a schema restart `npm run dev`, otherwise new fields are silently dropped on save.
- `FORM_IMPLEMENTATION_SUMMARY.md`, `UPLOAD_README.md`, `PROJECT_README.md` are historical notes; `PROJECT_README.md` describes the legacy Player-based design.
