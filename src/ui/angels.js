const TASKS_PER_ANGEL = 5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1;

function getAngelStates(completed, total) {
	if (total <= 0) return [];

	const angelCount = Math.ceil(total / TASKS_PER_ANGEL);
	const states = [];

	for (let i = 0; i < angelCount; i++) {
		const bucketStart = i * TASKS_PER_ANGEL;
		const bucketSize = Math.min(TASKS_PER_ANGEL, total - bucketStart);
		const doneInBucket = Math.max(0, Math.min(completed - bucketStart, bucketSize));
		const progress = doneInBucket / bucketSize;
		const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * progress;

		states.push({
			scale,
			isFull: doneInBucket === bucketSize,
			progress,
		});
	}

	return states;
}

module.exports = { TASKS_PER_ANGEL, MIN_SCALE, MAX_SCALE, getAngelStates };
