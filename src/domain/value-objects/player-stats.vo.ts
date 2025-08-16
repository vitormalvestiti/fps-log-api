export class PlayerStats {
    constructor(
        public readonly player: string,
        public readonly frags: number,
        public readonly deaths: number,
        public readonly maxStreak: number,
    ) { }
}
