
describe('LogParserService - básico', () => {
    let svc: LogParserService;

    beforeEach(() => {
        svc = new LogParserService();
    });

    it('retorna vazio para log vazio ou se tiver somente espacos', () => {
        expect(svc.parse('')).toEqual({ matches: [], events: [] });
        expect(svc.parse('   \n  ')).toEqual({ matches: [], events: [] });
    });
});