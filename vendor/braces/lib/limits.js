'use strict';

const { MAX_LENGTH } = require('./constants');

// Bound every input that the upstream recursive walkers or implicit coercion
// can reach. These limits cannot be disabled through caller options.
const MAX_DEPTH = 64;
const MAX_NODES = 65536;
const MAX_QUEUE_CHARS = 1_000_000;

const assertTree = (root) => {
  const pending = [{ node: root, depth: 0 }];
  const seen = new Set();
  const checkedShapes = new Set();
  const checkedQueues = new Set();
  let count = 0;
  let valueChars = 0;
  let queueCount = 0;
  let queueChars = 0;

  const assertQueue = (queue) => {
    const entries = [{ value: queue, depth: 0 }];
    const arrays = new Set();
    while (entries.length) {
      const { value, depth } = entries.pop();
      if (++queueCount > MAX_NODES || depth > MAX_DEPTH) {
        throw new SyntaxError('Brace queue exceeds depth/node limit');
      }
      if (typeof value === 'string') {
        queueChars += value.length;
        if (value.length > MAX_LENGTH || queueChars > MAX_QUEUE_CHARS) {
          throw new SyntaxError('Brace queue exceeds character limit');
        }
      } else if (Array.isArray(value) && !arrays.has(value)) {
        arrays.add(value);
        if (value.length > MAX_NODES - queueCount - entries.length) {
          throw new SyntaxError('Brace queue exceeds node limit');
        }
        for (const child of value) entries.push({ value: child, depth: depth + 1 });
      } else {
        throw new TypeError('Brace queue must contain bounded acyclic arrays of strings');
      }
    }
  };

  const assertShape = (node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.type !== 'string') {
      throw new TypeError('Invalid brace AST node');
    }
    if (checkedShapes.has(node)) return;
    checkedShapes.add(node);
    if (checkedShapes.size > MAX_NODES) throw new SyntaxError('Brace AST exceeds node limit');
    if (node.value !== undefined) {
      if (typeof node.value !== 'string') throw new TypeError('Brace node value must be a string');
      valueChars += node.value.length;
      if (valueChars > MAX_LENGTH) throw new SyntaxError('Brace AST exceeds character limit');
    }
    for (const field of ['commas', 'ranges', 'depth']) {
      if (node[field] !== undefined && (!Number.isInteger(node[field]) || node[field] < 0 || node[field] > MAX_NODES)) {
        throw new TypeError(`Brace node ${field} must be a bounded nonnegative integer`);
      }
    }
    if (node.queue !== undefined && !checkedQueues.has(node.queue)) {
      if (!Array.isArray(node.queue)) throw new TypeError('Brace queue must be an array');
      assertQueue(node.queue);
      checkedQueues.add(node.queue);
    }
  };

  while (pending.length) {
    const { node, depth } = pending.pop();
    assertShape(node);
    if (depth > MAX_DEPTH || ++count > MAX_NODES || seen.has(node)) {
      throw new SyntaxError('Brace AST exceeds depth/node limit or contains a cycle');
    }
    seen.add(node);
    // Parsing an unbalanced expression flattens children but intentionally
    // retains their former parent. Validate those shapes/queues too, rather
    // than requiring identity with the structural parent and breaking parsing.
    const parents = new Set([node]);
    let parent = node.parent;
    while (parent) {
      if (parents.has(parent) || parents.size > MAX_DEPTH) {
        throw new SyntaxError('Invalid brace AST parent chain');
      }
      assertShape(parent);
      parents.add(parent);
      parent = parent.parent;
    }
    if (node.nodes !== undefined) {
      if (!Array.isArray(node.nodes) || node.nodes.length > MAX_NODES - count - pending.length) {
        throw new SyntaxError('Brace AST exceeds node limit');
      }
      for (const child of node.nodes) pending.push({ node: child, depth: depth + 1 });
    }
  }
};

module.exports = { MAX_DEPTH, assertTree };
