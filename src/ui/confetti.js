const confetti = require("../vendor/canvas-confetti.js");

function fireCelebration(options = {}) {
	if (typeof window === "undefined") return;

	const duration = options.duration ?? 800;
	const zIndex = options.zIndex ?? 10000;
	const end = Date.now() + duration;

	const frame = () => {
		confetti({
			particleCount: 3,
			angle: 60,
			spread: 55,
			origin: { x: 0, y: 0.65 },
			zIndex,
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: { x: 1, y: 0.65 },
			zIndex,
		});
		if (Date.now() < end) requestAnimationFrame(frame);
	};
	frame();
	confetti({
		particleCount: options.particleCount ?? 80,
		spread: options.spread ?? 70,
		origin: { y: 0.6 },
		zIndex,
	});
}

module.exports = { fireCelebration };
