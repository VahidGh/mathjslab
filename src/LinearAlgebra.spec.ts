import { LinearAlgebra } from './LinearAlgebra';

describe('LinearAlgebra', () => {
    it('LinearAlgebra should be defined', () => {
        expect(LinearAlgebra).toBeDefined();
    });

    it('LinearAlgebra.functions and its methods should be defined', () => {
        expect(LinearAlgebra.functions).toBeDefined();
        expect(LinearAlgebra.trace).toBeDefined();
        expect(LinearAlgebra.transpose).toBeDefined();
        expect(LinearAlgebra.ctranspose).toBeDefined();
        expect(LinearAlgebra.mul).toBeDefined();
        expect(LinearAlgebra.det).toBeDefined();
        expect(LinearAlgebra.inv).toBeDefined();
        expect(LinearAlgebra.gauss).toBeDefined();
        expect(LinearAlgebra.lu).toBeDefined();
    });
});
