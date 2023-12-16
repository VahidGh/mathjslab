# Release notes
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.3.3
- File 'MathObject.ts' and (their respective class and test file) renamed to MathOperation.ts.
- CharString conversion to MultiArray implemented as previous to any operation in MathOperation.ts.

## 1.3.2
- Tests for types implemented as 'instanceof' in 'MathObject.ts' and 'Evaluator.ts'. Method 'isThis' removed from classes.
- Some bug fix ins evaluator (not operation).

## 1.3.1
- Improvements and some bug fixes in lexer and parser. Support for cell arrays in parser and MultiArray class. Error messages in existing functions and cell array functions no yet implemented.
- Start and stop positions (line and column) of statements in global scope stored in AST nodes.
- Some improvements in CharString class, removing 'removeQuotes' method an creating 'quote' property to store type of quote (single or double).

## 1.3.0
- Parser implemented using ANTLR in files MathJSLabLexer.g4 and MathJSLabParser.g4. The wrapper class for lexer and parser has been created in file Parser.ts. Need to make extensive tests.
- File names converted to camel case.
- The file AST.ts (Abstract Syntax Tree) has been created, and related types and interfaces defined in Evaluator.ts has been moved to AST.ts file.

## 1.2.5
- Optimizations (resulting return as number) in multi-array.ts file and code cleaning by hand in file 'parser.jison'.

## 1.2.4
- The file 'symbol-table.ts' and 'symbol-table.spec.ts' has been created.
- Changes in the lexer to support comment blocks spaces and line breaks to separate elements within arrays. Context variables created (previous_token and matrix_context).

## 1.2.3
- The file 'configuration.ts' and 'configuration.spec.ts' has been created. Two user functions (configure and getconfig) was created to manage internal configurations of MathJSLab. Most of the settings refer to Decimal.js settings related to the accuracy of the results.
- Namespaces wrapping external definitions in 'evaluator.ts' and 'complex-decimal.ts' files.

## 1.2.2
- Bug fix in function 'cat'.
- User functions cummin, cummax, cumsum, cumprod, ndims, rows, columns, length, numel, isempty and reshape.
- Bug fix in MultiArray.unparse and MultiArray.unparseMathML (null array).
- Bug fix in MultiArray constructor (dimension.length >= 2).
- Bug fix in MultiArray.isEmpty.
- Functions newFilled and newFilledEach in MultiArray class moved to CoreFunctions and optimized.
- Some methods related to multiple assignment in Evaluator changed to static functions.

## 1.2.1
- More methods and properties have been renamed to express their functions more clearly.
- Code cleaning by hand.
- Bug fix in MultiArray.newFilledEach (used in rand and randi functions).

## 1.2.0
- The MultiArray class now supports multidimensional arrays. More integration tests are needed. Several methods have been renamed to express their functions more clearly. Methods related to linear algebra in MultiArray class have been moved to the LinearAlgebra class in linear-algebra.ts file.
- The core-functions.ts file and its corresponding test file were created. Functions in MultiArray class have been moved to the CoreFunctions class in core-functions.ts file. The generalized methods have been left in MultiArray class and the user functions have been moved to the CoreFunctions class. The linearizedFunctions in MultiArray class have been removed (and corresponding methods and code in Evaluator class removed too).

## 1.1.27
- The linear-algebra.ts file and its corresponding test file were created. The relevant methods of the MultiArray class will be moved to this file as support for multidimensional arrays evolves in the MultiArray class. Some methods moved.
- More evolve to support multidimensional arrays in the MultiArray class. MultiArray constructor upgraded to support multidimensional arrays. Constructor overloaded.
- The class `Tensor` has been renamed to `MathObject` and the file 'tensor.ts' has been renamed to 'math-object.ts'. The file 'math-object.spec.ts' has been created.
- The corresponding test file for char-string.ts file has been created.
- Unary and binary operations name type defined in complex-decimal.ts for use in generic operations methods of the MultiArray class.

## 1.1.26
- A fix for a major bug in element wise operations. Assymetric operations produce incorrect results. This shouldn't even be called a bug. This was like finding a lizard in your bathroom, coming up the drain. The fix has been simple, but the lizard is old, it certainly comes from the first version. It is necessary to extend the tests.
- `horzcat` and `vertcat` functions defined as function mappings.
- Start to extend MultiArray class to support multidimensional arrays.

## 1.1.25
- More bug fix in indexing (some `end` in ranges stop to work after 1.1.23. The problem is parent link absent in some constructions).

## 1.1.24
- Fix logical indexing (with operation and literal).

## 1.1.23
- Logical indexing.

## 1.1.22
- Fix `end` in ranges. The `colon_item` parser rule has been removed and the `end` descriptor in ranges has been created in the `primary_expr` rule.
- Fix range expansion. Before it could only be increasing, now it can also be decreasing.
- Reference to contribute to MathJSLab Calculator in CONTRIBUTING.md file.

## 1.1.21
- Fix evaluator: 'LIST' `parent` setting.
- Fix evaluator: assignment at right side.
- Fix evaluator: some parents did not propagate to all terminal nodes.
- Comment about the ISBN in the CONTRIBUTING.md file.

## 1.1.20
- Changes in build scripts in package.json.
- Colon (:) when indexing.
- Discard output (~ at left side).

## 1.1.19
- Fix parser parenthesis node.

## 1.1.18
- `end` in ranges implemented in parser rule `colon_item`. To do this it was necessary to track the context creating the `parent` property in each node, set during `Evaluator`, and also the `index` property in the 'LIST' and 'ARG' type nodes. This can be useful in `Unparse` and `UnparseMathML`, to eliminate unnecessary parentheses.

## 1.1.17
- Project launch.
- Multiple assignment implemented using `NodeReturnList` type. Method `reduceIfReturnList` created in class `Evaluator`.
