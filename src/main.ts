import { MarkdownView, Plugin, type TFile } from "obsidian";
import type { EditorView } from "@codemirror/view";
import { ProgressController } from "./state/progress-controller.js";
import {
	graveyardEditorExtension,
	refreshGraveyardInView,
	setGraveyardPlugin,
} from "./editor-extension";

export default class GraveyardPlugin extends Plugin {
	controller: ProgressController | null = null;

	onload(): void {
		setGraveyardPlugin(this);
		this.registerEditorExtension(graveyardEditorExtension);
		this.controller = new ProgressController(this.app);
		this.controller.start();

		this.registerEvent(
			this.app.metadataCache.on("changed", (file: TFile) => {
				this.refreshFileEditors(file);
				this.controller?.refresh();
			}),
		);

		this.addCommand({
			id: "toggle-graveyard-progress-bar",
			name: "Toggle graveyard progress bar",
			callback: () => this.controller?.toggleBar(),
		});

		this.app.workspace.onLayoutReady(() => this.controller?.refresh());
	}

	onunload(): void {
		this.controller?.stop();
		this.controller = null;
		setGraveyardPlugin(null);
	}

	private refreshFileEditors(file: TFile): void {
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView) || view.file?.path !== file.path) continue;
			const editorView = (view.editor as unknown as { cm?: EditorView }).cm;
			if (editorView) refreshGraveyardInView(editorView);
		}
	}
}
