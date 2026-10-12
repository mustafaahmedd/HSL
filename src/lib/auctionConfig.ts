// Tier names and their auction order live in code. Prices and timers are defaults only: each auction
// can override them (Auction.categorySettings), edited from the admin console's "Auction Settings".
// Captains are not a tier: they are flagged `approvedIconPlayer` and matched to teams before bidding.
export interface CategorySetting {
  name: string;
  minBidPrice: number;
  bidIncrement: number;
  timerSeconds: number; // 0 = no timer
}

export const CATEGORY_CONFIG: CategorySetting[] = [
  { name: 'Platinum', minBidPrice: 4000, bidIncrement: 400, timerSeconds: 100 },
  { name: 'Gold', minBidPrice: 2500, bidIncrement: 200, timerSeconds: 50 },
  { name: 'Silver', minBidPrice: 1000, bidIncrement: 100, timerSeconds: 30 },
];

export const CATEGORY_ORDER = CATEGORY_CONFIG.map(c => c.name);

// Delay between a player appearing and their timer starting, and when the warning buzzer kicks in
export const DEFAULT_TIMER_BUFFER_SECONDS = 2;
export const DEFAULT_TIMER_WARNING_PERCENT = 75;

// Merge an auction's saved overrides onto the defaults (always returns every tier, in order)
export const resolveCategorySettings = (auction?: { categorySettings?: Partial<CategorySetting>[] } | null): CategorySetting[] =>
  CATEGORY_CONFIG.map(def => {
    const saved = auction?.categorySettings?.find(c => c?.name === def.name) || {};
    return { ...def, ...Object.fromEntries(Object.entries(saved).filter(([, v]) => v !== undefined && v !== null)) } as CategorySetting;
  });

export const getCategoryConfig = (categoryName: string, auction?: { categorySettings?: Partial<CategorySetting>[] } | null) => {
  const all = resolveCategorySettings(auction);
  return all.find(cat => cat.name === categoryName) || all[all.length - 1];
};

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
