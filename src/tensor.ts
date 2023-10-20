import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';

/**
 * External reference for Evaluator.
 */
export type Evaluator = any;
declare let EvaluatorPointer: Evaluator;

export abstract class Tensor {
    public static unaryOpFunction: { [name: string]: Function } = {
        uplus: Tensor.uplus,
        uminus: Tensor.uminus,
        not: Tensor.not,
        transpose: Tensor.transpose,
        ctranspose: Tensor.ctranspose,
    };

    public static binaryOpFunction: { [name: string]: Function } = {
        minus: Tensor.minus,
        mod: Tensor.mod,
        rem: Tensor.rem,
        rdivide: Tensor.rdivide,
        mrdivide: Tensor.mrdivide,
        ldivide: Tensor.ldivide,
        mldivide: Tensor.mldivide,
        power: Tensor.power,
        mpower: Tensor.mpower,
        le: Tensor.le,
        ge: Tensor.ge,
        gt: Tensor.gt,
        eq: Tensor.eq,
        ne: Tensor.ne,
    };

    public static twoMoreOpFunction: { [name: string]: Function } = {
        plus: Tensor.plus,
        times: Tensor.times,
        mtimes: Tensor.mtimes,
        and: Tensor.and,
        or: Tensor.or,
        xor: Tensor.xor,
    };

    public static functions: { [name: string]: Function } = {
        sub2ind: Tensor.sub2ind,
        ind2sub: Tensor.ind2sub,
    };

    /**
     * Linearized functions
     */
    public static linearizedFunctions: { [name: string]: { func: Function; lin: boolean[] } } = {
        size: {
            func: Tensor.size,
            lin: [false, true],
        },
    };

    public readonly linearize = MultiArray.linearize;

    public static copy(right: any): any {
        if ('re' in right) {
            return ComplexDecimal.copy(right);
        } else if ('array' in right) {
            return MultiArray.copy(right);
        }
    }

    public static ewiseOp(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'power' | 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne' | 'and' | 'or' | 'xor' | 'mod' | 'rem',
        left: any,
        right: any,
    ): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal[op](left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray(op, left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.MultiArrayOpScalar(op, left, right);
        } else if ('array' in left && 'array' in right) {
            return MultiArray.ewiseOp(op, left, right);
        }
    }

    public static leftOp(op: 'copy' | 'neg' | 'not', right: any): any {
        if ('re' in right) {
            return ComplexDecimal[op](right);
        } else if ('array' in right) {
            return MultiArray.leftOp(op, right);
        }
    }

    public static plus(left: any, right: any): any {
        return Tensor.ewiseOp('add', left, right);
    }

    public static minus(left: any, right: any): any {
        return Tensor.ewiseOp('sub', left, right);
    }

    public static mod(left: any, right: any): any {
        return Tensor.ewiseOp('mod', left, right);
    }

    public static rem(left: any, right: any): any {
        return Tensor.ewiseOp('rem', left, right);
    }

    public static times(left: any, right: any): any {
        return Tensor.ewiseOp('mul', left, right);
    }

    public static mtimes(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.mul(left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray('mul', left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.MultiArrayOpScalar('mul', left, right);
        } else if ('array' in left && 'array' in right) {
            return MultiArray.mul(left, right);
        }
    }

    public static rdivide(left: any, right: any): any {
        return Tensor.ewiseOp('rdiv', left, right);
    }

    public static mrdivide(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.rdiv(left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray('mul', left, MultiArray.inv(right));
        } else if ('array' in left && 're' in right) {
            return MultiArray.scalarOpMultiArray('mul', ComplexDecimal.inv(right), left);
        } else if ('array' in left && 'array' in right) {
            return MultiArray.mul(left, MultiArray.inv(right));
        }
    }

    public static ldivide(left: any, right: any): any {
        return Tensor.ewiseOp('ldiv', left, right);
    }

    public static mldivide(left: any, right: any): any {}

    public static power(left: any, right: any): any {
        return Tensor.ewiseOp('power', left, right);
    }

    public static mpower(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.power(left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.power(left, right);
        } else {
            throw new Error("invalid exponent in '^'.");
        }
    }

    public static uplus(right: any): any {
        return Tensor.leftOp('copy', right);
    }

    public static uminus(right: any): any {
        return Tensor.leftOp('neg', right);
    }

    public static transpose(left: any): any {
        if ('re' in left) {
            return Object.assign({}, left);
        } else if ('array' in left) {
            return MultiArray.transpose(left);
        }
    }

    public static ctranspose(left: any): any {
        if ('re' in left) {
            return ComplexDecimal.conj(left);
        } else if ('array' in left) {
            return MultiArray.ctranspose(left);
        }
    }

    public static lt(left: any, right: any): any {
        return Tensor.ewiseOp('lt', left, right);
    }

    public static le(left: any, right: any): any {
        return Tensor.ewiseOp('le', left, right);
    }

    public static eq(left: any, right: any): any {
        return Tensor.ewiseOp('eq', left, right);
    }

    public static ge(left: any, right: any): any {
        return Tensor.ewiseOp('ge', left, right);
    }

    public static gt(left: any, right: any): any {
        return Tensor.ewiseOp('gt', left, right);
    }

    public static ne(left: any, right: any): any {
        return Tensor.ewiseOp('ne', left, right);
    }

    public static mand(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.and(left, right);
        } else if ('re' in left && 'array' in right) {
            return ComplexDecimal.and(left, MultiArray.toLogical(right));
        } else if ('array' in left && 're' in right) {
            return ComplexDecimal.and(MultiArray.toLogical(left), right);
        } else if ('array' in left && 'array' in right) {
            return ComplexDecimal.and(MultiArray.toLogical(left), MultiArray.toLogical(right));
        }
    }

