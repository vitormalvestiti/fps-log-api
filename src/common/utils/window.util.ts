export function hasNItemsInWindow(timestamps: Date[], windowMs: number, n: number): boolean {
    if (timestamps.length < n) return false;

    const times = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
    let left = 0;

    for (let right = 0; right < times.length; right++) {
        while (times[right].getTime() - times[left].getTime() > windowMs) left++;
        const count = right - left + 1;
        if (count >= n) return true;
    }

    return false;
}