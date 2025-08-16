export type MatchRankingItemDto = {
    player: string;
    frags: number;
    deaths: number;
    maxStreak: number;
    awards: {
        invincible: boolean;
        fiveInOneMinute: boolean;
    };
};

export type MatchRankingDto = {
    matchId: string;
    winner: { player: string; favoriteWeapon: string | '' } | null;
    ranking: MatchRankingItemDto[];
};