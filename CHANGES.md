# Release notes
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

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
- Fix parser parenthsis node.

## 1.1.18
- `end` in ranges implemented in parser rule `colon_item`. To do this, it was necessary to track the context creating the `parent` property in each node, set during `Evaluator`, and also the `index` property in the 'LIST' and 'ARG' type nodes. This can be useful in `Unparse` and `UnparseML`, to eliminate unnecessary parentheses.

## 1.1.17
- Project launch.
- Multiple assignment implemented using `NodeReturnList` type. Method `reduceIfReturnList` created in class `Evaluator`.
