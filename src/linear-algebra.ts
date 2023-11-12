import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';

/**
 * # LinearAlgebra
 *
 * LinearAlgebra abstract class. Implements static methods related to linear algebra operations and algorithms.
 *
 * ## References
 *
 * * [Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/LinearAlgebra.html)
 * * [Fundamental Theorem of Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/FundamentalTheoremofLinearAlgebra.html)
 * * [Linear algebra at Wikipedia](https://en.wikipedia.org/wiki/Linear_algebra)
 */
export abstract class LinearAlgebra {
    /**
     * LinearAlgebra class methods.
     */
    public static functions: { [name: string]: Function } = {
        trace: LinearAlgebra.trace,
        transpose: LinearAlgebra.transpose,
        ctranspose: LinearAlgebra.ctranspose,
        mul: LinearAlgebra.mul,
        det: LinearAlgebra.det,
        inv: LinearAlgebra.inv,
        gauss: LinearAlgebra.gauss,
        lu: LinearAlgebra.lu,
    };

    /**
     * Sum of diagonal elements.
     * @param M Matrix.
     * @returns Trace of matrix.
     */
    public static trace(M: MultiArray): ComplexDecimal {
        if (M.dimension.length === 1) {
            return M.array.map((row, i) => (row[i] ? row[i] : ComplexDecimal.zero())).reduce((p, c) => ComplexDecimal.add(p, c), ComplexDecimal.zero());
        } else {
            throw new Error('trace: only valid on 2-D objects');
        }
    }

