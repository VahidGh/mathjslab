import { ComplexDecimal, TBinaryOperationName } from './complex-decimal';
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
                        MultiArray.appendSingletonTail(dims, length);
                        lenghtGreater = true;
                    } else {
                        dims = dims.slice(0, length - 1);
                    }
                    const ind = MultiArray.scalarToMultiArray(IND);
                    const result = new MultiArray(ind.dimension);
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
                if (!MultiArray.arrayEquals(subscript[0].dimension, subscript[s].dimension)) {
                    throw new Error('sub2ind: all subscripts must be of the same size.');
                }
            }
            MultiArray.appendSingletonTail(dims, subscript.length);
            const result = new MultiArray(subscript[0].dimension);
            for (let n = 0; n < MultiArray.linearLength(subscript[0]); n++) {
                const subscriptN = subscript.map((s) => {
                    const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(s.dimension[0], s.dimension[1], n);
                    return s.array[i][j];
                });
                const index = MultiArray.parseSubscript(dims, subscriptN, 'index ');
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
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
        const sizeDim = 'array' in M ? M.dimension.slice() : [1, 1];
        if (DIM.length === 0) {
            const result = new MultiArray([1, sizeDim.length]);
            result.array[0] = sizeDim.map((d) => new ComplexDecimal(d));
            result.type = ComplexDecimal.numberClass.real;
            return result;
        } else {
            const dims =
                DIM.length === 1 && 'array' in DIM[0]
                    ? MultiArray.linearize(DIM[0]).map((dim) => parseDimension(dim))
                    : DIM.map((dim: any) => parseDimension(MultiArray.firstElement(dim)));
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

    /**
     * Uniformly distributed pseudorandom numbers distributed on the
     * interval (0, 1).
     * @param dimension
     * @returns
     */
    public static rand(...dimension: any): MultiArray | ComplexDecimal {
        return MultiArray.newFilledEach((n: number) => new ComplexDecimal(Math.random()), ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(range: MultiArray | ComplexDecimal, ...dimension: any): MultiArray | ComplexDecimal {
        let imin = 0;
        let imax = 0;
        if ('array' in range) {
            const rangeLinearized = MultiArray.linearize(range);
            if (rangeLinearized.length > 1) {
                imin = rangeLinearized[0].re.toNumber();
                imax = rangeLinearized[1].re.toNumber();
            } else if (rangeLinearized.length > 0) {
                imax = rangeLinearized[0].re.toNumber();
            } else {
                throw new Error('bounds(1): out of bound 0 (dimensions are 0x0)');
            }
        } else {
            imax = range.re.toNumber();
        }
        if (Math.trunc(imin) !== imin || Math.trunc(imax) !== imax) {
            throw new Error(`randi: must be integer bounds.`);
        }
        if (imax > imin) {
            return MultiArray.newFilledEach(
                imin === 0
                    ? (n: number) => new ComplexDecimal(Math.round(imax * Math.random()))
                    : (n: number) => new ComplexDecimal(Math.round((imax - imin) * Math.random() + imin)),
                ...dimension,
            );
        } else {
            if ((imin = 0)) {
                throw new Error(`randi: require imax >= 1.`);
            } else {
                throw new Error(`randi: require imax > imin.`);
            }
        }
    }

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along dimension `DIM`.
     * @param DIM Dimension of concatenation.
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along dimension `DIM`.
     */
    public static cat(DIM: MultiArray | any, ...ARRAY: (MultiArray | any)[]): MultiArray {
        const dimension = MultiArray.firstElement(DIM);
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
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
    }

    /**
     * Calculate sum of squares of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of squares of elements along dimension DIM.
     */
    public static sumsq(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(ComplexDecimal.mul(p, ComplexDecimal.conj(p)), ComplexDecimal.mul(c, ComplexDecimal.conj(c))));
    }

    /**
     * Calculate product of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static prod(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.mul(p, c));
    }

    /**
     * Calculate average or mean of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static mean(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        const sum = MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
        return MultiArray.MultiArrayOpScalar('rdiv', MultiArray.scalarToMultiArray(sum), new ComplexDecimal(M.dimension[dim]));
    }

    /**
     * Base method of min and max user functions.
     * @param op 'min' or 'max'
     * @param args One to three arguments like user function.
     * @returns Return like user function.
     */
    private static minMax(op: 'min' | 'max', ...args: any[]): MultiArray | NodeReturnList {
        const minMaxAlogDimension = (M: MultiArray, dimension: number) => {
            const reduced = MultiArray.reduceToArray(dimension, M);
            const resultM = new MultiArray(reduced.dimension);
            const indexM = new MultiArray(reduced.dimension);
            const cmp = op === 'min' ? 'lt' : 'gt';
            for (let i = 0; i < indexM.array.length; i++) {
                for (let j = 0; j < indexM.array[0].length; j++) {
                    const [m, n] = ComplexDecimal[`minMaxArray${args[0].type < 2 ? 'Real' : 'Complex'}WithIndex`](cmp, ...(reduced.array[i][j] as unknown as ComplexDecimal[]));
                    resultM.array[i][j] = m;
                    indexM.array[i][j] = new ComplexDecimal(n + 1);
                }
            }
            return global.EvaluatorPointer.nodeReturnList((length: number, index: number): any => {
                global.EvaluatorPointer.throwErrorIfGreaterThanReturnList(2, length);
                return MultiArray.MultiArrayToScalar(index === 0 ? resultM : indexM);
            });
        };
        switch (args.length) {
            case 1:
                // Along first non singleton dimension.
                const dimension = MultiArray.firstNonSingleDimension(MultiArray.scalarToMultiArray(args[0]));
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), dimension);
            case 2:
                // Broadcast
                return MultiArray.elementWiseOperation((op + 'Wise') as TBinaryOperationName, MultiArray.scalarToMultiArray(args[0]), args[1]);
            case 3:
                // Along selected dimension.
                if (!('array' in args[1] && args[1].dimension.length === 2 && args[1].dimension[0] === 0 && args[1].dimension[1] === 0)) {
                    // Error if second argument is different from [].
                    throw new Error(`${op}: second argument is ignored`);
                }
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), MultiArray.firstElement(args[2]).re.toNumber() - 1);
            default:
                throw new Error(`Invalid call to ${op}.  Type 'help ${op}' to see correct usage.`);
        }
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: any[]): MultiArray | NodeReturnList {
        return CoreFunctions.minMax('min', ...args);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: any[]): MultiArray | NodeReturnList {
        return CoreFunctions.minMax('max', ...args);
    }
}
