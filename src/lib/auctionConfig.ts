// Single source of truth for auction tiers. Order here = order categories are auctioned in.
// Captains are not a tier: they are flagged `approvedIconPlayer` and matched to teams before bidding.
export const CATEGORY_CONFIG = [
  { name: 'Platinum', minBidPrice: 4000, bidIncrement: 400 },
  { name: 'Gold', minBidPrice: 2500, bidIncrement: 200 },
  { name: 'Silver', minBidPrice: 1000, bidIncrement: 100 },
];

export const CATEGORY_ORDER = CATEGORY_CONFIG.map(c => c.name);

export const getCategoryConfig = (categoryName: string) =>
  CATEGORY_CONFIG.find(cat => cat.name === categoryName) || CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1];

// Per-team cap for a category = ceil(players in that category / number of teams).
// Spreads each tier evenly across teams while always leaving enough slots for every player.
export const getCategoryQuota = (category: string, players: any[], teamCount: number): number => {
  if (!teamCount) return Infinity;
  const total = players.filter(p => p.approvedCategory === category && !p.approvedIconPlayer).length;
  return Math.max(1, Math.ceil(total / teamCount));
};

export const countTeamCategory = (team: any, category: string): number =>
  (team?.players || []).filter((p: any) => (p.category || p.approvedCategory) === category).length;

export const validateTeamCategoryQuota = (
  team: any,
  category: string,
  players: any[],
  teamCount: number
): { valid: boolean; message?: string } => {
  const max = getCategoryQuota(category, players, teamCount);
  const current = countTeamCategory(team, category);
  if (current >= max) {
    return {
      valid: false,
      message: `Team "${team.title}" already has ${current}/${max} ${category} player(s). Cannot add more ${category} players.`,
    };
  }
  return { valid: true };
};
