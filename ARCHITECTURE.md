# Architecture

How players get into an auction, where their data lives, and where to edit it.

## Data model

```
Event ──< Registration >── Team ──< (roster snapshot in Team.players)
  │            ▲                ▲
  └──< Auction ┘ players[]      │ teams[]
         │
         └── AuctionSession (current player, timer)   Bid (rarely used)
```

| Collection | What it is |
|---|---|
| **Event** | Anything people register for. `eventType` (`auction`, `tournament`, …) decides which fields its Teams use. |
| **Registration** | **One person in one event. This is the player record for auctions.** Profile (name, contact, course, role, photo) + admin fields (`approvedCategory`, `approvedIconPlayer` = captain, `status`) + auction state (`auctionStatus`, `teamId`, `teamName`, `bidPrice`). |
| **Team** | Belongs to one Event. Auction teams use `owner`, `totalPoints`, `pointsSpent`, `pointsLeft`; `players[]` is a snapshot of each purchase (name, category, price). |
| **Auction** | Belongs to one Event. `players[]` = Registration ids in the bidding pool, `teams[]` = Team ids, `categorySettings` = per-tier base price / increment / timer. |
| **AuctionSession** | One per auction: who is up for bidding now and the timer's start/end. |
| **Player** | **Legacy.** The first version of the app stored auction players here. Nothing new writes to it, which is why *Admin → Manage Players* is empty. |

## Two ways players get in

### 1. Normal path — the website registration form
1. Player fills the event's form at `/events/[id]/register` → a **Registration** with `status: 'pending'`.
2. Admin opens *Events → View Participants*, checks payment, approves, sets the category (and Captain).
3. In the auction console, *Player Management → Add Players* lists approved, non-captain registrations of that event; selecting them adds their ids to `Auction.players`.

### 2. Import path — Google Form / sheet (used for HCL 3.0)
The registrations came in through a Google Form instead, so the console has *Player Management → Import Players from Sheet*:
1. Upload the responses CSV or paste the sheet → **Preview** (`POST /api/auction/[id]/import`, `commit: false`) parses it with `src/lib/playerImport.ts`, nothing is written.
   - Category must be Captain / Platinum / Gold / Silver, otherwise the row is skipped.
   - Playing role and course are mapped onto the standard lists in `src/lib/playerOptions.ts` (e.g. "DN", "Drs-e-nizami" → "Darse Nizami"). Anything that doesn't match is kept as typed and highlighted.
2. **Confirm** (`commit: true`) writes the same thing the normal path ends with:
   - a **Registration** per row on the auction's event, already `status: 'approved'`, paid, with `approvedCategory` set (captains get `approvedIconPlayer: true`);
   - non-captains are added to `Auction.players`; captains wait for Captain Matching;
   - each Google Drive photo is copied to Cloudinary so the live auction never loads from Drive.
3. Re-importing a corrected sheet updates the same Registrations (matched by contact + name) and never touches who's sold.

**So after either path the data is identical: Registrations on the event.** There is no separate "imported player" type.

## Where to edit a player

- **Auction console → Player Management → Edit** (quickest): name, category/captain, playing role, course, photo upload. Rows missing a photo or with a non-standard role/course are flagged "Needs attention".
- **Events → View Participants → Edit**: the full registration (payment, notes, status, everything above).
Both save through `PUT /api/registrations`.

## Running the auction

1. **Teams**: create them under *Teams → Create Team* for the auction's event (event type must be Auction so they get Owner + Total Points), then *Team Management → Add Teams* in the console (only that event's teams are offered).
2. **Auction Settings** (console): base price, bid increment and timer per category; delay before the timer starts; when the buzzer begins.
3. **Captain Matching**: shuffles captains onto teams (captain joins the roster at price 0).
4. **Start auction → pick a category**: players come up in random order. The timer starts after the delay, buzzes from the warning point, shows TIME UP at zero (it does not auto-sell). Assign the player to a team at the final price; each team's cap per category is `ceil(players in category / teams)`.
5. **Undo**: *Remove* on a sale refunds it; **Reset Auction** undoes all matching and sales for a dry run.

## Public pages
- `/auction/[id]/players`: shareable player pool (photo, category, role, course, base price, sold-to), teams and purses. No contact numbers. Works before the auction starts; refreshes every 15 s.
- `/auction/[id]/details`: live view of the player currently up, with the timer.
