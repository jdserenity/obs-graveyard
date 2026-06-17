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
import { countGraveyardTasksFromContent, isGraveyardHeadingLine } from "./graveyard.js";
import type GraveyardPlugin from "./main";

class GraveyardCountWidget extends WidgetType {
	constructor(private readonly count: number) {
		super();
	}

	eq(other: GraveyardCountWidget): boolean {
		return other.count === this.count;
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "graveyard-counter-badge";
		span.textContent = ` ${this.count} 🪦 🏆`;
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

	const result = countGraveyardTasksFromContent(view.state.doc.toString());
	if (!result) return builder.finish();

	const lineNumber = result.headingLine + 1;
	if (lineNumber < 1 || lineNumber > view.state.doc.lines) return builder.finish();

	const line = view.state.doc.line(lineNumber);
	if (!isGraveyardHeadingLine(line.text)) return builder.finish();

	builder.add(
		line.to,
		line.to,
		Decoration.widget({
			widget: new GraveyardCountWidget(result.count),
			side: 1,
		}),
	);

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
