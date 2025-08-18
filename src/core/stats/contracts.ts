export type TeamMap = Record<string, string>;

export type PlayerMatchAwards = {
  invincible: boolean;
  fiveInOneMinute: boolean;
};

export type PlayerMatchStats = {
  player: string;
  frags: number;
  deaths: number;
  maxStreak: number;
  weapons: Record<string, number>;
  awards: PlayerMatchAwards;
};

export type MatchStatsResult = {
  matchId: string;
  players: Record<string, PlayerMatchStats>;
  winner: { player: string; favoriteWeapon: string } | null;
};