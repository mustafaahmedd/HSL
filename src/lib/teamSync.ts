import Team from '@/models/Team';
import type { TeamEventType } from '@/types/Team';

// Team.eventType is a copy of its event's type, taken when the team is created. These helpers keep the
// copy in step with the event (an admin can change an event from Tournament to Auction after teams exist).

const TEAM_EVENT_TYPES: readonly string[] = ['tournament', 'competition', 'auction', 'activity'];

/** Map an Event.eventType onto the narrower Team.eventType enum (farmhouse / beach count as activities). */
export function toTeamEventType(eventType: unknown): TeamEventType | null {
  if (typeof eventType !== 'string' || !eventType) return null;
  return (TEAM_EVENT_TYPES.includes(eventType) ? eventType : 'activity') as TeamEventType;
}

const isPositive = (n: unknown): n is number => typeof n === 'number' && n > 0;

/** Does this team (plain object or doc) disagree with the given event type, or lack an auction budget it could have? */
export function teamNeedsSync(team: any, eventType: unknown): boolean {
  const teamType = toTeamEventType(eventType);
  if (!teamType) return false;
  if (team.eventType !== teamType) return true;
  if (teamType !== 'auction') return false;
  if (!isPositive(team.totalPoints)) return isPositive(team.entryAmount);
  return typeof team.pointsLeft !== 'number';
}

/**
 * Set eventType on every team of an event. When the event is an auction, a team that has no
 * totalPoints but does have an entryAmount (it was created while the event was a tournament) gets
 * that amount as its budget: totalPoints = entryAmount, pointsLeft = totalPoints - pointsSpent.
 * Returns the number of teams changed.
 */
export async function syncTeamsWithEventType(eventId: unknown, eventType: unknown): Promise<number> {
  const teamType = toTeamEventType(eventType);
  if (!eventId || !teamType) return 0;

  const teams: any[] = await Team.find({ eventId })
    .select('eventType totalPoints pointsSpent pointsLeft entryAmount')
    .lean();

  let changed = 0;
  for (const team of teams) {
    if (!teamNeedsSync(team, teamType)) continue;

    const set: Record<string, unknown> = { eventType: teamType };
    if (teamType === 'auction') {
      const total = isPositive(team.totalPoints)
        ? team.totalPoints
        : isPositive(team.entryAmount) ? team.entryAmount : undefined;
      if (total !== undefined) {
        const spent = typeof team.pointsSpent === 'number' ? team.pointsSpent : 0;
        set.totalPoints = total;
        set.pointsSpent = spent;
        set.pointsLeft = total - spent;
      }
    }

    await Team.updateOne({ _id: team._id }, { $set: set });
    changed++;
  }
  return changed;
}
