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
 * baseFunctionTable type
 */
export type TBaseFunctionTableEntry = {
    mapper?: boolean,
    ev?: Array<boolean>,
    func: Function
};
export type TBaseFunctionTable = { [k: string]: TBaseFunctionTableEntry };

/**
 * TEvaluatorConfig type
 */
type TAliasNameTable = Record<string, RegExp>;
export type TEvaluatorConfig = {
    aliasTable?: TAliasNameTable,
    externalFuctionTable?: TBaseFunctionTable
};

/**
 * Abstract Syntax Tree nodes
 */
export type NodeExpr = NodeName | NodeArgExpr | NodeOperation | NodeList;

interface NodeRange {
    start: NodeExpr | null;
    stop: NodeExpr | null;
    stride: NodeExpr | null;
}

interface PrimaryNode {
    type: string | number;
}

interface NodeReserved extends PrimaryNode { }

export interface NodeName extends PrimaryNode {
    type: "NAME";
    id: string;
}

interface NodeCmdWList extends PrimaryNode {
    type: "CmdWList";
    id: string;
    args: Array<CharString>;
}

export interface NodeArgExpr extends PrimaryNode {
    type: "ARG";
    expr: NodeExpr;
    args: Array<NodeExpr>;
}

export type NodeOperation = UnaryOperation | BinaryOperation;

type UnaryOperation = UnaryOperationL | UnaryOperationR;

interface UnaryOperationR extends PrimaryNode {
    right: NodeExpr;
}

interface UnaryOperationL extends PrimaryNode {
    left: NodeExpr;
}

interface BinaryOperation extends PrimaryNode {
    left: NodeExpr;
    right: NodeExpr;
}

export interface NodeList {
    list: Array<NodeExpr>;
}

/**
* External parser declarations (defined in parser body)
*/
declare global {
    var EvaluatorPointer: any;
    const commandsTable: string[];
}

/**
* Evaluator object
* It is implemented as a class but cannot be instantiated more than one time
* simultaneously.
*/
export class Evaluator {

    /**
     * After run Parser or Evaluate method, the exitStatus property will contains
     * exit state of method.
     */
    public static response = {
        INFO: -2,
        WARNING: -1,
        OK: 0,
        LEX_ERROR: 1,
        PARSER_ERROR: 2,
        EVAL_ERROR: 3
    };

    public debug: boolean = false;
    private readonly nativeNameTable: { [k: string]: any } = {
        'false': ComplexDecimal.false(),
        'true': ComplexDecimal.true(),
        'i': ComplexDecimal.onei(),
        'I': ComplexDecimal.onei(),
        'j': ComplexDecimal.onei(),
        'J': ComplexDecimal.onei(),
        'e': ComplexDecimal.e(),
        'pi': ComplexDecimal.pi(),
        'inf': ComplexDecimal.inf_0(),
        'Inf': ComplexDecimal.inf_0(),
        'NaN': ComplexDecimal.NaN_0(),
    };
    private nameTable: { [k: string]: any } = {};
    private aliasTable: TAliasNameTable;
    public baseFunctionTable: TBaseFunctionTable = {};
    public localTable: { [k: string]: any } = {};
    private readonly parser: { parse: (input: string) => any } = Parser;
    exitStatus: number = Evaluator.response.OK;
    exitMessage: string = "";
    private readonly opTable: { [k: string]: Function } = {
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
        '.\'': Tensor.transpose,
        '\'': Tensor.ctranspose,
        '<': Tensor.lt,
        '<=': Tensor.lte,
        '==': Tensor.eq,
        '>=': Tensor.gte,
        '>': Tensor.gt,
        '!=': Tensor.ne,
        '&&': Tensor.and,
        '||': Tensor.or,
    };

