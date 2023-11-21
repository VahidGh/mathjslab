import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';
import { NodeReturnList } from './evaluator';

export abstract class CoreFunctions {
    public static functions: { [name: string]: Function } = {
        ind2sub: CoreFunctions.ind2sub,
        sub2ind: CoreFunctions.sub2ind,
        size: CoreFunctions.size,
        zeros: CoreFunctions.zeros,
        ones: CoreFunctions.ones,
        rand: CoreFunctions.rand,
        randi: CoreFunctions.randi,
        cat: CoreFunctions.cat,
        horzcat: CoreFunctions.horzcat,
        vertcat: CoreFunctions.vertcat,
        sum: CoreFunctions.sum,
        sumsq: CoreFunctions.sumsq,
        prod: CoreFunctions.prod,
        mean: CoreFunctions.mean,
        min: CoreFunctions.min,
        max: CoreFunctions.max,
    };

    /**
     * Convert linear indices to subscripts.
     * @param DIMS
     * @param IND
     * @returns
     */
    public static ind2sub(DIMS: any, IND: any): any {
        if (arguments.length === 2) {
            return global.EvaluatorPointer.nodeReturnList((length: number, index: number): any => {
                if (length === 1) {
                    return IND;
                } else {
                    let dims = MultiArray.linearize(DIMS).map((value) => value.re.toNumber());
                    let lenghtGreater = false;
                    if (length > dims.length) {
                        MultiArray.appendSingletonTail(dims, length - 1);
                        lenghtGreater = true;
                    } else {
                        dims = dims.slice(0, length - 1);
                    }
                    const ind = MultiArray.scalarToMultiArray(IND);
                    const result = new MultiArray(ind.dim);
                    const subscript = ind.array.map((row) => row.map((value) => MultiArray.ind2subNumber(dims, value.re.toNumber())));
                    if (index === length - 1 && lenghtGreater) {
                        result.array = subscript.map((row) => row.map((value) => new ComplexDecimal(value[length])));
                    } else {
                        result.array = subscript.map((row) => row.map((value) => new ComplexDecimal(value[index])));
                    }
                    result.type = ComplexDecimal.numberClass.real;
                    return MultiArray.MultiArrayToScalar(result);
                }
            });
        } else {
            throw new Error(`Invalid call to ind2sub. Type 'help ind2sub' to see correct usage.`);
        }
    }

