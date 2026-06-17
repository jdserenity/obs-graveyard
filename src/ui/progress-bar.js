const { MarkdownView } = require("obsidian");
const { getAngelStates } = require("./angels");
const { fireCelebration } = require("./confetti");

class ProgressBar {
	constructor(app) {
		this.app = app;
		this.root = this.createRoot();
		const summary = this.root.querySelector(".graveyard-progress-bar__summary");
		this.summaryText = summary.querySelector(".graveyard-progress-bar__summary-text");
		this.angelsEl = summary.querySelector(".graveyard-progress-bar__angels");
		this.percentageText = summary.querySelector(".graveyard-progress-bar__percentage");
		this.progressEl = this.root.querySelector(".graveyard-progress-bar__progress");
		this.lastCelebratedKey = null;
	}

	show(snapshot) {
		if (!this.ensureMounted()) return;

		const { completed, total, percentage } = snapshot;
		this.summaryText.setText(`${completed} of ${total} alive tasks`);
		this.percentageText.setText(`${percentage}%`);
		this.progressEl.value = percentage;
		this.progressEl.removeAttribute("title");
		this.renderAngels(completed, total);
		this.maybeCelebrate(completed, total);
		this.root.setAttr("aria-label", `${completed} of ${total} alive tasks complete`);
	}

	renderAngels(completed, total) {
		this.angelsEl.empty();
		for (const state of getAngelStates(completed, total)) {
			const angel = this.angelsEl.createDiv({
				cls: `graveyard-angel${state.isFull ? " graveyard-angel--full" : ""}`,
			});
			const body = angel.createDiv({ cls: "graveyard-angel__body" });
			body.style.transform = `scale(${state.scale})`;
			body.createSpan({ cls: "graveyard-angel__emoji", text: "😇" });
		}
	}

	maybeCelebrate(completed, total) {
		if (total > 0 && completed === total) {
			const key = `${completed}/${total}`;
			if (this.lastCelebratedKey !== key) {
				this.lastCelebratedKey = key;
				fireCelebration();
			}
			return;
		}
		this.lastCelebratedKey = null;
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
		const live = summary.createDiv({ cls: "graveyard-progress-bar__live" });
		live.createSpan({ cls: "graveyard-progress-bar__summary-text" }).setText("0 of 0 alive tasks");
		live.createDiv({ cls: "graveyard-progress-bar__angels" });
		summary.createSpan({ cls: "graveyard-progress-bar__percentage", text: "0%" });

		const progress = root.createEl("progress", { cls: "graveyard-progress-bar__progress" });
		progress.max = 100;
		progress.value = 0;
		progress.removeAttribute("title");
		return root;
	}
}

module.exports = { ProgressBar };