    readonly nodeString = CharString.parse;
    readonly isString = CharString.isThis;
    readonly unparseString = CharString.unparse;
    readonly unparseStringML = CharString.unparseML;
    readonly removeQuotes = CharString.removeQuotes;
    readonly nodeNumber = ComplexDecimal.parse;
    readonly newNumber = ComplexDecimal.newThis;
    readonly isNumber = ComplexDecimal.isThis;
    readonly unparseNumber = ComplexDecimal.unparse;
    readonly unparseNumberML = ComplexDecimal.unparseML;
    readonly isTensor = MultiArray.isThis;
    readonly isRange = MultiArray.isRange;
    readonly unparseTensor = MultiArray.unparse;
    readonly unparseTensorML = MultiArray.unparseML;
    readonly evaluateTensor = MultiArray.evaluate;
    readonly mapTensor = MultiArray.map;
    readonly subTensor = MultiArray.subMatrix;
    readonly expandRange = MultiArray.expandRange;
    readonly firstRow = MultiArray.firstRow;
    readonly appendRow = MultiArray.appendRow;
    readonly tensor0x0 = MultiArray.mat_0x0;

    /**
     * Evaluator object constructor
     * @param config Evaluator configuration
     */
    constructor(config?: TEvaluatorConfig) {
        global.EvaluatorPointer = this;
        /* Set opTable aliases */
        this.opTable['.+'] = this.opTable['+'];
        this.opTable['.-'] = this.opTable['-'];
        this.opTable['.÷'] = this.opTable['./'];
        this.opTable['÷'] = this.opTable['/'];
        this.opTable['**'] = this.opTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.opTable['~='] = this.opTable['!='];
        /* Load nativeNameTable and constantsTable in nameTable */
        this.ReloadNativeTable();
        /* Define function operators */
        for (let func in Tensor.twoMoreOpFunction) {
            this.DefBinMoreOpFunction(func, Tensor.twoMoreOpFunction[func]);
        }
        for (let func in Tensor.binaryOpFunction) {
            this.DefBinOpFunction(func, Tensor.binaryOpFunction[func]);
        }
        for (let func in Tensor.unaryOpFunction) {
            this.DefUnOpFunction(func, Tensor.unaryOpFunction[func]);
        }
        /* Define function mappers */
        for (let func in ComplexDecimal.mapFunction) {
            this.defFunction(func, ComplexDecimal.mapFunction[func], true);
        }
        /* Define other functions */
        for (let func in ComplexDecimal.twoArgFunction) {
            this.defFunction(func, ComplexDecimal.twoArgFunction[func]);
        }
        for (let func in MultiArray.functions) {
            this.defFunction(func, MultiArray.functions[func]);
        }
        this.set(config);
    }

    set(config?: TEvaluatorConfig): void {
        if (config) {
            if (config.aliasTable) {
                this.aliasTable = config.aliasTable;
                this.aliasName = (name: string): string => {
                    let result = false;
                    let aliasname = '';
                    for (let i in this.aliasTable) {
                        if (this.aliasTable[i].test(name)) {
                            result = true;
                            aliasname = i;
                            break;
                        }
                    }
                    if (result) {
                        return aliasname;
                    }
                    else {
                        return name;
                    }
                }
            }
            else {
                this.aliasName = (name: string): string => name;
            }
            if (config.externalFuctionTable) {
                Object.assign(this.baseFunctionTable, config.externalFuctionTable);
            }
        }
        else {
            this.aliasName = (name: string): string => name;
        }
    }

    aliasName: (name: string) => string = (name: string): string => name;

    ReloadNativeTable(): void {
        // Insert nativeNameTable in nameTable
        for (let name in this.nativeNameTable) {
            this.nameTable[name] = { args: [], expr: this.nativeNameTable[name] };
        }
        // Insert constantsTable in nameTable
        for (let name in constantsTable) {
            this.nameTable[constantsTable[name][0]] = { args: [], expr: this.newNumber(constantsTable[name][1], 0) };
        }
    }

    Restart(): void {
        this.nameTable = {};
        this.localTable = {};
        this.ReloadNativeTable();
    }

