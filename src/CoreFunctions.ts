import { ComplexDecimal } from './ComplexDecimal';
import { MultiArray } from './MultiArray';
import { Evaluator } from './Evaluator';
import { CharString } from './CharString';
import * as AST from './AST';

export abstract class CoreFunctions {
    public static functions: Record<string, Function> = {
        ndims: CoreFunctions.ndims,
        rows: CoreFunctions.rows,
        columns: CoreFunctions.columns,
        length: CoreFunctions.Length,
        numel: CoreFunctions.numel,
        ind2sub: CoreFunctions.ind2sub,
        sub2ind: CoreFunctions.sub2ind,
        size: CoreFunctions.size,
        isempty: CoreFunctions.isempty,
        reshape: CoreFunctions.reshape,
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
        cummin: CoreFunctions.cummin,
        cummax: CoreFunctions.cummax,
        cumsum: CoreFunctions.cumsum,
        cumprod: CoreFunctions.cumprod,
    };

    /**
     *
     * @param name
     */
    public static throwInvalidCallError(name: string): void {
        throw new Error(`Invalid call to ${name}.  Type 'help ${name}' to see correct usage.`);
    }

    /**
     *
     * @param M
     * @returns
     */
    public static isempty(M: MultiArray | ComplexDecimal): ComplexDecimal {
        return MultiArray.isEmpty(M) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return the number of dimensions of M.
     * @param M
     * @returns
     */
    public static ndims(M: MultiArray | ComplexDecimal): ComplexDecimal | undefined {
        if (arguments.length === 1) {
            return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension.length);
        } else {
            CoreFunctions.throwInvalidCallError('ndims');
        }
    }

