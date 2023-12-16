import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';

export abstract class MathOperation {
    public static unaryOpFunction: { [name: string]: Function } = {
        uplus: MathOperation.uplus,
        uminus: MathOperation.uminus,
        not: MathOperation.not,
        transpose: MathOperation.transpose,
        ctranspose: MathOperation.ctranspose,
    };

    public static binaryOpFunction: { [name: string]: Function } = {
        minus: MathOperation.minus,
        mod: MathOperation.mod,
        rem: MathOperation.rem,
        rdivide: MathOperation.rdivide,
        mrdivide: MathOperation.mrdivide,
        ldivide: MathOperation.ldivide,
        mldivide: MathOperation.mldivide,
        power: MathOperation.power,
        mpower: MathOperation.mpower,
        le: MathOperation.le,
        ge: MathOperation.ge,
        gt: MathOperation.gt,
        eq: MathOperation.eq,
        ne: MathOperation.ne,
    };

    public static twoMoreOpFunction: { [name: string]: Function } = {
        plus: MathOperation.plus,
        times: MathOperation.times,
        mtimes: MathOperation.mtimes,
        and: MathOperation.and,
        or: MathOperation.or,
        xor: MathOperation.xor,
    };

    public static copy(right: any): any {
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal.copy(right);
        } else if (right instanceof MultiArray) {
            return MultiArray.copy(right);
        } else if (right instanceof CharString) {
            return CharString.copy(right);
        }
    }

    public static elementWiseOperation(op: ComplexDecimal.TBinaryOperationName, left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal[op](left, right);
        } else if (left instanceof ComplexDecimal && right instanceof MultiArray) {
            return MultiArray.scalarOpMultiArray(op, left, right);
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return MultiArray.MultiArrayOpScalar(op, left, right);
        } else if (left instanceof MultiArray && right instanceof MultiArray) {
            return MultiArray.elementWiseOperation(op, left, right);
        }
    }

    public static leftOperation(op: ComplexDecimal.TUnaryOperationLeftName, right: any): any {
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal[op](right);
        } else if (right instanceof MultiArray) {
            return MultiArray.leftOperation(op, right);
        }
    }

    public static plus(left: any, right: any): any {
        return MathOperation.elementWiseOperation('add', left, right);
    }

    public static minus(left: any, right: any): any {
        return MathOperation.elementWiseOperation('sub', left, right);
    }

    public static mod(left: any, right: any): any {
        return MathOperation.elementWiseOperation('mod', left, right);
    }

    public static rem(left: any, right: any): any {
        return MathOperation.elementWiseOperation('rem', left, right);
    }

    public static times(left: any, right: any): any {
        return MathOperation.elementWiseOperation('mul', left, right);
    }

    public static mtimes(left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal.mul(left, right);
        } else if (left instanceof ComplexDecimal && right instanceof MultiArray) {
            return MultiArray.scalarOpMultiArray('mul', left, right);
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return MultiArray.MultiArrayOpScalar('mul', left, right);
        } else if (left instanceof MultiArray && right instanceof MultiArray) {
            return LinearAlgebra.mul(left, right);
        }
    }

    public static rdivide(left: any, right: any): any {
        return MathOperation.elementWiseOperation('rdiv', left, right);
    }

    public static mrdivide(left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal.rdiv(left, right);
        } else if (left instanceof ComplexDecimal && right instanceof MultiArray) {
            return MultiArray.scalarOpMultiArray('mul', left, LinearAlgebra.inv(right));
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return MultiArray.scalarOpMultiArray('mul', ComplexDecimal.inv(right), left);
        } else if (left instanceof MultiArray && right instanceof MultiArray) {
            return LinearAlgebra.mul(left, LinearAlgebra.inv(right));
        }
    }

    public static ldivide(left: any, right: any): any {
        return MathOperation.elementWiseOperation('ldiv', left, right);
    }

    public static mldivide(left: any, right: any): any {}

    public static power(left: any, right: any): any {
        return MathOperation.elementWiseOperation('power', left, right);
    }

    public static mpower(left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal.power(left, right);
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return LinearAlgebra.power(left, right);
        } else {
            throw new Error("invalid exponent in '^'.");
        }
    }

    public static uplus(right: any): any {
        return MathOperation.leftOperation('copy', right);
    }

    public static uminus(right: any): any {
        return MathOperation.leftOperation('neg', right);
    }

    public static transpose(left: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (left instanceof MultiArray) {
            return LinearAlgebra.transpose(left);
        } else {
            return left.copy();
        }
    }

    public static ctranspose(left: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (left instanceof ComplexDecimal) {
            return ComplexDecimal.conj(left);
        } else if (left instanceof MultiArray) {
            return LinearAlgebra.ctranspose(left);
        }
    }

    public static lt(left: any, right: any): any {
        return MathOperation.elementWiseOperation('lt', left, right);
    }

    public static le(left: any, right: any): any {
        return MathOperation.elementWiseOperation('le', left, right);
    }

    public static eq(left: any, right: any): any {
        return MathOperation.elementWiseOperation('eq', left, right);
    }

    public static ge(left: any, right: any): any {
        return MathOperation.elementWiseOperation('ge', left, right);
    }

    public static gt(left: any, right: any): any {
        return MathOperation.elementWiseOperation('gt', left, right);
    }

    public static ne(left: any, right: any): any {
        return MathOperation.elementWiseOperation('ne', left, right);
    }

    public static mand(left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal.and(left, right);
        } else if (left instanceof ComplexDecimal && right instanceof MultiArray) {
            return ComplexDecimal.and(left, MultiArray.toLogical(right));
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return ComplexDecimal.and(MultiArray.toLogical(left), right);
        } else if (left instanceof MultiArray && right instanceof MultiArray) {
            return ComplexDecimal.and(MultiArray.toLogical(left), MultiArray.toLogical(right));
        }
    }

    public static mor(left: any, right: any): any {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (left instanceof ComplexDecimal && right instanceof ComplexDecimal) {
            return ComplexDecimal.or(left, right);
        } else if (left instanceof ComplexDecimal && right instanceof MultiArray) {
            return ComplexDecimal.or(left, MultiArray.toLogical(right));
        } else if (left instanceof MultiArray && right instanceof ComplexDecimal) {
            return ComplexDecimal.or(MultiArray.toLogical(left), right);
        } else if (left instanceof MultiArray && right instanceof MultiArray) {
            return ComplexDecimal.or(MultiArray.toLogical(left), MultiArray.toLogical(right));
        }
    }

    public static not(right: any): any {
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal.not(right);
        } else if (right instanceof MultiArray) {
            return ComplexDecimal.not(MultiArray.toLogical(right));
        }
    }

    public static and(left: any, right: any): any {
        return MathOperation.elementWiseOperation('and', left, right);
    }

    public static or(left: any, right: any): any {
        return MathOperation.elementWiseOperation('or', left, right);
    }

    public static xor(left: any, right: any): any {
        return MathOperation.elementWiseOperation('xor', left, right);
    }
}
