export class CharString {
    readonly type = 3;
    public str: string;
    constructor(str: string) {
        this.str = str;
    }
    get string(): string {
        return this.str.substring(1, this.str.length - 1);
    }
    static isThis(obj: any): boolean {
        return 'str' in obj;
    }
    static parse(str: string): CharString {
        return new CharString(str);
    }
    static unparse(value: CharString): string {
        return value.str;
    }
    static unparseMathML(value: CharString): string {
        return '<mn>' + value.str + '</mn>';
    }
    static removeQuotes(value: CharString): CharString {
        const firstchar = value.str[0];
        const lastchar = value.str[value.str.length - 1];
        if (value.str.length >= 2 && ((firstchar === '"' && lastchar === '"') || (firstchar === "'" && lastchar === "'"))) {
            return new CharString(value.str.substring(1, value.str.length - 1));
        } else {
            return value;
        }
    }
}
