/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import { constantsTable } from './constantsTable';
import { substSymbol } from './substSymbol';
import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { MultiArray } from './MultiArray';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, MathOperation } from './MathOperation';
import { Configuration } from './Configuration';
import * as AST from './AST';
import { Parser } from './Parser';

/**
 * aliasNameTable type.
 */
export type TAliasNameTable = Record<string, RegExp>;

/**
 * baseFunctionTable type.
 */
export type TBaseFunctionTableEntry = {
    mapper?: boolean;
    ev: boolean[];
    func: Function;
    unparserMathML?: (tree: AST.NodeInput) => string;
};
export type TBaseFunctionTable = Record<string, TBaseFunctionTableEntry>;

/**
 * nameTable type.
 */
export type TNameTableEntry = {
    args: Array<AST.NodeIdentifier>;
    expr: AST.NodeExpr;
};
export type TNameTable = Record<string, TNameTableEntry>;

/**
 * commandWordListTable type.
 */
export type TCommandWordListFunction = (...args: string[]) => void;
export type TCommandWordListTableEntry = {
    func: TCommandWordListFunction;
};
export type TCommandWordListTable = Record<string, TCommandWordListTableEntry>;

/**
 * TEvaluatorConfig type.
 */
export type TEvaluatorConfig = {
    aliasTable?: TAliasNameTable;
    externalFunctionTable?: TBaseFunctionTable;
    externalCmdWListTable?: TCommandWordListTable;
};

export type IncDecOperator = (tree: AST.NodeIdentifier) => MathObject;

/**
 * External parser declarations (defined in parser body)
 */
declare global {
    /* eslint-disable-next-line  no-var */
    var EvaluatorPointer: Evaluator;
}

/**
 * Evaluator object.
 * It is implemented as a class but cannot be instantiated more than one time
 * simultaneously. Instance is given by `Evaluator.initialize` static method
 * or global variable global.EvaluatorPointer.
 */
export class Evaluator {
    /**
     * After run Parser or Evaluate method, the exitStatus property will contains
     * exit state of method.
     */
    public response = {
        EXTERNAL: -2,
        WARNING: -1,
        OK: 0,
        LEX_ERROR: 1,
        PARSER_ERROR: 2,
        EVAL_ERROR: 3,
    };

    /**
     * Debug flag, setter and getter.
     */
    private _debug: boolean = false;

    public get debug(): boolean {
        return this._debug;
    }

    public set debug(value: boolean) {
        this._debug = value;
    }

    /**
     * Native name table. It's inserted in nameTable when
     * `Evaluator.initialize` executed.
     */
    private readonly nativeNameTable: Record<string, ComplexDecimal> = {
        false: ComplexDecimal.false(),
        true: ComplexDecimal.true(),
        i: ComplexDecimal.onei(),
        I: ComplexDecimal.onei(),
        j: ComplexDecimal.onei(),
        J: ComplexDecimal.onei(),
        e: ComplexDecimal.e(),
        pi: ComplexDecimal.pi(),
        inf: ComplexDecimal.inf_0(),
        Inf: ComplexDecimal.inf_0(),
        nan: ComplexDecimal.NaN_0(),
        NaN: ComplexDecimal.NaN_0(),
    };

    /**
     * Name table.
     */
    public nameTable: TNameTable = {};

    public readonlyNameTable: string[] = [];

    /**
     * Alias table.
     */
    private aliasTable: TAliasNameTable;

    /**
     * Base function table.
     */
    public baseFunctionTable: TBaseFunctionTable = {};

    /**
     * Get a list of names of defined functions in baseFunctionTable.
     */
    public get baseFunctionList(): string[] {
        return Object.keys(this.baseFunctionTable);
    }

    /**
     * Local table.
     */
    public localTable: Record<string, AST.NodeInput> = {};

    /**
     * Command word list table.
     */
    public commandWordListTable: TCommandWordListTable = {};

    /**
     * Evaluator exit status.
     */
    public exitStatus: number;

