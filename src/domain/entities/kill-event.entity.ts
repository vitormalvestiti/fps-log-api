export type KillCause = { type: 'WEAPON'; weapon: string } | { type: 'WORLD'; reason: string };

export class KillEvent {
    constructor(
        public readonly occurredAt: Date,
        public readonly matchId: string,
        public readonly killer: string,
        public readonly victim: string,
        public readonly cause: KillCause,
    ) { }
}
