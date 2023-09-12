import { ComplexDecimal } from './complex-decimal';
import { Evaluator } from './evaluator';
import { MultiArray } from './multi-array';

let evaluator: Evaluator;

describe('MultiArray', () => {
    beforeEach(async () => {
        evaluator = Evaluator.initialize();
    });

    it('ComplexDecimal should be defined', () => {
        expect(ComplexDecimal).toBeDefined();
    });

    it('MultiArray should be defined', () => {
        expect(MultiArray).toBeDefined();
    }, 100);

    it('Evaluator should be defined', () => {
        expect(Evaluator).toBeDefined();
    }, 100);

    it('The determinant must be correctly calculated', () => {
        let tree: any;
        let value: any;
        tree = evaluator.Parse('det([1:3;4:6;7:9])');
        value = evaluator.Evaluate(tree);
        expect(value.list[0].re.toNumber()).toBe(0);
        tree = evaluator.Parse('det([2,1,-3; 3,2,4; 2,5,-2])');
        value = evaluator.Evaluate(tree);
        expect(value.list[0].re.toNumber()).toBe(-67);
        tree = evaluator.Parse('det([-7,6,3,1; -9,1,6,4; -8,-4,3,6; -5,5,9,2])');
        value = evaluator.Evaluate(tree);
        expect(value.list[0].re.toNumber()).toBe(-444);
    }, 1000);
});
