import { ComplexDecimal } from './complex-decimal';

/**
 * External reference for Evaluator.
 */
export type Evaluator = any;
declare let EvaluatorPointer: Evaluator;

/**
 * nameTable type (same in evaluator) to be used in MultiArray.setItems
 */
export type TNameTable = Record<
    string,
    {
        args: any[];
        expr: any;
    }
>;

/**
 * # MultiArray
 *
 * An arbitrary precision Linear Algebra library.
 *
 * ## References
 * * https://mathworld.wolfram.com/LinearAlgebra.html
 */
export class MultiArray {
    /**
     * Functions
     */
    public static functions: { [name: string]: Function } = {
        zeros: MultiArray.zeros,
        ones: MultiArray.ones,
        eye: MultiArray.eye,
        rand: MultiArray.rand,
        randi: MultiArray.randi,
        horzcat: MultiArray.horzcat,
        vertcat: MultiArray.vertcat,
        min: MultiArray.min,
        max: MultiArray.max,
        mean: MultiArray.mean,
        sum: MultiArray.sum,
        sumsq: MultiArray.sumsq,
        prod: MultiArray.prod,
        trace: MultiArray.trace,
        det: MultiArray.det,
        inv: MultiArray.inv,
        minor: MultiArray.minor,
        cofactor: MultiArray.cofactor,
        adj: MultiArray.adj,
        pivot: MultiArray.pivot,
        lu: MultiArray.lu,
        // plu: MultiArray.plu,
        qr: MultiArray.qr,
        gauss: MultiArray.gauss,
        sub2ind: MultiArray.sub2ind,
        ind2sub: MultiArray.ind2sub,
    };

    /**
     * Linearized functions
     */
    public static linearizedFunctions: { [name: string]: { func: Function; lin: boolean[] } } = {
        size: {
            func: MultiArray.size,
            lin: [false, true],
        },
    };

    /**
     * Dimension property.
     */
    public dim: number[];

    /**
     * Array property.
     */
    public array: ComplexDecimal[][];

    /**
     * Type property.
     */
    public type: number;

    /**
     * Parent node property.
     */
    public parent: number;

    /**
     * MultiArray constructor.
     * @param shape
     * @param fill
     */
    public constructor(shape?: number[], fill?: ComplexDecimal) {
        if (!shape) {
            this.dim = [0, 0];
            this.array = [];
            this.type = -1;
        } else {
            this.dim = shape.slice();
            if (!fill) {
                this.array = new Array(this.dim[0]);
                this.type = -1;
            } else {
                this.array = new Array(this.dim[0]);
                this.type = fill.type;
                for (let i = 0; i < this.dim[0]; i++) {
                    this.array[i] = new Array(this.dim[1]).fill(fill);
                }
            }
        }
    }

    public static getDimension(M: MultiArray, n: number): number {
        if (n < 2) {
            return M.dim[n];
        } else {
            return 1;
        }
    }

    public static removeSingletonTail(dim: number[]): number[] {
        const dimensions = dim.slice();
        let i = dimensions.length - 1;
        while (dimensions[i] === 1 && i > 1) {
            dimensions.pop();
            i--;
        }
        return dimensions;
    }

    public create(shape?: number[], fill?: ComplexDecimal) {
        if (!shape) {
            this.dim = [0, 0];
            this.array = [];
            this.type = -1;
        } else {
            this.dim = MultiArray.removeSingletonTail(shape);
            if (!fill) {
                this.array = new Array(this.dim[0]);
                this.type = -1;
            } else {
                this.array = new Array(this.dim[0]);
                this.type = fill.type;
                for (let i = 0; i < this.dim[0]; i++) {
                    this.array[i] = new Array(this.dim[1]).fill(fill);
                }
            }
        }
    }

    /**
     * Creates a MultiArray object from the first row of elements (for
     * parsing purposes).
     * @param row
     * @returns
     */
    public static firstRow(row: any[]): MultiArray {
        const result = new MultiArray([1, row.length]);
        result.array[0] = row;
        return result;
    }

    /**
     * Append a row of elements to a MultiArray object (for parsing
     * purposes).
     * @param M
     * @param row
     * @returns
     */
    public static appendRow(M: MultiArray, row: any[]): MultiArray {
        M.array.push(row);
        M.dim[0]++;
        return M;
    }

    /**
     * Swap two rows of a MultiArray in place.
     * @param M
     * @param m
     * @param n
     */
    public static swapRows(M: MultiArray, m: number, n: number): void {
        const temp = M.array[m];
        M.array[m] = M.array[n];
        M.array[n] = temp;
    }

    /**
     * Check if object is MultiArray compatible.
     * @param obj
     * @returns
     */
    public static isThis(obj: any): boolean {
        return 'array' in obj;
    }

    /**
     * Unparse MultiArray.
     * @param tree MultiArray matrix object.
     * @param that Evaluator.
     * @returns String of unparsed matrix.
     */
    public static unparse(tree: MultiArray, that: Evaluator): string {
        let arraystr = tree.array.map((row) => row.map((value) => that.Unparse(value)).join(',') + ';').join('');
        arraystr = arraystr.substring(0, arraystr.length - 1);
        return '[' + arraystr + ']';
    }

    /**
     * Unparse MultiArray as MathML language.
     * @param tree MultiArray matrix object.
     * @param that Evaluator.
     * @returns String of unparsed matrix.
     */
    public static unparseML(tree: MultiArray, that: Evaluator): string {
        let temp = '<mrow><mo>[</mo><mtable>';
        temp += tree.array.map((row) => `<mtr>${row.map((value) => `<mtd>${that.unparserML(value)}</mtd>`).join('')}</mtr>`).join('');
        temp += tree.array.length > 0 ? '</mtable><mo>]</mo></mrow>' : '<mspace width="0.5em"/></mtable><mo>]</mo></mrow><mo>(</mo><mn>0</mn><mi>&times;</mi><mn>0</mn><mo>)</mo>';
        return temp;
    }

