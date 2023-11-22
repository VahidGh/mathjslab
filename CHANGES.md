# Release notes
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.2.1
- Several methods and properties have been renamed to express their functions more clearly.
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
