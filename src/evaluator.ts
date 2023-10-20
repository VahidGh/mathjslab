/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import Parser from './parser.js';
import { constantsTable } from './constants-table';
import { substGreek } from './subst-greek';
import { CharString } from './char-string';
import { ComplexDecimal } from './complex-decimal';
import { MultiArray } from './multi-array';
import { Tensor } from './tensor';

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
    unparserML?: (tree: any) => string;
};
export type TBaseFunctionTable = Record<string, TBaseFunctionTableEntry>;

/**
 * nameTable type.
 */
export type TNameTableEntry = {
    args: Array<any>;
    expr: any;
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

/**
 * AST (Abstract Syntax Tree) nodes.
 */

/**
 * Common primary node.
 */
interface PrimaryNode {
    type: string | number;
}

/**
 * Expression node.
 */
export type NodeExpr = NodeName | NodeArgExpr | NodeOperation | NodeList | NodeRange | NodeReturnList;

/**
 * Reserved node.
 */
interface NodeReserved extends PrimaryNode {}

/**
 * Name node.
 */
export interface NodeName extends PrimaryNode {
    type: 'NAME';
    id: string;
}

/**
 * Command word list node.
 */
interface NodeCmdWList extends PrimaryNode {
    type: 'CmdWList';
    id: string;
    args: Array<CharString>;
}

/**
 * Expression and arguments node.
 */
export interface NodeArgExpr extends PrimaryNode {
    type: 'ARG';
    expr: NodeExpr;
    args: Array<NodeExpr>;
}

/**
 * Range node.
 */
interface NodeRange extends PrimaryNode {
    type: 'RANGE';
    start: NodeExpr | null;
    stop: NodeExpr | null;
    stride: NodeExpr | null;
}

/**
 * Operation node.
 */
export type NodeOperation = UnaryOperation | BinaryOperation;

/**
 * Unary operation node.
 */
type UnaryOperation = UnaryOperationL | UnaryOperationR;

/**
 * Right unary operation node.
 */
interface UnaryOperationR extends PrimaryNode {
    right: NodeExpr;
}

/**
 * Left unary operation node.
 */
interface UnaryOperationL extends PrimaryNode {
    left: NodeExpr;
}

/**
 * Binary operation.
 */
interface BinaryOperation extends PrimaryNode {
    left: NodeExpr;
    right: NodeExpr;
}

/**
 * List node
 */
export interface NodeList extends PrimaryNode {
    type: 'LIST';
    list: Array<NodeExpr>;
}

export type ReturnSelector = (length: number, index: number) => any;

/**
 * Return list node
 */
export interface NodeReturnList extends PrimaryNode {
    type: 'RETLIST';
    selector: ReturnSelector;
}

/**
 * External parser declarations (defined in parser body)
 */
declare global {
    /* eslint-disable-next-line  no-var */
    var EvaluatorPointer: Evaluator;
    /* eslint-disable-next-line  no-var */
    var commandsTable: string[];
}

/**
 * Evaluator object.
 * It is implemented as a class but cannot be instantiated more than one time
 * simultaneously. Instance is given by `Evaluator.initialize` static method.
 */
export class Evaluator {
    /**
     * After run Parser or Evaluate method, the exitStatus property will contains
     * exit state of method.
     */
    public static response = {
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

    public get baseFunctionList(): string[] {
        return Object.keys(this.baseFunctionTable);
    }

    /**
     * Local table.
     */
    public localTable: Record<string, any> = {};

    /**
     * Command word list table.
     */
    public commandWordListTable: TCommandWordListTable = {};

    /**
     * Parser (generated by Jison).
     */
    private readonly parser: { parse: (input: string) => any } = Parser;

    /**
     * Evaluator exit status.
     */
    public exitStatus: number = Evaluator.response.OK;

    private incDecOp(pre: boolean, operation: 'plus' | 'minus'): (tree: any) => any {
        if (pre) {
            return (tree: any): any => {
                if (tree.type === 'NAME') {
                    if (this.nameTable[tree.id].expr) {
                        this.nameTable[tree.id].expr = Tensor[operation](this.nameTable[tree.id].expr, ComplexDecimal.one());
                        return this.nameTable[tree.id].expr;
                    } else {
                        throw new Error('in x++ or ++x, x must be defined first.');
                    }
                } else {
                    throw new SyntaxError(`invalid ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        } else {
            return (tree: any): any => {
                if (tree.type === 'NAME') {
                    if (this.nameTable[tree.id].expr) {
                        const value = Tensor.copy(this.nameTable[tree.id].expr);
                        this.nameTable[tree.id].expr = Tensor[operation](this.nameTable[tree.id].expr, ComplexDecimal.one());
                        return value;
                    } else {
                        throw new Error('in x++ or ++x, x must be defined first.');
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
    private readonly opTable: Record<string, Function> = {
        '+': Tensor.plus,
        '-': Tensor.minus,
        '.*': Tensor.times,
        '*': Tensor.mtimes,
        './': Tensor.rdivide,
        '/': Tensor.mrdivide,
        '.\\': Tensor.ldivide,
        '\\': Tensor.mldivide,
        '.^': Tensor.power,
        '^': Tensor.mpower,
        '+_': Tensor.uplus,
        '-_': Tensor.uminus,
        ".'": Tensor.transpose,
        "'": Tensor.ctranspose,
        '<': Tensor.lt,
        '<=': Tensor.le,
        '==': Tensor.eq,
        '>=': Tensor.ge,
        '>': Tensor.gt,
        '!=': Tensor.ne,
        '&': Tensor.and,
        '|': Tensor.or,
        '!': Tensor.not,
        '&&': Tensor.mand,
        '||': Tensor.mor,
        '++_': this.incDecOp(true, 'plus'),
        '--_': this.incDecOp(true, 'minus'),
        '_++': this.incDecOp(false, 'plus'),
        '_--': this.incDecOp(false, 'minus'),
    };

    /**
     * Parser AST (Abstract Syntax Tree) constructor methods.
     */

    public readonly nodeString = CharString.parse;
    public readonly isString = CharString.isThis;
    public readonly unparseString = CharString.unparse;
    public readonly unparseStringML = CharString.unparseML;
    public readonly removeQuotes = CharString.removeQuotes;
    public readonly nodeNumber = ComplexDecimal.parse;
    public readonly newNumber = ComplexDecimal.newThis;
    public readonly isNumber = ComplexDecimal.isThis;
    public readonly unparseNumber = ComplexDecimal.unparse;
    public readonly unparseNumberML = ComplexDecimal.unparseML;
    public readonly isTensor = MultiArray.isThis;
    public readonly unparseTensor = MultiArray.unparse;
    public readonly unparseTensorML = MultiArray.unparseML;
    public readonly evaluateTensor = MultiArray.evaluate;
    public readonly mapTensor = MultiArray.map;
    public readonly getItems = MultiArray.getItems;
    public readonly setItems = MultiArray.setItems;
    public readonly expandRange = MultiArray.expandRange;
    public readonly firstRow = MultiArray.firstRow;
    public readonly appendRow = MultiArray.appendRow;
    public readonly tensor0x0 = MultiArray.mat_0x0;

    public readonly linearize = MultiArray.linearize;
    public readonly toTensor = MultiArray.number2matrix1x1;

    private readonly unparseMLFunctions: Record<string, (tree: any) => string> = {
        abs: (tree: any) => '<mrow><mo>|</mo>' + this.unparserML(tree.args[0]) + '<mo>|</mo></mrow>',
        conj: (tree: any) => '<mover><mrow>' + this.unparserML(tree.args[0]) + '</mrow><mo>&OverBar;</mo></mover>',
        sqrt: (tree: any) => '<msqrt><mrow>' + this.unparserML(tree.args[0]) + '</mrow></msqrt>',
        root: (tree: any) => '<mroot><mrow>' + this.unparserML(tree.args[0]) + '</mrow><mrow>' + this.unparserML(tree.args[1]) + '</mrow></mroot>',
        exp: (tree: any) => '<msup><mi>e</mi><mrow>' + this.unparserML(tree.args[0]) + '</mrow></msup>',
        logb: (tree: any) => '<msub><mi>log</mi><mrow>' + this.unparserML(tree.args[0]) + '</mrow></msub><mrow>' + this.unparserML(tree.args[1]) + '</mrow>',
        log2: (tree: any) => '<msub><mi>log</mi><mrow>' + '<mn>2</mn>' + '</mrow></msub><mrow>' + this.unparserML(tree.args[0]) + '</mrow>',
        log10: (tree: any) => '<msub><mi>log</mi><mrow>' + '<mn>10</mn>' + '</mrow></msub><mrow>' + this.unparserML(tree.args[0]) + '</mrow>',
        gamma: (tree: any) => '<mi>&Gamma;</mi><mrow><mo>(</mo>' + this.unparserML(tree.args[0]) + '<mo>)</mo></mrow>',
        factorial: (tree: any) => '<mrow><mo>(</mo>' + this.unparserML(tree.args[0]) + '<mo>)</mo></mrow><mo>!</mo>',
    };

    /**
     * Evaluator object constructor
     */
    private constructor() {
        global.EvaluatorPointer = this;
        this.exitStatus = Evaluator.response.OK;
        /* Set opTable aliases */
        this.opTable['**'] = this.opTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.opTable['~='] = this.opTable['!='];
        this.opTable['~'] = this.opTable['!'];
        /* Load nativeNameTable and constantsTable in nameTable */
        this.loadNativeTable();
        /* Define function operators */
        for (const func in Tensor.twoMoreOpFunction) {
            this.DefBinMoreOpFunction(func, Tensor.twoMoreOpFunction[func]);
        }
        for (const func in Tensor.binaryOpFunction) {
            this.DefBinOpFunction(func, Tensor.binaryOpFunction[func]);
        }
        for (const func in Tensor.unaryOpFunction) {
            this.DefUnOpFunction(func, Tensor.unaryOpFunction[func]);
        }
        /* Define function mappers */
        for (const func in ComplexDecimal.mapFunction) {
            this.defFunction(func, ComplexDecimal.mapFunction[func], true);
        }
        /* Define other functions */
        for (const func in ComplexDecimal.twoArgFunction) {
            this.defFunction(func, ComplexDecimal.twoArgFunction[func]);
        }
        for (const func in MultiArray.functions) {
            this.defFunction(func, MultiArray.functions[func]);
        }
        for (const func in Tensor.linearizedFunctions) {
            this.DefLinearizedFunction(func, Tensor.linearizedFunctions[func].func, Tensor.linearizedFunctions[func].lin);
        }
        /* Configure unparserML */
        for (const func in this.unparseMLFunctions) {
            this.baseFunctionTable[func].unparserML = this.unparseMLFunctions[func];
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
                global.commandsTable.push(cmd);
            }
        } else {
            evaluator.aliasName = (name: string): string => name;
        }
        return evaluator;
    }

    /**
     * Alias name function.
     * @param name
     * @returns
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
     * @param names
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
     * Parse input.
     * @param input
     * @returns
     */
    public Parse(input: string): any {
        return this.parser.parse(input);
    }

    /**
     * Create reserved node.
     * @param nodeid
     * @returns
     */
    public nodeReserved(nodeid: string): NodeReserved {
        return { type: nodeid };
    }

    /**
     * Create name node.
     * @param nodeid
     * @returns
     */
    public nodeName(nodeid: string): NodeName {
        return {
            type: 'NAME',
            id: nodeid.replace(/(\r\n|[\n\r])|[\ ]/gm, ''),
        };
    }

    /**
     * Create command word list node.
     * @param nodename
     * @param nodelist
     * @returns
     */
    public nodeCmdWList(nodename: NodeName, nodelist: NodeList): NodeCmdWList {
        return {
            type: 'CmdWList',
            id: nodename.id,
            args: nodelist ? (nodelist.list as any) : [],
        };
    }

    /**
     * Create expression and arguments node.
     * @param nodeexpr
     * @param nodelist
     * @returns
     */
    public nodeArgExpr(nodeexpr: any, nodelist?: any): NodeArgExpr {
        return {
            type: 'ARG',
            expr: nodeexpr,
            args: nodelist ? nodelist.list : [],
        };
    }

    /**
     * Create range node.
     * @param left
     * @param right
     * @returns
     */
    public nodeRange(...args: any): NodeRange {
        /* https://www.mathworks.com/help/matlab/ref/end.html */
        if (args.length === 2) {
            return {
                type: 'RANGE',
                start: args[0],
                stop: args[1],
                stride: null,
            };
        } else if (args.length === 3) {
            return {
                type: 'RANGE',
                start: args[0],
                stop: args[2],
                stride: args[1],
            };
        } else {
            throw new SyntaxError('invalid range.');
        }
    }

    /**
     * Create operator node.
     * @param op
     * @param data1
     * @param data2
     * @returns
     */
    public nodeOp(op: string, data1: any, data2: any): NodeOperation {
        switch (op) {
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
                return { type: op, left: data1, right: data2 };
            case '()':
            case '!':
            case '~':
            case '+_':
            case '-_':
            case '++_':
            case '--_':
                return { type: op, right: data1 };
            case ".'":
            case "'":
            case '_++':
            case '_--':
                return { type: op, left: data1 };
            default:
                return { type: 'INVALID' } as NodeOperation;
        }
    }

    /**
     * Create first element of list node.
     * @param node
     * @returns
     */
    public nodeListFirst(node?: any): NodeList {
        if (node) {
            return {
                type: 'LIST',
                list: [node],
            };
        } else {
            return {
                type: 'LIST',
                list: [],
            };
        }
    }

    /**
     * Append node to list node.
     * @param lnode
     * @param node
     * @returns
     */
    public nodeList(lnode: any, node: any): NodeList {
        lnode.list.push(node);
        return lnode;
    }

    /**
     * Create first row of a matrix MultiArray.
     * @param row
     * @returns
     */
    public nodeFirstRow(row: any): MultiArray {
        if (row) {
            return this.firstRow(row.list);
        } else {
            return this.tensor0x0();
        }
    }

    /**
     * Append row to matrix MultiArray.
     * @param matrix
     * @param row
     * @returns
     */
    public nodeAppendRow(matrix: any, row: any): MultiArray {
        if (row) {
            return this.appendRow(matrix, row.list);
        } else {
            return matrix;
        }
    }

    public nodeReturnList(selector: ReturnSelector): NodeReturnList {
        return {
            type: 'RETLIST',
            selector,
        };
    }

    /**
     * Validate left hand side of assignment node.
     * @param tree
     * @returns
     */
    public validateAssignment(tree: any, shallow: boolean = true): { left: any; id: string; args: any[] }[] {
        const invalidMessageBase = 'invalid left hand side of assignment';
        const invalidMessage = `${invalidMessageBase}: cannot assign to a read only value:`;
        if (tree.type === 'NAME') {
            if (this.readonlyNameTable.includes(tree.id)) {
                throw new Error(`${invalidMessage} ${tree.id}.`);
            }
            return [
                {
                    left: tree,
                    id: tree.id,
                    args: [],
                },
            ];
        } else if (tree.type === 'ARG' && tree.expr.type === 'NAME') {
            if (this.readonlyNameTable.includes(tree.expr.id)) {
                throw new Error(`${invalidMessage} ${tree.expr.id}.`);
            }
            return [
                {
                    left: tree.expr,
                    id: tree.expr.id,
                    args: tree.args,
                },
            ];
        } else if (shallow && this.isTensor(tree) && tree.dim[0] === 1) {
            return tree.array[0].map((left: any) => this.validateAssignment(left, false)[0]);
        } else {
            throw new Error(`${invalidMessageBase}.`);
        }
    }

    /**
     * Define function in baseFunctionTable.
     * @param name
     * @param func
     * @param map
     */
    private defFunction(name: string, func: Function, map?: boolean, ev?: boolean[]): void {
        this.baseFunctionTable[name] = {
            mapper: map ?? false,
            ev: ev ?? [],
            func,
        };
    }

    /**
     * Define unary operator function in baseFunctionTable.
     * @param name
     * @param func
     */
    private DefUnOpFunction(name: string, func: Function): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (...operand: any) => {
                if (operand.length === 1) {
                    return func(operand[0]);
                } else {
                    throw new Error(`Invalid call to ${name}.`);
                }
            },
        };
    }

    /**
     * Define binary operator function in baseFunctionTable.
     * @param name
     * @param func
     */
    private DefBinOpFunction(name: string, func: Function): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (left: any, ...right: any) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else {
                    throw new Error(`Invalid call to ${name}.`);
                }
            },
        };
    }

    /**
     * Define define two-or-more operator function in baseFunctionTable.
     * @param name
     * @param func
     */
    private DefBinMoreOpFunction(name: string, func: Function): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: [],
            func: (left: any, ...right: any) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else if (right.length > 1) {
                    let result = func(left, right[0]);
                    for (let i = 1; i < right.length; i++) {
                        result = func(result, right[i]);
                    }
                    return result;
                } else {
                    throw new Error(`Invalid call to ${name}.`);
                }
            },
        };
    }

    /**
     * Define function with matrix linearization.
     * @param name Function name.
     * @param func Function body.
     * @param linearize boolean[ ] indicating wich argument is linearized.
     */
    private DefLinearizedFunction(name: string, func: Function, linearize: boolean[]): void {
        this.baseFunctionTable[name] = {
            mapper: false,
            ev: linearize,
            func: (...args: any[]) => {
                args.forEach((value, index) => {
                    if (linearize[index]) {
                        if ('array' in value) {
                            args[index] = this.linearize(args[index]);
                        }
                    }
                });
                return func(...args);
            },
        };
    }

    /**
     * Expression tree recursive evaluator.
     * @param tree
     * @param local
     * @param fname
     * @returns
     */
    public Evaluator(tree: any, local: boolean = false, fname: string = ''): any {
        if (this._debug) {
            console.log(`Evaluator(\ntree:${JSON.stringify(tree, null, 2)},\nlocal:${local},\nfname:${fname});`);
        }
        if (this.isNumber(tree) || this.isString(tree)) {
            /* NUMBER or STRING */
            return tree;
        } else if (this.isTensor(tree)) {
            /* MATRIX */
            return this.evaluateTensor(tree, this, local, fname);
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
                    return this.opTable[tree.type](this.Evaluator(tree.left, local, fname), this.Evaluator(tree.right, local, fname));
                case '()':
                    return this.Evaluator(tree.right, local, fname);
                case '+_':
                case '-_':
                    return this.opTable[tree.type](this.Evaluator(tree.right, local, fname));
                case '++_':
                case '--_':
                    return this.opTable[tree.type](tree.right);
                case ".'":
                case "'":
                    return this.opTable[tree.type](this.Evaluator(tree.left, local, fname));
                case '_++':
                case '_--':
                    return this.opTable[tree.type](tree.left);
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
                    const assignment = this.validateAssignment(tree.left);
                    const op: string = tree.type.substring(0, tree.type.length - 1);
                    if (assignment.length > 1 && op.length > 0) {
                        throw new Error('computed multiple assignment not allowed.');
                    }
                    const { left, id, args } = assignment[0];
                    if (args.length === 0) {
                        /* Name definition. */
                        const expr = op.length ? this.nodeOp(op, left, tree.right) : tree.right;
                        try {
                            this.nameTable[id] = { args: [], expr: this.Evaluator(expr) };
                            return this.nodeOp('=', left, this.nameTable[id].expr);
                        } catch (error) {
                            this.nameTable[id] = { args: [], expr: expr };
                            throw error;
                        }
                    } else {
                        /* Function definition or indexed matrix reference. */
                        if (op) {
                            if (this.nameTable[id]) {
                                /* Indexed matrix reference on left hand side with operator. */
                                this.setItems(
                                    this.nameTable,
                                    id,
                                    args.map((arg: any) => this.linearize(this.Evaluator(arg))),
                                    this.toTensor(
                                        this.Evaluator(this.nodeOp(op, this.getItems(this.nameTable[id].expr, id, args), this.toTensor(this.Evaluator(tree.right))), false, fname),
                                    ),
                                );
                                return this.nodeOp('=', this.nodeName(id), this.nameTable[id].expr);
                            } else {
                                throw new Error(`in computed assignment ${id}(index) OP= X, ${id} must be defined first.`);
                            }
                        } else {
                            /* Test if is a function definition (test if args is a list of undefined NAME). */
                            let isFunction: boolean = true;
                            for (let i = 0; i < args.length; i++) {
                                isFunction &&= args[i].type === 'NAME';
                                if (isFunction) {
                                    isFunction &&= typeof this.nameTable[args[i].id] === 'undefined';
                                }
                                if (!isFunction) {
                                    break;
                                }
                            }
                            if (isFunction) {
                                this.nameTable[id] = { args: args, expr: tree.right };
                                return tree;
                            } else {
                                /* Indexed matrix reference on left hand side. */
                                this.setItems(
                                    this.nameTable,
                                    id,
                                    args.map((arg: any) => this.linearize(this.Evaluator(arg))),
                                    this.toTensor(this.Evaluator(tree.right)),
                                );
                                return this.nodeOp('=', this.nodeName(id), this.nameTable[id].expr);
                            }
                        }
                    }
                case 'NAME':
                    if (local && this.localTable[fname] && this.localTable[fname][tree.id]) {
                        /* Defined in localTable. */
                        return this.localTable[fname][tree.id];
                    } else if (tree.id in this.nameTable) {
                        /* Defined in nameTable. */
                        if (this.nameTable[tree.id].args.length === 0) {
                            /* Defined as name. */
                            return this.Evaluator(this.nameTable[tree.id].expr);
                        } else {
                            /* Defined as function name. */
                            throw new Error(`calling ${tree.id} function without arguments list.`);
                        }
                    }
                case 'LIST':
                    const result = {
                        type: 'LIST',
                        list: new Array(tree.list.length),
                    };
                    for (let i = 0; i < tree.list.length; i++) {
                        /* Convert undefined name, defined in word-list command, to word-list command.
                         * (Null length word-list command) */
                        if (
                            tree.list[i].type === 'NAME' &&
                            !(local && this.localTable[fname] && this.localTable[fname][tree.list[i].id]) &&
                            !(tree.list[i].id in this.nameTable) &&
                            commandsTable.indexOf(tree.list[i].id) >= 0
                        ) {
                            tree.list[i].type = 'CmdWList';
                            tree.list[i]['args'] = [];
                        }
                        result.list[i] = this.Evaluator(tree.list[i], local, fname);
                        if (typeof result.list[i].type === 'number') {
                            this.nameTable['ans'] = { args: [], expr: result.list[i] };
                        }
                    }
                    return result;
                case 'RANGE':
                    return this.expandRange(
                        this.Evaluator(tree.start, local, fname),
                        this.Evaluator(tree.stop, local, fname),
                        tree.stride ? this.Evaluator(tree.stride, local, fname) : null,
                    );
                case 'ARG':
                    if (typeof tree.expr === 'undefined') {
                        throw new Error(`'${tree.id}' undefined.`);
                    }
                    if (tree.expr.type === 'NAME') {
                        /* Indexed matrix reference or function call. */
                        const aliasTreeName = this.aliasName(tree.expr.id);
                        if (aliasTreeName in this.baseFunctionTable) {
                            /* Is base function. */
                            if (typeof this.baseFunctionTable[aliasTreeName]['mapper'] !== 'undefined') {
                                /* Arguments evaluated. */
                                const argumentsList = tree.args.map((arg: any) => this.Evaluator(arg, local, fname));
                                if (this.baseFunctionTable[aliasTreeName].mapper && argumentsList.length !== 1) {
                                    /* Error if mapper and #arguments!==1 (Invalid call). */
                                    throw new Error(`Invalid call to ${aliasTreeName}.`);
                                }
                                if (argumentsList.length === 1 && 'array' in argumentsList[0] && this.baseFunctionTable[aliasTreeName].mapper) {
                                    /* Test if is mapper. */
                                    return this.mapTensor(argumentsList[0], this.baseFunctionTable[aliasTreeName].func);
                                } else {
                                    return this.baseFunctionTable[aliasTreeName].func(...argumentsList);
                                }
                            } else {
                                /* Arguments selectively evaluated. */
                                return this.baseFunctionTable[aliasTreeName].func(
                                    ...tree.args.map((arg: any, i: number) => (this.baseFunctionTable[aliasTreeName].ev[i] ? this.Evaluator(arg, local, fname) : arg)),
                                );
                            }
                        } else if (local && this.localTable[fname] && this.localTable[fname][tree.expr.id]) {
                            /* Defined in localTable. **** */
                            return this.localTable[fname][tree.expr.id];
                        } else if (tree.expr.id in this.nameTable) {
                            /* Defined in nameTable. */
                            if (this.nameTable[tree.expr.id].args.length === 0) {
                                /* If is a defined name. */
                                const temp = this.Evaluator(this.nameTable[tree.expr.id].expr);
                                if (tree.args.length === 0) {
                                    /* Defined name. */
                                    return temp;
                                } else if (this.isTensor(temp)) {
                                    /* Defined indexed matrix reference. */
                                    return this.getItems(
                                        temp,
                                        tree.expr.id,
                                        tree.args.map((arg: any) => this.Evaluator(arg, local, fname)),
                                    );
                                } else {
                                    throw new Error('invalid matrix indexing or function arguments.');
                                }
                            } else {
                                /* Else is defined function. */
                                if (this.nameTable[tree.expr.id].args.length !== tree.args.length) {
                                    throw new Error(`invalid number of arguments in function ${tree.expr.id}.`);
                                }
                                /* Create localTable entry. */
                                this.localTable[tree.expr.id] = {};
                                for (let i = 0; i < tree.args.length; i++) {
                                    /* Evaluate defined function arguments list. */
                                    this.localTable[tree.expr.id][this.nameTable[tree.expr.id].args[i].id] = this.Evaluator(tree.args[i], true, fname);
                                }
                                const temp = this.Evaluator(this.nameTable[tree.expr.id].expr, true, tree.expr.id);
                                /* Delete localTable entry. */
                                delete this.localTable[tree.expr.id];
                                return temp;
                            }
                        } else {
                            throw new Error(`'${tree.expr.id}' undefined.`);
                        }
                    } else {
                        /* literal indexing, ex: [1,2;3,4](1,2). */
                        return this.getItems(
                            tree.expr,
                            this.Unparse(tree.expr),
                            tree.args.map((arg: any) => this.Evaluator(arg, local, fname)),
                        );
                    }
                case 'RETLIST':
                    return this.Evaluator(tree.selector(1, 1), local, fname);
                case 'CmdWList':
                    this.commandWordListTable[tree.id].func(...tree.args.map((word: { str: string }) => word.str));
                    this.exitStatus = Evaluator.response.EXTERNAL;
                    return tree;
                default:
                    throw new Error(`evaluating undefined type '${tree.type}'.`);
            }
        }
    }

    /**
     * Evaluate expression tree.
     * @param tree
     * @returns
     */
    public Evaluate(tree: any): any {
        try {
            this.exitStatus = Evaluator.response.OK;
            return this.Evaluator(tree);
        } catch (e) {
            this.exitStatus = Evaluator.response.EVAL_ERROR;
            throw e;
        }
    }

    /**
     * Unparse expression tree.
     * @param tree
     * @returns
     */
    public Unparse(tree: any): string {
        try {
            if (tree === undefined) {
                return '<UNDEFINED>';
            }
            if (this.isNumber(tree)) {
                /* NUMBER */
                return this.unparseNumber(tree);
            } else if (this.isString(tree)) {
                /* STRING */
                return this.unparseString(tree);
            } else if (this.isTensor(tree)) {
                /* MATRIX */
                return this.unparseTensor(tree, this);
            } else {
                switch (tree.type) {
                    case ':':
                    case '!':
                    case '~':
                        return tree.type;
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
                    case 'NAME':
                        return tree.id;
                    case 'LIST':
                        return tree.list.map((value: any) => this.Unparse(value)).join('\n') + '\n';
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
                    case 'ARG':
                        return this.Unparse(tree.expr) + '(' + tree.args.map((value: any) => this.Unparse(value)).join(',') + ')';
                    case 'CmdWList':
                        return tree.id + ' ' + tree.args.map((arg: any) => this.Unparse(arg)).join(' ');
                    default:
                        return '<INVALID>';
                }
            }
        } catch (e) {
            return '<ERROR>';
        }
    }

    /**
     * Unparse recursively expression tree generating MathML representation.
     * @param tree Expression tree.
     * @returns String of expression tree unparsed as MathML language.
     */
    public unparserML(tree: any): string {
        try {
            if (tree === undefined) {
                return '<mi>undefined</mi>';
            }
            if (this.isNumber(tree)) {
                /* NUMBER */
                return this.unparseNumberML(tree);
            } else if (this.isString(tree)) {
                /* STRING */
                return this.unparseStringML(tree);
            } else if (this.isTensor(tree)) {
                /* MATRIX */
                return this.unparseTensorML(tree, this);
            } else {
                switch (tree.type) {
                    case ':':
                    case '!':
                    case '~':
                        return '<mo>' + tree.type + '</mo>';
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
                        return this.unparserML(tree.left) + '<mo>' + tree.type + '</mo>' + this.unparserML(tree.right);
                    case '<=':
                        return this.unparserML(tree.left) + '<mo>&le;</mo>' + this.unparserML(tree.right);
                    case '>=':
                        return this.unparserML(tree.left) + '<mo>&ge;</mo>' + this.unparserML(tree.right);
                    case '!=':
                    case '~=':
                        return this.unparserML(tree.left) + '<mo>&ne;</mo>' + this.unparserML(tree.right);
                    case '()':
                        return '<mo>(</mo>' + this.unparserML(tree.right) + '<mo>)</mo>';
                    case '*':
                        return this.unparserML(tree.left) + '<mo>&times;</mo>' + this.unparserML(tree.right);
                    case '/':
                        return '<mfrac><mrow>' + this.unparserML(tree.left) + '</mrow><mrow>' + this.unparserML(tree.right) + '</mrow></mfrac>';
                    case '**':
                    case '^':
                        return '<msup><mrow>' + this.unparserML(tree.left) + '</mrow><mrow>' + this.unparserML(tree.right) + '</mrow></msup>';
                    case ':':
                    case '!':
                    case '~':
                        return '<mo>' + tree.type + '</mo>' + this.unparserML(tree.right);
                    case '+_':
                        return '<mo>+</mo>' + this.unparserML(tree.right);
                    case '-_':
                        return '<mo>-</mo>' + this.unparserML(tree.right);
                    case '++_':
                        return '<mo>++</mo>' + this.unparserML(tree.right);
                    case '--_':
                        return '<mo>--</mo>' + this.unparserML(tree.right);
                    case '_++':
                        return this.unparserML(tree.left) + '<mo>++</mo>';
                    case '_--':
                        return this.unparserML(tree.left) + '<mo>--</mo>';
                    case ".'":
                        return '<msup><mrow>' + this.unparserML(tree.left) + '</mrow><mrow><mi>T</mi></mrow></msup>';
                    case "'":
                        return '<msup><mrow>' + this.unparserML(tree.left) + '</mrow><mrow><mi>H</mi></mrow></msup>';
                    case 'NAME':
                        return '<mi>' + substGreek(tree.id) + '</mi>';
                    case 'LIST':
                        return `<mtable>${tree.list.map((value: any) => `<mtr><mtd>${this.unparserML(value)}</mtd></mtr>`).join('')}</mtable>`;
                    case 'RANGE':
                        if (tree.start && tree.stop) {
                            if (tree.stride) {
                                return this.unparserML(tree.start) + '<mo>:</mo>' + this.unparserML(tree.stride) + '<mo>:</mo>' + this.unparserML(tree.stop);
                            } else {
                                return this.unparserML(tree.start) + '<mo>:</mo>' + this.unparserML(tree.stop);
                            }
                        } else {
                            return '<mo>:</mo>';
                        }
                    case 'ARG':
                        if (tree.args.length === 0) {
                            return this.unparserML(tree.expr) + '<mrow><mo>(</mo><mo>)</mo></mrow>';
                        } else {
                            const arglist = tree.args.map((arg: any) => this.unparserML(arg)).join('<mo>,</mo>');
                            if (tree.expr.type === 'NAME') {
                                const aliasTreeName = this.aliasName(tree.expr.id);
                                if (aliasTreeName in this.baseFunctionTable && this.baseFunctionTable[aliasTreeName].unparserML) {
                                    return this.baseFunctionTable[aliasTreeName].unparserML!(tree);
                                } else {
                                    return '<mi>' + substGreek(tree.expr.id) + '</mi><mrow><mo>(</mo>' + arglist + '<mo>)</mo></mrow>';
                                }
                            } else {
                                return this.unparserML(tree.expr) + '<mrow><mo>(</mo>' + arglist + '<mo>)</mo></mrow>';
                            }
                        }
                    case 'CmdWList':
                        return '<mtext>' + tree.id + ' ' + tree.args.map((arg: any) => this.unparserML(arg)).join(' ') + '</mtext>';
                    default:
                        return '<mi>invalid</mi>';
                }
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
    public UnparseML(tree: any, display: 'inline' | 'block' = 'block'): string {
        let result: string = this.unparserML(tree);
        result = result.replace(/\<mo\>\(\<\/mo\>\<mi\>error\<\/mi\><\mi\>error\<\/mi\>\<mi\>i\<\/mi\>\<mo\>\)\<\/mo\>/gi, '<mi>error</mi>');
        return `<math xmlns = "http://www.w3.org/1998/Math/MathML" display="${display}">${result}</math>`;
    }

    public toMathML(text: string, display: 'inline' | 'block' = 'block'): string {
        return this.UnparseML(this.Parse(text), display);
    }
}
