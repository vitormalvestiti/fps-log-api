export function parseBrDatetime(input: string): Date {
    const [datePart, timePart] = input.trim().split(' ');
    const [d, m, y] = datePart.split('/').map(Number);
    const [hh, mm, ss] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, ss);
}