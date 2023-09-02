export class CharString {
    str: string;
    constructor(str: string) {
        this.str = str;
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
    static unparseML(value: CharString): string {
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
