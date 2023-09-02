import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';

export abstract class Tensor {
    static unaryOpFunction: { [name: string]: Function } = {
        uplus: Tensor.uplus,
        uminus: Tensor.uminus,
        not: Tensor.not,
        transpose: Tensor.transpose,
        ctranspose: Tensor.ctranspose,
    };

    static binaryOpFunction: { [name: string]: Function } = {
        minus: Tensor.minus,
        rdivide: Tensor.rdivide,
        mrdivide: Tensor.mrdivide,
        ldivide: Tensor.ldivide,
        mldivide: Tensor.mldivide,
        power: Tensor.power,
        mpower: Tensor.mpower,
        lte: Tensor.lte,
        gte: Tensor.gte,
        gt: Tensor.gt,
        eq: Tensor.eq,
        ne: Tensor.ne,
    };

    static twoMoreOpFunction: { [name: string]: Function } = {
        plus: Tensor.plus,
        times: Tensor.times,
        mtimes: Tensor.mtimes,
        mand: Tensor.mand,
        mor: Tensor.mor,
        and: Tensor.and,
        or: Tensor.or,
    };

    static ewiseOp(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'pow' | 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'ne' | 'and' | 'or',
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

    static leftOp(op: 'clone' | 'neg' | 'not', right: any): any {
        if ('re' in right) {
            return ComplexDecimal[op](right);
        } else if ('array' in right) {
            return MultiArray.leftOp(op, right);
        }
    }

    static plus(left: any, right: any): any {
        return Tensor.ewiseOp('add', left, right);
    }

    static minus(left: any, right: any): any {
        return Tensor.ewiseOp('sub', left, right);
    }

    static times(left: any, right: any): any {
        return Tensor.ewiseOp('mul', left, right);
    }

    static mtimes(left: any, right: any): any {
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

    static rdivide(left: any, right: any): any {
        return Tensor.ewiseOp('rdiv', left, right);
    }

    static mrdivide(left: any, right: any): any {
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

    static ldivide(left: any, right: any): any {
        return Tensor.ewiseOp('ldiv', left, right);
    }

    static mldivide(left: any, right: any): any {}

    static power(left: any, right: any): any {
        return Tensor.ewiseOp('pow', left, right);
    }

    static mpower(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.pow(left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.pow(left, right);
        } else {
            throw new Error("invalid exponent in '^'");
        }
    }

    static uplus(right: any): any {
        return Tensor.leftOp('clone', right);
    }

    static uminus(right: any): any {
        return Tensor.leftOp('neg', right);
    }

    static transpose(left: any): any {
        if ('re' in left) {
            return Object.assign({}, left);
        } else if ('array' in left) {
            return MultiArray.transpose(left);
        }
    }

    static ctranspose(left: any): any {
        if ('re' in left) {
            return ComplexDecimal.conj(left);
        } else if ('array' in left) {
            return MultiArray.ctranspose(left);
        }
    }

    static lt(left: any, right: any): any {
        return Tensor.ewiseOp('lt', left, right);
    }

    static lte(left: any, right: any): any {
        return Tensor.ewiseOp('lte', left, right);
    }

    static eq(left: any, right: any): any {
        return Tensor.ewiseOp('eq', left, right);
    }

    static gte(left: any, right: any): any {
        return Tensor.ewiseOp('gte', left, right);
    }

    static gt(left: any, right: any): any {
        return Tensor.ewiseOp('gt', left, right);
    }

    static ne(left: any, right: any): any {
        return Tensor.ewiseOp('ne', left, right);
    }

    static mand(left: any, right: any): any {
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

    static mor(left: any, right: any): any {
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

    static not(right: any): any {
        if ('re' in right) {
            return ComplexDecimal.not(right);
        } else if ('array' in right) {
            return ComplexDecimal.not(MultiArray.toLogical(right));
        }
    }

    static and(left: any, right: any): any {
        return Tensor.ewiseOp('and', left, right);
    }

    static or(left: any, right: any): any {
        return Tensor.ewiseOp('or', left, right);
    }
}
