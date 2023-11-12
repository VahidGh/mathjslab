import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';

export abstract class MathObject {
    public static unaryOpFunction: { [name: string]: Function } = {
        uplus: MathObject.uplus,
        uminus: MathObject.uminus,
        not: MathObject.not,
        transpose: MathObject.transpose,
        ctranspose: MathObject.ctranspose,
    };

    public static binaryOpFunction: { [name: string]: Function } = {
        minus: MathObject.minus,
        mod: MathObject.mod,
        rem: MathObject.rem,
        rdivide: MathObject.rdivide,
        mrdivide: MathObject.mrdivide,
        ldivide: MathObject.ldivide,
        mldivide: MathObject.mldivide,
        power: MathObject.power,
        mpower: MathObject.mpower,
        le: MathObject.le,
        ge: MathObject.ge,
        gt: MathObject.gt,
        eq: MathObject.eq,
        ne: MathObject.ne,
    };

    public static twoMoreOpFunction: { [name: string]: Function } = {
        plus: MathObject.plus,
        times: MathObject.times,
        mtimes: MathObject.mtimes,
        and: MathObject.and,
        or: MathObject.or,
        xor: MathObject.xor,
    };

    public static readonly linearize = MultiArray.linearize;

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
        return MathObject.ewiseOp('add', left, right);
    }

    public static minus(left: any, right: any): any {
        return MathObject.ewiseOp('sub', left, right);
    }

    public static mod(left: any, right: any): any {
        return MathObject.ewiseOp('mod', left, right);
    }

    public static rem(left: any, right: any): any {
        return MathObject.ewiseOp('rem', left, right);
    }

    public static times(left: any, right: any): any {
        return MathObject.ewiseOp('mul', left, right);
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
        return MathObject.ewiseOp('rdiv', left, right);
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
        return MathObject.ewiseOp('ldiv', left, right);
    }

    public static mldivide(left: any, right: any): any {}

    public static power(left: any, right: any): any {
        return MathObject.ewiseOp('power', left, right);
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
        return MathObject.leftOp('copy', right);
    }

    public static uminus(right: any): any {
        return MathObject.leftOp('neg', right);
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
        return MathObject.ewiseOp('lt', left, right);
    }

    public static le(left: any, right: any): any {
        return MathObject.ewiseOp('le', left, right);
    }

    public static eq(left: any, right: any): any {
        return MathObject.ewiseOp('eq', left, right);
    }

    public static ge(left: any, right: any): any {
        return MathObject.ewiseOp('ge', left, right);
    }

    public static gt(left: any, right: any): any {
        return MathObject.ewiseOp('gt', left, right);
    }

    public static ne(left: any, right: any): any {
        return MathObject.ewiseOp('ne', left, right);
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
        return MathObject.ewiseOp('and', left, right);
    }

    public static or(left: any, right: any): any {
        return MathObject.ewiseOp('or', left, right);
    }

    public static xor(left: any, right: any): any {
        return MathObject.ewiseOp('xor', left, right);
    }
}
