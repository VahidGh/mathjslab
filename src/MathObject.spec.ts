import { MathObject } from './MathObject';

describe('MathObject', () => {
    it('MathObject and its generic methods should be defined', () => {
        expect(MathObject).toBeDefined();
        expect(MathObject.copy).toBeDefined();
        expect(MathObject.elementWiseOperation).toBeDefined();
        expect(MathObject.leftOperation).toBeDefined();
        expect(MathObject.mand).toBeDefined();
        expect(MathObject.mor).toBeDefined();
    });

    it('MathObject.unaryOpFunction and its methods should be defined', () => {
        expect(MathObject.unaryOpFunction).toBeDefined();
        expect(MathObject.uplus).toBeDefined();
        expect(MathObject.uminus).toBeDefined();
        expect(MathObject.not).toBeDefined();
        expect(MathObject.transpose).toBeDefined();
        expect(MathObject.ctranspose).toBeDefined();
    });

    it('MathObject.binaryOpFunction and its methods should be defined', () => {
        expect(MathObject.binaryOpFunction).toBeDefined();
        expect(MathObject.minus).toBeDefined();
        expect(MathObject.mod).toBeDefined();
        expect(MathObject.rem).toBeDefined();
        expect(MathObject.rdivide).toBeDefined();
        expect(MathObject.mrdivide).toBeDefined();
        expect(MathObject.ldivide).toBeDefined();
        expect(MathObject.mldivide).toBeDefined();
        expect(MathObject.power).toBeDefined();
        expect(MathObject.mpower).toBeDefined();
        expect(MathObject.le).toBeDefined();
        expect(MathObject.ge).toBeDefined();
        expect(MathObject.gt).toBeDefined();
        expect(MathObject.eq).toBeDefined();
        expect(MathObject.ne).toBeDefined();
    });

    it('MathObject.twoMoreOpFunction and its methods should be defined', () => {
        expect(MathObject.twoMoreOpFunction).toBeDefined();
        expect(MathObject.plus).toBeDefined();
        expect(MathObject.times).toBeDefined();
        expect(MathObject.mtimes).toBeDefined();
        expect(MathObject.and).toBeDefined();
        expect(MathObject.or).toBeDefined();
        expect(MathObject.xor).toBeDefined();
    });
});
