import { ComplexDecimal } from './complex-decimal';
import { Evaluator } from './evaluator';

let evaluator: Evaluator;

describe('ComplexDecimal', () => {

    beforeEach(async () => {
        evaluator = new Evaluator();
    });

    it('ComplexDecimal should be defined', () => {
        expect(ComplexDecimal).toBeDefined();
    });

    it('sin(x)^2+cos(x)^2 should be equal 1 for any value of x', () => {
        let result: boolean = true;
        // One-by-one degree
        for (let i = 0; i < 2 * Math.PI; i += Math.PI / 360) {
            const value = ComplexDecimal.add(ComplexDecimal.pow(ComplexDecimal.sin(new ComplexDecimal(i)), ComplexDecimal.newThis(2)), ComplexDecimal.pow(ComplexDecimal.cos(new ComplexDecimal(i)), ComplexDecimal.newThis(2)))
            result &&= ((value.re.toNumber() === 1) && (value.im.toNumber() === 0)); // converting to native number type to comparison.
            result &&= Boolean(ComplexDecimal.eq(value, ComplexDecimal.one()).re) // using ComplexDecimal.eq to comparison.
        }

        expect(result).toBe(true);
    }, 20000);

    it('e^(i*pi) should be equal -1', () => {
        const value = ComplexDecimal.exp(ComplexDecimal.mul(ComplexDecimal.onei(), ComplexDecimal.pi()));
        const result = Boolean(ComplexDecimal.eq(value, ComplexDecimal.minusone()).re) // using ComplexDecimal.eq to comparison.
        expect(result).toBe(true);
    }, 1000);

    it('e^(i*pi) should be equal -1 using Evaluator', () => {
        // Using comparison by code.
        let tree = evaluator.Parse('e^(i*pi)');
        let value = evaluator.Evaluate(tree);
        let result = Boolean(ComplexDecimal.eq(value.list[0], ComplexDecimal.minusone()).re);
        expect(result).toBe(true);
        // Using comparison by Evaluator.
        tree = evaluator.Parse('e^(i*pi)==-1');
        value = evaluator.Evaluate(tree);
        result = Boolean(value.list[0].re.toNumber())
        expect(result).toBe(true);
    }, 1000);

});
