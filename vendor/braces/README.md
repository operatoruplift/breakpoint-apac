# Operator Uplift bounded braces fork

Source: [`micromatch/braces` 3.0.3](https://github.com/micromatch/braces/tree/3.0.3),
MIT license retained in `LICENSE`. This package is named `@operator-uplift/braces`
and supplied under the `braces` dependency alias. Upstream has no patched release
for [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Changes from upstream:

- The iterative parser rejects brace/parenthesis nesting above 64 before it
  creates an unsafe tree or invokes a recursive helper. It increments comma
  counters only on brace nodes, preserving parenthesized-comma behavior without
  generating `NaN` fields in its own AST.
- Compile, expand and stringify validate externally supplied ASTs iteratively
  before walking them: depth 64, 65,536 nodes, no cyclic/shared child nodes.
- Node values must be strings with at most 10,000 aggregate characters. Range,
  comma and depth fields must be bounded nonnegative integers. Ancestor queues
  must contain bounded acyclic arrays of strings, with at most 65,536 entries,
  depth 64 and 1,000,000 aggregate characters; parent queues outside the child
  tree are validated too.
- Caller options cannot lift these limits. Parent chains are checked separately
  for bounded, acyclic ancestry; previous-sibling links are not traversed. The
  validation does not confuse valid child-to-parent links with child cycles.

This is an actual bounded implementation, not an audit exception. Existing glob,
range, quoting and escaping behavior is retained within the limits. The app owns
this fork's maintenance and must review upstream releases for a replacement.
Tests cover hostile strings and ASTs plus the real micromatch/fast-glob owners.

Reuse provenance: copied without source changes from the Operator Uplift maintained fork on October 23, 2026, for the standalone Breakpoint APAC project. The original package name, source attribution and MIT license are retained. Breakpoint APAC owns maintenance of this vendored copy.
