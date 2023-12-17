import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { ElementType, MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';

export type MathObject = ElementType;

export type UnaryMathOperation = (expression: MathObject) => MathObject;

export type BinaryMathOperation = (left: MathObject, right: MathObject) => MathObject;

export type MathOperationType = UnaryMathOperation | BinaryMathOperation;

export abstract class MathOperation {
    public static unaryOperations: { [name: string]: UnaryMathOperation } = {
        uplus: MathOperation.uplus,
        uminus: MathOperation.uminus,
        not: MathOperation.not,
        transpose: MathOperation.transpose,
        ctranspose: MathOperation.ctranspose,
    };

    public static binaryOperations: { [name: string]: BinaryMathOperation } = {
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

    public static leftAssociativeMultipleOperations: { [name: string]: BinaryMathOperation } = {
        plus: MathOperation.plus,
        times: MathOperation.times,
        mtimes: MathOperation.mtimes,
        and: MathOperation.and,
        or: MathOperation.or,
        xor: MathOperation.xor,
    };

    public static copy(right: MathObject): MathObject {
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal.copy(right);
        } else if (right instanceof MultiArray) {
            return MultiArray.copy(right);
        } else {
            return CharString.copy(right);
        }
    }

    private static elementWiseOperation(op: ComplexDecimal.TBinaryOperationName, left: MathObject, right: MathObject): MathObject {
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
        } else {
            return MultiArray.elementWiseOperation(op, left as MultiArray, right as MultiArray);
        }
    }

    private static leftOperation(op: ComplexDecimal.TUnaryOperationLeftName, right: MathObject): MathObject {
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal[op](right);
        } else {
            return MultiArray.leftOperation(op, right);
        }
    }

    public static plus(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('add', left, right);
    }

    public static minus(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('sub', left, right);
    }

    public static mod(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('mod', left, right);
    }

    public static rem(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('rem', left, right);
    }

    public static times(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('mul', left, right);
    }

    public static mtimes(left: MathObject, right: MathObject): MathObject {
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
        } else {
            return LinearAlgebra.mul(left as MultiArray, right as MultiArray);
        }
    }

    public static rdivide(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('rdiv', left, right);
    }

    public static mrdivide(left: MathObject, right: MathObject): MathObject {
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
        } else {
            return LinearAlgebra.mul(left as MultiArray, LinearAlgebra.inv(right as MultiArray));
        }
    }

    public static ldivide(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('ldiv', left, right);
    }

    public static mldivide(left: MathObject, right: MathObject): MathObject {
        return ComplexDecimal.one(); // TODO: implement left division.
    }

    public static power(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('power', left, right);
    }

    public static mpower(left: MathObject, right: MathObject): MathObject {
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
            // TODO implement matrix power.
            throw new Error("invalid exponent in '^'.");
        }
    }

    public static uplus(right: MathObject): MathObject {
        return MathOperation.leftOperation('copy', right);
    }

    public static uminus(right: MathObject): MathObject {
        return MathOperation.leftOperation('neg', right);
    }

    public static transpose(left: MathObject): MathObject {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (left instanceof MultiArray) {
            return LinearAlgebra.transpose(left);
        } else {
            return left.copy();
        }
    }

    public static ctranspose(left: MathObject): MathObject {
        if (left instanceof CharString) {
            left = MultiArray.fromCharString(left);
        }
        if (left instanceof ComplexDecimal) {
            return ComplexDecimal.conj(left);
        } else {
            return LinearAlgebra.ctranspose(left);
        }
    }

    public static lt(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('lt', left, right);
    }

    public static le(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('le', left, right);
    }

    public static eq(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('eq', left, right);
    }

    public static ge(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('ge', left, right);
    }

    public static gt(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('gt', left, right);
    }

    public static ne(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('ne', left, right);
    }

    public static mand(left: MathObject, right: MathObject): MathObject {
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
        } else {
            return ComplexDecimal.and(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
    }

    public static mor(left: MathObject, right: MathObject): MathObject {
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
        } else {
            return ComplexDecimal.or(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
    }

    public static not(right: MathObject): MathObject {
        if (right instanceof CharString) {
            right = MultiArray.fromCharString(right);
        }
        if (right instanceof ComplexDecimal) {
            return ComplexDecimal.not(right);
        } else {
            return ComplexDecimal.not(MultiArray.toLogical(right));
        }
    }

    public static and(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('and', left, right);
    }

    public static or(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('or', left, right);
    }

    public static xor(left: MathObject, right: MathObject): MathObject {
        return MathOperation.elementWiseOperation('xor', left, right);
    }
}
