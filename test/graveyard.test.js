const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isGraveyardPage,
	countGraveyardTasks,
	calculateActiveProgress,
	calculateActiveProgressFromContent,
	countGraveyardTasksFromContent,
	isGraveyardHeadingLine,
} = require("../src/graveyard.js");

const graveyardHeading = {
	level: 6,
	heading: "Graveyard:",
	position: { start: { line: 10 } },
};

test("isGraveyardPage matches level-6 Graveyard heading", () => {
	assert.equal(isGraveyardPage({ headings: [graveyardHeading] }), true);
	assert.equal(isGraveyardPage({ headings: [{ level: 5, heading: "Graveyard:" }] }), false);
});

test("isGraveyardHeadingLine matches markdown source", () => {
	assert.equal(isGraveyardHeadingLine("###### Graveyard:"), true);
	assert.equal(isGraveyardHeadingLine("###### Done:"), false);
});

test("countGraveyardTasks counts checked tasks below Graveyard only", () => {
	const cache = {
		headings: [graveyardHeading],
		listItems: [
			{ task: "x", position: { start: { line: 3 } } },
			{ task: "x", position: { start: { line: 11 } } },
			{ task: "x", position: { start: { line: 12 } } },
			{ task: " ", position: { start: { line: 13 } } },
		],
	};

	assert.deepEqual(countGraveyardTasks(cache), { headingLine: 10, count: 2 });
});

test("calculateActiveProgress counts only live tasks above Graveyard", () => {
	const cache = {
		headings: [graveyardHeading],
		listItems: [
			...Array.from({ length: 5 }, (_, i) => ({ task: " ", position: { start: { line: i } } })),
			{ task: "x", position: { start: { line: 5 } } },
			...Array.from({ length: 6 }, (_, i) => ({ task: "x", position: { start: { line: 11 + i } } })),
		],
	};

	const snapshot = calculateActiveProgress(cache, 1);
	assert.deepEqual(snapshot, {
		open: 5,
		done: 1,
		total: 6,
		completed: 1,
		percentage: 17,
		generatedAt: 1,
	});
});

test("calculateActiveProgress returns null without Graveyard heading", () => {
	assert.equal(calculateActiveProgress({ headings: [], listItems: [] }), null);
});

test("calculateActiveProgressFromContent parses editor text immediately", () => {
	const content = [
		"- [ ] one",
		"- [x] two",
		"###### Graveyard:",
		"- [x] buried",
	].join("\n");

	assert.deepEqual(calculateActiveProgressFromContent(content), {
		open: 1,
		done: 1,
		total: 2,
		completed: 1,
		percentage: 50,
		generatedAt: calculateActiveProgressFromContent(content).generatedAt,
	});
	assert.deepEqual(countGraveyardTasksFromContent(content), { headingLine: 2, count: 1 });
});
