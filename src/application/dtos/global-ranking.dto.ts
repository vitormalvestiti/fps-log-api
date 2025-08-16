export type GlobalRankingItemDto = {
  player: string;
  totalFrags: number;
  totalDeaths: number;
  kd: number;      
  wins: number;
  bestStreak: number;
};

export type GlobalRankingDto = {
  total: number;
  items: GlobalRankingItemDto[];
};