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

module.exports = {
	isGraveyardHeading,
	isGraveyardHeadingLine,
	findGraveyardHeading,
	isGraveyardPage,
	countGraveyardTasks,
	calculateActiveProgress,
};