    Parse(input: string): any {
        return this.parser.parse(input);
    }

    nodeReserved(nodeid: string): NodeReserved {
        return { type: nodeid }
    }

    nodeName(nodeid: string): NodeName {
        return { type: 'NAME', id: nodeid.replace(/(\r\n|[\n\r])|[\ ]/gm, "") }
    }

    nodeCmdWList(nodename: NodeName, nodelist: NodeList): NodeCmdWList {
        return { type: 'CmdWList', id: nodename.id, args: (nodelist) ? (nodelist.list as any) : [] };
    }

    nodeArgExpr(nodeexpr: any, nodelist?: any): NodeArgExpr {
        return { type: 'ARG', expr: nodeexpr, args: (nodelist) ? nodelist.list : [] }
    }
    //https://www.mathworks.com/help/matlab/ref/end.html
    nodeRange(left: any, ...right: any): NodeRange {
        if (right.length == 1) {
            return { start: left, stop: right[0], stride: null };
        }
        else if (right.length == 2) {
            return { start: left, stop: right[1], stride: right[0] };
        }
        else {
            throw new Error("invalid range");
        }
    }

    nodeOp(op: string, data1: any, data2: any): NodeOperation {
        switch (op) {
            case '.+':
            case '+':
            case '.-':
            case '-':
            case '.*':
            case '*':
            case './':
            case '/':
            case '.÷':
            case '÷':
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
            case '.\'':
            case '\'':
            case '_++':
            case '_--':
                return { type: op, left: data1 };
            default:
                return { type: 'INVALID' } as NodeOperation;
        }
    }

    nodeListFirst(node?: any): NodeList {
        if (node) {
            return { list: [node] };
        }
        else {
            return { list: [] };
        }
    }

    nodeList(lnode: any, node: any): NodeList {
        lnode.list.push(node);
        return lnode;
    }

    nodeFirstRow(row: any): MultiArray {
        if (row) {
            return this.firstRow(row.list);
        }
        else {
            return this.tensor0x0();
        }
    }

    nodeAppendRow(matrix: any, row: any): MultiArray {
        if (row) {
            return this.appendRow(matrix, row.list);
        }
        else {
            return matrix;
        }
    }

    validateAssignment(tree: any): any {
        if ((tree.type == 'NAME') || ((tree.type == 'ARG') && (tree.expr.type == 'NAME'))) {
            return tree;
        }
        else {
            throw new Error("parse error: invalid left hand side of assignment.");
        }
    }

    DefUnOpFunction(name: string, func: Function) {
        this.baseFunctionTable[name] = {
            mapper: false,
            func: (...operand: any) => {
                if (operand.length == 1) {
                    return func(operand[0]);
                }
                else {
                    throw new Error(`Invalid call to ${name}.`);
                }
            }
        }
    }

    DefBinOpFunction(name: string, func: Function) {
        this.baseFunctionTable[name] = {
            mapper: false,
            func: (left: any, ...right: any) => {
                if (right.length == 1) {
                    return func(left, right[0]);
                }
                else {
                    throw new Error(`Invalid call to ${name}.`);
                }
            }
        }
    }

    DefBinMoreOpFunction(name: string, func: Function) {
        this.baseFunctionTable[name] = {
            mapper: false,
            func: (left: any, ...right: any) => {
                if (right.length == 1) {
                    return func(left, right[0]);
                }
                else if (right.length > 1) {
                    let result = func(left, right[0]);
                    for (let i = 1; i < right.length; i++) {
                        result = func(result, right[i]);
                    }
                    return result;
                }
                else {
                    throw new Error('Invalid call to "+name+".');
                }
            }
        }
    }

    defFunction(name: string, func: Function, map?: boolean) {
        this.baseFunctionTable[name] = {
            mapper: (map) ? true : false,
            func
        }
    }

