import { ComplexDecimal, TBinaryOperationName, TUnaryOperationLeftName } from './complex-decimal';
import { MultiArray } from './multi-array';
import { LinearAlgebra } from './linear-algebra';

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

    public static copy(right: any): any {
        if ('re' in right) {
            return ComplexDecimal.copy(right);
        } else if ('array' in right) {
            return MultiArray.copy(right);
        }
    }

    public static elementWiseOperation(op: TBinaryOperationName, left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal[op](left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray(op, left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.MultiArrayOpScalar(op, left, right);
        } else if ('array' in left && 'array' in right) {
            return MultiArray.elementWiseOperation(op, left, right);
        }
    }

    public static leftOperation(op: TUnaryOperationLeftName, right: any): any {
        if ('re' in right) {
            return ComplexDecimal[op](right);
        } else if ('array' in right) {
            return MultiArray.leftOperation(op, right);
        }
    }

    public static plus(left: any, right: any): any {
        return MathObject.elementWiseOperation('add', left, right);
    }

    public static minus(left: any, right: any): any {
        return MathObject.elementWiseOperation('sub', left, right);
    }

    public static mod(left: any, right: any): any {
        return MathObject.elementWiseOperation('mod', left, right);
    }

    public static rem(left: any, right: any): any {
        return MathObject.elementWiseOperation('rem', left, right);
    }

    public static times(left: any, right: any): any {
        return MathObject.elementWiseOperation('mul', left, right);
    }

    public static mtimes(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.mul(left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray('mul', left, right);
        } else if ('array' in left && 're' in right) {
            return MultiArray.MultiArrayOpScalar('mul', left, right);
        } else if ('array' in left && 'array' in right) {
            return LinearAlgebra.mul(left, right);
        }
    }

    public static rdivide(left: any, right: any): any {
        return MathObject.elementWiseOperation('rdiv', left, right);
    }

    public static mrdivide(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.rdiv(left, right);
        } else if ('re' in left && 'array' in right) {
            return MultiArray.scalarOpMultiArray('mul', left, LinearAlgebra.inv(right));
        } else if ('array' in left && 're' in right) {
            return MultiArray.scalarOpMultiArray('mul', ComplexDecimal.inv(right), left);
        } else if ('array' in left && 'array' in right) {
            return LinearAlgebra.mul(left, LinearAlgebra.inv(right));
        }
    }

    public static ldivide(left: any, right: any): any {
        return MathObject.elementWiseOperation('ldiv', left, right);
    }

    public static mldivide(left: any, right: any): any {}

    public static power(left: any, right: any): any {
        return MathObject.elementWiseOperation('power', left, right);
    }

    public static mpower(left: any, right: any): any {
        if ('re' in left && 're' in right) {
            return ComplexDecimal.power(left, right);
        } else if ('array' in left && 're' in right) {
            return LinearAlgebra.power(left, right);
        } else {
            throw new Error("invalid exponent in '^'.");
        }
    }

    public static uplus(right: any): any {
        return MathObject.leftOperation('copy', right);
    }

    public static uminus(right: any): any {
        return MathObject.leftOperation('neg', right);
    }

    public static transpose(left: any): any {
        if ('re' in left) {
            return Object.assign({}, left);
        } else if ('array' in left) {
            return LinearAlgebra.transpose(left);
        }
    }

    public static ctranspose(left: any): any {
        if ('re' in left) {
            return ComplexDecimal.conj(left);
        } else if ('array' in left) {
            return LinearAlgebra.ctranspose(left);
        }
    }

    public static lt(left: any, right: any): any {
        return MathObject.elementWiseOperation('lt', left, right);
    }

    public static le(left: any, right: any): any {
        return MathObject.elementWiseOperation('le', left, right);
    }

    public static eq(left: any, right: any): any {
        return MathObject.elementWiseOperation('eq', left, right);
    }

    public static ge(left: any, right: any): any {
        return MathObject.elementWiseOperation('ge', left, right);
    }

    public static gt(left: any, right: any): any {
        return MathObject.elementWiseOperation('gt', left, right);
    }

    public static ne(left: any, right: any): any {
        return MathObject.elementWiseOperation('ne', left, right);
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
        return MathObject.elementWiseOperation('and', left, right);
    }

    public static or(left: any, right: any): any {
        return MathObject.elementWiseOperation('or', left, right);
    }

    public static xor(left: any, right: any): any {
        return MathObject.elementWiseOperation('xor', left, right);
    }
}
