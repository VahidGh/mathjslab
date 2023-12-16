import { MathOperation } from './MathOperation';

describe('MathOperation', () => {
    it('MathOperation and its generic methods should be defined', () => {
        expect(MathOperation).toBeDefined();
        expect(MathOperation.copy).toBeDefined();
        expect(MathOperation.elementWiseOperation).toBeDefined();
        expect(MathOperation.leftOperation).toBeDefined();
        expect(MathOperation.mand).toBeDefined();
        expect(MathOperation.mor).toBeDefined();
    });

    it('MathOperation.unaryOpFunction and its methods should be defined', () => {
        expect(MathOperation.unaryOpFunction).toBeDefined();
        expect(MathOperation.uplus).toBeDefined();
        expect(MathOperation.uminus).toBeDefined();
        expect(MathOperation.not).toBeDefined();
        expect(MathOperation.transpose).toBeDefined();
        expect(MathOperation.ctranspose).toBeDefined();
    });

    it('MathOperation.binaryOpFunction and its methods should be defined', () => {
        expect(MathOperation.binaryOpFunction).toBeDefined();
        expect(MathOperation.minus).toBeDefined();
        expect(MathOperation.mod).toBeDefined();
        expect(MathOperation.rem).toBeDefined();
        expect(MathOperation.rdivide).toBeDefined();
        expect(MathOperation.mrdivide).toBeDefined();
        expect(MathOperation.ldivide).toBeDefined();
        expect(MathOperation.mldivide).toBeDefined();
        expect(MathOperation.power).toBeDefined();
        expect(MathOperation.mpower).toBeDefined();
        expect(MathOperation.le).toBeDefined();
        expect(MathOperation.ge).toBeDefined();
        expect(MathOperation.gt).toBeDefined();
        expect(MathOperation.eq).toBeDefined();
        expect(MathOperation.ne).toBeDefined();
    });

    it('MathOperation.twoMoreOpFunction and its methods should be defined', () => {
        expect(MathOperation.twoMoreOpFunction).toBeDefined();
        expect(MathOperation.plus).toBeDefined();
        expect(MathOperation.times).toBeDefined();
        expect(MathOperation.mtimes).toBeDefined();
        expect(MathOperation.and).toBeDefined();
        expect(MathOperation.or).toBeDefined();
        expect(MathOperation.xor).toBeDefined();
    });
});
