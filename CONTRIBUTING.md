# How to contribute

I'm really glad you're reading this, because we need volunteer developers to
help this project come to fruition. At end of this file there is
[references](#references) that were consulted to carry out this project.

## Testing

The tests are run by jest. Add tests for the new code you create.

## Submitting changes

Please send a [GitHub Pull Request to mathjslab](https://github.com/sergiolindau/mathjslab/pull/new/master)
with a clear list of what you've done (read more about
[pull requests](http://help.github.com/pull-requests/)). Please follow our
coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

Always write a clear log message for your commits. One-line messages are fine
for small changes, but bigger changes should look like this:

    $ git commit -m "A brief summary of the commit
    >
    > A paragraph describing what changed and its impact."

## Community

Join the community chat:

[![Join the chat at https://matrix.to/#/#mathjslab:gitter.im](https://badges.gitter.im/Join%20Chat.svg)](https://matrix.to/#/#mathjslab:gitter.im?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Coding conventions

Start reading our code and you'll get the hang of it. We optimize for readability:

* We indent using four spaces for code files and two spaces for json files, set by EditorConfig.
* We ALWAYS put spaces after list items and method parameters (`[1, 2, 3]`, not `[1,2,3]`), around operators (`x += 1`, not `x+=1`), and around hash arrows.
* This is an [open source software](https://en.wikipedia.org/wiki/Open-source_software). Consider the people who will read your code, and make it look nice for them.

Thanks,
Sergio Lindau

## References

* [Decimal.js documentation](https://mikemcl.github.io/decimal.js/)
* [Wolfram MathWorld](https://mathworld.wolfram.com/)
* [WolframAlpha](https://www.wolframalpha.com/)
* [MATLAB&reg; Documentation](https://www.mathworks.com/help/matlab/index.html)
    * [Get Started with MATLAB&reg;](https://www.mathworks.com/help/matlab/getting-started-with-matlab.html)
    * [Language Fundamentals](https://www.mathworks.com/help/matlab/language-fundamentals.html)
    * [Compatible Array Sizes for Basic Operations](https://www.mathworks.com/help/matlab/matlab_prog/compatible-array-sizes-for-basic-operations.html)
    * [MATLAB Operators and Special Characters](https://www.mathworks.com/help/matlab/matlab_prog/matlab-operators-and-special-characters.html)
    * [Operator Precedence](https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html)
* [GNU Octave Documentation](https://docs.octave.org/latest/)
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

