const { MarkdownView } = require("obsidian");

class ProgressBar {
	constructor(app) {
		this.app = app;
		this.root = this.createRoot();
		const summary = this.root.querySelector(".graveyard-progress-bar__summary");
		this.summaryText = summary.querySelector(".graveyard-progress-bar__summary-text");
		this.percentageText = summary.querySelector(".graveyard-progress-bar__summary-percentage");
		this.progressEl = this.root.querySelector(".graveyard-progress-bar__progress");
	}

	show(snapshot) {
		if (!this.ensureMounted()) return;
		this.summaryText.setText(`${snapshot.completed} of ${snapshot.total}`);
		this.percentageText.setText(`${snapshot.percentage}%`);
		this.progressEl.value = snapshot.percentage;
		this.progressEl.title = `${snapshot.percentage}%`;
		this.root.setAttr("aria-label", this.summaryText.textContent ?? "");
	}

	hide() {
		if (this.root.parentElement) this.root.parentElement.removeChild(this.root);
	}

	destroy() {
		this.hide();
	}

	ensureMounted() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			this.hide();
			return false;
		}

		const container = view.containerEl.querySelector(".inline-title") ?? view.contentEl;
		if (!container) return false;

		if (this.root.parentElement !== container) {
			container.insertAdjacentElement("afterend", this.root);
		}
		return true;
	}

	createRoot() {
		const root = document.createElement("div");
		root.className = "graveyard-progress-bar";
		root.setAttr("role", "status");
		root.setAttr("aria-live", "polite");

		const summary = root.createDiv({ cls: "graveyard-progress-bar__summary" });
		summary.createSpan({ cls: "graveyard-progress-bar__summary-text" }).setText("0 of 0");
		summary.createSpan({ cls: "graveyard-progress-bar__summary-percentage" }).setText("0%");
		const progress = root.createEl("progress", { cls: "graveyard-progress-bar__progress" });
		progress.max = 100;
		progress.value = 0;
		return root;
	}
}

module.exports = { ProgressBar };
