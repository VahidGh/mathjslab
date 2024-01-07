import { ComplexDecimal } from './ComplexDecimal';
import { Structure } from './Structure';
import * as AST from './AST';
import { Evaluator } from './Evaluator';

export class FunctionHandle {
    public static readonly FUNCTION_HANDLE = Structure.STRUCTURE + 1;
    public readonly type = FunctionHandle.FUNCTION_HANDLE;
    public parent: any;
    public id: string | null;
    public commat: boolean;
    public parameter: AST.NodeExpr[];
    public expression: AST.NodeExpr;

    constructor(id: string | null = null, commat: boolean = false, parameter: AST.NodeExpr[] | null = null, expression: AST.NodeExpr = null) {
        this.id = id;
        this.commat = commat;
        this.parameter = parameter ?? [];
        this.expression = expression;
    }

    public static newThis(id: string | null = null, commat: boolean = false, parameter: AST.NodeExpr[] | null = null, expression: AST.NodeExpr = null) {
        return new FunctionHandle(id, commat, parameter, expression);
    }

    public static unparse(fhandle: FunctionHandle, evaluator: Evaluator): string {
        if (fhandle.id) {
            return (fhandle.commat ? '@' : '') + fhandle.id;
        } else {
            return '@(' + fhandle.parameter.map((param: AST.NodeExpr) => evaluator.Unparse(param)).join(',') + ') ' + evaluator.Unparse(fhandle.expression);
        }
    }

    public static unparseMathML(fhandle: FunctionHandle, evaluator: Evaluator): string {
        if (fhandle.id) {
            return `${fhandle.commat ? '<mo>@</mo><mi>' : ''}${fhandle.id}</mi>`;
        } else {
            return (
                '<mo>@</mo><mo>(</mo>' +
                fhandle.parameter.map((param: AST.NodeExpr) => evaluator.unparserMathML(param)).join('<mo>,</mo>') +
                '<mo>)</mo><mspace width="0.8em"/>' +
                evaluator.unparserMathML(fhandle.expression)
            );
        }
    }

    public static copy(fhandle: FunctionHandle): FunctionHandle {
        const result = new FunctionHandle(fhandle.id, fhandle.commat, fhandle.parameter, fhandle.expression);
        result.parent = fhandle.parent;
        return result;
    }

    public copy(): FunctionHandle {
        const result = new FunctionHandle(this.id, this.commat, this.parameter, this.expression);
        result.parent = this.parent;
        return result;
    }

    public static toLogical(fhandle: FunctionHandle): ComplexDecimal {
        return ComplexDecimal.false();
    }

    public toLogical(): ComplexDecimal {
        return ComplexDecimal.false();
    }
}
