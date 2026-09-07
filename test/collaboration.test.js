import test from "node:test";
import assert from "node:assert/strict";
import { applyOperation, singleSpanDiff, transformOperation } from "../src/collaboration.js";
import { DocumentStore } from "../src/document-store.js";

test("applies insert, replace, and deletion operations", () => {
  assert.equal(applyOperation("hello", { index: 5, deleteCount: 0, insertText: "!" }), "hello!");
  assert.equal(applyOperation("hello", { index: 1, deleteCount: 3, insertText: "i" }), "hio");
});

test("rejects invalid operation ranges", () => {
  assert.throws(() => applyOperation("hi", { index: 4, deleteCount: 0, insertText: "x" }));
});

test("creates a minimal single-span diff", () => {
  assert.deepEqual(singleSpanDiff("write clearly", "write more clearly"), { index: 6, deleteCount: 0, insertText: "more " });
});

test("moves a concurrent insertion after an earlier committed insertion", () => {
  const incoming = { index: 3, deleteCount: 0, insertText: "B", clientId: "z" };
  const committed = { index: 3, deleteCount: 0, insertText: "A", clientId: "a" };
  assert.equal(transformOperation(incoming, committed).index, 4);
});

test("document store transforms edits from an older version", () => {
  const store = new DocumentStore("team");
  store.commit({ index: 0, deleteCount: 0, insertText: "A ", baseVersion: 0, clientId: "a" });
  store.commit({ index: 4, deleteCount: 0, insertText: "!", baseVersion: 0, clientId: "b" });
  assert.deepEqual(store.snapshot(), { text: "A team!", version: 2 });
});

