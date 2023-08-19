# MathJSLab

> Interpreter with language syntax like MATLAB&reg;/Octave

This package emulates a parser and evaluator for a subset of
[MATLAB&reg;](https://www.mathworks.com/)/[Octave](https://www.gnu.org/software/octave/)
language.

It can run in browser environment and implements an arbitrary precision arithmetics using
[decimal.js](https://www.npmjs.com/package/decimal.js) package. This package
has functions to generate [MathML](https://www.w3.org/Math/) code of
expressions parsed too.

This software is intended for educational purposes to provide teachers and
students with a computer aided calculation tool that is capable of running in
a browser environment. So it can be easily adapted and used on different devices
and environments.

A functional [demo](https://mathjslab.netlify.app/) use of this package in a Web
application can be found [here](https://github.com/sergiolindau/mathjslab-calculator).

## Installation

Install the `mathjslab` package:

```bash
npm install mathjslab
```

Install `@types/mathjslab` package:

```bash
npm install --save-dev @type/mathjslab
```

## Usage

The basic API is a instantiation of `Evaluator` with optional configuration.

```typescript
let evaluator = new Evaluator(EvaluatorConfiguration);
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
