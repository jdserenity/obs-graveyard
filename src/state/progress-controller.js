const { ProgressBar } = require("../ui/progress-bar");
const { NoteWatcher } = require("./note-watcher");
const { calculateActiveProgressFromContent } = require("../graveyard");

class ProgressController {
	constructor(app) {
		this.bar = new ProgressBar(app);
		this.watcher = new NoteWatcher(app, (snapshot) => this.handleSnapshot(snapshot));
		this.latestSnapshot = null;
		this.barEnabled = true;
	}

	start() { this.watcher.start(); }
	stop() { this.watcher.stop(); this.bar.destroy(); }
	refresh() { this.watcher.refresh(); }

	refreshFromContent(content) {
		const snapshot = calculateActiveProgressFromContent(content);
		this.handleSnapshot(snapshot);
	}

	toggleBar() {
		this.barEnabled = !this.barEnabled;
		if (!this.barEnabled) { this.bar.hide(); return; }
		if (this.latestSnapshot) this.bar.show(this.latestSnapshot);
		else this.refresh();
	}

	handleSnapshot(snapshot) {
		this.latestSnapshot = snapshot;
		if (!this.barEnabled) { this.bar.hide(); return; }
		if (snapshot) this.bar.show(snapshot);
		else this.bar.hide();
	}
}

module.exports = { ProgressController };
