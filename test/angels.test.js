const test = require("node:test");
const assert = require("node:assert/strict");
const { getAngelStates, TASKS_PER_ANGEL } = require("../src/ui/angels.js");

test("one angel per 5 live tasks", () => {
  assert.equal(getAngelStates(0, 6).length, 2);
  assert.equal(getAngelStates(0, 5).length, 1);
  assert.equal(getAngelStates(0, 12).length, 3);
});

test("angels start small with no progress in bucket", () => {
  const states = getAngelStates(0, 6);
  assert.equal(states[0].scale, 0.5);
  assert.equal(states[0].isFull, false);
  assert.equal(states[1].scale, 0.5);
});

test("angel scales up with partial bucket progress", () => {
  const states = getAngelStates(3, 6);
  assert.equal(states[0].isFull, false);
  assert.ok(states[0].scale > 0.5 && states[0].scale < 1);
  assert.equal(states[1].isFull, false);
});

test("full bucket gives max scale and glow", () => {
  const states = getAngelStates(5, 6);
  assert.equal(states[0].scale, 1);
  assert.equal(states[0].isFull, true);
  assert.equal(states[1].isFull, false);
});

test("all tasks complete fills every angel", () => {
  const states = getAngelStates(12, 12);
  assert.equal(states.length, Math.ceil(12 / TASKS_PER_ANGEL));
  assert.ok(states.every((s) => s.isFull && s.scale === 1));
});
