const GRAVEYARD_HEADING_PATTERN = /^graveyard:?\s*$/i;
const DONE_HEADING_PATTERN = /^done:?\s*$/i;

function isGraveyardHeading(heading) {
	return heading.level === 6 && GRAVEYARD_HEADING_PATTERN.test(heading.heading.trim());
}

function isDoneHeading(heading) {
	return heading.level === 6 && DONE_HEADING_PATTERN.test(heading.heading.trim());
}

function isGraveyardHeadingLine(lineText) {
	return /^#{6}\s+graveyard:?\s*$/i.test(lineText.trim());
}

function isDoneHeadingLine(lineText) {
	return /^#{6}\s+done:?\s*$/i.test(lineText.trim());
}

function sectionKindFromHeading(heading) {
	if (isGraveyardHeading(heading)) return "graveyard";
	if (isDoneHeading(heading)) return "done";
	return null;
}

function sectionKindFromLine(lineText) {
	if (isGraveyardHeadingLine(lineText)) return "graveyard";
	if (isDoneHeadingLine(lineText)) return "done";
	return null;
}

function findGraveyardHeading(headings) {
	if (!headings?.length) return null;
	return headings.find(isGraveyardHeading) ?? null;
}

function findDoneHeading(headings) {
	if (!headings?.length) return null;
	return headings.find(isDoneHeading) ?? null;
}

function isGraveyardPage(cache) {
	return findGraveyardHeading(cache?.headings) !== null;
}

function isChecked(item) {
	return item.task?.toLowerCase() === "x";
}

function isOpenTask(item) {
	return item.task === " ";
}

function countCheckedTasksBelowLine(lines, headingLine) {
	let count = 0;
	for (let i = headingLine + 1; i < lines.length; i++) {
		if (sectionKindFromLine(lines[i])) break;
		const match = lines[i].match(TASK_LINE);
		if (match && match[2].toLowerCase() === "x") count += 1;
	}
	return count;
}

function countSectionTasks(cache) {
	const sections = (cache?.headings ?? [])
		.map((heading) => ({ heading, kind: sectionKindFromHeading(heading) }))
		.filter((entry) => entry.kind)
		.sort((a, b) => a.heading.position.start.line - b.heading.position.start.line);
	if (!sections.length) return [];

	return sections.map(({ heading, kind }, index) => {
		const headingLine = heading.position.start.line;
		const nextLine = sections[index + 1]?.heading.position.start.line ?? Number.POSITIVE_INFINITY;
		const count = (cache.listItems ?? []).filter(
			(item) => {
				const line = item.position.start.line;
				return line > headingLine && line < nextLine && isChecked(item);
			},
		).length;
		return { headingLine, kind, count };
	});
}

function countGraveyardTasks(cache) {
	const section = countSectionTasks(cache).find((entry) => entry.kind === "graveyard");
	if (!section) return null;
	return { headingLine: section.headingLine, count: section.count };
}

function countDoneTasks(cache) {
	const section = countSectionTasks(cache).find((entry) => entry.kind === "done");
	if (!section) return null;
	return { headingLine: section.headingLine, count: section.count };
}

function calculateActiveProgress(cache, timestamp = Date.now()) {
	const heading = findGraveyardHeading(cache?.headings);
	if (!heading) return null;

	const graveyardLine = heading.position.start.line;
	let open = 0;
	let done = 0;

	for (const item of cache?.listItems ?? []) {
		if (item.task === undefined) continue;
		const line = item.position.start.line;
		if (line >= graveyardLine) continue;
		if (isOpenTask(item)) open += 1;
		else if (isChecked(item)) done += 1;
	}

	const total = open + done;
	if (total === 0) return null;

	const percentage = clampPercentage(Math.round((done / total) * 100));
	return { open, done, total, completed: done, percentage, generatedAt: timestamp };
}

function clampPercentage(value) {
	if (value < 0) return 0;
	if (value > 100) return 100;
	return value;
}

const TASK_LINE = /^(\s*)[-*+]\s+\[([ xX])\]/;

function findSectionHeadingLines(lines) {
	const results = [];
	for (let i = 0; i < lines.length; i++) {
		const kind = sectionKindFromLine(lines[i]);
		if (kind) results.push({ headingLine: i, kind });
	}
	return results;
}

function findGraveyardLineInLines(lines) {
	for (let i = 0; i < lines.length; i++) {
		if (isGraveyardHeadingLine(lines[i])) return i;
	}
	return -1;
}

function isGraveyardPageContent(content) {
	return findGraveyardLineInLines(content.split("\n")) >= 0;
}

function calculateActiveProgressFromContent(content, timestamp = Date.now()) {
	const lines = content.split("\n");
	const graveyardLine = findGraveyardLineInLines(lines);
	if (graveyardLine < 0) return null;

	let open = 0;
	let done = 0;
	for (let i = 0; i < graveyardLine; i++) {
		const match = lines[i].match(TASK_LINE);
		if (!match) continue;
		if (match[2] === " ") open += 1;
		else if (match[2].toLowerCase() === "x") done += 1;
	}

	const total = open + done;
	if (total === 0) return null;

	const percentage = clampPercentage(Math.round((done / total) * 100));
	return { open, done, total, completed: done, percentage, generatedAt: timestamp };
}

function countSectionTasksFromContent(content) {
	const lines = content.split("\n");
	return findSectionHeadingLines(lines).map(({ headingLine, kind }) => ({
		headingLine,
		kind,
		count: countCheckedTasksBelowLine(lines, headingLine),
	}));
}

function countGraveyardTasksFromContent(content) {
	const section = countSectionTasksFromContent(content).find((entry) => entry.kind === "graveyard");
	if (!section) return null;
	return { headingLine: section.headingLine, count: section.count };
}

module.exports = {
	isGraveyardHeading,
	isDoneHeading,
	isGraveyardHeadingLine,
	isDoneHeadingLine,
	sectionKindFromLine,
	findGraveyardHeading,
	findDoneHeading,
	isGraveyardPage,
	isGraveyardPageContent,
	countSectionTasks,
	countGraveyardTasks,
	countDoneTasks,
	countSectionTasksFromContent,
	countGraveyardTasksFromContent,
	calculateActiveProgress,
	calculateActiveProgressFromContent,
};
