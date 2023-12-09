import { CharStreams, CommonTokenStream } from 'antlr4';
import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';
import LexerErrorListener from './LexerErrorListener';
import ParserErrorListener from './ParserErrorListener';

/**
 * MATLAB®/Octave like syntax parser using ANTLR4.
 */
export class Parser {
    public commandNames: string[] = [];

    public getCommandNames() {
        return this.commandNames;
    }

    /**
     * Parse input string.
     * @param input String to parse.
     * @returns Abstract syntax tree of input.
     */
    public parse(input: string): void {
        // Give the lexer the input as a stream of characters.
        const inputStream = CharStreams.fromString(input);
        const lexer = new MathJSLabLexer(inputStream);

        // Set word-list commands.
        // lexer.commandNames = this.commandNames; // TODO: Why it doesn't work?!!
        lexer.commandNames = EvaluatorPointer.parser.commandNames;

        // Create a stream of tokens and give it to the parser.
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new MathJSLabParser(tokenStream);

        // Remove error listeners and add LexerErrorListener and ParserErrorListener.
        lexer.removeErrorListeners();
        lexer.addErrorListener(new LexerErrorListener());
        parser.removeErrorListeners();
        parser.addErrorListener(new ParserErrorListener());

        // Parse input.
        const inputContext = parser.input();
        return inputContext.node;
    }
}