    Unparse(tree: any): string {
        try {
            if ('list' in tree) {
                let list = "";
                for (let i = 0; i < tree.list.length; i++) {
                    list += this.Unparse(tree.list[i]) + "\n";
                }
                return list;
            }
            else if (this.isNumber(tree)) { // NUMBER
                return this.unparseNumber(tree);
            }
            else if (this.isString(tree)) { // STRING
                return this.unparseString(tree);
            }
            else if (this.isTensor(tree)) { // MATRIX
                return this.unparseTensor(tree, this);
            }
            else if (this.isRange(tree)) { // RANGE
                if (tree.start && tree.stop) {
                    if (tree.stride) {
                        return this.Unparse(tree.start) + ":" + this.Unparse(tree.stride) + ":" + this.Unparse(tree.stop);
                    }
                    else {
                        return this.Unparse(tree.start) + ":" + this.Unparse(tree.stop);
                    }
                }
                else {
                    return ":";
                }
            }
            else {
                let arglist: string;
                switch (tree.type) {
                    case ':':
                    case '!':
                    case '~':
                        return tree.type;
                    case '.+':
                    case '+':
                    case '.-':
                    case '-':
                    case '.*':
                    case '*':
                    case './':
                    case '/':
                    case '.÷':
                    case '÷':
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
                        return "(" + this.Unparse(tree.right) + ")";
                    case '!':
                    case '~':
                        return tree.type + this.Unparse(tree.right);
                    case '+_':
                        return "+" + this.Unparse(tree.right);
                    case '-_':
                        return "-" + this.Unparse(tree.right);
                    case '++_':
                        return "++" + this.Unparse(tree.right);
                    case '--_':
                        return "--" + this.Unparse(tree.right);
                    case '.\'':
                    case '\'':
                        return this.Unparse(tree.left) + tree.type;
                    case '_++':
                        return this.Unparse(tree.left) + "++";
                    case '_--':
                        return this.Unparse(tree.left) + "--";
                    case 'NAME':
                        return tree.id;
                    case 'ARG':
                        arglist = "";
                        for (let i = 0; i < tree.args.length; i++) {
                            arglist += this.Unparse(tree.args[i]) + ',';
                        }
                        return this.Unparse(tree.expr) + "(" + arglist.substring(0, arglist.length - 1) + ")";
                    case 'CmdWList':
                        arglist = "";
                        for (let i = 0; i < tree.args.length; i++) {
                            arglist += this.Unparse(tree.args[i]) + ' ';
                        }
                        return tree.id + arglist.substring(0, arglist.length - 1);
                    default:
                        return "<INVALID>";
                }
            }
        }
        catch (e) {
            return "<ERROR>";
        }
    }

