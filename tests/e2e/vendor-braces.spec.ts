import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Resolve through the installed Next lint consumer, not a separate test-only package.
const rootRequire = createRequire(resolve('package.json'));
const eslintRequire = createRequire(rootRequire.resolve('eslint-config-next'));
const nextLintRequire = createRequire(eslintRequire.resolve('@next/eslint-plugin-next'));
const globRequire = createRequire(nextLintRequire.resolve('fast-glob'));
const matchRequire = createRequire(globRequire.resolve('micromatch'));
const braces = matchRequire('braces') as {
  (pattern: string): string[];
  parse(pattern: string): unknown;
  compile(ast: unknown): string;
  expand(ast: unknown): string[];
  stringify(ast: unknown): string;
};

test('braces compatibility remains intact through micromatch and fast-glob', () => {
  expect(matchRequire('braces/package.json').name).toBe('@operator-uplift/braces');
  expect(matchRequire('braces/package.json').version).toBe('3.0.3-uplift.1');
  expect(braces('src/{a,b}/*.ts')).toEqual(['src/(a|b)/*.ts']);
  expect(braces.expand('{01..03}-{a,b}')).toEqual(['01-a', '01-b', '02-a', '02-b', '03-a', '03-b']);
  expect(braces.expand('x/{a,{b,c}}')).toEqual(['x/a', 'x/b', 'x/c']);
  expect(braces.expand('x/\\{literal\\}')).toEqual(['x/{literal}']);
  expect(braces.stringify(braces.parse('src/{a,b}/*.ts'))).toBe('src/{a,b}/*.ts');
  const match = globRequire('micromatch') as (files: string[], patterns: string[]) => string[];
  expect(match(['a.ts', 'b.tsx', 'c.js', 'nested/a.ts'], ['*.{ts,tsx}'])).toEqual(['a.ts', 'b.tsx']);
  const glob = nextLintRequire('fast-glob') as { sync(pattern: string, options: { cwd: string }): string[] };
  expect(glob.sync('vendor/braces/*.{js,json}', { cwd: process.cwd() }).sort())
    .toEqual(['vendor/braces/index.js', 'vendor/braces/package.json']);
});

for (const opening of ['{', '(']) {
  test(`brace parser rejects deeply nested ${opening} before recursive processing`, () => {
    const closing = opening === '{' ? '}' : ')';
    const input = opening.repeat(4_000) + 'x' + closing.repeat(4_000);
    for (const operation of [braces, braces.parse, braces.compile, braces.expand, braces.stringify]) {
      expect(() => operation(input)).toThrow('depth limit');
    }
    expect(braces.expand(opening.repeat(20) + 'x' + closing.repeat(20))).toHaveLength(1);
  });
}

test('all recursive brace entry points reject deep and cyclic supplied ASTs', () => {
  let deep: { type: string; nodes?: unknown[]; value?: string } = { type: 'text', value: 'x' };
  for (let index = 0; index < 10_000; index++) deep = { type: 'root', nodes: [deep] };
  const cyclic: { type: string; nodes: unknown[] } = { type: 'root', nodes: [] };
  cyclic.nodes.push(cyclic);
  const parentCycle: { type: string; nodes: unknown[]; parent?: unknown } = { type: 'paren', nodes: [] };
  parentCycle.parent = parentCycle;
  const wide = { type: 'root', nodes: Array.from({ length: 65_537 }, () => ({ type: 'text', value: 'x' })) };
  for (const operation of [braces.compile, braces.expand, braces.stringify,
    matchRequire('braces/lib/compile'), matchRequire('braces/lib/expand'), matchRequire('braces/lib/stringify')]) {
    for (const ast of [deep, cyclic, parentCycle, wide]) expect(() => operation(ast)).toThrow();
  }
});

test('brace AST scalar and parent queue payloads cannot enter recursive coercion', () => {
  let deepArray: unknown = ['x'];
  for (let index = 0; index < 10_000; index++) deepArray = [deepArray];
  const cyclicArray: unknown[] = [];
  cyclicArray.push(cyclicArray);
  const operations = [braces.compile, braces.expand, braces.stringify,
    matchRequire('braces/lib/compile'), matchRequire('braces/lib/expand'), matchRequire('braces/lib/stringify')];
  const malformed = [
    { type: 'root', nodes: [{ type: 'text', value: deepArray }] },
    { type: 'root', nodes: [{ type: 'text', value: cyclicArray }] },
    { type: 'brace', nodes: [], ranges: deepArray },
    { type: 'brace', nodes: [], commas: deepArray },
    { type: 'root', nodes: [{ type: 'paren', parent: { type: 'brace', queue: [deepArray] }, nodes: [{ type: 'text', value: 'y' }] }] },
    { type: 'root', nodes: [{ type: 'paren', parent: { type: 'brace', queue: cyclicArray }, nodes: [{ type: 'text', value: 'y' }] }] },
    { type: 'root', nodes: [{ type: 'text', value: 'a'.repeat(6_000) }, { type: 'text', value: 'b'.repeat(6_000) }] },
  ];
  for (const operation of operations) {
    for (const ast of malformed) {
      expect(() => operation(ast)).toThrow(/Brace (node|queue|AST)/);
    }
    for (const value of [-1, NaN, Infinity, '1', []]) {
      expect(() => operation({ type: 'brace', nodes: [], ranges: value })).toThrow('bounded nonnegative integer');
      expect(() => operation({ type: 'brace', nodes: [], commas: value })).toThrow('bounded nonnegative integer');
    }
  }
});

// Expected outputs verified independently against upstream braces 3.0.3.
for (const fixture of [
  { pattern: '{a,(b,c)}', compiled: '(a|(b|c))', expanded: ['a', '(b,c)'] },
  { pattern: '{a,b(c,d)}', compiled: '(a|b(c|d))', expanded: ['a', 'b(c,d)'] },
  { pattern: '{foo,bar(baz,qux)}', compiled: '(foo|bar(baz|qux))', expanded: ['foo', 'bar(baz,qux)'] },
]) {
  test(`parenthesized comma pattern ${fixture.pattern} preserves upstream behavior`, () => {
    expect(braces.compile(fixture.pattern)).toBe(fixture.compiled);
    expect(braces.expand(fixture.pattern)).toEqual(fixture.expanded);
    expect(braces.stringify(braces.parse(fixture.pattern))).toBe(fixture.pattern);
  });
}

test('unbalanced patterns preserve parser behavior despite retained former parent links', () => {
  for (const input of ['{a', '(x', 'x/{a,b']) {
    expect(braces.compile(input)).toBe(input);
    expect(braces.expand(input)).toEqual([input]);
    expect(braces.stringify(braces.parse(input))).toBe(input);
  }
});

