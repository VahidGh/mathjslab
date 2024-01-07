import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { FunctionHandle } from './FunctionHandle';
import { ElementType, MultiArray } from './MultiArray';

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

export type NodeInput = NodeExpr | NodeList | NodeDeclaration | NodeIf;

/**
 * Expression node.
 */
export type NodeExpr = ElementType | NodeIdentifier | NodeIndexExpr | NodeOperation | NodeRange | NodeIndirectRef | NodeReturnList | any;

/**
 * Reserved node.
 */
export interface NodeReserved extends PrimaryNode {}

/**
 * Literal node.
 */
export interface NodeLiteral extends PrimaryNode {}

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
    args: CharString[];
    omitAns?: boolean;
}

/**
 * Expression and arguments node.
 */
export interface NodeIndexExpr extends PrimaryNode {
    type: 'IDX';
    expr: NodeExpr;
    args: NodeExpr[];
    delim: '()' | '{}';
}

/**
 * Range node.
 */
export interface NodeRange extends PrimaryNode {
    type: 'RANGE';
    start_: NodeExpr | null;
    stop_: NodeExpr | null;
    stride_: NodeExpr | null;
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
    list: NodeInput[];
}

export interface NodeIndirectRef extends PrimaryNode {
    type: '.';
    obj: NodeExpr;
    field: (string | NodeExpr)[];
}

export type ReturnSelector = (length: number, index: number) => any;

/**
 * Return list node
 */
export interface NodeReturnList extends PrimaryNode {
    type: 'RETLIST';
    selector: ReturnSelector;
}

export interface NodeFunction extends PrimaryNode {
    type: 'FCN';
    id: string;
    return: NodeInput[];
    parameter: NodeInput[];
    arguments: NodeInput[];
    statements: NodeInput[];
}

export interface NodeArgumentValidation {
    name: NodeIdentifier;
    size: NodeInput[];
    class: NodeIdentifier | null;
    functions: NodeInput[];
    default: NodeExpr; // NodeExpr can be null.
}

export interface NodeArguments {
    attribute: NodeIdentifier | null;
    validation: NodeArgumentValidation[];
}

export interface NodeDeclaration extends PrimaryNode {
    type: 'GLOBAL' | 'PERSIST';
    list: NodeExpr[];
}

export interface NodeIf extends PrimaryNode {
    type: 'IF';
    expression: NodeExpr[];
    then: NodeList[];
    else: NodeList | null;
    omitAns?: boolean;
}

export interface NodeElseIf {
    expression: NodeExpr;
    then: NodeList;
}

export interface NodeElse {
    else: NodeList;
}

/**
 * AST (Abstract Syntax Tree) constructor methods.
 */

export const nodeString = CharString.create;
export const nodeNumber = ComplexDecimal.parse;
export const firstRow = MultiArray.firstRow;
export const appendRow = MultiArray.appendRow;
export const emptyArray = MultiArray.emptyArray;

/**
 * Create literal node.
 * @param type
 * @returns
 */
export const nodeLiteral = (type: string): NodeLiteral => ({ type });

/**
 * Create name node.
 * @param nodeid
 * @returns
 */
export const nodeIdentifier = (id: string): NodeIdentifier => {
    return {
        type: 'IDENT',
        id: id.replace(/(\r\n|[\n\r])|[\ ]/gm, ''),
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
        args: nodelist ? (nodelist.list as CharString[]) : [],
        omitAns: true,
    };
};

/**
 * Create expression and arguments node.
 * @param nodeexpr
 * @param nodelist
 * @returns
 */
export const nodeIndexExpr = (nodeexpr: NodeExpr, nodelist: NodeList | null = null, delimiter: '()' | '{}' = '()'): NodeIndexExpr => {
    return {
        type: 'IDX',
        expr: nodeexpr,
        args: nodelist ? (nodelist.list as NodeExpr[]) : [],
        delim: delimiter,
    };
};

/**
 * Create range node.
 * @param start_
 * @param stop_
 * @param stride_
 * @returns NodeRange.
 */
export const nodeRange = (start_: NodeExpr, stop_: NodeExpr, stride_?: NodeExpr): NodeRange => {
    return {
        type: 'RANGE',
        start_,
        stop_,
        stride_: stride_ ?? null,
    };
};

/**
 * Create operator node.
 * @param op
 * @param data1
 * @param data2
 * @returns
 */
export const nodeOp = (op: TOperator, data1: NodeExpr, data2?: NodeExpr): NodeOperation => {
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
export const nodeListFirst = (node?: NodeInput): NodeList => {
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
export const appendNodeList = (lnode: NodeList, node: NodeInput): NodeList => {
    node!.parent = lnode;
    lnode.list.push(node);
    return lnode;
};

export const nodeList = (list: NodeInput[]): NodeList => {
    return {
        type: 'LIST',
        list,
    };
};

/**
 * Create first row of a MultiArray.
 * @param row
 * @returns
 */
export const nodeFirstRow = (row: NodeList | null = null, iscell?: boolean): MultiArray => {
    if (row) {
        return firstRow(row.list as ElementType[], iscell);
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
export const nodeAppendRow = (M: MultiArray, row: NodeList | null = null): MultiArray => {
    if (row) {
        return appendRow(M, row.list as ElementType[]);
    } else {
        return M;
    }
};

export const nodeIndirectRef = (left: NodeExpr, right: string | NodeExpr): NodeIndirectRef => {
    if (left.type === '.') {
        left.field.push(right);
        return left;
    } else {
        return {
            type: '.',
            obj: left,
            field: [right],
        };
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

export const nodeFunctionHandle = (id: NodeIdentifier | null = null, parameter_list: NodeList | null = null, expression: NodeExpr = null): FunctionHandle => {
    return new FunctionHandle(id ? id.id : null, true, parameter_list ? parameter_list.list : [], expression);
};

export const nodeFunction = (id: NodeIdentifier, return_list: NodeList, parameter_list: NodeList, arguments_list: NodeList, statements_list: NodeList): NodeFunction => {
    return {
        type: 'FCN',
        id: id.id,
        return: return_list.list,
        parameter: parameter_list.list,
        arguments: arguments_list.list,
        statements: statements_list.list,
    };
};

export const nodeArgumentValidation = (
    name: NodeIdentifier,
    size: NodeList,
    cl: NodeIdentifier | null = null,
    functions: NodeList,
    dflt: NodeExpr = null,
): NodeArgumentValidation => {
    return {
        name,
        size: size.list,
        class: cl,
        functions: functions.list,
        default: dflt,
    };
};

export const nodeArguments = (attribute: NodeIdentifier | null, validationList: NodeList): NodeArguments => {
    return {
        attribute,
        validation: validationList.list as unknown as NodeArgumentValidation[],
    };
};

export const nodeDeclarationFirst = (type: 'GLOBAL' | 'PERSIST'): NodeDeclaration => {
    return {
        type,
        list: [],
    };
};

export const nodeAppendDeclaration = (node: NodeDeclaration, declaration: NodeExpr): NodeDeclaration => {
    node.list.push(declaration);
    return node;
};

export const nodeIfBegin = (expression: NodeExpr, then: NodeList): NodeIf => {
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

export const nodeElseIf = (expression: NodeExpr, then: NodeList): NodeElseIf => {
    return {
        expression,
        then,
    };
};

export const nodeElse = (elseStmt: NodeList): NodeElse => {
    return {
        else: elseStmt,
    };
};
