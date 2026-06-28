import * as vscode from 'vscode';
import { buildWebviewHtml } from './webviewHtml';

const STYLE = `
body {
	font-family: var(--vscode-font-family);
	color: var(--vscode-foreground);
	background: var(--vscode-editor-background);
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	margin: 0;
}
.block { text-align: center; max-width: 480px; padding: 32px; }
h1 { font-size: 1.6em; }
`;

export function showPrayerBlock(prayerName: string): void {
	const panel = vscode.window.createWebviewPanel('halalProgrammingPrayerBlock', 'Halal Programmer', vscode.ViewColumn.One, {
		enableScripts: false,
		retainContextWhenHidden: false,
	});

	panel.webview.html = buildWebviewHtml({
		title: 'Halal Programmer',
		bodyHtml: `
<div class="block">
	<h1>${prayerName} time has arrived</h1>
	<p>Take a moment to pray. This will close automatically.</p>
</div>`,
		styleText: STYLE,
		scriptText: '',
	});

	const timeout = setTimeout(() => panel.dispose(), 60_000);
	panel.onDidDispose(() => clearTimeout(timeout));
}
