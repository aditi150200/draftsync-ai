import test from "node:test";
import assert from "node:assert/strict";
import { analyzeWriting } from "../src/suggestions.js";

test("returns clean metrics for a concise draft", () => {
  const result = analyzeWriting("Teams write clear stories together.");
  assert.equal(result.wordCount, 5);
  assert.equal(result.score, 100);
});

test("explains vague wording and long sentences", () => {
  const long = `This is a really ${Array(30).fill("word").join(" ")}.`;
  const result = analyzeWriting(long);
  assert.ok(result.score < 100);
  assert.ok(result.suggestions.some(item => item.type === "precision"));
  assert.ok(result.suggestions.some(item => item.type === "clarity"));
});

