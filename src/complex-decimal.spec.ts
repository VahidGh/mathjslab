import { ComplexDecimal } from './complex-decimal';

describe('ComplexDecimal', () => {
    beforeEach(async () => {});

    it('ComplexDecimal should be defined', () => {
        expect(ComplexDecimal).toBeDefined();
    });

    it('sin(x)^2+cos(x)^2 should be equal 1 for any value of x (first cycle)', () => {
        let result: boolean = true;
        // One-by-one degree
        for (let i = 0; i <= 2 * Math.PI; i += Math.PI / 180) {
            const value = ComplexDecimal.add(
                ComplexDecimal.power(ComplexDecimal.sin(new ComplexDecimal(i)), ComplexDecimal.newThis(2)),
                ComplexDecimal.power(ComplexDecimal.cos(new ComplexDecimal(i)), ComplexDecimal.newThis(2)),
            );
            result &&= value.re.toNumber() === 1 && value.im.toNumber() === 0; // converting to native number type to comparison.
            result &&= Boolean(ComplexDecimal.eq(value, ComplexDecimal.one()).re.toNumber()); // using ComplexDecimal.eq to comparison.
        }

        expect(result).toBe(true);
    }, 20000);

    it('sin(x)^2+cos(x)^2 should be equal 1 for lower values of x', () => {
        let result: boolean = true;
        for (let i = 0; i <= 1e-300; i += 1e-302) {
            const value = ComplexDecimal.add(
                ComplexDecimal.power(ComplexDecimal.sin(new ComplexDecimal(i)), ComplexDecimal.newThis(2)),
                ComplexDecimal.power(ComplexDecimal.cos(new ComplexDecimal(i)), ComplexDecimal.newThis(2)),
            );
            result &&= value.re.toNumber() === 1 && value.im.toNumber() === 0; // converting to native number type to comparison.
            result &&= Boolean(ComplexDecimal.eq(value, ComplexDecimal.one()).re.toNumber()); // using ComplexDecimal.eq to comparison.
        }

        expect(result).toBe(true);
    }, 20000);

    it('e^(i*pi) should be equal -1', () => {
        const value = ComplexDecimal.exp(ComplexDecimal.mul(ComplexDecimal.onei(), ComplexDecimal.pi()));
        const result = Boolean(ComplexDecimal.eq(value, ComplexDecimal.minusone()).re.toNumber()); // using ComplexDecimal.eq to comparison.
        expect(result).toBe(true);
    }, 1000);

    it('abs(sin(n*pi+pi/2)) == 1 for integer n >= 0', () => {
        let result: boolean = true;
        for (let n = 0; n < 1000; n++) {
            const value = ComplexDecimal.abs(ComplexDecimal.sin(ComplexDecimal.add(ComplexDecimal.mul(new ComplexDecimal(n), ComplexDecimal.pi()), ComplexDecimal.pidiv2())));
            result &&= Boolean(ComplexDecimal.eq(value, ComplexDecimal.one()).re.toNumber()); // using ComplexDecimal.eq to comparison.
        }
        expect(result).toBe(true);
    }, 10000);
});
