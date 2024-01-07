import * as AST from './AST';

export type FunctionTableEntry = AST.NodeFunction;

export interface VariableTableEntry {
    type: number;
    parameter?: AST.NodeIdentifier[];
    expression?: AST.NodeExpr;
}

export class SymbolTable {
    public static readonly NAME = 1;
    public static readonly FUNCTION_HANDLER = 2;
    public static readonly ANON_FUNCTION_HANDLER = 3;
    variableTable: Record<string, VariableTableEntry>;
    functionTable: Record<string, FunctionTableEntry>;
    parent: SymbolTable | null;
    child: SymbolTable[];
    scope: string | null;

    constructor(parent?: SymbolTable | null, scope?: string | null, node?: any) {
        const thisParent = typeof parent !== 'undefined' ? parent : null;
        if (thisParent) {
            thisParent.child.push(this);
        }
        this.variableTable = {};
        this.functionTable = {};
        this.parent = thisParent;
        this.child = [];
        this.scope = scope ?? null;
        if (typeof node !== 'undefined') {
            node['symtab'] = this;
        }
    }

    public lookupVariable(id: string): [VariableTableEntry, string | null] | null {
        /* eslint-disable-next-line  @typescript-eslint/no-this-alias */
        let table: SymbolTable | null = this;
        while (table !== null) {
            if (typeof table.variableTable[id] !== 'undefined') {
                return [table.variableTable[id], table.scope];
            } else {
                table = table.parent;
            }
        }
        return null;
    }

    public insertVariable(id: string, expression: AST.NodeExpr, parameter?: AST.NodeIdentifier[]): [VariableTableEntry, string | null] {
        this.variableTable[id] = {
            type: parameter ? SymbolTable.FUNCTION_HANDLER : SymbolTable.NAME,
            expression,
            parameter: parameter ?? [],
        };
        return [this.variableTable[id], this.scope];
    }

    public lookupFunction(id: string): [FunctionTableEntry, string | null] | null {
        /* eslint-disable-next-line  @typescript-eslint/no-this-alias */
        let table: SymbolTable | null = this;
        while (table !== null) {
            if (typeof table.functionTable[id] !== 'undefined') {
                return [table.functionTable[id], table.scope];
            } else {
                table = table.parent;
            }
        }
        return null;
    }

    public insertFunction(id: string, entry: FunctionTableEntry): [FunctionTableEntry, string | null] {
        this.functionTable[id] = entry;
        return [this.functionTable[id], this.scope];
    }
}
