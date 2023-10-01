# How to contribute

I'm really glad you're reading this, because we need volunteer developers to help this project come to fruition.

## Testing

The tests are run by jest. Add tests for the new code you create.

## Submitting changes

Please send a [GitHub Pull Request to mathjslab](https://github.com/sergiolindau/mathjslab/pull/new/master) with a clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)). Please follow our coding conventions (below) and make sure all of your commits are atomic (one feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes should look like this:

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
