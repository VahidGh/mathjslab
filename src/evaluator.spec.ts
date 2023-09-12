import { Evaluator } from './evaluator';

let evaluator: Evaluator;

describe('Evaluator', () => {
    beforeEach(async () => {
        evaluator = Evaluator.initialize();
    });

    it('Evaluator should be defined', () => {
        expect(Evaluator).toBeDefined();
    });

    it('Should parse, evaluate and unparse a simple real expression', () => {
        const tree = evaluator.Parse('1+2*3');
        const value = evaluator.Evaluate(tree);
        const unparsed = evaluator.Unparse(tree);
        expect(value.list[0].re.toNumber()).toBe(7);
        expect(unparsed === '1+2*3\n').toBe(true);
    }, 10000);
});