    /**
     * eturn the number of rows of M.
     * @param M
     * @returns
     */
    public static rows(M: MultiArray | ComplexDecimal): ComplexDecimal | undefined {
        if (arguments.length === 1) {
            return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension[0]);
        } else {
            CoreFunctions.throwInvalidCallError('rows');
        }
    }

    /**
     * Return the number of columns of M.
     * @param M
     * @returns
     */
    public static columns(M: MultiArray | ComplexDecimal): ComplexDecimal | undefined {
        if (arguments.length === 1) {
            return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension[1]);
        } else {
            CoreFunctions.throwInvalidCallError('columns');
        }
    }

    /**
     * Return the length of the object M. The length is the number of elements
     * along the largest dimension.
     * @param M
     * @returns
     */
    public static Length(M: MultiArray | ComplexDecimal): ComplexDecimal | undefined {
        // Capitalized name so as not to conflict with the built-in 'Function.length' property.
        if (arguments.length === 1) {
            return new ComplexDecimal(Math.max(...MultiArray.scalarToMultiArray(M).dimension));
        } else {
            CoreFunctions.throwInvalidCallError('length');
        }
    }

    public static numel(M: MultiArray | ComplexDecimal, ...IDX: (MultiArray | ComplexDecimal | CharString)[]): ComplexDecimal {
        if (IDX.length === 0) {
            return 'array' in M ? new ComplexDecimal(MultiArray.linearLength(M)) : ComplexDecimal.one();
        } else {
            const m = MultiArray.scalarToMultiArray(M);
            const index = IDX.map((idx, i) => {
                if ('array' in idx) {
                    return MultiArray.linearLength(idx);
                } else if ('str' in idx && idx.string === ':') {
                    return i < m.dimension.length ? m.dimension[i] : 1;
                } else {
                    return 1;
                }
            });
            return new ComplexDecimal(index.reduce((p, c) => p * c, 1));
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
            return AST.nodeReturnList((length: number, index: number): any => {
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
            CoreFunctions.throwInvalidCallError('ind2sub');
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
            CoreFunctions.throwInvalidCallError('sub2ind');
        }
    }

    /**
     * Returns array dimensions.
     * @param M MultiArray
     * @param DIM Dimensions
     * @returns Dimensions of `M` parameter.
     */
    public static size(M: MultiArray | ComplexDecimal, ...DIM: any): MultiArray | ComplexDecimal | undefined {
        if (arguments.length > 0) {
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
        } else {
            CoreFunctions.throwInvalidCallError('size');
        }
    }

    /**
     *
     * @param M
     * @param dimension
     * @returns
     */
    public static reshape(M: MultiArray | ComplexDecimal, ...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        const m = MultiArray.scalarToMultiArray(M);
        let d: number = -1;
        const dims = dimension.map((dim, i) => {
            const element = MultiArray.firstElement(dim);
            if (MultiArray.isEmpty(element)) {
                if (d < 0) {
                    d = i;
                    return 1;
                } else {
                    throw new Error('reshape: only a single dimension can be unknown.');
                }
            } else {
                return element.re.toNumber();
            }
        });
        return MultiArray.reshape(m, dims, d >= 0 ? d : undefined);
    }

    /**
     * Create MultiArray with all elements equals `fill` parameter.
     * @param fill Value to fill MultiArray.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fill` parameter.
     */
    private static newFilled(fill: any, name: string, ...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        let dims: number[];
        if (dimension.length === 0) {
            return fill;
        } else if (dimension.length === 1) {
            const m = MultiArray.scalarToMultiArray(dimension[0]);
            if (m.dimension.length > 2 || m.dimension[0] !== 1) {
                throw new Error(`${name} (A): use ${name} (size (A)) instead.`);
            }
            dims = m.array[0].map((data) => data.re.toNumber());
        } else {
            dims = dimension.map((dim) => {
                if ('array' in dim) {
                    throw new Error(`${name}: dimensions must be scalars.`);
                }
                return dim.re.toNumber();
            });
        }
        return MultiArray.MultiArrayToScalar(new MultiArray(dims, fill));
    }

    /**
     * Create MultiArray with all elements filled with `fillFunction` result.
     * The parameter passed to `fillFunction` is a linear index of element.
     * @param fillFunction Function to be called and the result fills element of MultiArray created.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fillFunction` results for each element.
     */
    private static newFilledEach(fillFunction: (index: number) => any, ...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        let dims: number[];
        if (dimension.length === 1) {
            dims = MultiArray.linearize(dimension[0]).map((dim: ComplexDecimal) => dim.re.toNumber());
        } else if (dimension.length === 0) {
            return fillFunction(0);
        } else {
            dims = dimension.map((dim) => MultiArray.firstElement(dim).re.toNumber());
        }
        const result = new MultiArray(dims);
        for (let n = 0; n < MultiArray.linearLength(result); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[i][j] = fillFunction(n);
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    }

    /**
     * Create array of all zeros.
     * @param dimension
     * @returns
     */
    public static zeros(...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        return CoreFunctions.newFilled(ComplexDecimal.zero(), 'zeros', ...dimension);
    }

    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static ones(...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        return CoreFunctions.newFilled(ComplexDecimal.one(), 'ones', ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom numbers distributed on the
     * interval (0, 1).
     * @param dimension
     * @returns
     */
    public static rand(...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
        return CoreFunctions.newFilledEach(() => new ComplexDecimal(Math.random()), ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(range: MultiArray | ComplexDecimal, ...dimension: (MultiArray | ComplexDecimal)[]): MultiArray | ComplexDecimal {
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
            return CoreFunctions.newFilledEach(
                imin === 0 ? () => new ComplexDecimal(Math.round(imax * Math.random())) : () => new ComplexDecimal(Math.round((imax - imin) * Math.random() + imin)),
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
        const dimension = MultiArray.firstElement(DIM).re.toNumber() - 1;
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
    public static sum(M: MultiArray, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
    }

    /**
     * Calculate sum of squares of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of squares of elements along dimension DIM.
     */
    public static sumsq(M: MultiArray, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(ComplexDecimal.mul(p, ComplexDecimal.conj(p)), ComplexDecimal.mul(c, ComplexDecimal.conj(c))));
    }

    /**
     * Calculate product of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static prod(M: MultiArray, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        return MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.mul(p, c));
    }

    /**
     * Calculate average or mean of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static mean(M: MultiArray, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        const sum = MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p, c));
        return MultiArray.MultiArrayOpScalar('rdiv', MultiArray.scalarToMultiArray(sum), new ComplexDecimal(M.dimension[dim]));
    }

    /**
     * Base method of min and max user functions.
     * @param op 'min' or 'max'.
     * @param args One to three arguments like user function.
     * @returns Return like user function.
     */
    private static minMax(op: 'min' | 'max', ...args: any[]): MultiArray | AST.NodeReturnList | undefined {
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
            return AST.nodeReturnList((length: number, index: number): any => {
                Evaluator.throwErrorIfGreaterThanReturnList(2, length);
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
                return MultiArray.elementWiseOperation((op + 'Wise') as ComplexDecimal.TBinaryOperationName, MultiArray.scalarToMultiArray(args[0]), args[1]);
            case 3:
                // Along selected dimension.
                if (!MultiArray.isEmpty(args[1])) {
                    // Error if second argument is different from [](0x0).
                    throw new Error(`${op}: second argument is ignored`);
                }
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), MultiArray.firstElement(args[2]).re.toNumber() - 1);
            default:
                CoreFunctions.throwInvalidCallError(op);
        }
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: any[]): MultiArray | AST.NodeReturnList | undefined {
        return CoreFunctions.minMax('min', ...args);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: any[]): MultiArray | AST.NodeReturnList | undefined {
        return CoreFunctions.minMax('max', ...args);
    }

    /**
     * Base method of cummin and cummax user functions.
     * @param op 'min' or 'max'.
     * @param M MultiArray.
     * @param DIM Dimension in which the cumulative operation occurs.
     * @returns MultiArray with cumulative values along dimension DIM.
     */
    private static cumMinMax(op: 'min' | 'max', M: MultiArray | ComplexDecimal, DIM?: MultiArray | ComplexDecimal): AST.NodeReturnList {
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : 1;
        M = MultiArray.scalarToMultiArray(M);
        const indexM = new MultiArray(M.dimension);
        let compare: ComplexDecimal;
        let index: ComplexDecimal;
        const result = MultiArray.alongDimensionMap(dim, M, (element, d, i, j) => {
            if (d === 0) {
                compare = element;
                index = ComplexDecimal.one();
            } else {
                if (ComplexDecimal[op === 'min' ? 'lt' : 'gt'](element, compare).re.toNumber()) {
                    index = new ComplexDecimal(d + 1);
                    compare = element;
                }
            }
            indexM.array[i][j] = index;
            return compare;
        });
        return AST.nodeReturnList((length: number, index: number): any => {
            Evaluator.throwErrorIfGreaterThanReturnList(2, length);
            return MultiArray.MultiArrayToScalar(index === 0 ? result : indexM);
        });
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cummin(M: MultiArray, DIM?: MultiArray | ComplexDecimal): AST.NodeReturnList {
        return CoreFunctions.cumMinMax('min', M, DIM);
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cummax(M: MultiArray, DIM?: MultiArray | ComplexDecimal): AST.NodeReturnList {
        return CoreFunctions.cumMinMax('max', M, DIM);
    }

    /**
     *
     * @param op
     * @param M
     * @param DIM
     * @returns
     */
    private static cumSumProd(op: 'add' | 'mul', M: MultiArray | ComplexDecimal, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        M = MultiArray.scalarToMultiArray(M);
        const dim = DIM ? MultiArray.firstElement(DIM).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        const initialValue = op === 'add' ? ComplexDecimal.zero() : ComplexDecimal.one();
        const result = MultiArray.alongDimensionMap(
            dim,
            M,
            (
                (sum) => (element, dimension) =>
                    (sum = dimension !== 0 ? ComplexDecimal[op](sum, element) : element)
            )(initialValue),
        );
        MultiArray.setType(result);
        return result;
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cumsum(M: MultiArray | ComplexDecimal, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        return CoreFunctions.cumSumProd('add', M, DIM);
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cumprod(M: MultiArray | ComplexDecimal, DIM?: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        return CoreFunctions.cumSumProd('mul', M, DIM);
    }
}
