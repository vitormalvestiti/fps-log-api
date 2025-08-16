export class Match {
    constructor(
        public readonly id: string,
        public readonly startedAt: Date,
        public endedAt?: Date,
    ) { }

    end(at: Date) {
        this.endedAt = at;
    }
}