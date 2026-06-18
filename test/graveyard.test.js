const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isGraveyardPage,
	countGraveyardTasks,
	countDoneTasks,
	calculateActiveProgress,
	calculateActiveProgressFromContent,
	countGraveyardTasksFromContent,
	countSectionTasksFromContent,
	isGraveyardHeadingLine,
	isDoneHeadingLine,
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

test("isDoneHeadingLine matches markdown source", () => {
	assert.equal(isDoneHeadingLine("###### Done:"), true);
	assert.equal(isDoneHeadingLine("###### Graveyard:"), false);
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

	const snapshot = calculateActiveProgressFromContent(content, 1);
	assert.deepEqual(snapshot, {
		open: 1,
		done: 1,
		total: 2,
		completed: 1,
		percentage: 50,
		generatedAt: 1,
	});
	assert.deepEqual(countGraveyardTasksFromContent(content), { headingLine: 2, count: 1 });
});

test("countDoneTasks counts checked tasks below Done only", () => {
	const doneHeading = {
		level: 6,
		heading: "Done:",
		position: { start: { line: 4 } },
	};
	const cache = {
		headings: [doneHeading],
		listItems: [
			{ task: "x", position: { start: { line: 1 } } },
			{ task: "x", position: { start: { line: 5 } } },
			{ task: "x", position: { start: { line: 6 } } },
			{ task: " ", position: { start: { line: 7 } } },
		],
	};

	assert.deepEqual(countDoneTasks(cache), { headingLine: 4, count: 2 });
});

test("countSectionTasksFromContent returns Done sections without progress", () => {
	const content = [
		"- [x] above",
		"###### Done:",
		"- [x] finished",
		"- [x] also finished",
		"- [ ] still open",
	].join("\n");

	assert.deepEqual(countSectionTasksFromContent(content), [
		{ headingLine: 1, kind: "done", count: 2 },
	]);
	assert.equal(calculateActiveProgressFromContent(content), null);
});

test("countSectionTasksFromContent returns both Graveyard and Done sections", () => {
	const content = [
		"- [ ] live",
		"###### Graveyard:",
		"- [x] buried",
		"###### Done:",
		"- [x] finished",
	].join("\n");

	assert.deepEqual(countSectionTasksFromContent(content), [
		{ headingLine: 1, kind: "graveyard", count: 1 },
		{ headingLine: 3, kind: "done", count: 1 },
	]);
});
