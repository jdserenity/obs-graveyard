const { Component, MarkdownView } = require("obsidian");
const { isGraveyardPage, calculateActiveProgress } = require("../graveyard");

class NoteWatcher extends Component {
	constructor(app, onSnapshot) {
		super();
		this.app = app;
		this.onSnapshot = onSnapshot;
		this.activeFile = null;
	}

	onload() {
		this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
			const view = leaf?.view instanceof MarkdownView ? leaf.view : null;
			this.setActiveFile(view?.file ?? null);
		}));
		this.registerEvent(this.app.metadataCache.on("changed", (file) => {
			if (this.isActiveFile(file)) this.recalculate(file);
		}));
		this.setActiveFile(this.getActiveMarkdownFile());
	}

	start() { this.load(); }
	stop() { this.unload(); }
	refresh() { this.recalculate(this.activeFile); }

	setActiveFile(file) {
		if (file?.path === this.activeFile?.path) { this.recalculate(file); return; }
		this.activeFile = file;
		this.recalculate(file);
	}

	recalculate(file) {
		if (!file) { this.onSnapshot(null); return; }
		const cache = this.app.metadataCache.getFileCache(file) ?? null;
		if (!isGraveyardPage(cache)) { this.onSnapshot(null); return; }
		this.onSnapshot(calculateActiveProgress(cache));
	}

	getActiveMarkdownFile() {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
	}

	isActiveFile(file) {
		return this.activeFile?.path === file.path;
	}
}

module.exports = { NoteWatcher };
