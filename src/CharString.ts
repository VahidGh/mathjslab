export type StringQuote = '"' | "'";

export class CharString {
    public readonly type = 3;
    public str: string;
    public quote: StringQuote;
    constructor(str: string, quote: StringQuote = '"') {
        this.str = str;
        this.quote = quote;
    }
    public static isThis(obj: any): boolean {
        return 'str' in obj;
    }
    public static create(str: string, quote: string = '"'): CharString {
        return new CharString(str, quote as StringQuote);
    }
    public static parse(str: string): CharString {
        return new CharString(str);
    }
    public static unparse(value: CharString): string {
        return value.str;
    }
    public static unparseMathML(value: CharString): string {
        return '<mn><pre>' + value.str + '</pre></mn>';
    }
    public unparse(): string {
        return this.str;
    }
}