    Evaluator(tree: any, local: boolean, fname: string): any {
        let aliasTreeName: string;
        if (this.debug) console.log("Evaluator(tree:" + JSON.stringify(tree, null, 2) + ",local:" + local + ",fname:" + fname + ")");
        if ('list' in tree) {
            let result = { list: new Array(tree.list.length) };
            for (let i = 0; i < tree.list.length; i++) {
                // Convert undefined name, defined in word-list command, to word-list command.
                // (Null length word-list command)
                if (
                    tree.list[i].type == 'NAME' &&
                    !((local && this.localTable[fname]) && this.localTable[fname][tree.list[i].id]) &&
                    !(tree.list[i].id in this.nameTable) &&
                    (commandsTable.indexOf(tree.list[i].id) >= 0)
                ) {
                    tree.list[i].type = 'CmdWList';
                    tree.list[i]['args'] = [];
                }
                result.list[i] = this.Evaluator(tree.list[i], local, fname);
            }
            return result;
        }
        else if (this.isNumber(tree) || this.isString(tree)) { // NUMBER or STRING
            return tree;
        }
        else if (this.isTensor(tree)) { // MATRIX
            return this.evaluateTensor(tree, this, fname);
        }
        else if (this.isRange(tree)) { // RANGE
            return this.expandRange(
                this.Evaluator(tree.start, local, fname),
                this.Evaluator(tree.stop, local, fname),
                tree.stride ? this.Evaluator(tree.stride, local, fname) : null
            );
        }
        else {
            let result;
            switch (tree.type) {
                case '.+':
                case '+':
                case '.-':
                case '-':
                case '.*':
                case '*':
                case './':
                case '/':
                case '.÷':
                case '÷':
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
                    return this.opTable[tree.type](this.Evaluator(tree.right, local, fname));
                case '.\'':
                case '\'':
                case '_++':
                case '_--':
                    return this.opTable[tree.type](this.Evaluator(tree.left, local, fname));
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
                    let op = tree.type.substring(0, tree.type.length - 1);
                    let left;
                    let id;
                    let args;
                    if (tree.left.type == 'NAME') {
                        left = tree.left;
                        id = tree.left.id;
                        aliasTreeName = this.aliasName(tree.left.id);
                        args = [];
                    }
                    else { // (tree.left.type=='ARG') && (tree.left.expr.type=='NAME')
                        left = tree.left.expr;
                        id = tree.left.expr.id
                        aliasTreeName = this.aliasName(tree.left.expr.id);
                        args = tree.left.args;
                    }
                    if (aliasTreeName in this.baseFunctionTable) {
                        throw new Error("assign to reserved name: " + aliasTreeName);
                    }
                    else {
                        if (args.length == 0) {
                            // Name definition
                            try {
                                this.nameTable[id] = { args: [], expr: this.Evaluator(tree.right, false, fname) };
                                return this.nodeOp('=', left, this.nameTable[id].expr);
                            }
                            catch (e) {
                                this.nameTable[id] = { args: [], expr: tree.right };
                                throw e;
                            }
                        }
                        else {
                            if ((this.nameTable[id]) && (this.isTensor(this.nameTable[id].expr))) {
                                // Matrix indexing refer
                                console.log("matrix indexing refer");
                                return tree; /** */
                            }
                            else {
                                // Function definition
                                // Test if args is a list of NAME
                                let pass = true;
                                for (let i = 0; i < args.length; i++) {
                                    pass = pass && args[i].type == 'NAME';
                                    if (!pass) throw new Error("invalid arguments in function definition");
                                }
                                this.nameTable[id] = { args: args, expr: tree.right };
                                return tree;
                            }
                        }
                    }
                    break;
                case 'NAME':
                    if ((local && this.localTable[fname]) && this.localTable[fname][tree.id]) { // Defined in localTable
                        return this.localTable[fname][tree.id];
                    }
                    else if (tree.id in this.nameTable) { // Defined in nameTable
                        if (this.nameTable[tree.id].args.length == 0) { // Defined as name
                            return this.Evaluator(this.nameTable[tree.id].expr, false, fname);
                        }
                        else { // Defined as function name
                            throw new Error("calling " + tree.id + " function without arguments list");
                        }
                    }
                case 'ARG':
                    if (tree.expr.type == 'NAME') { // Matrix indexing or function call
                        aliasTreeName = this.aliasName(tree.expr.id);
                        let argumentsList: any[] = [];
                        if (aliasTreeName in this.baseFunctionTable) { // Is base function
                            if (typeof this.baseFunctionTable[aliasTreeName]['mapper'] !== 'undefined') {  // arguments evaluated
                                for (let i = 0; i < tree.args.length; i++) { // Evaluate arguments list
                                    argumentsList[i] = this.Evaluator(tree.args[i], local, fname);
                                }
                                if (this.baseFunctionTable[aliasTreeName].mapper && argumentsList.length != 1) { // Error if mapper and #arguments!=1 (Invalid call)
                                    throw new Error("Invalid call to " + aliasTreeName + ".");
                                }
                                if ((argumentsList.length == 1) && ('array' in argumentsList[0]) && this.baseFunctionTable[aliasTreeName].mapper) { // Test if is mapper
                                    return this.mapTensor(argumentsList[0], this.baseFunctionTable[aliasTreeName].func);
                                }
                                else {
                                    return this.baseFunctionTable[aliasTreeName].func(...argumentsList);
                                }
                            }
                            else {   // arguments selectively evaluated
                                for (let i = 0; i < tree.args.length; i++) { // Evaluate arguments list selectively
                                    argumentsList[i] = (this.baseFunctionTable[aliasTreeName] as any).ev[i] ? this.Evaluator(tree.args[i], local, fname) : tree.args[i];
                                }
                                return this.baseFunctionTable[aliasTreeName].func(...argumentsList, this);
                            }
                        }
                        else if (local && this.localTable[fname] && this.localTable[fname][tree.expr.id]) { // Defined in localTable ****
                            return this.localTable[fname][tree.expr.id];
                        }
                        else if (tree.expr.id in this.nameTable) { // Defined in nameTable
                            if (this.nameTable[tree.expr.id].args.length == 0) { // if is defined name
                                let temp = this.Evaluator(this.nameTable[tree.expr.id].expr, false, fname);
                                if (tree.args.length == 0) {
                                    // Defined name
                                    return temp;
                                }
                                else if (this.isTensor(temp)) {
                                    // Defined matrix indexing
                                    for (let i = 0; i < tree.args.length; i++) { // Evaluate index list
                                        argumentsList[i] = this.Evaluator(tree.args[i], local, fname)
                                    }
                                    return this.subTensor(temp, tree.expr.id, argumentsList);
                                }
                                else {
                                    throw new Error("invalid matrix indexing or function arguments");
                                }
                            }
                            else { // Else is defined function
                                if (this.nameTable[tree.expr.id].args.length != tree.args.length) {
                                    throw new Error("invalid number of arguments in function " + tree.expr.id);
                                }
                                this.localTable[tree.expr.id] = {}; // create localTable entry
                                for (let i = 0; i < tree.args.length; i++) { // Evaluate defined function arguments list
                                    this.localTable[tree.expr.id][this.nameTable[tree.expr.id].args[i].id] = this.Evaluator(tree.args[i], true, fname);
                                }
                                let temp = this.Evaluator(this.nameTable[tree.expr.id].expr, true, tree.expr.id);
                                delete this.localTable[tree.expr.id]; // delete localTable entry
                                return temp;
                            }
                        }
                        else {
                            throw new Error("'" + tree.id + "' undefined");
                        }
                    }
                    else { // literal indexing, ex: [1,2;3,4](1,2)
                        console.log("literal indexing")
                        return tree; /** */
                    }
                case 'CmdWList':
                    switch (tree.id) {
                        case 'help':
                            this.exitStatus = Evaluator.response.INFO;
                            // this.exitMessage = helpCommand(tree.args);
                            break;
                        case 'doc':
                            this.exitStatus = Evaluator.response.INFO;
                            // this.exitMessage = docCommand(tree.args);
                            break;
                    }
                    return tree;
                default:
                    throw new Error("evaluating undefined type '" + tree.type + "'");
            }
        }
    }

