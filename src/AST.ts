import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { MultiArray } from './MultiArray';

/**
 * AST (Abstract Syntax Tree).
 */

/**
 * Operator type.
 */
export type TOperator =
    | '+'
    | '-'
    | '.*'
    | '*'
    | './'
    | '/'
    | '.\\'
    | '\\'
    | '.^'
    | '^'
    | '.**'
    | '**'
    | '<'
    | '<='
    | '=='
    | '>='
    | '>'
    | '!='
    | '~='
    | '&'
    | '|'
    | '&&'
    | '||'
    | '='
    | '+='
    | '-='
    | '*='
    | '/='
    | '\\='
    | '^='
    | '**='
    | '.*='
    | './='
    | '.\\='
    | '.^='
    | '.**='
    | '&='
    | '|='
    | '()'
    | '!'
    | '~'
    | '+_'
    | '-_'
    | '++_'
    | '--_'
    | ".'"
    | "'"
    | '_++'
    | '_--';

/**
 * Common primary node.
 */
export interface PrimaryNode {
    type: string | number;
    parent?: any;
    index?: number;
    omitOut?: boolean;
    start?: { line: number; column: number };
    stop?: { line: number; column: number };
}

export type NodeInput = NodeExpr;

export interface NodeNull {
    type: 'NULL';
}

/**
 * Expression node.
 */
export type NodeExpr = NodeReserved | NodeIdentifier | NodeArgExpr | NodeOperation | NodeList | NodeRange | NodeReturnList | MultiArray | ComplexDecimal | CharString | null | any;

/**
 * Reserved node.
 */
export interface NodeReserved extends PrimaryNode {}

/**
 * Name node.
 */
export interface NodeIdentifier extends PrimaryNode {
    type: 'IDENT';
    id: string;
}

/**
 * Command word list node.
 */