    public static mor(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.or(left, right);
        } else if ('re' in left && 'array' in right) {
            return ComplexDecimal.or(left, MultiArray.toLogical(right));
        } else if ('array' in left && 're' in right) {
            return ComplexDecimal.or(MultiArray.toLogical(left), right);
        } else if ('array' in left && 'array' in right) {
            return ComplexDecimal.or(MultiArray.toLogical(left), MultiArray.toLogical(right));
        }
    }

    public static not(right: any): any {
        if ('re' in right) {
            return ComplexDecimal.not(right);
        } else if ('array' in right) {
            return ComplexDecimal.not(MultiArray.toLogical(right));
        }
    }

    public static and(left: any, right: any): any {
        return Tensor.ewiseOp('and', left, right);
    }

    public static or(left: any, right: any): any {
        return Tensor.ewiseOp('or', left, right);
    }

    public static xor(left: any, right: any): any {
        return Tensor.ewiseOp('xor', left, right);
    }

    /**
     * Convert subscripts to linear indices.
     * @param DIMS
     * @param S
     * @returns
     */
    public static sub2ind(DIMS: any, ...S: any) {
        if (arguments.length > 1) {
            const n = DIMS;
            return new ComplexDecimal(1, 0);
        } else {
            throw new Error(`Invalid call to sub2ind.`);
        }
    }

    /**
     * Convert linear indices to subscripts.
     * @param DIMS
     * @param IND
     * @returns
     */
    public static ind2sub(DIMS: any, IND: any): any {
        if (arguments.length === 2) {
            return EvaluatorPointer.nodeReturnList((length: number, index: number): any => {
                const dims = DIMS;
                const ind = IND;
                if (length === 1) {
                    return ind;
                } else {
                    return ind;
                }
            });
        } else {
            throw new Error(`Invalid call to ind2sub.`);
        }
    }

    /**
     * Array size.
     * @param M Matrix
     * @param DIM
     * @returns
     */
    public static size(M: MultiArray, ...DIM: ComplexDecimal[] | ComplexDecimal[][]): MultiArray | ComplexDecimal {
        const testDimension = (dimension: ComplexDecimal): number => {
            const dim = dimension.re.toNumber();
            if (dim < 1 || !dimension.re.trunc().eq(dimension.re)) {
                throw new Error(`size: requested dimension DIM (= ${Math.trunc(dimension.re.toNumber())}) out of range. DIM must be a positive integer.`);
            }
            return dim;
        };
        if (DIM.length === 0) {
            if ('re' in M) {
                const result = new MultiArray([1, 2]);
                result.array = [[ComplexDecimal.one(), ComplexDecimal.one()]];
                result.type = ComplexDecimal.numberClass.real;
                return result;
            } else {
                const result = new MultiArray([1, 2]);
                result.array = [[new ComplexDecimal(M.dim[0]), new ComplexDecimal(M.dim[1])]];
                result.type = ComplexDecimal.numberClass.real;
                return result;
            }
        } else {
            if (DIM.length === 1) {
                if ('re' in M) {
                    return ComplexDecimal.one();
                } else {
                    if ('re' in DIM[0]) {
                        const dim = testDimension(DIM[0]);
                        if (dim > M.dim.length) {
                            return ComplexDecimal.one();
                        } else {
                            return new ComplexDecimal(M.dim[dim - 1]);
                        }
                    } else {
                        const result = new MultiArray([1, DIM[0].length]);
                        result.array = [[]];
                        DIM[0].forEach((dimension) => {
                            const dim = testDimension(dimension);
                            if (dim > M.dim.length) {
                                result.array[0].push(ComplexDecimal.one());
                            } else {
                                result.array[0].push(new ComplexDecimal(M.dim[dim - 1]));
                            }
                        });
                        result.type = ComplexDecimal.numberClass.real;
                        return result;
                    }
                }
            } else {
                if ('re' in M) {
                    const result = new MultiArray([1, DIM.length]);
                    result.array = [[]];
                    (DIM as ComplexDecimal[]).forEach((dimension) => {
                        testDimension(dimension);
                        result.array[0].push(ComplexDecimal.one());
                    });
                    result.type = ComplexDecimal.numberClass.real;
                    return result;
                } else {
                    const result = new MultiArray([1, DIM.length]);
                    result.array = [[]];
                    DIM.forEach((dimension) => {
                        const dim = testDimension(dimension as ComplexDecimal);
                        if (dim > M.dim.length) {
                            result.array[0].push(ComplexDecimal.one());
                        } else {
                            result.array[0].push(new ComplexDecimal(M.dim[dim - 1]));
                        }
                    });
                    result.type = ComplexDecimal.numberClass.real;
                    return result;
                }
            }
        }
    }
}