    /**
     * Convert subscripts to linear indices.
     * @param DIMS
     * @param S
     * @returns
     */
    public static sub2ind(DIMS: any, ...S: any) {
        if (arguments.length > 1) {
            const dims = MultiArray.linearize(DIMS).map((value) => value.re.toNumber());
            const subscript: MultiArray[] = S.map((s: any) => MultiArray.scalarToMultiArray(s));
            for (let s = 1; s < subscript.length; s++) {
                if (!MultiArray.arrayEquals(subscript[0].dim, subscript[s].dim)) {
                    throw new Error('sub2ind: all subscripts must be of the same size.');
                }
            }
            MultiArray.appendSingletonTail(dims, subscript.length);
            const result = new MultiArray(subscript[0].dim);
            for (let n = 0; n < MultiArray.linearLength(subscript[0]); n++) {
                const subscriptN = subscript.map((s) => {
                    const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(s.dim[0], s.dim[1], n);
                    return s.array[i][j];
                });
                const index = MultiArray.parseSubscript(dims, subscriptN, 'index ');
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dim[0], result.dim[1], n);
                result.array[p][q] = new ComplexDecimal(index + 1);
            }
            return MultiArray.MultiArrayToScalar(result);
        } else {
            throw new Error(`Invalid call to sub2ind. Type 'help su2ind' to see correct usage.`);
        }
    }

    /**
     * Returns array dimensions.
     * @param M MultiArray
     * @param DIM Dimensions
     * @returns Dimensions of `M` parameter.
     */
    public static size(M: MultiArray | ComplexDecimal, ...DIM: any): MultiArray | ComplexDecimal {
        const parseDimension = (dimension: ComplexDecimal): number => {
            const dim = dimension.re.toNumber();
            if (dim < 1 || !dimension.re.trunc().eq(dimension.re)) {
                throw new Error(`size: requested dimension DIM (= ${dim}) out of range. DIM must be a positive integer.`);
            }
            return dim;
        };
        const sizeDim = 'array' in M ? M.dim.slice() : [1, 1];
        if (DIM.length === 0) {
            const result = new MultiArray([1, sizeDim.length]);
            result.array[0] = sizeDim.map((d) => new ComplexDecimal(d));
            result.type = ComplexDecimal.numberClass.real;
            return result;
        } else {
            const dims =
                DIM.length === 1 && 'array' in DIM[0]
                    ? MultiArray.linearize(DIM[0]).map((dim) => parseDimension(dim))
                    : // DIM.map((dim: any) => ('array' in dim) ? parseDimension(dim.array[0][0]) : parseDimension(dim));
                      DIM.map((dim: any) => parseDimension(MultiArray.firstElement(dim)));
            MultiArray.appendSingletonTail(sizeDim, Math.max(...dims));
            const result = new MultiArray([1, dims.length]);
            result.array[0] = dims.map((dim: number) => new ComplexDecimal(sizeDim[dim - 1]));
            result.type = ComplexDecimal.numberClass.real;
            return MultiArray.MultiArrayToScalar(result);
        }
    }

    /**
     * Create array of all zeros.
     * @param dimension
     * @returns
     */
    public static zeros(...dimension: any): MultiArray | ComplexDecimal {
        return MultiArray.newFilled(ComplexDecimal.zero(), ...dimension);
    }

    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static ones(...dimension: any): MultiArray | ComplexDecimal {
        return MultiArray.newFilled(ComplexDecimal.one(), ...dimension);
    }

    public static rand(...dimension: any): MultiArray | ComplexDecimal {
        return MultiArray.newFilledEach((n: number) => new ComplexDecimal(Math.random()), ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(imax: ComplexDecimal, ...dimension: any): MultiArray | ComplexDecimal {
        if (imax.re.lt(1)) {
            throw new Error(`randi: require imax >= 1.`);
        }
        if (!imax.re.trunc().eq(imax.re)) {
            throw new Error(`randi: must be integer bounds.`);
        }
        const max = Math.trunc(imax.re.toNumber());
        return MultiArray.newFilledEach((n: number) => new ComplexDecimal(Math.round(max * Math.random())), ...dimension);
    }

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along dimension `DIM`.
     * @param DIM Dimension of concatenation.
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along dimension `DIM`.
     */
    public static cat(DIM: MultiArray | any, ...ARRAY: (MultiArray | any)[]): MultiArray {
        let dimension: number;
        if ('array' in DIM && DIM.dim.reduce((p: number, c: number) => p * c, 1) > 0) {
            dimension = DIM.array[0][0].re.toNumber() - 1;
        } else {
            dimension = DIM.re.toNumber() - 1;
        }
        const array = ARRAY.map((m) => MultiArray.scalarToMultiArray(m));
        return MultiArray.concatenate(dimension, 'cat', ...array);
    }

    /**
     * Concatenate arrays horizontally.
     * @param ARRAY Arrays to concatenate horizontally.
     * @returns Concatenated arrays horizontally.
     */
    public static horzcat(...ARRAY: (MultiArray | any)[]): MultiArray {
        const array = ARRAY.map((m) => MultiArray.scalarToMultiArray(m));
        return MultiArray.concatenate(1, 'horzcat', ...array);
    }

    /**
     * Concatenate arrays vertically.
     * @param ARRAY Arrays to concatenate vertically.
     * @returns Concatenated arrays vertically.
     */
    public static vertcat(...ARRAY: (MultiArray | any)[]): MultiArray {
        const array = ARRAY.map((m) => MultiArray.scalarToMultiArray(m));
        return MultiArray.concatenate(0, 'vertcat', ...array);
    }

    /**
     * Calculate sum of elements along dimension DIM.
     * @param M Array
     * @param DIM Dimension
     * @returns Array with sum of elements along dimension DIM.
     */
    public static sum(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? DIM.re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
    }

    /**
     * Calculate sum of squares of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of squares of elements along dimension DIM.
     */
    public static sumsq(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? DIM.re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(ComplexDecimal.mul(p, ComplexDecimal.conj(p)), ComplexDecimal.mul(c, ComplexDecimal.conj(c))));
    }

    /**
     * Calculate product of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static prod(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? DIM.re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.mul(p, c));
    }

    /**
     * Calculate average or mean of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static mean(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? DIM.re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        const sum = MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
        return MultiArray.MultiArrayOpScalar('rdiv', MultiArray.scalarToMultiArray(sum), new ComplexDecimal(M.dim[dim]));
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: any[]): MultiArray | NodeReturnList {
        return MultiArray.minMax('min', ...args);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: any[]): MultiArray | NodeReturnList {
        return MultiArray.minMax('max', ...args);
    }
}
