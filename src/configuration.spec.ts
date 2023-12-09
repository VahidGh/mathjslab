import { Configuration } from './Configuration';

describe('Configuration', () => {
    it('Configuration and its functions should be defined', () => {
        expect(Configuration).toBeDefined();
        expect(Configuration.functions.configure).toBeDefined();
        expect(Configuration.functions.getconfig).toBeDefined();
    });
});
