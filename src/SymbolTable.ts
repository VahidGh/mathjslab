import * as AST from './AST';

export type FunctionTableEntry = {
    mapper?: boolean;
    ev: boolean[];
    func: Function;
    unparserMathML?: (tree: AST.NodeExpr) => string;
};

export type EntryType = 'name' | 'function';

export interface PrimarySymbolTableEntry {
    type: EntryType;
}

export interface ValueSymbolTableEntry extends PrimarySymbolTableEntry {
    type: 'name';
    expression?: AST.NodeExpr;
}

export interface FunctionSymbolTableEntry extends PrimarySymbolTableEntry {
    type: 'function';
    parameter?: AST.NodeIdentifier[];
    expression?: AST.NodeExpr;
}

export type SymbolTableEntry = ValueSymbolTableEntry | FunctionSymbolTableEntry;

export type SymbolTableType = {
    table: Record<string, SymbolTableEntry>;
    parent: SymbolTable | null;
    child: SymbolTable[];
    scope: string | null;
};

export class SymbolTable {
    Table: SymbolTableType;

    constructor(parent?: SymbolTable | null, scope?: string, node?: any) {
        const thisParent = typeof parent !== 'undefined' ? parent : null;
        if (thisParent) {
            thisParent.Table.child.push(this);
        }
        this.Table = {
            table: {},
            parent: thisParent,
            child: [],
            scope: scope ?? null,
        };
        if (typeof node !== 'undefined') {
            node['symtab'] = this;
        }
    }

    public getIdentifier(id: string): [SymbolTableEntry, string] {
        return [{ type: 'name' }, 'scope'];
    }
}