    Evaluate(tree: any): any {
        try {
            this.exitStatus = Evaluator.response.OK;
            let result = this.Evaluator(tree, false, "");
            const assign_op = ['=', '+=', '.+=', '-=', '.-=', '*=', '/=', '\\=', '^=', '.*=', './=', '.\\=', '.^=', '.**=', '|=', '&='];
            if (assign_op.indexOf(result.type) == -1) {
                this.nameTable['ans'] = { args: [], expr: result };
            }
            if (this.exitStatus >= 0) { // not (WARNING or INFO)
                this.exitMessage = "";
            }
            return result;
        }
        catch (e) {
            this.exitStatus = Evaluator.response.EVAL_ERROR;
            throw e;
        }
    }

    unparserML(tree: any): string {
        try {
            if ('list' in tree) {
                let list = "<mtable>";
                for (let i = 0; i < tree.list.length; i++) {
                    list += "<mtr><mtd>" + this.unparserML(tree.list[i]) + "</mtd></mtr>";
                }
                return list + "</mtable>";
            }
            else if (this.isNumber(tree)) { // NUMBER
                return this.unparseNumberML(tree);
            }
            else if (this.isString(tree)) { // STRING
                return this.unparseStringML(tree);
            }
            else if (this.isTensor(tree)) { // MATRIX
                return this.unparseTensorML(tree, this);
            }
            else if (this.isRange(tree)) { // RANGE
                if (tree.start && tree.stop) {
                    if (tree.stride) {
                        return this.unparserML(tree.start) + "<mo>:</mo>" + this.unparserML(tree.stride) + "<mo>:</mo>" + this.unparserML(tree.stop);
                    }
                    else {
                        return this.unparserML(tree.start) + "<mo>:</mo>" + this.unparserML(tree.stop);
                    }
                }
                else {
                    return "<mo>:</mo>";
                }
            }
            else {
                let arglist: string;
                switch (tree.type) {
                    case ':':
                    case '!':
                    case '~':
                        return "<mo>" + tree.type + "</mo>";
                    case '.+':
                    case '+':
                    case '.-':
                    case '-':
                    case '.*':
                    case './':
                    case '.÷':
                    case '÷':
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
                        return this.unparserML(tree.left) + "<mo>" + tree.type + "</mo>" + this.unparserML(tree.right);
                    case '<=':
                        return this.unparserML(tree.left) + "<mo>&le;</mo>" + this.unparserML(tree.right);
                    case '>=':
                        return this.unparserML(tree.left) + "<mo>&ge;</mo>" + this.unparserML(tree.right);
                    case '!=':
                    case '~=':
                        return this.unparserML(tree.left) + "<mo>&ne;</mo>" + this.unparserML(tree.right);
                    case '()':
                        return "<mo>(</mo>" + this.unparserML(tree.right) + "<mo>)</mo>";
                    case '*':
                        return this.unparserML(tree.left) + "<mo>&times;</mo>" + this.unparserML(tree.right);
                    case '/':
                        return "<mfrac><mrow>" + this.unparserML(tree.left) + "</mrow><mrow>" + this.unparserML(tree.right) + "</mrow></mfrac>";
                    case '**':
                    case '^':
                        return "<msup><mrow>" + this.unparserML(tree.left) + "</mrow><mrow>" + this.unparserML(tree.right) + "</mrow></msup>";
                    case ':':
                    case '!':
                    case '~':
                        return "<mo>" + tree.type + "</mo>" + this.unparserML(tree.right);
                    case '+_':
                        return "<mo>+</mo>" + this.unparserML(tree.right);
                    case '-_':
                        return "<mo>-</mo>" + this.unparserML(tree.right);
                    case '++_':
                        return "<mo>++</mo>" + this.unparserML(tree.right);
                    case '--_':
                        return "<mo>--</mo>" + this.unparserML(tree.right);
                    case '_++':
                        return this.unparserML(tree.right) + "<mo>++</mo>";
                    case '_--':
                        return this.unparserML(tree.right) + "<mo>--</mo>";
                    case '.\'':
                        return "<msup><mrow>" + this.unparserML(tree.left) + "</mrow><mrow><mi>T</mi></mrow></msup>";
                    case '\'':
                        return "<msup><mrow>" + this.unparserML(tree.left) + "</mrow><mrow><mi>H</mi></mrow></msup>";
                    case 'NAME':
                        return "<mi>" + substGreek(tree.id) + "</mi>";
                    case 'ARG':
                        if (tree.args.length == 0) {
                            return this.unparserML(tree.expr) + "<mrow><mo>(</mo><mo>)</mo></mrow>";
                        }
                        else {
                            arglist = "";
                            for (let i = 0; i < tree.args.length; i++) {
                                arglist += this.unparserML(tree.args[i]) + "<mo>,</mo>";
                            }
                            arglist = arglist.substring(0, arglist.length - 10);
                            if (tree.expr.type == 'NAME') {
                                let aliasTreeName = this.aliasName(tree.expr.id);
                                switch (aliasTreeName) {
                                    case "abs":
                                        return "<mrow><mo>|</mo>" + this.unparserML(tree.args[0]) + "<mo>|</mo></mrow>"
                                    case "conj":
                                        return "<mover><mrow>" + this.unparserML(tree.args[0]) + "</mrow><mo>&OverBar;</mo></mover>"
                                    case "sqrt":
                                        return "<msqrt><mrow>" + this.unparserML(tree.args[0]) + "</mrow></msqrt>"
                                    case "root":
                                        return "<mroot><mrow>" + this.unparserML(tree.args[0]) + "</mrow><mrow>" + this.unparserML(tree.args[1]) + "</mrow></mroot>"
                                    case "exp":
                                        return "<msup><mi>e</mi><mrow>" + this.unparserML(tree.args[0]) + "</mrow></msup>"
                                    case "log":
                                        return "<msub><mi>log</mi><mrow>" + this.unparserML(tree.args[0]) + "</mrow></msub><mrow>" + this.unparserML(tree.args[1]) + "</mrow>"
                                    case "sum":
                                        return "<mrow><munderover><mo>&#x2211;</mo><mrow>" + this.unparserML(tree.args[0]) + "<mo>=</mo>" + this.unparserML(tree.args[1]) + "</mrow>" + this.unparserML(tree.args[2]) + "</munderover></mrow>" + this.unparserML(tree.args[3])
                                    case "prod":
                                        return "<mrow><munderover><mo>&#x220F;</mo><mrow>" + this.unparserML(tree.args[0]) + "<mo>=</mo>" + this.unparserML(tree.args[1]) + "</mrow>" + this.unparserML(tree.args[2]) + "</munderover></mrow>" + this.unparserML(tree.args[3])
                                    case "gamma":
                                        return "<mi>&Gamma;</mi><mrow><mo>(</mo>" + arglist + "<mo>)</mo></mrow>"
                                    case "factorial":
                                        return "<mrow><mo>(</mo>" + this.unparserML(tree.args[0]) + "<mo>)</mo></mrow><mo>!</mo>";
                                    case "binomial":
                                        return "<mrow><mo>(</mo><mtable><mtr><mtd>" + this.unparserML(tree.args[0]) + "</mtd></mtr><mtr><mtd>" + this.unparserML(tree.args[1]) + "</mtd></mtr></mtable><mo>)</mo></mrow>";
                                    default:
                                        return "<mi>" + substGreek(tree.expr.id) + "</mi><mrow><mo>(</mo>" + arglist + "<mo>)</mo></mrow>"
                                }
                            }
                            else {
                                return "<mi>" + this.unparserML(tree.expr) + "</mi><mrow><mo>(</mo>" + arglist + "<mo>)</mo></mrow>";
                            }
                        }
                    case 'CmdWList':
                        arglist = " ";
                        for (let i = 0; i < tree.args.length; i++) {
                            arglist += this.Unparse(tree.args[i]) + ' ';
                        }
                        return "<mtext>" + tree.id + " " + arglist.substring(0, arglist.length - 1) + "</mtext>";
                    default:
                        return "<mi>invalid</mi>";
                }
            }
        }
        catch (e) {
            if (this.debug) {
                throw e;
            }
            else {
                return "<mi>error</mi>";
            }
        }
    }

    UnparseML(tree: any): string {
        let result: string = this.unparserML(tree);
        result = result.replace(/\<mo\>\(\<\/mo\>\<mi\>error\<\/mi\><\mi\>error\<\/mi\>\<mi\>i\<\/mi\>\<mo\>\)\<\/mo\>/ig, "<mi>error</mi>");
        return "<math xmlns = 'http://www.w3.org/1998/Math/MathML' display='block'>" + result + "</math>";
    }

}