    /**
     * Transpose and apply function.
     * @param M Matrix.
     * @returns Transpose matrix with `func` applied to each element.
     */
    private static applyTranspose(M: MultiArray, func: Function = (value: any) => value): MultiArray {
        if (M.dimension.length === 1) {
            const result = new MultiArray([M.column, M.dimension[0]]);
            for (let i = 0; i < M.column; i++) {
                result.array[i] = new Array(M.dimension[0]);
                for (let j = 0; j < M.dimension[0]; j++) {
                    result.array[i][j] = Object.assign({}, func(M.array[j][i]));
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else {
            throw new Error('transpose not defined for N-D objects');
        }
    }

    /**
     * Transpose.
     * @param M Matrix.
     * @returns Transpose matrix.
     */
    public static transpose(M: MultiArray): MultiArray {
        return LinearAlgebra.applyTranspose(M);
    }

    /**
     * Complex conjugate transpose.
     * @param M Matrix.
     * @returns Complex conjugate transpose matrix.
     */
    public static ctranspose(M: MultiArray): MultiArray {
        return LinearAlgebra.applyTranspose(M, (value: any) => ComplexDecimal.conj(value));
    }

    /**
     * Matrix product.
     * @param left Matrix.
     * @param right Matrix.
     * @returns left * right.
     */
    public static mul(left: MultiArray, right: MultiArray): MultiArray {
        if (left.column !== right.dimension[0] && left.dimension.length === 1 && right.dimension.length === 1) {
            throw new Error(`operator *: nonconformant arguments (op1 is ${left.dimension[0]}x${left.column}, op2 is ${right.dimension[0]}x${right.column}).`);
        } else {
            const result = new MultiArray([left.dimension[0], right.column]);
            for (let i = 0; i < left.dimension[0]; i++) {
                result.array[i] = new Array(right.column).fill(ComplexDecimal.zero());
                for (let j = 0; j < right.column; j++) {
                    for (let n = 0; n < left.column; n++) {
                        result.array[i][j] = ComplexDecimal.add(result.array[i][j], ComplexDecimal.mul(left.array[i][n], right.array[n][j]));
                    }
                }
            }
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        }
    }

    /**
     * Matrix determinant.
     * @param M Matrix.
     * @returns Matrix determinant.
     */
    public static det(M: MultiArray): ComplexDecimal {
        if (M.dimension[0] === M.column && M.dimension.length === 1) {
            const n = M.column;
            let det = ComplexDecimal.zero();
            if (n === 1) det = M.array[0][0];
            else if (n === 2) det = ComplexDecimal.sub(ComplexDecimal.mul(M.array[0][0], M.array[1][1]), ComplexDecimal.mul(M.array[0][1], M.array[1][0]));
            else {
                det = ComplexDecimal.zero();
                for (let j1 = 0; j1 < n; j1++) {
                    const m = new MultiArray([n - 1, n - 1], ComplexDecimal.zero());
                    for (let i = 1; i < n; i++) {
                        let j2 = 0;
                        for (let j = 0; j < n; j++) {
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
            throw new Error('det: matrix must be square.');
        }
    }

    /**
     * Returns the inverse of matrix `M`.
     * Source: http://blog.acipo.com/matrix-inversion-in-javascript/
     * This method uses Guassian Elimination to calculate the inverse:
     * (1) 'Augment' the matrix (M) by the identity (on the right).
     * (2) Turn the matrix on the M into the identity by elemetry row ops.
     * (3) The matrix on the right is the inverse (was the identity matrix).
     * There are 3 elemtary row ops: (b and c are combined in the code).
     * (a) Swap 2 rows.
     * (b) Multiply a row by a scalar.
     * (c) Add 2 rows.
     * @param M Matrix.
     * @returns Inverted matrix.
     */
    public static inv(M: MultiArray): MultiArray {
        // if the matrix isn't square: exit (error)
        if (M.dimension[0] === M.column && M.dimension.length === 1) {
            // create the identity matrix (I), and a copy (C) of the original
            let i = 0,
                ii = 0,
                j = 0,
                e = ComplexDecimal.zero();
            const numRows = M.dimension[0];
            const I: ComplexDecimal[][] = [],
                C: any[][] = [];
            for (i = 0; i < numRows; i += 1) {
                // Create the row
                I[I.length] = [];
                C[C.length] = [];
                for (j = 0; j < numRows; j += 1) {
                    // if we're on the diagonal, put a 1 (for identity)
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
            for (i = 0; i < numRows; i += 1) {
                // get the element e on the diagonal
                e = C[i][i];

                // if we have a 0 on the diagonal (we'll need to swap with a lower row)
                if (e.re.eq(0) && e.im.eq(0)) {
                    // look through every row below the i'th row
                    for (ii = i + 1; ii < numRows; ii += 1) {
                        // if the ii'th row has a non-0 in the i'th col
                        if (!C[ii][i].re.eq(0) && !C[ii][i].im.eq(0)) {
                            //it would make the diagonal have a non-0 so swap it
                            for (j = 0; j < numRows; j++) {
                                e = C[i][j]; // temp store i'th row
                                C[i][j] = C[ii][j]; // replace i'th row by ii'th
                                C[ii][j] = e; // replace ii'th by temp
                                e = I[i][j]; // temp store i'th row
                                I[i][j] = I[ii][j]; // replace i'th row by ii'th
                                I[ii][j] = e; // replace ii'th by temp
                            }
                            // don't bother checking other rows since we've swapped
                            break;
                        }
                    }
                    // get the new diagonal
                    e = C[i][i];
                    // if it's still 0, not invertable (error)
                    if (e.re.eq(0) && e.im.eq(0)) {
                        return new MultiArray([M.dimension[0], M.column], ComplexDecimal.inf_0());
                    }
                }

                // Scale this row down by e (so we have a 1 on the diagonal)
                for (j = 0; j < numRows; j++) {
                    C[i][j] = ComplexDecimal.rdiv(C[i][j], e); //apply to original matrix
                    I[i][j] = ComplexDecimal.rdiv(I[i][j], e); //apply to identity
                }

                // Subtract this row (scaled appropriately for each row) from ALL of
                // the other rows so that there will be 0's in this column in the
                // rows above and below this one
                for (ii = 0; ii < numRows; ii++) {
                    // Only apply to other rows (we want a 1 on the diagonal)
                    if (ii === i) {
                        continue;
                    }

                    // We want to change this element to 0
                    e = C[ii][i];

                    // Subtract (the row above(or below) scaled by e) from (the
                    // current row) but start at the i'th column and assume all the
                    // stuff M of diagonal is 0 (which it should be if we made this
                    // algorithm correctly)
                    for (j = 0; j < numRows; j++) {
                        C[ii][j] = ComplexDecimal.sub(C[ii][j], ComplexDecimal.mul(e, C[i][j])); // apply to original matrix
                        I[ii][j] = ComplexDecimal.sub(I[ii][j], ComplexDecimal.mul(e, I[i][j])); // apply to identity
                    }
                }
            }

            // we've done all operations, C should be the identity
            // matrix I should be the inverse:
            const result = new MultiArray([M.dimension[0], M.column]);
            result.array = I;
            result.type = Math.max(...result.array.map((row) => ComplexDecimal.maxNumberType(...row)));
            return result;
        } else {
            throw new Error('inv: matrix must be square.');
        }
    }

    /**
     * Gaussian elimination algorithm for solving systems of linear equations.
     * Adapted from: https://github.com/itsravenous/gaussian-elimination
     * ## References
     * * https://mathworld.wolfram.com/GaussianElimination.html
     * @param M Matrix.
     * @param m Vector.
     * @returns Solution of linear system.
     */
    public static gauss(M: MultiArray, m: MultiArray): MultiArray {
        if (M.dimension[0] !== M.column || M.dimension.length !== 1) throw new Error(`invalid dimensions in function gauss.`);
        const A: MultiArray = MultiArray.copy(M);
        let i: number, k: number, j: number;
        const DMin = Math.min(m.dimension[0], m.column);
        if (DMin === m.column) {
            m = MultiArray.transpose(m);
        }

        // Just make a single matrix
        for (i = 0; i < A.dimension[0]; i++) {
            A.array[i].push(m.array[0][i]);
        }
        const n = A.dimension[0];

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

        // Solve equation Mx=m for an upper triangular matrix M
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

    /**
     * PLU matrix factorization.
     * @param M Matrix.
     * @returns L, U and P matrices as multiple output.
     * ## References
     * * https://www.codeproject.com/Articles/1203224/A-Note-on-PA-equals-LU-in-Javascript
     * * https://rosettacode.org/wiki/LU_decomposition#JavaScript
     */
    public static lu(M: MultiArray): any {
        if (M.dimension[0] !== M.column) {
            throw new Error(`PLU decomposition can only be applied to square matrices.`);
        }

        const n = M.dimension[0]; // Size of the square matrix

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
}