export interface NodeCmdWList extends PrimaryNode {
    type: 'CMDWLIST';
    id: string;
    args: Array<CharString>;
    omitAns?: boolean;
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
export interface NodeRange extends PrimaryNode {
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
export type UnaryOperation = UnaryOperationL | UnaryOperationR;

/**
 * Right unary operation node.
 */
export interface UnaryOperationR extends PrimaryNode {
    right: NodeExpr;
}

/**
 * Left unary operation node.
 */
export interface UnaryOperationL extends PrimaryNode {
    left: NodeExpr;
    omitAns?: boolean; // To omit result to be stored in 'ans' variable.
}

/**
 * Binary operation.
 */
export interface BinaryOperation extends PrimaryNode {
    left: NodeExpr;
    right: NodeExpr;
    omitAns?: boolean; // To omit result to be stored in 'ans' variable.
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

export interface NodeIf extends PrimaryNode {
    type: 'IF';
    expression: NodeExpr[];
    then: NodeList[];
    else: NodeList | null;
    omitAns?: boolean;
}

export interface NodeElseIf extends PrimaryNode {
    type: 'ELSEIF';
    expression: NodeExpr;
    then: NodeList;
}

export interface NodeElse extends PrimaryNode {
    type: 'ELSE';
    else: NodeList;
}

/**
 * AST (Abstract Syntax Tree) constructor methods.
 */

/**
 * Create null node.
 * @returns
 */
export const nodeNull = (): NodeNull => {
    return { type: 'NULL' };
};

export const nodeString = CharString.create;
export const nodeNumber = ComplexDecimal.parse;
export const firstRow = MultiArray.firstRow;
export const appendRow = MultiArray.appendRow;
export const emptyArray = MultiArray.emptyArray;

/**
 * Create literal node.
 * @param nodeid
 * @returns
 */
export const nodeLiteral = (nodeid: string): NodeReserved => {
    return { type: nodeid };
};

/**
 * Create name node.
 * @param nodeid
 * @returns
 */
export const nodeIdentifier = (nodeid: string): NodeIdentifier => {
    return {
        type: 'IDENT',
        id: nodeid.replace(/(\r\n|[\n\r])|[\ ]/gm, ''),
    };
};

/**
 * Create command word list node.
 * @param nodename
 * @param nodelist
 * @returns
 */
export const nodeCmdWList = (nodename: NodeIdentifier, nodelist: NodeList): NodeCmdWList => {
    return {
        type: 'CMDWLIST',
        id: nodename.id,
        args: nodelist ? (nodelist.list as any) : [],
        omitAns: true,
    };
};

/**
 * Create expression and arguments node.
 * @param nodeexpr
 * @param nodelist
 * @returns
 */
export const nodeArgExpr = (nodeexpr: any, nodelist?: any): NodeArgExpr => {
    return {
        type: 'ARG',
        expr: nodeexpr,
        args: nodelist ? nodelist.list : [],
    };
};

/**
 * Create range node. If two arguments are passed then it is 'start' and
 * 'stop' of range. If three arguments are passed then it is 'start',
 * 'stride' and 'stop'.
 * @param args 'start' and 'stop' or 'start', 'stride' and 'stop'.
 * @returns NodeRange.
 */
export const nodeRange = (...args: any): NodeRange => {
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
};

/**
 * Create operator node.
 * @param op
 * @param data1
 * @param data2
 * @returns
 */
export const nodeOp = (op: TOperator, data1: any, data2?: any): NodeOperation => {
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
            return { type: op, left: data1, right: data2 };
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
            return { type: op, left: data1, right: data2, omitAns: true };
        case '()':
        case '!':
        case '~':
        case '+_':
        case '-_':
            return { type: op, right: data1 };
        case '++_':
        case '--_':
            return { type: op, right: data1, omitAns: true };
        case ".'":
        case "'":
            return { type: op, left: data1 };
        case '_++':
        case '_--':
            return { type: op, left: data1, omitAns: true };
        default:
            return { type: `INVALID:${op}` } as NodeOperation;
    }
};

/**
 * Create first element of list node.
 * @param node First element of list node.
 * @returns A NodeList.
 */
export const nodeListFirst = (node?: any): NodeList => {
    if (node) {
        const result = {
            type: 'LIST',
            list: [node],
        };
        node.parent = result;
        return result as NodeList;
    } else {
        return {
            type: 'LIST',
            list: [],
        };
    }
};

/**
 * Append node to list node.
 * @param lnode NodeList.
 * @param node Element to append to list.
 * @returns NodeList with element appended.
 */
export const appendNodeList = (lnode: NodeList, node: any): NodeList => {
    node.parent = lnode;
    lnode.list.push(node);
    return lnode;
};

export const nodeList = (list: any[]): NodeList => {
    const result = {
        type: 'LIST',
        list,
    };
    return result as NodeList;
};

/**
 * Create first row of a MultiArray.
 * @param row
 * @returns
 */
export const nodeFirstRow = (row: NodeList, iscell?: boolean): MultiArray => {
    if (row) {
        return firstRow(row.list, iscell);
    } else {
        return emptyArray(iscell);
    }
};

/**
 * Append row to MultiArray.
 * @param M
 * @param row
 * @returns
 */
export const nodeAppendRow = (M: MultiArray, row: NodeList): MultiArray => {
    if (row) {
        return appendRow(M, row.list);
    } else {
        return M;
    }
};

/**
 * Creates NodeReturnList (multiple assignment)
 * @param selector Left side selector function.
 * @returns Return list node.
 */
export const nodeReturnList = (selector: ReturnSelector): NodeReturnList => {
    return {
        type: 'RETLIST',
        selector,
    };
};

export const nodeIfBegin = (expression: any, then: NodeList): NodeIf => {
    return {
        type: 'IF',
        expression: [expression],
        then: [then],
        else: null,
        omitAns: true,
    };
};

export const nodeIfAppendElse = (nodeIf: NodeIf, nodeElse: NodeElse): NodeIf => {
    nodeIf.else = nodeElse.else;
    return nodeIf;
};

export const nodeIfAppendElseIf = (nodeIf: NodeIf, nodeElseIf: NodeElseIf): NodeIf => {
    nodeIf.expression.push(nodeElseIf.expression);
    nodeIf.then.push(nodeElseIf.then);
    return nodeIf;
};

export const nodeElseIf = (expression: any, then: NodeList): NodeElseIf => {
    return {
        type: 'ELSEIF',
        expression,
        then,
    };
};

export const nodeElse = (elseStmt: NodeList): NodeElse => {
    return {
        type: 'ELSE',
        else: elseStmt,
    };
};