    /**
     * Increment and decrement operator
     * @param pre `true` if prefixed. `false` if postfixed.
     * @param operation Operation (`'plus'` or `'minus'`).
     * @returns Operator function with signature `(tree: AST.NodeIdentifier) => MathObject`.
     */
    private incDecOp(pre: boolean, operation: 'plus' | 'minus'): IncDecOperator {
        if (pre) {
            return (tree: AST.NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (this.nameTable[tree.id].expr) {
                        this.nameTable[tree.id].expr = MathOperation[operation](this.nameTable[tree.id].expr, ComplexDecimal.one());
                        return this.nameTable[tree.id].expr;
                    } else {
                        throw new EvalError('in x++ or ++x, x must be defined first.');
                    }
                } else {
                    throw new SyntaxError(`invalid ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        } else {
            return (tree: AST.NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    if (this.nameTable[tree.id].expr) {
                        const value = MathOperation.copy(this.nameTable[tree.id].expr);
                        this.nameTable[tree.id].expr = MathOperation[operation](this.nameTable[tree.id].expr, ComplexDecimal.one());
                        return value;
                    } else {
                        throw new EvalError('in x++ or ++x, x must be defined first.');
                    }
                } else {
                    throw new SyntaxError(`invalid ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        }
    }

    /**
     * Operator table.
     */
    private readonly opTable: Record<string, MathOperationType | IncDecOperator> = {
        '+': MathOperation.plus,
        '-': MathOperation.minus,
        '.*': MathOperation.times,
        '*': MathOperation.mtimes,
        './': MathOperation.rdivide,
        '/': MathOperation.mrdivide,
        '.\\': MathOperation.ldivide,
        '\\': MathOperation.mldivide,
        '.^': MathOperation.power,
        '^': MathOperation.mpower,
        '+_': MathOperation.uplus,
        '-_': MathOperation.uminus,
        ".'": MathOperation.transpose,
        "'": MathOperation.ctranspose,
        '<': MathOperation.lt,
        '<=': MathOperation.le,
        '==': MathOperation.eq,
        '>=': MathOperation.ge,
        '>': MathOperation.gt,
        '!=': MathOperation.ne,
        '&': MathOperation.and,
        '|': MathOperation.or,
        '!': MathOperation.not,
        '&&': MathOperation.mand,
        '||': MathOperation.mor,
        '++_': this.incDecOp(true, 'plus'),
        '--_': this.incDecOp(true, 'minus'),
        '_++': this.incDecOp(false, 'plus'),
        '_--': this.incDecOp(false, 'minus'),
    };

    /**
     * User functions.
     */
    private readonly functions: Record<string, Function> = {
        unparse: (tree: AST.NodeInput): CharString => new CharString(EvaluatorPointer.Unparse(tree)),
    };

    /**
     * Local methods.
     */
    public readonly unparseString = CharString.unparse;
    public readonly unparseStringMathML = CharString.unparseMathML;
    public readonly newNumber = ComplexDecimal.newThis;
    public readonly unparseNumber = ComplexDecimal.unparse;
    public readonly unparseNumberMathML = ComplexDecimal.unparseMathML;
    public readonly isRowVector = MultiArray.isRowVector;
    public readonly unparseArray = MultiArray.unparse;
    public readonly unparseArrayMathML = MultiArray.unparseMathML;
    public readonly evaluateArray = MultiArray.evaluate;
    public readonly mapArray = MultiArray.rawMap;
    public readonly getElements = MultiArray.getElements;
    public readonly getElementsLogical = MultiArray.getElementsLogical;
    public readonly setElements = MultiArray.setElements;
    public readonly setElementsLogical = MultiArray.setElementsLogical;
    public readonly expandRange = MultiArray.expandRange;
    public readonly array0x0 = MultiArray.emptyArray;
    public readonly linearize = MultiArray.linearize;
    public readonly scalarToArray = MultiArray.scalarToMultiArray;
    public readonly linearLength = MultiArray.linearLength;
    public readonly getDimension = MultiArray.getDimension;
    public readonly toLogical = MultiArray.toLogical;

    public readonly parser = new Parser();
    public readonly Parse = this.parser.parse;

    /**
     * Special functions MathML unparser.
     */
    private readonly unparseMathMLFunctions: Record<string, (tree: AST.NodeInput) => string> = {
        abs: (tree: AST.NodeInput) => '<mrow><mo>|</mo>' + this.unparserMathML(tree.args[0]) + '<mo>|</mo></mrow>',
        conj: (tree: AST.NodeInput) => '<mover><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow><mo>&OverBar;</mo></mover>',
        sqrt: (tree: AST.NodeInput) => '<msqrt><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow></msqrt>',
        root: (tree: AST.NodeInput) => '<mroot><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow><mrow>' + this.unparserMathML(tree.args[1]) + '</mrow></mroot>',
        exp: (tree: AST.NodeInput) => '<msup><mi>e</mi><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow></msup>',
        logb: (tree: AST.NodeInput) => '<msub><mi>log</mi><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow></msub><mrow>' + this.unparserMathML(tree.args[1]) + '</mrow>',
        log2: (tree: AST.NodeInput) => '<msub><mi>log</mi><mrow>' + '<mn>2</mn>' + '</mrow></msub><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow>',
        log10: (tree: AST.NodeInput) => '<msub><mi>log</mi><mrow>' + '<mn>10</mn>' + '</mrow></msub><mrow>' + this.unparserMathML(tree.args[0]) + '</mrow>',
        gamma: (tree: AST.NodeInput) => '<mi>&Gamma;</mi><mrow><mo>(</mo>' + this.unparserMathML(tree.args[0]) + '<mo>)</mo></mrow>',
        factorial: (tree: AST.NodeInput) => '<mrow><mo>(</mo>' + this.unparserMathML(tree.args[0]) + '<mo>)</mo></mrow><mo>!</mo>',
    };

    /**
     * Evaluator object constructor
     */
    private constructor() {
        global.EvaluatorPointer = this;
        this.exitStatus = this.response.OK;
        /* Set opTable aliases */
        this.opTable['**'] = this.opTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.opTable['~='] = this.opTable['!='];
        this.opTable['~'] = this.opTable['!'];
        /* Load nativeNameTable and constantsTable in nameTable */
        this.loadNativeTable();
        /* Define Evaluator functions */
        for (const func in this.functions) {
            this.defineFunction(func, this.functions[func]);
        }
        /* Define function operators */
        for (const func in MathOperation.leftAssociativeMultipleOperations) {
            this.defineLeftAssociativeMultipleOperationFunction(func, MathOperation.leftAssociativeMultipleOperations[func]);
        }
        for (const func in MathOperation.binaryOperations) {
            this.defineBinaryOperatorFunction(func, MathOperation.binaryOperations[func]);
        }
        for (const func in MathOperation.unaryOperations) {
            this.defineUnaryOperatorFunction(func, MathOperation.unaryOperations[func]);
        }
        /* Define function mappers */
        for (const func in ComplexDecimal.mapFunction) {
            this.defineFunction(func, ComplexDecimal.mapFunction[func], true);
        }
        /* Define other functions */
        for (const func in ComplexDecimal.twoArgFunction) {
            this.defineFunction(func, ComplexDecimal.twoArgFunction[func]);
        }
        /* Define Configuration functions */
        for (const func in Configuration.functions) {
            this.defineFunction(func, Configuration.functions[func]);
        }
        /* Define CoreFunctions functions */
        for (const func in CoreFunctions.functions) {
            this.defineFunction(func, CoreFunctions.functions[func]);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.defineFunction(func, LinearAlgebra.functions[func]);
        }
        /* Load unparserMathML for special functions */
        for (const func in this.unparseMathMLFunctions) {
            this.baseFunctionTable[func].unparserMathML = this.unparseMathMLFunctions[func];
        }
    }

    /**
     * Evaluator initialization.
     * @param config Evaluator configuration.
     * @returns Evaluator instance.
     */
    public static initialize(config?: TEvaluatorConfig): Evaluator {
        const evaluator = new Evaluator();
        if (config) {
            if (config.aliasTable) {
                evaluator.aliasTable = config.aliasTable;
                evaluator.aliasName = (name: string): string => {
                    let result = false;
                    let aliasname = '';
                    for (const i in evaluator.aliasTable) {
                        if (evaluator.aliasTable[i].test(name)) {
                            result = true;
                            aliasname = i;
                            break;
                        }
                    }
                    if (result) {
                        return aliasname;
                    } else {
                        return name;
                    }
                };
            } else {
                evaluator.aliasName = (name: string): string => name;
            }
            if (config.externalFunctionTable) {
                Object.assign(evaluator.baseFunctionTable, config.externalFunctionTable);
            }
            if (config.externalCmdWListTable) {
                Object.assign(evaluator.commandWordListTable, config.externalCmdWListTable);
            }
            for (const cmd in evaluator.commandWordListTable) {
                evaluator.parser.commandNames.push(cmd);
            }
        } else {
            evaluator.aliasName = (name: string): string => name;
        }
        return evaluator;
    }

    /**
     * Alias name function. This property is set when running Evaluator.initialize.
     * @param name Alias name.
     * @returns Canonical name.
     */
    public aliasName: (name: string) => string = (name: string): string => name;

    /**
     * Load native name table in name table.
     */
    private loadNativeTable(): void {
        /* Insert nativeNameTable in nameTable */
        for (const name in this.nativeNameTable) {
            this.nameTable[name] = { args: [], expr: this.nativeNameTable[name] };
            this.readonlyNameTable.push(name);
        }
        /* Insert constantsTable in nameTable */
        for (const name in constantsTable) {
            this.nameTable[constantsTable[name][0]] = { args: [], expr: constantsTable[name][1] };
            this.readonlyNameTable.push(constantsTable[name][0]);
        }
    }

    /**
     * Restart evaluator.
     */
    public Restart(): void {
        this.nameTable = {};
        this.localTable = {};
        this.readonlyNameTable = [];
        this.loadNativeTable();
    }

    /**
     * Clear variables. If names is 0 lenght restart evaluator.
     * @param names Variable names to clear in nameTable and baseFunctionTable.
     */
    public Clear(...names: string[]): void {
        if (names.length === 0) {
            this.Restart();
        } else {
            names.forEach((name) => {
                if (!this.readonlyNameTable.includes(name)) {
                    delete this.nameTable[name];
                    delete this.baseFunctionTable[name];
                }
            });
        }
    }

    /**
     * Throws error if left hand side length of multiple assignment greater
     * than maximum length (to be used in ReturnSelector functions).
     * @param maxLength Maximum length of return list.
     * @param currentLength Requested length of return list.
     */
    public static throwErrorIfGreaterThanReturnList(maxLength: number, currentLength: number): void {
        if (currentLength > maxLength) {
            throw new EvalError(`element number ${maxLength + 1} undefined in return list`);
        }
    }

    /**
     * Tests if it is a NodeReturnList and if so reduces it to its first
     * element.
     * @param value A node.
     * @returns Reduced node if `tree` is a NodeReturnList.
     */
    public reduceIfReturnList(tree: AST.NodeInput): AST.NodeInput {
        if (tree.type === 'RETLIST') {
            const result = tree.selector(1, 0);
            result.parent = tree.parent;
            return result;
        } else {
            return tree;
        }
    }

    /**
     * Validate left side of assignment node.
     * @param tree Left side of assignment node
     * @param shallow True if tree is a left root of assignment.
     * @returns An object with three properties: `left`, `id` and `args`.
     */
    public validateAssignment(tree: AST.NodeExpr, shallow: boolean = true): { left: AST.NodeExpr; id: string; args: AST.NodeExpr[] }[] {
        const invalidMessageBase = 'invalid left hand side of assignment';
        const invalidMessage = `${invalidMessageBase}: cannot assign to a read only value:`;
        if (tree.type === 'IDENT') {
            if (this.readonlyNameTable.includes(tree.id)) {
                throw new EvalError(`${invalidMessage} ${tree.id}.`);
            }
            return [
                {
                    left: tree,
                    id: tree.id,
                    args: [],
                },
            ];
        } else if (tree.type === 'ARG' && tree.expr.type === 'IDENT') {
            if (this.readonlyNameTable.includes(tree.expr.id)) {
                throw new EvalError(`${invalidMessage} ${tree.expr.id}.`);
            }
            return [
                {
                    left: tree.expr,
                    id: tree.expr.id,
                    args: tree.args,
                },
            ];
        } else if (tree.type === '<~>') {
            return [
                {
                    left: null,
                    id: '~',
                    args: [],
                },
            ];
        } else if (shallow && this.isRowVector(tree)) {
            return tree.array[0].map((left: AST.NodeExpr) => this.validateAssignment(left, false)[0]);
        } else {
            throw new EvalError(`${invalidMessageBase}.`);
        }
    }

    /**
     * Define function in baseFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     * @param map `true` if function is a mapper function.
     * @param ev A `boolean` array indicating which function argument should
     * be evaluated before executing the function.
     */
    private defineFunction(name: string, func: Function, map?: boolean, ev?: boolean[]): void {
        this.baseFunctionTable[name] = {
            mapper: map ?? false,
            ev: ev ?? [],
            func,
        };
    }

    /**
     * Define unary operator function in baseFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     */
    private defineUnaryOperatorFunction(name: string, func: UnaryMathOperation): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (...operand: AST.NodeExpr) => {
                if (operand.length === 1) {
                    return func(operand[0]);
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     * Define binary operator function in baseFunctionTable.
     * @param name Name of function.
     * @param func Function body.
     */
    private defineBinaryOperatorFunction(name: string, func: BinaryMathOperation): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (left: AST.NodeExpr, ...right: AST.NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     * Define define two-or-more operand function in baseFunctionTable.
     * @param name
     * @param func
     */
    private defineLeftAssociativeMultipleOperationFunction(name: string, func: BinaryMathOperation): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (left: AST.NodeExpr, ...right: AST.NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else if (right.length > 1) {
                    let result = func(left, right[0]);
                    for (let i = 1; i < right.length; i++) {
                        result = func(result, right[i]);
                    }
                    return result;
                } else {
                    throw new EvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
                }
            },
        };
    }

    /**
     *
     * @param tree
     * @returns
     */
    public toBoolean(tree: AST.NodeExpr): boolean {
        const value = tree instanceof MultiArray ? this.toLogical(tree) : tree;
        if (value instanceof ComplexDecimal) {
            return Boolean(value.re.toNumber() || value.im.toNumber());
        } else {
            return !!value.str;
        }
    }

    /**
     * Expression tree recursive evaluator.
     * @param tree Expression to evaluate.
     * @param local Set `true` if evaluating function.
     * @param fname Function name if evaluating function.
     * @returns Expression `tree` evaluated.
     */
    public Evaluator(tree: AST.NodeInput, local: boolean = false, fname: string = ''): AST.NodeInput {
        if (this._debug) {
            console.log(
                `Evaluator(\ntree:${JSON.stringify(
                    tree,
                    (key: string, value: AST.NodeInput) => (key !== 'parent' ? value : value === null ? 'root' : true),
                    2,
                )},\nlocal:${local},\nfname:${fname});`,
            );
        }
        if (tree) {
            if (tree instanceof ComplexDecimal || tree instanceof CharString) {
                /* NUMBER or STRING */
                return tree;
            } else if (tree instanceof MultiArray) {
                /* MATRIX */
                return this.evaluateArray(tree, local, fname);
            } else {
                switch (tree.type) {
                    case '+':
                    case '-':
                    case '.*':
                    case '*':
                    case './':
                    case '/':
                    case '.\\':
                    case '\\':
                    case '.^':
                    case '^':
                    case '.**':
                    case '**':
                    case '<':
                    case '<=':
                    case '==':
                    case '>=':
                    case '>':
                    case '!=':
                    case '~=':
                    case '&':
                    case '|':
                    case '&&':
                    case '||':
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as BinaryMathOperation)(
                            this.reduceIfReturnList(this.Evaluator(tree.left, local, fname)),
                            this.reduceIfReturnList(this.Evaluator(tree.right, local, fname)),
                        );
                    case '()':
                        tree.right.parent = tree;
                        return this.reduceIfReturnList(this.Evaluator(tree.right, local, fname));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(this.reduceIfReturnList(this.Evaluator(tree.right, local, fname)));
                    case '++_':
                    case '--_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.right);
                    case ".'":
                    case "'":
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(this.reduceIfReturnList(this.Evaluator(tree.left, local, fname)));
                    case '_++':
                    case '_--':
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.left);
                    case '=':
                    case '+=':
                    case '-=':
                    case '*=':
                    case '/=':
                    case '\\=':
                    case '^=':
                    case '**=':
                    case '.*=':
                    case './=':
                    case '.\\=':
                    case '.^=':
                    case '.**=':
                    case '&=':
                    case '|=':
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        const assignment = this.validateAssignment(tree.left);
                        const op: AST.TOperator = tree.type.substring(0, tree.type.length - 1);
                        if (assignment.length > 1 && op.length > 0) {
                            throw new EvalError('computed multiple assignment not allowed.');
                        }
                        let right: AST.NodeExpr;
                        try {
                            right = this.Evaluator(tree.right, false, fname);
                        } catch {
                            right = tree.right;
                        }
                        if (right.type !== 'RETLIST') {
                            right = AST.nodeReturnList((length: number, index: number) => {
                                if (index === 0) {
                                    return tree.right;
                                } else {
                                    throw new EvalError(`element number ${index + 1} undefined in return list`);
                                }
                            });
                        }
                        const resultList = AST.nodeListFirst();
                        for (let n = 0; n < assignment.length; n++) {
                            const { left, id, args } = assignment[n];
                            if (left) {
                                if (args.length === 0) {
                                    /* Name definition. */
                                    if (right.type !== 'RETLIST') {
                                        right = this.Evaluator(right, false, fname);
                                    }
                                    const rightN = right.selector(assignment.length, n);
                                    rightN.parent = tree.right;
                                    const expr = op.length ? AST.nodeOp(op, left, rightN) : rightN;
                                    try {
                                        this.nameTable[id] = { args: [], expr: this.reduceIfReturnList(this.Evaluator(expr)) };
                                        AST.appendNodeList(resultList, AST.nodeOp('=', left, this.nameTable[id].expr));
                                        continue;
                                    } catch (error) {
                                        this.nameTable[id] = { args: [], expr: expr };
                                        throw error;
                                    }
                                } else {
                                    /* Function definition or indexed matrix reference. */
                                    if (op) {
                                        if (typeof this.nameTable[id] !== 'undefined') {
                                            if (this.nameTable[id].args.length === 0) {
                                                /* Indexed matrix reference on left hand side with operator. */
                                                if (args.length === 1) {
                                                    /* Test logical indexing. */
                                                    const arg0 = this.reduceIfReturnList(this.Evaluator(args[0], local, fname));
                                                    if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.numberClass.logical) {
                                                        /* Logical indexing. */
                                                        this.setElementsLogical(
                                                            this.nameTable,
                                                            id,
                                                            this.linearize(arg0) as ComplexDecimal[],
                                                            this.scalarToArray(
                                                                this.reduceIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            this.getElementsLogical(this.nameTable[id].expr, id, arg0),
                                                                            this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    } else {
                                                        /* Not logical indexing. */
                                                        this.setElements(
                                                            this.nameTable,
                                                            id,
                                                            [arg0],
                                                            this.scalarToArray(
                                                                this.reduceIfReturnList(
                                                                    this.Evaluator(
                                                                        AST.nodeOp(
                                                                            op,
                                                                            this.getElements(this.nameTable[id].expr, id, [arg0]),
                                                                            this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                        ),
                                                                        false,
                                                                        fname,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    }
                                                } else {
                                                    this.setElements(
                                                        this.nameTable,
                                                        id,
                                                        args.map((arg: AST.NodeExpr) => this.reduceIfReturnList(this.Evaluator(arg))),
                                                        this.scalarToArray(
                                                            this.reduceIfReturnList(
                                                                this.Evaluator(
                                                                    AST.nodeOp(
                                                                        op,
                                                                        this.getElements(this.nameTable[id].expr, id, args),
                                                                        this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                                    ),
                                                                    false,
                                                                    fname,
                                                                ),
                                                            ),
                                                        ),
                                                    );
                                                }
                                                AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id].expr));
                                                continue;
                                            } else {
                                                throw new EvalError(`in computed assignment ${id}(index) OP= X, ${id} cannot be a function.`);
                                            }
                                        } else {
                                            throw new EvalError(`in computed assignment ${id}(index) OP= X, ${id} must be defined first.`);
                                        }
                                    } else {
                                        /* Test if is a function definition (test if args is a list of undefined NAME). */
                                        let isFunction: boolean = true;
                                        for (let i = 0; i < args.length; i++) {
                                            isFunction &&= args[i].type === 'IDENT';
                                            if (isFunction) {
                                                isFunction &&= typeof this.nameTable[args[i].id] === 'undefined';
                                            }
                                            if (!isFunction) {
                                                break;
                                            }
                                        }
                                        if (isFunction) {
                                            this.nameTable[id] = { args: args, expr: right.selector(assignment.length, n) };
                                            AST.appendNodeList(resultList, tree);
                                            continue;
                                        } else {
                                            /* Indexed matrix reference on left hand side. */
                                            if (args.length === 1) {
                                                /* Test logical indexing. */
                                                args[0].parent = tree.left;
                                                args[0].index = 0;
                                                const arg0 = this.reduceIfReturnList(this.Evaluator(args[0], local, fname));
                                                if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.numberClass.logical) {
                                                    /* Logical indexing. */
                                                    this.setElementsLogical(
                                                        this.nameTable,
                                                        id,
                                                        this.linearize(arg0) as ComplexDecimal[],
                                                        this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                    );
                                                } else {
                                                    /* Not logical indexing. */
                                                    this.setElements(
                                                        this.nameTable,
                                                        id,
                                                        [arg0],
                                                        this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                    );
                                                }
                                            } else {
                                                this.setElements(
                                                    this.nameTable,
                                                    id,
                                                    args.map((arg: AST.NodeExpr, i: number) => {
                                                        arg.parent = tree.left;
                                                        arg.index = i;
                                                        return this.reduceIfReturnList(this.Evaluator(arg));
                                                    }),
                                                    this.scalarToArray(this.reduceIfReturnList(this.Evaluator(right.selector(assignment.length, n)))),
                                                );
                                            }
                                            AST.appendNodeList(resultList, AST.nodeOp('=', AST.nodeIdentifier(id), this.nameTable[id].expr));
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                        if (tree.parent === null || tree.parent.parent === null) {
                            /* assignment at root expression */
                            if (resultList.list.length === 1) {
                                /* single assignment */
                                return resultList.list[0];
                            } else {
                                /* multiple assignment */
                                return resultList;
                            }
                        } else {
                            /* assignment at right side */
                            return (resultList.list[0] as AST.NodeExpr).right;
                        }
                    case 'IDENT':
                        if (local && this.localTable[fname] && this.localTable[fname][tree.id]) {
                            /* Defined in localTable. */
                            this.localTable[fname][tree.id].parent = tree;
                            return this.localTable[fname][tree.id];
                        } else if (tree.id in this.nameTable) {
                            /* Defined in nameTable. */
                            if (this.nameTable[tree.id].args.length === 0) {
                                /* Defined as name. */
                                this.nameTable[tree.id].expr.parent = tree;
                                return this.reduceIfReturnList(this.Evaluator(this.nameTable[tree.id].expr));
                            } else {
                                /* Defined as function name. */
                                throw new EvalError(`calling ${tree.id} function without arguments list.`);
                            }
                        } else {
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                    case 'LIST':
                        const result = {
                            type: 'LIST',
                            list: new Array(tree.list.length),
                            parent: tree.parent === null ? null : tree,
                        };
                        for (let i = 0; i < tree.list.length; i++) {
                            /* Convert undefined name, defined in word-list command, to word-list command.
                             * (Null length word-list command) */
                            if (
                                tree.list[i].type === 'IDENT' &&
                                !(local && this.localTable[fname] && this.localTable[fname][tree.list[i].id]) &&
                                !(tree.list[i].id in this.nameTable) &&
                                this.parser.commandNames.indexOf(tree.list[i].id) >= 0
                            ) {
                                tree.list[i].type = 'CMDWLIST';
                                tree.list[i].omitAns = true;
                                tree.list[i]['args'] = [];
                            }
                            tree.list[i].parent = result;
                            tree.list[i].index = i;
                            result.list[i] = this.reduceIfReturnList(this.Evaluator(tree.list[i], local, fname));
                            if (tree.parent === null && !tree.list[i].omitAns) {
                                this.nameTable['ans'] = { args: [], expr: result.list[i] };
                            }
                        }
                        return result;
                    case 'RANGE':
                        tree.start.parent = tree;
                        tree.stop.parent = tree;
                        if (tree.stride) {
                            tree.stride.parent = tree;
                        }
                        return this.expandRange(
                            this.reduceIfReturnList(this.Evaluator(tree.start, local, fname)),
                            this.reduceIfReturnList(this.Evaluator(tree.stop, local, fname)),
                            tree.stride ? this.reduceIfReturnList(this.Evaluator(tree.stride, local, fname)) : null,
                        );
                    case 'ENDRANGE': {
                        let parent = tree.parent;
                        /* Search for 'ARG' node until reach 'ARG' or root node */
                        while (parent !== null && parent.type !== 'ARG') {
                            parent = parent.parent;
                        }
                        if (
                            parent &&
                            parent.type === 'ARG' &&
                            parent.expr.id in this.nameTable &&
                            this.nameTable[parent.expr.id].args.length === 0 &&
                            this.nameTable[parent.expr.id].expr instanceof MultiArray
                        ) {
                            return parent.args.length === 1
                                ? this.newNumber(this.linearLength(this.nameTable[parent.expr.id].expr))
                                : this.newNumber(this.getDimension(this.nameTable[parent.expr.id].expr, tree.parent.index));
                        } else {
                            throw new SyntaxError("indeterminate end of range. The word 'end' to refer a value is valid only in indexing.");
                        }
                    }
                    case ':':
                        const parent = tree.parent;
                        if (
                            parent.type === 'ARG' &&
                            parent.expr.id in this.nameTable &&
                            this.nameTable[parent.expr.id].args.length === 0 &&
                            this.nameTable[parent.expr.id].expr instanceof MultiArray
                        ) {
                            return parent.args.length === 1
                                ? this.expandRange(ComplexDecimal.one(), this.newNumber(this.linearLength(this.nameTable[parent.expr.id].expr)))
                                : this.expandRange(ComplexDecimal.one(), this.newNumber(this.getDimension(this.nameTable[parent.expr.id].expr, tree.index)));
                        } else {
                            throw new SyntaxError('indeterminate colon. The colon to refer a range is valid only in indexing.');
                        }
                    case 'ARG':
                        if (typeof tree.expr === 'undefined') {
                            throw new ReferenceError(`'${tree.id}' undefined.`);
                        }
                        tree.expr.parent = tree;
                        if (tree.expr.type === 'IDENT') {
                            /* Indexed matrix reference or function call. */
                            const aliasTreeName = this.aliasName(tree.expr.id);
                            if (aliasTreeName in this.baseFunctionTable) {
                                /* Is base function. */
                                if (typeof this.baseFunctionTable[aliasTreeName]['mapper'] !== 'undefined') {
                                    /* Arguments evaluated. */
                                    const argumentsList = tree.args.map((arg: AST.NodeExpr, i: number) => {
                                        arg.parent = tree;
                                        arg.index = i;
                                        return this.reduceIfReturnList(this.Evaluator(arg, local, fname));
                                    });
                                    if (this.baseFunctionTable[aliasTreeName].mapper && argumentsList.length !== 1) {
                                        /* Error if mapper and #arguments!==1 (Invalid call). */
                                        throw new EvalError(`Invalid call to ${aliasTreeName}. Type 'help ${tree.expr.id}' to see correct usage.`);
                                    }
                                    if (argumentsList.length === 1 && argumentsList[0] instanceof MultiArray && this.baseFunctionTable[aliasTreeName].mapper) {
                                        /* Test if is mapper. */
                                        return this.mapArray(argumentsList[0], this.baseFunctionTable[aliasTreeName].func);
                                    } else {
                                        return this.baseFunctionTable[aliasTreeName].func(...argumentsList);
                                    }
                                } else {
                                    /* Arguments selectively evaluated. */
                                    return this.baseFunctionTable[aliasTreeName].func(
                                        ...tree.args.map((arg: AST.NodeExpr, i: number) => {
                                            arg.parent = tree;
                                            arg.index = i;
                                            return this.baseFunctionTable[aliasTreeName].ev[i] ? this.reduceIfReturnList(this.Evaluator(arg, local, fname)) : arg;
                                        }),
                                    );
                                }
                            } else if (local && this.localTable[fname] && this.localTable[fname][tree.expr.id]) {
                                /* Defined in localTable. **** */
                                return this.localTable[fname][tree.expr.id];
                            } else if (tree.expr.id in this.nameTable) {
                                /* Defined in nameTable. */
                                if (this.nameTable[tree.expr.id].args.length === 0) {
                                    /* If is a defined name. */
                                    this.nameTable[tree.expr.id].expr.parent = tree;
                                    const temp = this.reduceIfReturnList(this.Evaluator(this.nameTable[tree.expr.id].expr));
                                    if (tree.args.length === 0) {
                                        /* Defined name. */
                                        temp.parent = tree;
                                        return temp;
                                    } else if (temp instanceof MultiArray) {
                                        /* Defined indexed matrix reference. */
                                        let result: MathObject;
                                        if (tree.args.length === 1) {
                                            /* Test logical indexing. */
                                            tree.args[0].parent = tree;
                                            tree.args[0].index = 0;
                                            const arg0 = this.reduceIfReturnList(this.Evaluator(tree.args[0], local, fname));
                                            if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.numberClass.logical) {
                                                /* Logical indexing. */
                                                result = this.getElementsLogical(temp, tree.expr.id, arg0);
                                            } else {
                                                /* Not logical indexing. */
                                                result = this.getElements(temp, tree.expr.id, [arg0]);
                                            }
                                        } else {
                                            result = this.getElements(
                                                temp,
                                                tree.expr.id,
                                                tree.args.map((arg: AST.NodeExpr, i: number) => {
                                                    arg.parent = tree;
                                                    arg.index = i;
                                                    return this.reduceIfReturnList(this.Evaluator(arg, local, fname));
                                                }),
                                            );
                                        }
                                        result.parent = tree;
                                        return result;
                                    } else {
                                        throw new EvalError('invalid matrix indexing or function arguments.');
                                    }
                                } else {
                                    /* Else is defined function. */
                                    if (this.nameTable[tree.expr.id].args.length !== tree.args.length) {
                                        throw new EvalError(`invalid number of arguments in function ${tree.expr.id}.`);
                                    }
                                    /* Create localTable entry. */
                                    this.localTable[tree.expr.id] = {};
                                    for (let i = 0; i < tree.args.length; i++) {
                                        /* Evaluate defined function arguments list. */
                                        tree.args[i].parent = tree;
                                        tree.args[i].index = i;
                                        this.localTable[tree.expr.id][this.nameTable[tree.expr.id].args[i].id] = this.reduceIfReturnList(this.Evaluator(tree.args[i], true, fname));
                                    }
                                    const temp = this.reduceIfReturnList(this.Evaluator(this.nameTable[tree.expr.id].expr, true, tree.expr.id));
                                    /* Delete localTable entry. */
                                    delete this.localTable[tree.expr.id];
                                    return temp;
                                }
                            } else {
                                throw new ReferenceError(`'${tree.expr.id}' undefined.`);
                            }
                        } else {
                            /* literal indexing, ex: [1,2;3,4](1,2). */
                            let result: MathObject;
                            if (tree.args.length === 1) {
                                /* Test logical indexing. */
                                tree.args[0].parent = tree;
                                tree.args[0].index = 0;
                                const arg0 = this.reduceIfReturnList(this.Evaluator(tree.args[0], local, fname));
                                if (arg0 instanceof MultiArray && arg0.type === ComplexDecimal.numberClass.logical) {
                                    /* Logical indexing. */
                                    result = this.getElementsLogical(tree.expr, this.Unparse(tree.expr), arg0);
                                } else {
                                    /* Not logical indexing. */
                                    result = this.getElements(tree.expr, this.Unparse(tree.expr), [arg0]);
                                }
                            } else {
                                result = this.getElements(
                                    tree.expr,
                                    this.Unparse(tree.expr),
                                    tree.args.map((arg: AST.NodeExpr, i: number) => {
                                        arg.parent = tree;
                                        arg.index = i;
                                        return this.reduceIfReturnList(this.Evaluator(arg, local, fname));
                                    }),
                                );
                            }
                            result.parent = tree;
                            return result;
                        }
                    case 'CMDWLIST':
                        this.commandWordListTable[tree.id].func(...tree.args.map((word: { str: string }) => word.str));
                        this.exitStatus = this.response.EXTERNAL;
                        return tree;
                    case 'IF':
                        for (let ifTest = 0; ifTest < tree.expression.length; ifTest++) {
                            tree.expression[ifTest].parent = tree;
                            if (this.toBoolean(this.reduceIfReturnList(this.Evaluator(tree.expression[ifTest], local, fname)))) {
                                tree.then[ifTest].parent = tree;
                                return this.reduceIfReturnList(this.Evaluator(tree.then[ifTest], local, fname));
                            }
                        }
                        // No one then clause.
                        if (tree.else) {
                            tree.else.parent = tree;
                            return this.reduceIfReturnList(this.Evaluator(tree.else, local, fname));
                        }
                        // Return null NodeList.
                        return {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                    default:
                        throw new EvalError(`evaluating undefined type '${tree.type}'.`);
                }
            }
        } else {
            return null;
        }
    }

    /**
     * Evaluate expression `tree`.
     * @param tree Expression to evaluate.
     * @returns Expression `tree` evaluated.
     */
    public Evaluate(tree: AST.NodeInput): AST.NodeInput {
        try {
            this.exitStatus = this.response.OK;
            tree.parent = null;
            return this.Evaluator(tree);
        } catch (e) {
            this.exitStatus = this.response.EVAL_ERROR;
            throw e;
        }
    }

    /**
     * Unparse expression `tree`.
     * @param tree Expression to unparse.
     * @returns Expression `tree` unparsed.
     */
    public Unparse(tree: AST.NodeInput): string {
        try {
            if (tree) {
                if (tree === undefined) {
                    return '<UNDEFINED>';
                } else if (tree instanceof ComplexDecimal) {
                    /* NUMBER */
                    return this.unparseNumber(tree);
                } else if (tree instanceof CharString) {
                    /* STRING */
                    return this.unparseString(tree);
                } else if (tree instanceof MultiArray) {
                    /* MATRIX */
                    return this.unparseArray(tree);
                } else {
                    switch (tree.type) {
                        case '+':
                        case '-':
                        case '.*':
                        case '*':
                        case './':
                        case '/':
                        case '.\\':
                        case '\\':
                        case '.^':
                        case '^':
                        case '.**':
                        case '**':
                        case '<':
                        case '<=':
                        case '==':
                        case '>=':
                        case '>':
                        case '!=':
                        case '~=':
                        case '&':
                        case '|':
                        case '&&':
                        case '||':
                        case '=':
                        case '+=':
                        case '-=':
                        case '*=':
                        case '/=':
                        case '\\=':
                        case '^=':
                        case '**=':
                        case '.*=':
                        case './=':
                        case '.\\=':
                        case '.^=':
                        case '.**=':
                        case '&=':
                        case '|=':
                            return this.Unparse(tree.left) + tree.type + this.Unparse(tree.right);
                        case '()':
                            return '(' + this.Unparse(tree.right) + ')';
                        case '!':
                        case '~':
                            return tree.type + this.Unparse(tree.right);
                        case '+_':
                            return '+' + this.Unparse(tree.right);
                        case '-_':
                            return '-' + this.Unparse(tree.right);
                        case '++_':
                            return '++' + this.Unparse(tree.right);
                        case '--_':
                            return '--' + this.Unparse(tree.right);
                        case ".'":
                        case "'":
                            return this.Unparse(tree.left) + tree.type;
                        case '_++':
                            return this.Unparse(tree.left) + '++';
                        case '_--':
                            return this.Unparse(tree.left) + '--';
                        case 'IDENT':
                            return tree.id.replace(/^[Ii]nf$/, '&infin;');
                        case 'LIST':
                            return tree.list.map((value: AST.NodeExpr) => this.Unparse(value)).join('\n') + '\n';
                        case 'RANGE':
                            if (tree.start && tree.stop) {
                                if (tree.stride) {
                                    return this.Unparse(tree.start) + ':' + this.Unparse(tree.stride) + ':' + this.Unparse(tree.stop);
                                } else {
                                    return this.Unparse(tree.start) + ':' + this.Unparse(tree.stop);
                                }
                            } else {
                                return ':';
                            }
                        case 'ENDRANGE':
                            return 'end';
                        case ':':
                            return ':';
                        case '<~>':
                            return '~';
                        case 'ARG':
                            return this.Unparse(tree.expr) + '(' + tree.args.map((value: AST.NodeExpr) => this.Unparse(value)).join(',') + ')';
                        case 'RETLIST':
                            return '<RETLIST>';
                        case 'CMDWLIST':
                            return tree.id + ' ' + tree.args.map((arg: CharString) => this.Unparse(arg)).join(' ');
                        case 'IF':
                            let ifstr = 'IF ' + this.Unparse(tree.expression[0]) + '\n';
                            ifstr += this.Unparse(tree.then[0]) + '\n';
                            for (let i = 1; i < tree.expression.length; i++) {
                                ifstr += 'ELSEIF ' + this.Unparse(tree.expression[i]) + '\n';
                                ifstr += this.Unparse(tree.then[i]) + '\n';
                            }
                            if (tree.else) {
                                ifstr += 'ELSE' + '\n' + this.Unparse(tree.else) + '\n';
                            }
                            ifstr += 'ENDIF';
                            return ifstr;
                        case 'NULL':
                            return '';
                        default:
                            return '<INVALID>';
                    }
                }
            } else {
                return '';
            }
        } catch (e) {
            return '<ERROR>';
        }
    }

    /**
     * Unparse recursively expression tree generating MathML representation.
     * @param tree Expression tree.
     * @returns String of expression `tree` unparsed as MathML language.
     */
    public unparserMathML(tree: AST.NodeInput): string {
        try {
            if (tree) {
                if (tree === undefined) {
                    return '<mi>undefined</mi>';
                } else if (tree instanceof ComplexDecimal) {
                    /* NUMBER */
                    return this.unparseNumberMathML(tree);
                } else if (tree instanceof CharString) {
                    /* STRING */
                    return this.unparseStringMathML(tree);
                } else if (tree instanceof MultiArray) {
                    /* MATRIX */
                    return this.unparseArrayMathML(tree);
                } else {
                    switch (tree.type) {
                        case '+':
                        case '-':
                        case '.*':
                        case './':
                        case '.\\':
                        case '\\':
                        case '.^':
                        case '.**':
                        case '<':
                        case '>':
                        case '==':
                        case '&':
                        case '|':
                        case '&&':
                        case '||':
                        case '=':
                        case '+=':
                        case '-=':
                        case '*=':
                        case '/=':
                        case '\\=':
                        case '^=':
                        case '**=':
                        case '.*=':
                        case './=':
                        case '.\\=':
                        case '.^=':
                        case '.**=':
                        case '&=':
                        case '|=':
                            return this.unparserMathML(tree.left) + '<mo>' + tree.type + '</mo>' + this.unparserMathML(tree.right);
                        case '<=':
                            return this.unparserMathML(tree.left) + '<mo>&le;</mo>' + this.unparserMathML(tree.right);
                        case '>=':
                            return this.unparserMathML(tree.left) + '<mo>&ge;</mo>' + this.unparserMathML(tree.right);
                        case '!=':
                        case '~=':
                            return this.unparserMathML(tree.left) + '<mo>&ne;</mo>' + this.unparserMathML(tree.right);
                        case '()':
                            return '<mo>(</mo>' + this.unparserMathML(tree.right) + '<mo>)</mo>';
                        case '*':
                            return this.unparserMathML(tree.left) + '<mo>&times;</mo>' + this.unparserMathML(tree.right);
                        case '/':
                            return '<mfrac><mrow>' + this.unparserMathML(tree.left) + '</mrow><mrow>' + this.unparserMathML(tree.right) + '</mrow></mfrac>';
                        case '**':
                        case '^':
                            return '<msup><mrow>' + this.unparserMathML(tree.left) + '</mrow><mrow>' + this.unparserMathML(tree.right) + '</mrow></msup>';
                        case '!':
                        case '~':
                            return '<mo>' + tree.type + '</mo>' + this.unparserMathML(tree.right);
                        case '+_':
                            return '<mo>+</mo>' + this.unparserMathML(tree.right);
                        case '-_':
                            return '<mo>-</mo>' + this.unparserMathML(tree.right);
                        case '++_':
                            return '<mo>++</mo>' + this.unparserMathML(tree.right);
                        case '--_':
                            return '<mo>--</mo>' + this.unparserMathML(tree.right);
                        case '_++':
                            return this.unparserMathML(tree.left) + '<mo>++</mo>';
                        case '_--':
                            return this.unparserMathML(tree.left) + '<mo>--</mo>';
                        case ".'":
                            return '<msup><mrow>' + this.unparserMathML(tree.left) + '</mrow><mrow><mi>T</mi></mrow></msup>';
                        case "'":
                            return '<msup><mrow>' + this.unparserMathML(tree.left) + '</mrow><mrow><mi>H</mi></mrow></msup>';
                        case 'IDENT':
                            return '<mi>' + substSymbol(tree.id) + '</mi>';
                        case 'LIST':
                            return `<mtable>${tree.list.map((value: AST.NodeInput) => `<mtr><mtd>${this.unparserMathML(value)}</mtd></mtr>`).join('')}</mtable>`;
                        case 'RANGE':
                            if (tree.start && tree.stop) {
                                if (tree.stride) {
                                    return this.unparserMathML(tree.start) + '<mo>:</mo>' + this.unparserMathML(tree.stride) + '<mo>:</mo>' + this.unparserMathML(tree.stop);
                                } else {
                                    return this.unparserMathML(tree.start) + '<mo>:</mo>' + this.unparserMathML(tree.stop);
                                }
                            } else {
                                return '<mo>:</mo>';
                            }
                        case 'ENDRANGE':
                            return '<mi>end</mi>';
                        case ':':
                            return '<mo>:</mo>';
                        case '<~>':
                            return '<mo>~</mo>';
                        case 'ARG':
                            if (tree.args.length === 0) {
                                return this.unparserMathML(tree.expr) + '<mrow><mo>(</mo><mo>)</mo></mrow>';
                            } else {
                                const arglist = tree.args.map((arg: AST.NodeExpr) => this.unparserMathML(arg)).join('<mo>,</mo>');
                                if (tree.expr.type === 'IDENT') {
                                    const aliasTreeName = this.aliasName(tree.expr.id);
                                    if (aliasTreeName in this.baseFunctionTable && this.baseFunctionTable[aliasTreeName].unparserMathML) {
                                        return this.baseFunctionTable[aliasTreeName].unparserMathML!(tree);
                                    } else {
                                        return '<mi>' + substSymbol(tree.expr.id) + '</mi><mrow><mo>(</mo>' + arglist + '<mo>)</mo></mrow>';
                                    }
                                } else {
                                    return this.unparserMathML(tree.expr) + '<mrow><mo>(</mo>' + arglist + '<mo>)</mo></mrow>';
                                }
                            }
                        case 'RETLIST':
                            return '<mi>RETLIST</mi>';
                        case 'CMDWLIST':
                            return '<mtext>' + tree.id + ' ' + tree.args.map((arg: CharString) => this.unparserMathML(arg)).join(' ') + '</mtext>';
                        case 'IF':
                            const ifThenArray = tree.expression.map(
                                (expr: AST.NodeInput, i: number) =>
                                    `<mtr><mtd><mo>${i === 0 ? '<b>if</b>' : '<b>elseif</b>'}</mo></mtd><mtd>${this.unparserMathML(
                                        tree.expression[0],
                                    )}</mtd></mtr><mtr><mtd></mtd><mtd>${this.unparserMathML(tree.then[0])}</mtd></mtr>`,
                            );
                            const ifElse = tree.else ? `<mtr><mtd><mo><b>else</b></mo></mtd></mtr><mtr><mtd></mtd><mtd>${this.unparserMathML(tree.else)}</mtd></mtr>` : '';
                            return `<mtable>${ifThenArray.join('')}${ifElse}<mtr><mtd><mo><b>endif</b></mo></mtd></mtr></mtable>`;
                        case 'NULL':
                            return '';
                        default:
                            return '<mi>invalid</mi>';
                    }
                }
            } else {
                return '';
            }
        } catch (e) {
            if (this._debug) {
                throw e;
            } else {
                return '<mi>error</mi>';
            }
        }
    }

    /**
     * Unparse Expression tree in MathML.
     * @param tree Expression tree.
     * @returns String of expression unparsed as MathML language.
     */
    public UnparseMathML(tree: AST.NodeInput, display: 'inline' | 'block' = 'block'): string {
        let result: string = this.unparserMathML(tree);
        if (result) {
            result = result.replace(/\<mo\>\(\<\/mo\>\<mi\>error\<\/mi\><\mi\>error\<\/mi\>\<mi\>i\<\/mi\>\<mo\>\)\<\/mo\>/gi, '<mi>error</mi>');
            return `<math xmlns = "http://www.w3.org/1998/Math/MathML" display="${display}">${result}</math>`;
        } else {
            return '';
        }
    }

    /**
     * Generates MathML representation of input without evaluation.
     * @param input Input to parse and generate MathML representation.
     * @param display `'inline'` or `'block'`.
     * @returns MathML representation of input.
     */
    public toMathML(input: string, display: 'inline' | 'block' = 'block'): string {
        return this.UnparseMathML(this.Parse(input), display);
    }
}
