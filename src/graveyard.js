const GRAVEYARD_HEADING_PATTERN = /^graveyard:?\s*$/i;

function isGraveyardHeading(heading) {
	return heading.level === 6 && GRAVEYARD_HEADING_PATTERN.test(heading.heading.trim());
}

function isGraveyardHeadingLine(lineText) {
	return /^#{6}\s+graveyard:?\s*$/i.test(lineText.trim());
}

function findGraveyardHeading(headings) {
	if (!headings?.length) return null;
	return headings.find(isGraveyardHeading) ?? null;
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

function countGraveyardTasks(cache) {
	const heading = findGraveyardHeading(cache?.headings);
	if (!heading) return null;

	const graveyardLine = heading.position.start.line;
	const count = (cache.listItems ?? []).filter(
		(item) =>
			item.position.start.line > graveyardLine && isChecked(item),
	).length;

	return { headingLine: graveyardLine, count };
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

function countGraveyardTasksFromContent(content) {
	const lines = content.split("\n");
	const graveyardLine = findGraveyardLineInLines(lines);
	if (graveyardLine < 0) return null;

	let count = 0;
	for (let i = graveyardLine + 1; i < lines.length; i++) {
		const match = lines[i].match(TASK_LINE);
		if (match && match[2].toLowerCase() === "x") count += 1;
	}

	return { headingLine: graveyardLine, count };
}

module.exports = {
	isGraveyardHeading,
	isGraveyardHeadingLine,
	findGraveyardHeading,
	isGraveyardPage,
	isGraveyardPageContent,
	countGraveyardTasks,
	countGraveyardTasksFromContent,
	calculateActiveProgress,
	calculateActiveProgressFromContent,
};
