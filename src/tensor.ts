import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';

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
        lte: Tensor.lte,
        gte: Tensor.gte,
        gt: Tensor.gt,
        eq: Tensor.eq,
        ne: Tensor.ne,
    };

    public static twoMoreOpFunction: { [name: string]: Function } = {
        plus: Tensor.plus,
        times: Tensor.times,
        mtimes: Tensor.mtimes,
        mand: Tensor.mand,
        mor: Tensor.mor,
        and: Tensor.and,
        or: Tensor.or,
    };

    public static ewiseOp(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'pow' | 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'ne' | 'and' | 'or' | 'mod' | 'rem',
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
        return Tensor.ewiseOp('pow', left, right);
    }

    public static mpower(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.pow(left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.pow(left, right);
        } else {
            throw new Error("invalid exponent in '^'");
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

    public static lte(left: any, right: any): any {
        return Tensor.ewiseOp('lte', left, right);
    }

    public static eq(left: any, right: any): any {
        return Tensor.ewiseOp('eq', left, right);
    }

    public static gte(left: any, right: any): any {
        return Tensor.ewiseOp('gte', left, right);
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
}
