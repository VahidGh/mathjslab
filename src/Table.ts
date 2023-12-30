import { ComplexDecimal } from './ComplexDecimal';
import { ElementType } from './MultiArray';
import { Structure } from './Structure';

export class Table {
    public static TABLE = Structure.STRUCTURE + 1;
    public readonly type = Table.TABLE;
    parent: any;
    public column: Record<string, ElementType[]>;
    public copy(): Table {
        return this;
    }
    public toLogical(): ComplexDecimal {
        return ComplexDecimal.false();
    }
}