    /**
     * Evaluate MultiArray object. Calls `that.Evaluator` for each element of
     * Matrix
     * @param tree MultiArray matrix object.
     * @param that Evaluator reference.
     * @param fname Function name (context).
     * @returns MultiArray object evaluated.
     */
    public static evaluate(tree: MultiArray, that: Evaluator, local: boolean = false, fname: string = ''): MultiArray {
        // if (tree.parent === undefined) console.log('(MultiArray) parent undefined');
        const result = new MultiArray();
        for (let i = 0, k = 0; i < tree.array.length; i++, k++) {
            result.array.push([]);
            let h = 1;
            for (let j = 0; j < tree.array[i].length; j++) {
                tree.array[i][j].parent = result;
                const temp = that.Evaluator(tree.array[i][j], local, fname);
                if (MultiArray.isThis(temp)) {
                    if (j === 0) {
                        h = temp.array.length;
                        result.array.splice(k, 1, temp.array[0]);
                        for (let n = 1; n < h; n++) {
                            result.array.splice(k + n, 0, temp.array[n]);
                        }
                    } else {
                        for (let n = 0; n < temp.array.length; n++) {
                            for (let m = 0; m < temp.array[0].length; m++) {
                                result.array[k + n].push(temp.array[n][m]);
                            }
                        }
                    }
                } else {
                    result.array[k][j] = temp;
                }
            }
            k += h - 1;
            if (i != 0) {
                if (result.array[i].length != result.array[0].length) {
                    throw new Error(`vertical dimensions mismatch (${k}x${result.array[0].length} vs 1x${result.array[i].length}).`);
                }
            }
        }
        result.dim = [result.array.length, result.array.length ? result.array[0].length : 0];
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Linearize MultiArray in an array of ComplexDecimal using row-major
     * order.
     * @param M
     * @returns
     */
    public static linearize(M: MultiArray | ComplexDecimal): ComplexDecimal[] {
        if ('array' in M) {
            const result: ComplexDecimal[] = [];
            for (let j = 0; j < M.dim[1]; j++) {
                result.push(...M.array.map((row) => row[j]));
            }
            return result;
        } else {
            return [M];
        }
    }

    /**
     * Null matrix (0x0 matrix).
     * @returns
     */
    public static mat_0x0(): MultiArray {
        return new MultiArray([0, 0]);
    }

    /**
     * Test if two array of numbers are equals.
     * @param left
     * @param right
     * @returns
     */
    public static arrayEqual(left: number[], right: number[]): boolean {
        return !(left < right || left > right);
    }

    /**
     * Convert a ComplexDecimal to 1x1 MultiArray.
     * @param value
     * @returns
     */
    public static numberToMatrix(value: ComplexDecimal | MultiArray): MultiArray {
        if ('array' in value) {
            return value;
        } else {
            const result = new MultiArray([1, 1]);
            result.array[0] = [value];
            result.type = value.type;
            return result;
        }
    }

    public static matrixToNumber(value: ComplexDecimal | MultiArray): MultiArray | ComplexDecimal {
        if ('array' in value && value.dim[0] === 1 && value.dim[1] === 1) {
            return value.array[0][0];
        } else {
            return value;
        }
    }

    /**
     * Copy of MultiArray.
     * @param M
     * @returns
     */
    public static copy(M: MultiArray): MultiArray {
        const result = new MultiArray(M.dim);
        result.array = M.array.map((row) => row.map((value) => (ComplexDecimal.isThis(value) ? ComplexDecimal.copy(value) : Object.assign({}, value))));
        result.type = M.type;
        return result;
    }

    /**
     * Convert MultiArray to logical value. It's true if all elements is
     * non-null. Otherwise is false.
     * @param M
     * @returns
     */
    public static toLogical(M: MultiArray): ComplexDecimal {
        for (let i = 0; i < M.dim[0]; i++) {
            for (let j = 0; j < M.dim[1]; j++) {
                const value = ComplexDecimal.toMaxPrecision(M.array[i][j]);
                if (value.re.eq(0) && value.im.eq(0)) {
                    return ComplexDecimal.false();
                }
            }
        }
        return ComplexDecimal.true();
    }

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results.
     * @param M Matrix.
     * @param f Function mapping.
     * @returns
     */
    public static map(M: MultiArray, f: Function): MultiArray {
        const result = new MultiArray(M.dim.slice());
        result.array = M.array.map((row) => row.map(f as any));
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Expand matrix dimensions if dimensions in `dim` is greater than dimensions of `M`.
     * If a dimension of `M` is greater than corresponding dimension in `dim` it's unchanged.
     * The matrix is filled with zeros.
     * The matrix is expanded in place.
     * @param M Matrix.
     * @param dim New dimensions.
     * @returns Matrix `M` with dimensions expanded.
     */
    public static expand(M: MultiArray, dim: number[]): MultiArray {
        if (M.dim[1] < dim[1]) {
            M.array.forEach((row) => row.push(...new Array(dim[1] - M.dim[1]).fill(ComplexDecimal.zero())));
        }
        for (let i = M.dim[0]; i < dim[0]; i++) {
            M.array[i] = new Array(dim[1]).fill(ComplexDecimal.zero());
        }
        M.dim = [Math.max(M.dim[0], dim[0]), Math.max(M.dim[1], dim[1])];
        return M;
    }

    public static linearLength(M: MultiArray): number {
        return M.dim.reduce((previous, current) => previous * current, 1);
    }

    /**
     * Expand range
     * @param startNode
     * @param stopNode
     * @param strideNode
     * @returns
     */
    public static expandRange(startNode: ComplexDecimal, stopNode: ComplexDecimal, strideNode?: ComplexDecimal | null): MultiArray {
        const temp = [];
        const s = strideNode ? strideNode.re.toNumber() : 1;
        for (let n = startNode.re.toNumber(), i = 0; n <= stopNode.re.toNumber(); n += s, i++) {
            temp[i] = new ComplexDecimal(n, 0);
        }
        const result = new MultiArray([1, temp.length]);
        result.array = [temp];
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Check if subscript is a integer number, convert ComplexDecimal to
     * number and decrement (for use as index in a 0 based javascript array).
     * @param k
     * @param input
     * @returns
     */
    public static testIndex(k: ComplexDecimal, input?: string): number {
        if (!k.re.isInteger() || !k.re.gte(1)) {
            throw new Error(`${input ? `${input}: ` : ``}subscripts must be either integers greater than or equal 1 or logicals.`);
        }
        if (!k.im.eq(0)) {
            throw new Error(`${input ? `${input}: ` : ``}subscripts must be real.`);
        }
        return k.re.toNumber() - 1;
    }

    /**
     * Check if subscript is a integer number, convert ComplexDecimal to
     * number and decrement (for use in a 0 based javascript array), then
     * check if it's less than bound.
     * @param k
     * @param input
     * @returns
     */
    public static testIndexBound(k: ComplexDecimal, bound: number, dim: number[], input?: string): number {
        const result = MultiArray.testIndex(k, input);
        if (result >= bound) {
            throw new Error(`${input ? `${input}: ` : ``}out of bound ${bound} (dimensions are ${dim[0]}x${dim[1]}).`);
        }
        return result;
    }

    /**
     * Check if two dimensions are compatible.
     * @param leftDim
     * @param rightDim
     * @returns
     */
    public static testDimension(leftDim: number[], rightDim: number[]): boolean {
        if (MultiArray.arrayEqual(leftDim, rightDim)) {
            return true;
        } else {
            const left = leftDim.slice().sort();
            const right = rightDim.slice().sort();
            return left[0] === 1 && right[0] === 1 && left[1] === right[1];
        }
    }

    /**
     * Find first non-single dimension.
     * @param M
     * @returns
     */
    public static firstNonSingleDimmension(M: MultiArray): number {
        for (let i = 0; i < M.dim.length; i++) {
            if (M.dim[i] !== 1) {
                return i;
            }
        }
        return M.dim.length - 1;
    }

    /**
     * Converts a ComplexDecimal array or a single line MultiArray to an array
     * or number.
     * @param M
     * @returns
     */
    public static oneRowToDim(M: ComplexDecimal[] | MultiArray): number[] {
        if (Array.isArray(M)) {
            return M.map((data) => data.re.toNumber());
        } else {
            return M.array[0].map((data) => data.re.toNumber());
        }
    }

    /**
     * Set selected items from MultiArray by linear index or subscripts.
     * @param nameTable Name Table
     * @param id Identifier
     * @param args linear indices or subscripts
     * @param right Value to assign.
     */
    public static setItems(nameTable: TNameTable, id: string, args: any[], right: MultiArray): void {
        const linright = this.linearize(right);
        args = args.map((arg: any) => arg.map((value: any) => MultiArray.testIndex(value, id)));
        const argsMax = args.map((arg: number[]) => Math.max(...arg));
        const argsLength = args.map((arg: number[]) => arg.length);
        const isDefinedId = typeof nameTable[id] !== 'undefined';
        const isNotFunction = isDefinedId && nameTable[id].args.length === 0;
        const isMultiArray = isNotFunction && 'array' in nameTable[id].expr;
        const isLinearIndex = args.length < 2;
        if (isMultiArray) {
            if (isLinearIndex) {
                const index = argsLength[0];
                argsLength[0] = index % nameTable[id].expr.dim[0];
                argsLength[1] = Math.trunc(index / nameTable[id].expr.dim[0]);
            }
        } else {
            if (isNotFunction) {
                nameTable[id].expr = MultiArray.numberToMatrix(nameTable[id].expr);
            }
        }
        // console.log('args:');
        // console.table(args);
        // console.log('isDefinedId:', isDefinedId);
        // console.log('isMultiArray:', isMultiArray);
        // console.log('isLinearIndex:', isLinearIndex);
        // console.log('argsMax:', argsMax);
        // console.log('argsLength:', argsLength);
        let argsDim;
        if (isLinearIndex) {
            if (isDefinedId) {
                if (isNotFunction) {
                    const index = argsMax[0];
                    argsMax[0] = index % nameTable[id].expr.dim[0];
                    argsMax[1] = Math.trunc(index / nameTable[id].expr.dim[0]);
                    argsDim = argsMax.map((value) => value + 1);
                    if (argsDim[1] > nameTable[id].expr.dim[1]) {
                        throw new Error('Invalid resizing operation or ambiguous assignment to an out-of-bounds array element.');
                    }
                } else {
                    throw new Error(`in indexed assignment ${id}(index) = X, ${id} cannot be a function.`);
                }
            } else {
                argsMax[1] = argsMax[0];
                argsMax[0] = 0;
                argsDim = argsMax.map((value) => value + 1);
            }
        } else {
            argsDim = argsLength.slice();
        }
        // console.log('argsDim', argsDim);
        // console.log('right.dim:', right.dim);
        if (!isLinearIndex && !MultiArray.testDimension(argsDim, right.dim)) {
            throw new Error(`=: nonconformant arguments (op1 is ${argsDim[0]}x${argsDim[1]}, op2 is ${right.dim[0]}x${right.dim[1]})`);
        }
        if (isDefinedId) {
            if (isNotFunction) {
                nameTable[id].expr = MultiArray.expand(
                    nameTable[id].expr,
                    argsMax.map((value: number) => value + 1),
                );
                // console.log(`expanded(${argsMax}):`, nameTable[id].expr);
            } else {
                throw new Error(`in indexed assignment ${id}(index) = X, ${id} cannot be a function.`);
            }
        } else {
            // console.log('undefined name');
            nameTable[id] = {
                args: [],
                expr: MultiArray.zeros(argsMax.map((value: number) => new ComplexDecimal(value + 1))),
            };
            // console.log('created:', nameTable[id].expr);
        }
        // console.log(`linright(${linright.length}):`, linright);
        // console.log('id:', id);
        // console.log('args:', args);
        if (isLinearIndex) {
            // console.log('single index');
            for (let n = 0; n < args[0].length; n++) {
                // console.log('args[0][n]:', args[0][n]);
                // console.log('nameTable[id].expr.dim:', nameTable[id].expr.dim);
                // console.log('j:', Math.trunc(args[0][n] / nameTable[id].expr.dim[0]));
                nameTable[id].expr.array[args[0][n] % nameTable[id].expr.dim[0]][Math.trunc(args[0][n] / nameTable[id].expr.dim[0])] = linright[n];
            }
        } else {
            // console.log('subscript:', argsLength);
            for (let j = 0, n = 0; j < argsLength[1]; j++) {
                for (let i = 0; i < argsLength[0]; i++, n++) {
                    // console.log(`(${n})(${i},${j})>>${args[0][i]}x${args[1][j]}`);
                    nameTable[id].expr.array[args[0][i]][args[1][j]] = linright[n];
                }
            }
        }
        // console.log('nameTable[id].expr:', nameTable[id].expr);
    }

    /**
     * Get selected items from MultiArray by linear indices or subscripts.
     * @param M Matrix
     * @param id Identifier
     * @param indexList
     * @returns MultiArray of selected items
     */
    public static getItems(M: MultiArray, id: string, indexList: (ComplexDecimal | MultiArray)[]): MultiArray | ComplexDecimal {
        let result: MultiArray;
        if (indexList.length === 0) {
            return M;
        } else if (indexList.length === 1) {
            // single value indexing
            if ('array' in indexList[0]) {
                result = new MultiArray(indexList[0].dim.slice(0, 2));
                for (let i = 0; i < indexList[0].dim[0]; i++) {
                    result.array[i] = new Array(indexList[0].dim[1]);
                    for (let j = 0; j < indexList[0].dim[1]; j++) {
                        const n = MultiArray.testIndexBound(indexList[0].array[i][j], M.dim[0] * M.dim[1], M.dim, `${id}(${indexList[0].array[i][j].re.toNumber()})`);
                        result.array[i][j] = M.array[n % M.dim[0]][Math.trunc(n / M.dim[0])];
                    }
                }
                result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            } else {
                /* Is a ComplexDecimal value */
                const n = MultiArray.testIndexBound(indexList[0], M.dim[0] * M.dim[1], M.dim, `${id}(${indexList[0].re.toNumber()})`);
                return M.array[n % M.dim[0]][Math.floor(n / M.dim[0])];
            }
        } else {
            // multiple value indexing
            if (indexList.length > 2) {
                throw new Error(`${id}(_,_,...): out of bounds (dimensions are ${M.dim[0]}x${M.dim[1]}).`);
            }
            const args: ComplexDecimal[][] = [];
            for (let i = 0; i < indexList.length; i++) {
                if ('array' in indexList[i]) {
                    args[i] = MultiArray.linearize(indexList[i] as MultiArray);
                } else {
                    /* Is a ComplexDecimal value */
                    args[i] = [indexList[i] as ComplexDecimal];
                }
            }
            result = new MultiArray([args[0].length, args[1].length]);
            for (let i = 0; i < args[0].length; i++) {
                const p = MultiArray.testIndexBound(args[0][i], M.dim[0], M.dim, `${id}(${args[0][i].re.toNumber()},_)`);
                result.array[i] = new Array(args[1].length);
                for (let j = 0; j < args[1].length; j++) {
                    const q = MultiArray.testIndexBound(args[1][j], M.dim[1], M.dim, `${id}(${args[1][j].re.toNumber()},_)`);
                    result.array[i][j] = M.array[p][q];
                }
            }
        }
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return MultiArray.matrixToNumber(result);
        /*if (result.dim[0] === 1 && result.dim[1] === 1) {
            return result.array[0][0];
        } else {
            return result;
        }
        /*  */
    }

    /**
     * Matrix product.
     * @param left Matrix.
     * @param right Matrix.
     * @returns left * right
     */
    public static mul(left: MultiArray, right: MultiArray): MultiArray {
        if (left.dim[1] !== right.dim[0]) {
            throw new Error(`operator *: nonconformant arguments (op1 is ${left.dim[0]}x${left.dim[1]}, op2 is ${right.dim[0]}x${right.dim[1]}).`);
        } else {
            const result = new MultiArray([left.dim[0], right.dim[1]]);
            for (let i = 0; i < left.dim[0]; i++) {
                result.array[i] = new Array(right.dim[1]).fill(ComplexDecimal.zero());
                for (let j = 0; j < right.dim[1]; j++) {
                    for (let n = 0; n < left.dim[1]; n++) {
                        result.array[i][j] = ComplexDecimal.add(result.array[i][j], ComplexDecimal.mul(left.array[i][n], right.array[n][j]));
                    }
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        }
    }

    /**
     * Operation scalar _ matrix.
     * @param op
     * @param left
     * @param right
     * @returns
     */
    public static scalarOpMultiArray(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'power' | 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne' | 'and' | 'or' | 'xor' | 'mod' | 'rem',
        left: ComplexDecimal,
        right: MultiArray,
    ): MultiArray {
        const result = new MultiArray(right.dim);
        result.array = right.array.map((row) => row.map((value) => ComplexDecimal[op](left, value)));
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Operation matrix _ scalar.
     * @param op
     * @param left
     * @param right
     * @returns
     */
    public static MultiArrayOpScalar(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'power' | 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne' | 'and' | 'or' | 'xor' | 'mod' | 'rem',
        left: MultiArray,
        right: ComplexDecimal,
    ): MultiArray {
        const result = new MultiArray(left.dim);
        result.array = left.array.map((row) => row.map((value) => ComplexDecimal[op](value, right)));
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Unary left operation.
     * @param op
     * @param right
     * @returns
     */
    public static leftOp(op: 'copy' | 'neg' | 'not', right: MultiArray): MultiArray {
        const result = new MultiArray(right.dim);
        result.array = right.array.map((row) => row.map((value) => ComplexDecimal[op](value)));
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Element-wise operation
     * @param op
     * @param left
     * @param right
     * @returns
     */
    public static ewiseOp(
        op: 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'power' | 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne' | 'and' | 'or' | 'xor' | 'mod' | 'rem',
        left: MultiArray,
        right: MultiArray,
    ): MultiArray {
        if (MultiArray.arrayEqual(left.dim.slice(0, 2), right.dim.slice(0, 2))) {
            // left and right has same number of rows and columns
            const result = new MultiArray(left.dim);
            for (let i = 0; i < result.dim[0]; i++) {
                result.array[i] = new Array(result.dim[1]);
                for (let j = 0; j < result.dim[1]; j++) {
                    result.array[i][j] = ComplexDecimal[op](left.array[i][j], right.array[i][j]);
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else if (left.dim[0] === right.dim[0]) {
            // left and right has same number of rows
            let col, matrix;
            if (left.dim[1] === 1) {
                // left has one column
                col = left;
                matrix = right;
            } else if (right.dim[1] === 1) {
                // right has one column
                col = right;
                matrix = left;
            } else {
                throw new Error(`operator ${op}: nonconformant arguments (op1 is ${left.dim[0]}x${left.dim[1]}, op2 is ${right.dim[0]}x${right.dim[1]}).`);
            }
            const result = new MultiArray([col.dim[0], matrix.dim[1]]);
            for (let i = 0; i < col.dim[0]; i++) {
                result.array[i] = new Array(matrix.dim[1]);
                for (let j = 0; j < matrix.dim[1]; j++) {
                    result.array[i][j] = ComplexDecimal[op](col.array[i][0], matrix.array[i][j]);
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else if (left.dim[1] === right.dim[1]) {
            // left and right has same number of columns
            let row, matrix;
            if (left.dim[0] === 1) {
                // left has one row
                row = left;
                matrix = right;
            } else if (right.dim[0] === 1) {
                // right has one row
                row = right;
                matrix = left;
            } else {
                throw new Error(`operator ${op}: non-conforming arguments (op1 is ${left.dim[0]}x${left.dim[1]}, op2 is ${right.dim[0]}x${right.dim[1]}).`);
            }
            const result = new MultiArray([matrix.dim[0], row.dim[1]]);
            for (let i = 0; i < matrix.dim[0]; i++) {
                result.array[i] = new Array(row.dim[1]);
                for (let j = 0; j < row.dim[1]; j++) {
                    result.array[i][j] = ComplexDecimal[op](row.array[0][j], matrix.array[i][j]);
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else if (left.dim[0] === 1 && right.dim[1] === 1) {
            // left has one row and right has one column
            const result = new MultiArray([right.dim[0], left.dim[1]]);
            for (let i = 0; i < right.dim[0]; i++) {
                result.array[i] = new Array(left.dim[1]);
                for (let j = 0; j < left.dim[1]; j++) {
                    result.array[i][j] = ComplexDecimal[op](left.array[0][j], right.array[i][0]);
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else if (left.dim[1] === 1 && right.dim[0] === 1) {
            // left has one column and right has one row
            const result = new MultiArray([left.dim[0], right.dim[1]]);
            for (let i = 0; i < left.dim[0]; i++) {
                result.array[i] = new Array(right.dim[1]);
                for (let j = 0; j < right.dim[1]; j++) {
                    result.array[i][j] = ComplexDecimal[op](left.array[i][0], right.array[0][j]);
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else {
            throw new Error(`operator ${op}: nonconformant arguments (op1 is ${left.dim[0]}x${left.dim[1]}, op2 is ${right.dim[0]}x${right.dim[1]}).`);
        }
    }

    /**
     * Create array of all zeros.
     * @param args
     * @returns
     */
    public static zeros(...args: any): MultiArray | ComplexDecimal {
        if (!args.length) {
            return ComplexDecimal.zero();
        } else if (args.length === 1) {
            if ('re' in args[0]) {
                return new MultiArray([args[0].re.toNumber(), args[0].re.toNumber()], ComplexDecimal.zero());
            } else {
                return new MultiArray(MultiArray.oneRowToDim(args[0]), ComplexDecimal.zero());
            }
        } else {
            return new MultiArray(MultiArray.oneRowToDim(args), ComplexDecimal.zero());
        }
    }

    /**
     * Create array of all ones.
     * @param args
     * @returns
     */
    public static ones(...args: any): MultiArray | ComplexDecimal {
        if (!args.length) {
            return ComplexDecimal.one();
        } else if (args.length === 1) {
            if ('re' in args[0]) {
                return new MultiArray([args[0].re.toNumber(), args[0].re.toNumber()], ComplexDecimal.one());
            } else {
                return new MultiArray(MultiArray.oneRowToDim(args[0]), ComplexDecimal.one());
            }
        } else {
            return new MultiArray(MultiArray.oneRowToDim(args), ComplexDecimal.one());
        }
    }

    /**
     * Identity matrix
     * @param args
     * * `eye(N)` - create identity N x N
     * * `eye(N,M)` - create identity N x M
     * * `eye([N,M])` - create identity N x M
     * @returns Identity matrix
     */
    public static eye(...args: any): MultiArray | ComplexDecimal {
        const result = MultiArray.zeros(...args);
        if (ComplexDecimal.isThis(result)) {
            return ComplexDecimal.one();
        } else {
            for (let n = 0; n < Math.min((result as MultiArray).dim[0], (result as MultiArray).dim[1]); n++) {
                (result as MultiArray).array[n][n] = ComplexDecimal.one();
            }
        }
        return result;
    }

    /**
     * Uniformly distributed random numbers.
     * @param args
     * @returns
     */
    public static rand(...args: any): MultiArray | ComplexDecimal {
        let result: MultiArray;
        if (!args.length) {
            return new ComplexDecimal(Math.random());
        } else if (args.length === 1) {
            if ('re' in args[0]) {
                result = new MultiArray([args[0].re.toNumber(), args[0].re.toNumber()]);
            } else {
                result = new MultiArray(MultiArray.oneRowToDim(args[0]));
            }
        } else {
            result = new MultiArray(MultiArray.oneRowToDim(args));
        }
        for (let i = 0; i < result.dim[0]; i++) {
            result.array[i] = [];
            for (let j = 0; j < result.dim[1]; j++) {
                result.array[i][j] = new ComplexDecimal(Math.random());
            }
        }
        result.type = ComplexDecimal.numberClass.real;
        return result;
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(imax: ComplexDecimal, ...args: any): MultiArray | ComplexDecimal {
        if (imax.re.lt(1)) {
            throw new Error(`randi: require imax >= 1.`);
        }
        if (!imax.re.trunc().eq(imax.re)) {
            throw new Error(`randi: must be integer bounds.`);
        }
        let result: MultiArray;
        const max = Math.trunc(imax.re.toNumber());
        const getRandom = () => {
            return Math.round(max * Math.random());
        };
        if (!args.length) {
            return new ComplexDecimal(getRandom());
        } else if (args.length === 1) {
            if ('re' in args[0]) {
                result = new MultiArray([args[0].re.toNumber(), args[0].re.toNumber()]);
            } else {
                result = new MultiArray(MultiArray.oneRowToDim(args[0]));
            }
        } else {
            result = new MultiArray(MultiArray.oneRowToDim(args));
        }
        for (let i = 0; i < result.dim[0]; i++) {
            result.array[i] = [];
            for (let j = 0; j < result.dim[1]; j++) {
                result.array[i][j] = new ComplexDecimal(getRandom());
            }
        }
        result.type = ComplexDecimal.numberClass.real;
        return result;
    }

    /**
     * Matrix power (multiple multiplication).
     * @param left
     * @param right
     * @returns
     */
    public static power(left: MultiArray, right: ComplexDecimal): MultiArray {
        let temp1;
        if (right.re.isInteger() && right.im.eq(0)) {
            if (right.re.eq(0)) {
                temp1 = MultiArray.eye(new ComplexDecimal(left.dim[0], 0)) as MultiArray;
            } else if (right.re.gt(0)) {
                temp1 = MultiArray.copy(left);
            } else {
                temp1 = MultiArray.inv(left);
            }
            if (Math.abs(right.re.toNumber()) != 1) {
                let temp2 = MultiArray.copy(temp1);
                for (let i = 1; i < Math.abs(right.re.toNumber()); i++) {
                    temp2 = MultiArray.mul(temp2, temp1);
                }
                temp1 = temp2;
            }
            return temp1;
        } else {
            throw new Error(`exponent must be integer real in matrix '^'.`);
        }
    }

    /**
     * Transpose.
     * @param left
     * @returns
     */
    public static transpose(left: MultiArray): MultiArray {
        const result = new MultiArray(left.dim.slice(0, 2).reverse());
        for (let i = 0; i < left.dim[1]; i++) {
            result.array[i] = new Array(left.dim[0]);
            for (let j = 0; j < left.dim[0]; j++) {
                result.array[i][j] = Object.assign({}, left.array[j][i]);
            }
        }
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Complex conjugate transpose.
     * @param left
     * @returns
     */
    public static ctranspose(left: MultiArray): MultiArray {
        const result = new MultiArray(left.dim.slice(0, 2).reverse());
        for (let i = 0; i < left.dim[1]; i++) {
            result.array[i] = new Array(left.dim[0]);
            for (let j = 0; j < left.dim[0]; j++) {
                result.array[i][j] = ComplexDecimal.conj(left.array[j][i]);
            }
        }
        result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return result;
    }

    /**
     * Concatenate arrays horizontally.
     * @param L
     * @param R
     * @returns
     */
    public static horzcat(L: MultiArray, R: MultiArray): MultiArray {
        if (L.dim[0] === R.dim[0]) {
            const temp = new MultiArray([L.dim[0], L.dim[1] + R.dim[1]]);
            for (let i = 0; i < L.dim[0]; i++) {
                temp.array[i] = [];
                for (let j = 0; j < L.dim[1]; j++) {
                    temp.array[i][j] = Object.assign({}, L.array[i][j]);
                }
                for (let j = 0; j < R.dim[1]; j++) {
                    temp.array[i][j + L.dim[1]] = Object.assign({}, R.array[i][j]);
                }
            }
            return temp;
        } else {
            throw new Error(`invalid dimensions in horzcat function.`);
        }
    }

    /**
     * Concatenate arrays vertically.
     * @param U
     * @param D
     * @returns
     */
    public static vertcat(U: MultiArray, D: MultiArray): MultiArray {
        if (U.dim[1] === D.dim[1]) {
            const temp = new MultiArray([U.dim[0] + D.dim[0], U.dim[1]]);
            for (let i = 0; i < U.dim[0]; i++) {
                temp.array[i] = [];
                for (let j = 0; j < U.dim[1]; j++) {
                    temp.array[i][j] = Object.assign({}, U.array[i][j]);
                }
            }
            for (let i = 0; i < D.dim[0]; i++) {
                temp.array[i + U.dim[0]] = [];
                for (let j = 0; j < D.dim[1]; j++) {
                    temp.array[i + U.dim[0]][j] = Object.assign({}, D.array[i][j]);
                }
            }
            temp.type = Math.max(...temp.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return temp;
        } else {
            throw new Error(`invalid dimensions in vertcat function.`);
        }
    }

    /**
     * Minimum (lt) or maximum (gt) elements of array.
     * @param M
     * @returns
     */
    public static minMax(cmp: 'lt' | 'gt', M: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        let temp: MultiArray;
        if ('array' in M) {
            if (M.dim[0] === 1) {
                temp = MultiArray.transpose(M);
            } else {
                temp = M;
            }
            const result = new MultiArray([1, temp.dim[1]]);
            result.array = [new Array(temp.dim[1])];
            if (temp.type === ComplexDecimal.numberClass.complex) {
                for (let j = 0; j < temp.dim[1]; j++) {
                    result.array[0][j] = ComplexDecimal.minMaxArrayComplex(cmp, ...temp.array.map((row) => row[j]));
                }
            } else {
                for (let j = 0; j < temp.dim[1]; j++) {
                    result.array[0][j] = ComplexDecimal.minMaxArrayReal(cmp, ...temp.array.map((row) => row[j]));
                }
            }
            result.type = temp.type;
            if (temp.dim[1] === 1) {
                return result.array[0][0];
            } else {
                return result;
            }
        } else {
            return M;
        }
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: any[]): MultiArray | ComplexDecimal {
        if (args.length !== 1) {
            throw new Error('min: second argument is ignored.');
        }
        return MultiArray.minMax('lt', args[0]);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: any[]): MultiArray | ComplexDecimal {
        if (args.length !== 1) {
            throw new Error('max: second argument is ignored.');
        }
        return MultiArray.minMax('gt', args[0]);
    }

    /**
     * Average or mean value of array.
     * @param M
     * @returns
     */
    public static mean(M: MultiArray | ComplexDecimal): MultiArray | ComplexDecimal {
        if ('array' in M) {
            let temp: MultiArray;
            if (M.dim[0] === 1) {
                temp = MultiArray.transpose(M);
            } else {
                temp = M;
            }
            const result = new MultiArray([1, temp.dim[1]]);
            result.array = [new Array(temp.dim[1])];
            for (let j = 0; j < temp.dim[1]; j++) {
                result.array[0][j] = temp.array[0][j];
                for (let i = 1; i < temp.dim[0]; i++) {
                    result.array[0][j] = ComplexDecimal.add(result.array[0][j], temp.array[i][j]);
                }
                result.array[0][j] = ComplexDecimal.rdiv(result.array[0][j], new ComplexDecimal(temp.dim[0], 0));
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            if (temp.dim[1] === 1) {
                return result.array[0][0];
            } else {
                return result;
            }
        } else {
            return M;
        }
    }

    /**
     * Calculate sum or product of elements along dimension DIM.
     * @param op 'add' for sum or 'mul' for product
     * @param mapper function to apply in each element
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum or product of elements along dimension DIM.
     */
    private static sumprod(op: 'add' | 'mul', mapper: ((value: ComplexDecimal) => ComplexDecimal) | null, M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        if (!mapper) {
            mapper = (value) => value;
        }
        let dim: number;
        if (DIM) {
            dim = MultiArray.testIndexBound(DIM, M.dim.length, M.dim, 'sum');
        } else {
            dim = MultiArray.firstNonSingleDimmension(M);
        }
        let result: MultiArray;
        if (dim === 0) {
            result = new MultiArray([1, M.dim[1]]);
            result.array[0] = new Array(M.dim[1]);
            for (let i = 0; i < M.dim[1]; i++) {
                result.array[0][i] = M.array
                    .map((row) => row[i])
                    .reduce(
                        (accumulator: ComplexDecimal, current: ComplexDecimal): ComplexDecimal => ComplexDecimal[op](accumulator, mapper!(current)),
                        op === 'mul' ? ComplexDecimal.one() : ComplexDecimal.zero(),
                    );
            }
        } else {
            result = new MultiArray([M.dim[0], 1]);
            for (let i = 0; i < M.dim[0]; i++) {
                result.array[i] = [
                    M.array[i].reduce(
                        (accumulator: ComplexDecimal, current: ComplexDecimal): ComplexDecimal => ComplexDecimal[op](accumulator, mapper!(current)),
                        op === 'mul' ? ComplexDecimal.one() : ComplexDecimal.zero(),
                    ),
                ];
            }
        }
        if (result.dim[0] === 1 && result.dim[1] === 1) {
            return result.array[0][0];
        } else {
            return result;
        }
    }

    /**
     * Calculate sum of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of elements along dimension DIM.
     */
    public static sum(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        return MultiArray.sumprod('add', null, M, DIM);
    }

    /**
     * Calculate sum of squares of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of squares of elements along dimension DIM.
     */
    public static sumsq(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        return MultiArray.sumprod('add', (value) => ComplexDecimal.mul(value, ComplexDecimal.conj(value)), M, DIM);
    }

    /**
     * Calculate product of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static prod(M: MultiArray, DIM?: ComplexDecimal): MultiArray | ComplexDecimal {
        return MultiArray.sumprod('mul', null, M, DIM);
    }

    /**
     * Sum of diagonal elements.
     * @param M
     * @returns
     */
    public static trace(M: MultiArray): ComplexDecimal {
        if (M.dim[0] === M.dim[1]) {
            let temp: ComplexDecimal = ComplexDecimal.zero();
            for (let i = 0; i < M.dim[0]; i++) {
                temp = ComplexDecimal.add(temp, M.array[i][i]);
            }
            return temp;
        } else {
            throw new Error(`trace: invalid dimensions.`);
        }
    }

    /**
     * Matrix determinant.
     * @param M
     * @returns
     */
    public static det(M: MultiArray): ComplexDecimal {
        if (M.dim[0] === M.dim[1]) {
            let det = ComplexDecimal.zero();
            if (M.dim[0] === 1) det = M.array[0][0];
            else if (M.dim[0] === 2) det = ComplexDecimal.sub(ComplexDecimal.mul(M.array[0][0], M.array[1][1]), ComplexDecimal.mul(M.array[0][1], M.array[1][0]));
            else {
                det = ComplexDecimal.zero();
                for (let j1 = 0; j1 < M.dim[0]; j1++) {
                    const m = new MultiArray([M.dim[0] - 1, M.dim[0] - 1], ComplexDecimal.zero());
                    for (let i = 1; i < M.dim[0]; i++) {
                        let j2 = 0;
                        for (let j = 0; j < M.dim[0]; j++) {
                            if (j === j1) continue;
                            m.array[i - 1][j2] = M.array[i][j];
                            j2++;
                        }
                    }
                    det = ComplexDecimal.add(det, ComplexDecimal.mul(new ComplexDecimal(Math.pow(-1, 2.0 + j1), 0), ComplexDecimal.mul(M.array[0][j1], MultiArray.det(m))));
                }
            }
            return det;
        } else {
            throw new Error(`det: A must be a square matrix.`);
        }
    }

    /**
     * Matrix inverse.
     * @param M
     * @returns
     */
    public static inv(M: MultiArray): MultiArray {
        // Returns the inverse of matrix `M`.
        // from http://blog.acipo.com/matrix-inversion-in-javascript/
        // I use Guassian Elimination to calculate the inverse:
        // (1) 'augment' the matrix (left) by the identity (on the right)
        // (2) Turn the matrix on the left into the identity by elemetry row ops
        // (3) The matrix on the right is the inverse (was the identity matrix)
        // There are 3 elemtary row ops: (I combine b and c in my code)
        // (a) Swap 2 rows
        // (b) Multiply a row by a scalar
        // (c) Add 2 rows

        //if the matrix isn't square: exit (error)
        if (M.dim[0] === M.dim[1]) {
            //create the identity matrix (I), and a copy (C) of the original
            let i = 0,
                ii = 0,
                j = 0,
                e = ComplexDecimal.zero();
            const dim = M.dim[0];
            const I: ComplexDecimal[][] = [],
                C: any[][] = [];
            for (i = 0; i < dim; i += 1) {
                // Create the row
                I[I.length] = [];
                C[C.length] = [];
                for (j = 0; j < dim; j += 1) {
                    //if we're on the diagonal, put a 1 (for identity)
                    if (i === j) {
                        I[i][j] = ComplexDecimal.one();
                    } else {
                        I[i][j] = ComplexDecimal.zero();
                    }
                    // Also, make the copy of the original
                    C[i][j] = M.array[i][j];
                }
            }

            // Perform elementary row operations
            for (i = 0; i < dim; i += 1) {
                // get the element e on the diagonal
                e = C[i][i];

                // if we have a 0 on the diagonal (we'll need to swap with a lower row)
                if (e.re.eq(0) && e.im.eq(0)) {
                    //look through every row below the i'th row
                    for (ii = i + 1; ii < dim; ii += 1) {
                        //if the ii'th row has a non-0 in the i'th col
                        if (!C[ii][i].re.eq(0) && !C[ii][i].im.eq(0)) {
                            //it would make the diagonal have a non-0 so swap it
                            for (j = 0; j < dim; j++) {
                                e = C[i][j]; //temp store i'th row
                                C[i][j] = C[ii][j]; //replace i'th row by ii'th
                                C[ii][j] = e; //repace ii'th by temp
                                e = I[i][j]; //temp store i'th row
                                I[i][j] = I[ii][j]; //replace i'th row by ii'th
                                I[ii][j] = e; //repace ii'th by temp
                            }
                            //don't bother checking other rows since we've swapped
                            break;
                        }
                    }
                    //get the new diagonal
                    e = C[i][i];
                    //if it's still 0, not invertable (error)
                    if (e.re.eq(0) && e.im.eq(0)) {
                        return new MultiArray([M.dim[0], M.dim[1]], ComplexDecimal.inf_0());
                    }
                }

                // Scale this row down by e (so we have a 1 on the diagonal)
                for (j = 0; j < dim; j++) {
                    C[i][j] = ComplexDecimal.rdiv(C[i][j], e); //apply to original matrix
                    I[i][j] = ComplexDecimal.rdiv(I[i][j], e); //apply to identity
                }

                // Subtract this row (scaled appropriately for each row) from ALL of
                // the other rows so that there will be 0's in this column in the
                // rows above and below this one
                for (ii = 0; ii < dim; ii++) {
                    // Only apply to other rows (we want a 1 on the diagonal)
                    if (ii === i) {
                        continue;
                    }

                    // We want to change this element to 0
                    e = C[ii][i];

                    // Subtract (the row above(or below) scaled by e) from (the
                    // current row) but start at the i'th column and assume all the
                    // stuff left of diagonal is 0 (which it should be if we made this
                    // algorithm correctly)
                    for (j = 0; j < dim; j++) {
                        C[ii][j] = ComplexDecimal.sub(C[ii][j], ComplexDecimal.mul(e, C[i][j])); //apply to original matrix
                        I[ii][j] = ComplexDecimal.sub(I[ii][j], ComplexDecimal.mul(e, I[i][j])); //apply to identity
                    }
                }
            }

            //we've done all operations, C should be the identity
            //matrix I should be the inverse:
            const result = new MultiArray(M.dim);
            result.array = I;
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else {
            throw new Error(`inverse: A must be a square matrix.`);
        }
    }

    /**
     * Compute the minor of a matrix.
     * @param M Matrix.
     * @param p Line.
     * @param q Column.
     * @returns
     */
    public static minor(M: MultiArray, p: ComplexDecimal, q: ComplexDecimal): MultiArray {
        // minor of matrix (remove line and column)
        const temp = MultiArray.copy(M);
        temp.array.splice(p.re.toNumber() - 1, 1);
        for (let i = 0; i < M.dim[0] - 1; i++) {
            temp.array[i].splice(q.re.toNumber() - 1, 1);
        }
        temp.dim[0]--;
        temp.dim[1]--;
        return temp;
    }

    /**
     * Compute the matrix of cofactors.
     * @param M
     * @returns
     */
    public static cofactor(M: MultiArray): MultiArray {
        const temp = new MultiArray([M.dim[0], M.dim[1]], ComplexDecimal.zero());
        for (let i = 0; i < M.dim[0]; i++) {
            for (let j = 0; j < M.dim[1]; j++) {
                const minor = MultiArray.minor(M, new ComplexDecimal(i + 1, 0), new ComplexDecimal(j + 1, 0));
                let sign: ComplexDecimal;
                if ((i + j) % 2 === 0) {
                    sign = ComplexDecimal.one();
                } else {
                    sign = ComplexDecimal.minusone();
                }
                temp.array[i][j] = ComplexDecimal.mul(sign, MultiArray.det(minor));
            }
        }
        temp.type = Math.max(...temp.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return temp;
    }

    /**
     * Compute the adjugate (adjoint) matrix for a square matrix.
     * @param M
     * @returns
     */
    public static adj(M: MultiArray): MultiArray {
        return MultiArray.ctranspose(MultiArray.cofactor(M));
    }

    public static pivot(M: MultiArray): MultiArray {
        const n = M.dim[0];
        const id = MultiArray.eye(new ComplexDecimal(n, 0)) as MultiArray;
        for (let i = 0; i < n; i++) {
            let maxm = ComplexDecimal.abs(M.array[i][i]);
            let row = i;
            for (let j = i; j < n; j++)
                if (ComplexDecimal.abs(M.array[j][i]).re.gt(maxm.re)) {
                    maxm = ComplexDecimal.abs(M.array[j][i]);
                    row = j;
                }
            if (i != row) {
                const tmp = id.array[i];
                id.array[i] = id.array[row];
                id.array[row] = tmp;
            }
        }
        return id;
    }

    /**
     * Gaussian elimination algorithm for solving systems of linear equations.
     * Adapted from: https://github.com/itsravenous/gaussian-elimination
     * ## References
     * * https://mathworld.wolfram.com/GaussianElimination.html
     * @param M
     * @param x
     * @returns
     */
    public static gauss(M: MultiArray, x: MultiArray): MultiArray | undefined {
        if (M.dim[0] != M.dim[1]) throw new Error(`invalid dimensions in function gauss.`);
        const A: MultiArray = MultiArray.copy(M);
        let i: number, k: number, j: number;
        const DMin = Math.min(x.dim[0], x.dim[1]);
        if (DMin === x.dim[1]) {
            x = MultiArray.transpose(x);
        }

        // Just make a single matrix
        for (i = 0; i < A.dim[0]; i++) {
            A.array[i].push(x.array[0][i]);
        }
        const n = A.dim[0];

        for (i = 0; i < n; i++) {
            // Search for maximum in this column
            let maxEl = ComplexDecimal.abs(A.array[i][i]),
                maxRow = i;
            for (k = i + 1; k < n; k++) {
                if (ComplexDecimal.abs(A.array[k][i]).re.gt(maxEl.re)) {
                    maxEl = ComplexDecimal.abs(A.array[k][i]);
                    maxRow = k;
                }
            }

            // Swap maximum row with current row (column by column)
            for (k = i; k < n + 1; k++) {
                const tmp = A.array[maxRow][k];
                A.array[maxRow][k] = A.array[i][k];
                A.array[i][k] = tmp;
            }

            // Make all rows below this one 0 in current column
            for (k = i + 1; k < n; k++) {
                const c = ComplexDecimal.rdiv(ComplexDecimal.neg(A.array[k][i]), A.array[i][i]);
                for (j = i; j < n + 1; j++) {
                    if (i === j) {
                        A.array[k][j] = ComplexDecimal.zero();
                    } else {
                        A.array[k][j] = ComplexDecimal.add(A.array[k][j], ComplexDecimal.mul(c, A.array[i][j]));
                    }
                }
            }
        }

        // Solve equation Ax=b for an upper triangular matrix A
        const X = new MultiArray([1, n], ComplexDecimal.zero());
        for (i = n - 1; i > -1; i--) {
            X.array[0][i] = ComplexDecimal.rdiv(A.array[i][n], A.array[i][i]);
            for (k = i - 1; k > -1; k--) {
                A.array[k][n] = ComplexDecimal.sub(A.array[k][n], ComplexDecimal.mul(A.array[k][i], X.array[0][i]));
            }
        }
        X.type = Math.max(...X.array.map((row) => ComplexDecimal.maxNumberType(...row)));
        return X;
    }

    static lu_chatgpt(matrix: MultiArray): { P: MultiArray; L: MultiArray; U: MultiArray } {
        const n = matrix.dim[0]; // Size of the square matrix
        const L = MultiArray.eye(new ComplexDecimal(n)) as MultiArray; // Initialize the lower triangular matrix as an identity matrix
        const U = MultiArray.copy(matrix); // Initialize the upper triangular matrix with input
        const P = MultiArray.eye(new ComplexDecimal(n)) as MultiArray; // Initialize the permutation matrix as an identity matrix

        for (let k = 0; k < n; k++) {
            // Find the pivot element and its row index in the k-th column
            let maxVal = ComplexDecimal.abs(U.array[k][k]);
            let maxIdx = k;

            for (let i = k + 1; i < n; i++) {
                const absVal = ComplexDecimal.abs(U.array[i][k]);
                if (ComplexDecimal.gt(absVal, maxVal)) {
                    maxVal = absVal;
                    maxIdx = i;
                }
            }

            // Swap rows in U and P if needed
            if (maxIdx !== k) {
                MultiArray.swapRows(U, k, maxIdx);
                MultiArray.swapRows(P, k, maxIdx);
            }

            for (let i = k + 1; i < n; i++) {
                // Compute the multiplier for the row transformation and store it in L
                const multiplier = ComplexDecimal.rdiv(U.array[i][k], U.array[k][k]);
                L.array[i][k] = multiplier;

                // Update the elements in the lower part of U
                for (let j = k; j < n; j++) {
                    U.array[i][j] = ComplexDecimal.sub(U.array[i][j], ComplexDecimal.mul(multiplier, U.array[k][j]));
                }
            }
        }
        return EvaluatorPointer.nodeReturnList((length: number, index: number): any => {
            if (length === 1) {
                return U;
            } else {
                switch (index) {
                    case 0:
                        return L;
                    case 1:
                        return U;
                    case 2:
                        return P;
                }
            }
        });
    }

    /**
     * PLU matrix factorization
     * @param M
     * @returns
     */
    public static lu(M: MultiArray): any {
        // https://www.codeproject.com/Articles/1203224/A-Note-on-PA-equals-LU-in-Javascript
        // https://rosettacode.org/wiki/LU_decomposition#JavaScript
        if (M.dim[0] !== M.dim[1]) {
            throw new Error(`PLU decomposition can only be applied to square matrices.`);
        }

        const n = M.dim[0]; // Size of the square matrix

        // Initialize P as an identity matrix with the appropriate dimensions
        const P = MultiArray.eye(new ComplexDecimal(n)) as MultiArray;

        // Initialize L as an identity matrix with the same dimensions as the input matrix
        const L = MultiArray.eye(new ComplexDecimal(n)) as MultiArray;

        // Initialize U as a copy of the input matrix
        const U = MultiArray.copy(M);

        for (let k = 0; k < n; k++) {
            // Find the pivot element (maximum absolute value) in the current column
            let maxVal = ComplexDecimal.abs(U.array[k][k]);
            let maxIdx = k;

            for (let i = k + 1; i < n; i++) {
                const absVal = ComplexDecimal.abs(U.array[i][k]);
                if (ComplexDecimal.gt(absVal, maxVal)) {
                    maxVal = absVal;
                    maxIdx = i;
                }
            }

            // Swap rows in P, L, and U if needed
            if (maxIdx !== k) {
                MultiArray.swapRows(P, k, maxIdx);
                for (let j = 0; j < k; j++) {
                    const temp = L.array[k][j];
                    L.array[k][j] = L.array[maxIdx][j];
                    L.array[maxIdx][j] = temp;
                }
                MultiArray.swapRows(U, k, maxIdx);
            }

            for (let i = k + 1; i < n; i++) {
                // Compute the multiplier
                const multiplier = ComplexDecimal.rdiv(U.array[i][k], U.array[k][k]);

                // Update L and U
                (L as MultiArray).array[i][k] = multiplier;
                for (let j = k; j < n; j++) {
                    U.array[i][j] = ComplexDecimal.sub(U.array[i][j], ComplexDecimal.mul(multiplier, U.array[k][j]));
                }
            }
        }
        return EvaluatorPointer.nodeReturnList((length: number, index: number): any => {
            if (length === 1) {
                return U;
            } else {
                switch (index) {
                    case 0:
                        return L;
                    case 1:
                        return U;
                    case 2:
                        return P;
                }
            }
        });
    }

    /**
     * QR matrix factorization
     * @param M
     * @returns
     */
    public static qr(M: MultiArray): any {
        const m = M.dim[0]; // Number of rows
        const n = M.dim[1]; // Number of columns

        // Initialize Q as an identity matrix with dimensions (m x m)
        const Q = MultiArray.eye(new ComplexDecimal(m)) as MultiArray;

        // Copy the input matrix to R
        const R = MultiArray.copy(M);

        for (let k = 0; k < Math.min(m, n); k++) {
            // Find the pivot element (maximum absolute value) in the current column
            let maxVal = ComplexDecimal.abs(R.array[k][k]);
            let maxIdx = k;

            for (let i = k + 1; i < m; i++) {
                const absVal = ComplexDecimal.abs(R.array[i][k]);
                if (ComplexDecimal.gt(absVal, maxVal)) {
                    maxVal = absVal;
                    maxIdx = i;
                }
            }

            // Swap rows in Q, and R if needed
            if (maxIdx !== k) {
                MultiArray.swapRows(Q, k, maxIdx);
                MultiArray.swapRows(R, k, maxIdx);
            }

            // Compute the norm of the k-th column in R
            let norm = ComplexDecimal.zero();
            for (let i = k; i < m; i++) {
                norm = ComplexDecimal.add(norm, ComplexDecimal.mul(R.array[i][k], R.array[i][k]));
            }
            norm = ComplexDecimal.sqrt(norm);

            // if (Boolean(ComplexDecimal.eq(norm, ComplexDecimal.zero()).re)) {
            // If the norm is zero, the matrix is rank deficient, and we can't proceed
            // throw new Error(`Matrix is rank deficient, QR decomposition cannot be completed.`);
            // }

            // Compute the sign of the first element in the k-th column
            const sign = ComplexDecimal.rdiv(R.array[k][k], norm);

            // Update the first element in the k-th column with the sign and norm
            R.array[k][k] = ComplexDecimal.mul(sign, norm);

            // Update the corresponding element in Q to make it orthogonal
            for (let i = k + 1; i < m; i++) {
                Q.array[i][k] = ComplexDecimal.rdiv(R.array[i][k], norm);
            }

            // Update the remaining elements in R and Q
            for (let j = k + 1; j < n; j++) {
                let dotProduct = ComplexDecimal.zero();
                for (let i = k; i < m; i++) {
                    dotProduct = ComplexDecimal.add(dotProduct, ComplexDecimal.mul(ComplexDecimal.conj(Q.array[i][k]), R.array[i][j]));
                }
                for (let i = k; i < m; i++) {
                    R.array[i][j] = ComplexDecimal.sub(R.array[i][j], ComplexDecimal.mul(Q.array[i][k], dotProduct));
                }
            }
        }
        return EvaluatorPointer.nodeOp('*', Q, R);
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
                if (length === 1) {
                    return IND;
                } else {
                    const dims = 're' in DIMS ? MultiArray.numberToMatrix(DIMS) : DIMS;
                    const ind = 're' in IND ? MultiArray.numberToMatrix(IND) : IND;
                    if (dims.type > 1 || ind.type > 1) {
                        throw new Error(`ind2sub: invalid index: subscripts must be either positive integers or logicals`);
                    }
                    let result;
                    switch (index) {
                        case 0:
                            result = MultiArray.map(ind, (value: ComplexDecimal) =>
                                ComplexDecimal.add(ComplexDecimal.mod(ComplexDecimal.sub(value, ComplexDecimal.one()), dims.array[0][0]), ComplexDecimal.one()),
                            );
                            break;
                        case 1:
                            result = MultiArray.map(ind, (value: ComplexDecimal) =>
                                ComplexDecimal.fix(
                                    ComplexDecimal.add(ComplexDecimal.rdiv(ComplexDecimal.sub(value, ComplexDecimal.one()), dims.array[0][0]), ComplexDecimal.one()),
                                ),
                            );
                            break;
                        default:
                            result = MultiArray.ones(ind.dim.map((value: number) => new ComplexDecimal(value)));
                            break;
                    }
                    return MultiArray.matrixToNumber(result);
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
