# MathJSLab

> An interpreter with language syntax like MATLAB&reg;/Octave written in TypeScript.

This package emulates a parser and evaluator for a subset of
[MATLAB&reg;](https://www.mathworks.com/)/[Octave](https://www.gnu.org/software/octave/)
language written completely in [Typescript](https://www.typescriptlang.org/).

It uses the [Jison](https://gerhobbelt.github.io/jison/)
[parser generator](https://en.wikipedia.org/wiki/Compiler-compiler) to create an
[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
([Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)).

It can run in browser environment and implements an arbitrary precision arithmetics using
[decimal.js](https://www.npmjs.com/package/decimal.js) package. MathJSLab
has functions to generate [MathML](https://www.w3.org/Math/) code of
expressions parsed too.

This software is intended for educational purposes, to provide teachers and
students with a computer aided calculation tool that is capable of running in
a browser environment. So it can be easily adapted to be used on different devices
and environments.

A functional [demo](https://mathjslab.netlify.app/) use of this package in a Web
application can be found [here](https://github.com/sergiolindau/mathjslab-calculator).

## Features

- Runs on any JavaScript engine.
- Comes with a large set of built-in functions and constants.
- Is easily extensible.
- Open source with fully documented code.
- Test suites.
- Improved [demo](https://mathjslab.netlify.app/) web application.

## Browser support

MathJSLab works on any ES6 compatible JavaScript engine, including Node.js, Chrome, Firefox, Safari, and Edge.

## Installation

Install the `mathjslab` package:

```bash
npm install mathjslab
```

## Usage

The basic API is an instantiation of `Evaluator` with optional configuration.
Initialize evaluator with:

```typescript
let evaluator = Evaluator.initialize(EvaluatorConfiguration);
```

Examples:

* Parsing
```typescript
let tree = evaluator.Parse('x=sqrt(1+2*3)');
```

* Evaluation
```typescript
let result = evaluator.Evaluate(tree);
```

* MathML generation
```typescript
let mathml = evaluator.UnparseML(tree);
```

## Test and Build

Run the `mathjslab` tests:

```bash
npm run test
```

Build `mathjslab`:

```bash
npm run build
```

## Language subset

Currently only the mathematical expressions of the language are implemented.

The control and loop structures are not yet implemented.

Some differences from the original MATLAB&reg;/Octave language are

* Defining functions is done simply using:
function_name(argument, argument, ...) = <expression>
* Parsing is executed line-by-line.

## References

* [Decimal.js documentation](https://mikemcl.github.io/decimal.js/)
* [Wolfram MathWorld](https://mathworld.wolfram.com/)
* [WolframAlpha](https://www.wolframalpha.com/)
* [MATLAB&reg; Documentation](https://www.mathworks.com/help/matlab/index.html)
    * [Get Started with MATLAB&reg;](https://www.mathworks.com/help/matlab/getting-started-with-matlab.html)
    * [Language Fundamentals](https://www.mathworks.com/help/matlab/language-fundamentals.html)
* [GNU Octave manual](https://docs.octave.org/latest/)
* [Octave Online](https://octave-online.net/)
* [Octave scripts source](https://github.com/gnu-octave/octave/tree/default/scripts)
* [GNU Octave at Wikipedia](https://en.wikipedia.org/wiki/GNU_Octave)
* [Octave Forge - Extra packages for GNU Octave](https://octave.sourceforge.io/)
    * [Octave Forge Function List](https://octave.sourceforge.io/list_functions.php)
* [GNU Octave at Free Software Foundation](https://www.gnu.org/software/octave/)
* [GNU Octave (version 6.4.0) Online Manual](https://octave.org/doc/v6.4.0/index.html)
    * [18.2 Basic Matrix Functions](https://octave.org/doc/v6.4.0/Basic-Matrix-Functions.html)
* [Octave lexer](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/lex.ll)
* [Octave parser](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/oct-parse.yy)
* [MATLAB&reg; parser by Tegala Sravani](https://github.com/TegalaSravani/MATLAB&reg;-PARSER)
* [The Design and Implementation of a Parser and Scanner for the MATLAB&reg; Language in the MATCH Compiler](http://www.ece.northwestern.edu/cpdc/pjoisha/MAGICA/CPDC-TR-9909-017.pdf)
* [MATLAB&reg; grammar from Grammar Zoo](https://slebok.github.io/zoo/markup/scientific/matlab/srour/extracted/index.html)

# License

>MIT License
>
>Copyright &copy; 2016-2023 Sergio Lindau
>
>Permission is hereby granted, free of charge, to any person obtaining a copy
>of this software and associated documentation files (the "Software"), to deal
>in the Software without restriction, including without limitation the rights
>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
>copies of the Software, and to permit persons to whom the Software is
>furnished to do so, subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in all
>copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
>SOFTWARE.
