import type { TeamEventType } from '@/types/Team';

// Client-side helpers for the admin team pages. Team.eventType is a copy taken when the team was
// created; the event's current type (populated as team.eventId.eventType) wins when it's available.

const TEAM_EVENT_TYPES: readonly string[] = ['tournament', 'competition', 'auction', 'activity'];

export function teamTypeOf(team: any): TeamEventType {
  const eventType = team?.eventId?.eventType;
  if (typeof eventType === 'string' && eventType) {
    return (TEAM_EVENT_TYPES.includes(eventType) ? eventType : 'activity') as TeamEventType;
  }
  return team?.eventType;
}

export const isAuctionTeam = (team: any) => teamTypeOf(team) === 'auction';

/** Remaining budget: stored pointsLeft, else totalPoints - pointsSpent. */
export function pointsLeftOf(team: any): number | undefined {
  if (typeof team?.pointsLeft === 'number') return team.pointsLeft;
  if (typeof team?.totalPoints === 'number') return team.totalPoints - (team.pointsSpent || 0);
  return undefined;
}

export const formatPoints = (n: number | undefined) => (typeof n === 'number' ? n.toLocaleString() : '—');
