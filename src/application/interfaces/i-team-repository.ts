export interface ITeamRepository {
  getTeamsByMatchId(matchId: string): Promise<Record<string, string>>;
}
