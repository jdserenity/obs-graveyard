import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { editorInfoField } from "obsidian";
import { countSectionTasksFromContent, sectionKindFromLine } from "./graveyard.js";
import type GraveyardPlugin from "./main";

type SectionKind = "graveyard" | "done";

class SectionCountWidget extends WidgetType {
	constructor(private readonly count: number, private readonly kind: SectionKind) {
		super();
	}

	eq(other: SectionCountWidget): boolean {
		return other.count === this.count && other.kind === this.kind;
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "graveyard-counter-badge";
		span.textContent = this.kind === "graveyard" ? ` ${this.count} 🪦 🏆` : ` ${this.count} ✅`;
		return span;
	}
}

export const refreshGraveyardEffect = StateEffect.define<void>();

export const refreshGraveyardField = StateField.define<number>({
	create: () => 0,
	update(value, transaction) {
		for (const effect of transaction.effects) {
			if (effect.is(refreshGraveyardEffect)) return value + 1;
		}
		return value;
	},
});

let plugin: GraveyardPlugin | null = null;

export function setGraveyardPlugin(instance: GraveyardPlugin | null): void {
	plugin = instance;
}

function buildDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const info = view.state.field(editorInfoField, false);
	const file = info?.file;
	if (!file || !plugin) return builder.finish();

	const sections = countSectionTasksFromContent(view.state.doc.toString());
	if (!sections.length) return builder.finish();

	for (const section of sections) {
		const lineNumber = section.headingLine + 1;
		if (lineNumber < 1 || lineNumber > view.state.doc.lines) continue;

		const line = view.state.doc.line(lineNumber);
		const kind = sectionKindFromLine(line.text);
		if (!kind || kind !== section.kind) continue;

		builder.add(
			line.to,
			line.to,
			Decoration.widget({
				widget: new SectionCountWidget(section.count, section.kind),
				side: 1,
			}),
		);
	}

	return builder.finish();
}

class GraveyardViewPlugin {
	decorations: DecorationSet;
	private lastRefreshToken = -1;

	constructor(view: EditorView) {
		this.lastRefreshToken = view.state.field(refreshGraveyardField);
		this.decorations = buildDecorations(view);
	}

	update(update: ViewUpdate): void {
		const refreshToken = update.state.field(refreshGraveyardField);
		if (
			update.docChanged ||
			update.viewportChanged ||
			refreshToken !== this.lastRefreshToken
		) {
			this.lastRefreshToken = refreshToken;
			this.decorations = buildDecorations(update.view);
		}
	}
}

const graveyardViewPlugin = ViewPlugin.fromClass(GraveyardViewPlugin, {
	decorations: (value) => value.decorations,
});

export const graveyardEditorExtension = [
	refreshGraveyardField,
	graveyardViewPlugin,
];

export function refreshGraveyardInView(view: EditorView): void {
	view.dispatch({ effects: refreshGraveyardEffect.of() });
}
